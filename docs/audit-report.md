# Audit Report — Vest AI Financial Assistant
> Tanggal: 2026-06-25
> Scope: Perubahan blueprint agent (Langkah 1–3) + codebase keseluruhan
> Tools: multi-agent code review (max effort) + UI audit

---

## Status Ringkasan

| Kategori              | Critical | High | Medium | Low |
|-----------------------|----------|------|--------|-----|
| Bug / Correctness     | 2        | 4    | 5      | 4   |
| Security              | 1        | 2    | 1      | —   |
| Performance           | —        | 1    | 1      | 2   |
| UI / Accessibility    | 2        | 6    | 4      | 5   |

---

## Bagian 1 — Bug, Security & Performance

### 🔴 CRITICAL

---

#### BUG-01 · Commit endpoint menggunakan body klien, bukan record DB
**File:** `src/app/api/ai-context-chat/commit/route.ts:21`
**Status:** ❌ Belum diperbaiki

Endpoint `/api/ai-context-chat/commit` membaca `draft` langsung dari `body.draft` (klien) untuk financial write. DB record `AgentDraft` yang tersimpan tidak pernah di-load untuk validasi. User terautentikasi bisa POST arbitrary `amount`, `accountId`, `budgetId` melewati agent sepenuhnya.

```ts
// Sekarang (berbahaya):
const draft = body?.draft  // dari klien
const result = await commitDraft(kind, draft, session.user.id)

// Fix: load dari DB dulu
const stored = await prisma.agentDraft.findFirst({
  where: { id: draftId, userId: session.user.id, status: "pending" },
})
if (!stored) return NextResponse.json({ error: "Draft tidak ditemukan" }, { status: 404 })
const result = await commitDraft(kind, stored.data, session.user.id)
```

---

#### BUG-02 · Tidak ada idempotency guard — double-tap membuat dua expense
**File:** `src/app/api/ai-context-chat/commit/route.ts:31`
**Status:** ❌ Belum diperbaiki

`commitDraft()` dipanggil di baris 31, `updateMany` status→`committed` baru dijalankan *setelah* write berhasil. Dua POST simultan (double-tap tombol Approve) keduanya memanggil `createExpense` sebelum salah satunya sempat mark `committed`. Hasilnya: dua record pengeluaran identik terbuat.

```ts
// Fix: atomic check + mark sebelum commit
const updated = await prisma.agentDraft.updateMany({
  where: { id: draftId, userId: session.user.id, status: "pending" },
  data: { status: "committed" },
})
if (updated.count === 0) {
  return NextResponse.json({ error: "Draft sudah diproses" }, { status: 409 })
}
// baru panggil commitDraft dengan data dari DB (lihat BUG-01)
```

---

### 🟠 HIGH

---

#### SEC-01 · `budgetId` ditulis ke expense tanpa verifikasi kepemilikan
**File:** `src/lib/services/expenseService.ts` (sekitar baris 163)
**Status:** ❌ Belum diperbaiki

`accountId` diverifikasi via `findFirst({ where: { id, userId } })`, tapi `budgetId` langsung dimasukkan ke `tx.expense.create` tanpa pengecekan serupa. User bisa menyuplai `budgetId` milik user lain, mencemari budget utilization-nya.

```ts
// Fix: tambahkan ownership check
if (budgetId) {
  const budget = await tx.budget.findFirst({ where: { id: budgetId, userId } })
  if (!budget) throw new Error("Budget tidak ditemukan atau bukan milik Anda")
}
```

---

#### BUG-03 · `budgetUtilization` understated — hanya 20 expense terbaru di-query
**File:** `src/lib/services/financeSummary.ts:51`
**Status:** ❌ Belum diperbaiki

`getFinancialSummary` fetch `take: 20` expenses, lalu `budgetUtilization` dihitung dari filter 20 baris itu. Budget dengan 21+ transaksi menampilkan sisa yang lebih besar dari sebenarnya — AI memberikan saran finansial yang salah.

```ts
// Fix: query spent per budget langsung dari DB
const budgetSpent = await prisma.expense.groupBy({
  by: ['budgetId'],
  where: { userId, budgetId: { in: budgets.map(b => b.id) } },
  _sum: { amount: true },
})
```

---

#### BUG-04 · `agentDraft.create` failure setelah AI sukses: 500 + kuota hangus
**File:** `src/app/api/ai-context-chat/route.ts:255`
**Status:** ❌ Belum diperbaiki

Rate limit counter di-increment di baris 174 *sebelum* AI call dan DB write. Jika `agentDraft.create` gagal (DB blip), outer catch return 500 — user kehilangan satu slot kuota harian tanpa mendapat respons atau draft.

```ts
// Fix: isolasi DB write dengan try/catch tersendiri
const pendingDrafts = await Promise.all(rawDrafts.map(async (draft) => {
  try {
    const saved = await prisma.agentDraft.create({ data: { ... } })
    return { ...draft, _dbId: saved.id }
  } catch {
    return { ...draft, _dbId: null } // degraded gracefully, AI response tetap terkirim
  }
}))
```

---

#### BUG-05 · Empty string dari provider melewati fallback — message bubble kosong
**File:** `src/lib/ai/agent-loop.ts:131` dan `baris 189`
**Status:** ❌ Belum diperbaiki

`content ?? "Tidak ada respon..."` — nullish coalescing `??` tidak terpicu untuk empty string `""`. Jika Groq atau Gemini mengembalikan string kosong, user melihat bubble AI tanpa teks.

```ts
// Fix: ganti ?? dengan ||
content: final.choices[0]?.message?.content || "Tidak ada respon dari AI."
// Gemini:
content: final.text || "Tidak ada respon dari AI."
// dan di Gemini mid-loop:
return { content: resp.text || "Tidak ada respon dari AI.", ... }
```

---

#### BUG-06 · Nama akun user di-inject ke system prompt — potensi prompt injection
**File:** `src/app/api/ai-context-chat/route.ts:199` → `src/lib/ai/prompt.ts:99`
**Status:** ⚠️ Partially mitigated

`balances[].name` dan `assets[].name` adalah data user-controlled yang di-`JSON.stringify` verbatim ke dalam blok `<<<USER_DATA_JSON`. Delimiter itu hanya label teks — LLM tidak enforce boundary secara protokol. `JSON.stringify` sudah escape newline ke `\n` literal (mengurangi risiko), tapi tool *results* yang dikembalikan sebagai plaintext ke conversation tetap rentan.

Mitigasi yang sudah ada: kebijakan keamanan di system prefix + label "untrusted". Risiko residual: injection via tool result content (title expense yang dikembalikan `list_expenses`).

```ts
// Tambahan perlindungan: batasi field user-controlled yang masuk ke prompt
// Misalnya strip field 'name' dari balances jika tidak diperlukan untuk analisis,
// atau gunakan allowlist field yang di-include.
```

---

### 🟡 MEDIUM

---

#### BUG-07 · `restoredDrafts` state basi saat panel dibuka ulang dengan array kosong
**File:** `src/components/layout/messages-panel.tsx:366`
**Status:** ❌ Belum diperbaiki

Guard `data.drafts.length > 0` berarti `setRestoredDrafts([])` tidak pernah dipanggil. Ketika semua draft sudah committed/rejected di server, membuka ulang panel tetap menampilkan draft lama.

```ts
// Fix: hapus guard length, selalu set state
setRestoredDrafts(
  (data.drafts ?? []).map((d) => ({
    ...d,
    _id: crypto.randomUUID(),
    _status: 'pending' as DraftStatus,
  }))
)
```

---

#### BUG-08 · Unsafe spread `r.data as object` — crash jika Prisma JsonValue adalah null
**File:** `src/app/api/ai-context-chat/drafts/route.ts:27`
**Status:** ❌ Belum diperbaiki

`Prisma.JsonValue` includes `null`. `...(null as object)` throws `TypeError` di runtime, mengakibatkan GET /drafts return 500 dan semua draft recovery gagal untuk user tersebut.

```ts
// Fix: null guard sebelum spread
const data =
  r.data && typeof r.data === 'object' && !Array.isArray(r.data)
    ? (r.data as Record<string, unknown>)
    : {}
return { ...data, _dbId: r.id }
```

---

#### BUG-09 · `handleReject` PATCH fire-and-forget — draft muncul kembali setelah gagal
**File:** `src/components/layout/messages-panel.tsx:500`
**Status:** ❌ Belum diperbaiki

PATCH tidak di-`await`. UI di-update optimistically, tapi jika server gagal, DB tetap `pending` — draft muncul kembali saat panel dibuka ulang tanpa peringatan.

```ts
// Fix: await dan handle error
async function handleReject(messageId: string | null, draft: DraftWithState) {
  // update UI optimistically
  if (draft._dbId) {
    const res = await fetch('/api/ai-context-chat/drafts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: draft._dbId }),
    })
    if (!res.ok) {
      // rollback UI atau tampilkan toast error
    }
  }
}
```

---

#### SEC-02 · `userMessage` tidak ada batas panjang
**File:** `src/app/api/ai-context-chat/route.ts:179`
**Status:** ❌ Belum diperbaiki

User bisa kirim string ratusan KB. Provider mengembalikan context-length error, outer catch return 500, rate limit sudah terpakai.

```ts
// Fix: tambahkan di awal validasi POST body
if (!userMessage || typeof userMessage !== "string") { ... }
if (userMessage.length > 4000) {
  return NextResponse.json({ error: "Pesan terlalu panjang (maks 4000 karakter)" }, { status: 400 })
}
```

---

#### BUG-10 · `ExpenseSchema.date` tidak validasi format — mismatch dengan tool schema
**File:** `src/lib/validations.ts:9`
**Status:** ❌ Belum diperbaiki

`draftExpenseSchema` di tools.ts memvalidasi `YYYY-MM-DD` via regex, tapi `ExpenseSchema` (dipakai di commit) hanya `z.string().min(1)`. Direct API call dengan `date: "kemarin"` lolos Zod, lalu `new Date("kemarin")` menghasilkan `Invalid Date`.

```ts
// Fix: tambahkan regex validation ke ExpenseSchema
date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
```

---

### 🔵 LOW / INFO

---

#### PERF-01 · Rate limit slot hangus sebelum `buildUserContext` jika DB error
**File:** `src/app/api/ai-context-chat/route.ts:174`
**Status:** ⚠️ Info

`checkRateLimit` di baris 174 increment counter sebelum `buildUserContext()` di baris 198. Transient DB error di context fetch = kuota terpakai tanpa respons AI.

---

#### PERF-02 · Dua fetch terpisah saat panel dibuka — bisa diparalelkan
**File:** `src/components/layout/messages-panel.tsx:357`
**Status:** ❌ Belum diperbaiki

```ts
// Fix: jalankan paralel
const [usageRes, draftsRes] = await Promise.all([
  fetch('/api/ai-context-chat'),
  fetch('/api/ai-context-chat/drafts'),
])
```

---

#### PERF-03 · `take: 10` di GET /drafts truncate tanpa sinyal ke client
**File:** `src/app/api/ai-context-chat/drafts/route.ts:23`
**Status:** ❌ Belum diperbaiki

Draft ke-11+ tidak terlihat, tidak bisa di-approve/reject, silent expire setelah 7 hari. Tambahkan `total` count di response.

---

#### CLEANUP-01 · `limitNumber` dan `idr()` duplikat fungsi yang sudah ada
**Files:** `src/app/api/ai-context-chat/route.ts:39`, `src/components/layout/messages-panel.tsx:85`
**Status:** ❌ Belum diperbaiki

- `limitNumber` identik dengan yang sudah di-export dari `src/lib/services/financeSummary.ts`
- `idr()` identik dengan `formatCurrency` dari `src/lib/services/financeSummary.ts`

Hapus duplikat, import dari source yang ada.

---

## Bagian 2 — UI / Aksesibilitas

### 🔴 Critical

---

#### UI-01 · Panel overflow di layar mobile 375px
**File:** `src/components/layout/messages-panel.tsx:529–536`
**Status:** ❌ Belum diperbaiki

`right-4` + `w-[350px]` = 366px dari kanan, memotong konten 9px di layar 375px. Di layar 320px (iPhone lama) overflow 46px.

```tsx
// Fix: tambahkan max-w ke class list panel
'max-w-[calc(100vw-2rem)]'
// sehingga panel tidak pernah overflow viewport
```

---

#### UI-02 · Tombol expand/collapse tanpa `aria-label`
**File:** `src/components/layout/messages-panel.tsx:553`
**Status:** ❌ Belum diperbaiki

Dua tombol lain punya `title` ("Start New Chat", "Close") tapi tombol expand/collapse tidak punya label apapun — screen reader mengumumkannya sebagai "button" tanpa konteks.

```tsx
// Fix:
<button
  aria-label={isExpanded ? 'Perkecil chat' : 'Perbesar chat'}
  title={isExpanded ? 'Perkecil' : 'Perbesar'}
  ...
>
```

---

### 🟠 HIGH

---

#### UI-03 · `bg-primary/25` user bubble bergantung tema global
**File:** `src/components/layout/messages-panel.tsx:157`
**Status:** ❌ Belum diperbaiki

Panel selalu dark, tapi `--primary` berubah antara light/dark mode (light: hijau, dark: berbeda). User bubble harus menggunakan variabel `--chat-*` yang theme-invariant.

```tsx
// Fix: ganti bg-primary/25 dengan warna chat-aware
'bg-white/10'  // atau variabel CSS baru --chat-user-bubble
```

---

#### UI-04 · Tidak ada entry point panel AI di mobile
**File:** `src/components/layout/session-wrapper.tsx:95`
**Status:** ❌ Belum diperbaiki

Tombol chat disembunyikan di mobile (`!isMobile`). Tidak ada shortcut di BottomNav. Fitur AI chat tidak bisa diakses sama sekali di perangkat mobile.

---

#### UI-05 · `UsageMeter` tooltip tidak bisa diakses keyboard
**File:** `src/components/layout/messages-panel.tsx:122`
**Status:** ❌ Belum diperbaiki

Outer div tidak focusable. Pengguna keyboard tidak bisa membaca info sisa kuota.

```tsx
// Fix: ganti div dengan button atau tambahkan tabIndex + role
<div
  className="flex items-center gap-1.5 cursor-help"
  tabIndex={0}
  role="meter"
  aria-valuenow={usage.current}
  aria-valuemin={0}
  aria-valuemax={usage.limit}
  aria-label={`Kuota AI: ${usage.current} dari ${usage.limit} terpakai`}
>
```

---

#### UI-06 · Header icon buttons kehilangan touch target 44px
**File:** `src/app/globals.css:314`
**Status:** ❌ Belum diperbaiki

`globals.css` set `button { min-height: 44px }` tapi kemudian mengoverride untuk `.h-7` — menyebabkan tombol 28×28px di touch device. Sangat sulit di-tap akurat.

```css
/* Fix: scope override lebih sempit, jangan override semua .h-7 button */
/* Atau gunakan invisible padding trick */
```

---

#### UI-07 · Section "Draft tertunda" tidak ada batas tinggi
**File:** `src/components/layout/messages-panel.tsx:644–659`
**Status:** ❌ Belum diperbaiki

Jika banyak draft pending, section tumbuh tak terbatas dan mendorong input area off-screen.

```tsx
// Fix: batasi tinggi dengan scroll
<div className="px-4 pb-2 shrink-0 max-h-[35%] overflow-y-auto space-y-1.5">
```

---

#### UI-08 · `text-[9px]` di bawah minimum WCAG
**File:** `src/components/layout/messages-panel.tsx:131, 208, 726`
**Status:** ❌ Belum diperbaiki

WCAG merekomendasikan minimum ~12px untuk teks yang dapat dibaca. `text-[9px]` dipakai di 3 tempat: usage counter, timestamp bubble, disclaimer footer.

```tsx
// Fix: naikkan semua ke text-[10px] atau text-[11px]
```

---

### 🟡 MEDIUM

---

#### UI-09 · Tidak ada `aria-live` di messages container
**File:** `src/components/layout/messages-panel.tsx:588`
**Status:** ❌ Belum diperbaiki

Screen reader tidak mengumumkan pesan AI baru secara otomatis.

```tsx
// Fix:
<div className="flex-1 overflow-y-auto ..." aria-live="polite" aria-atomic="false">
```

---

#### UI-10 · Inline `<code>` style teraplikasi di dalam `<pre>` — double-styling
**File:** `src/components/layout/messages-panel.tsx:175`
**Status:** ❌ Belum diperbaiki

ReactMarkdown dengan remark-gfm merender fenced code blocks sebagai `<pre><code>`. Inline code style (background + padding) diaplikasikan ulang di dalam block code, menghasilkan background redundan.

```tsx
// Fix: bedakan inline vs block via prop
code: ({ children, className }) => {
  const isBlock = !!className // remark-gfm menambahkan class language-xxx untuk block
  if (isBlock) return <code className="font-mono text-[11px]">{children}</code>
  return <code className="bg-chat-surface/70 rounded px-1 py-0.5 text-[11px] font-mono">{children}</code>
}
```

---

#### UI-11 · `top-4 bottom-4` dan `max-h-[80vh]` bertabrakan
**File:** `src/components/layout/messages-panel.tsx:531`
**Status:** ⚠️ Info

`top-4 bottom-4` sudah fully constrain tinggi panel. `max-h-[80vh]` redundan dan keduanya bisa bertabrakan di layar pendek (≤500px). Pertimbangkan pakai salah satu saja.

---

#### UI-12 · Raw `<button>` di header alih-alih shadcn `<Button>`
**File:** `src/components/layout/messages-panel.tsx:552–573`
**Status:** ⚠️ Info

3 tombol header menggunakan raw `<button>`, melewatkan focus ring dan variant logic shadcn. Tidak kritis tapi inkonsisten dengan bagian panel lain.

---

### 🔵 LOW

| # | Masalah | File |
|---|---------|------|
| UI-13 | Entrance animation `x: ±400` lebih lebar dari panel di narrow screen — gunakan `'100%'` | messages-panel.tsx:524 |
| UI-14 | 7-stop type scale (9/10/11/12/13/14px + text-xs) — konsolidasi ke 3–4 stop | Seluruh panel |
| UI-15 | `isExpanded` `w-[600px]` tanpa viewport guard — bisa overflow di tablet 768px dengan sidebar | messages-panel.tsx:534 |
| UI-16 | DraftCard approve/reject button tidak punya `aria-label` yang menyebutkan judul transaksi | messages-panel.tsx:299 |
| UI-17 | Typing indicator tidak punya `role="status"` — screen reader tidak tahu AI sedang mengetik | messages-panel.tsx:627 |

---

## Roadmap Perbaikan

### Sprint 1 — Security & Double-commit (WAJIB sebelum production)
- [ ] BUG-01: Load draft dari DB di commit endpoint, jangan pakai body klien
- [ ] BUG-02: Atomic idempotency check sebelum commitDraft
- [ ] SEC-01: Ownership check untuk `budgetId` di createExpense

### Sprint 2 — Correctness & Robustness
- [ ] BUG-03: Fix budgetUtilization — query aggregate dari DB, bukan filter 20 row
- [ ] BUG-04: Isolasi agentDraft.create dengan inner try/catch
- [ ] BUG-05: Ganti `??` dengan `||` di agent-loop fallback messages
- [ ] BUG-07: Hapus guard `length > 0` di restored drafts useEffect
- [ ] BUG-08: Null-guard sebelum spread `r.data` di GET /drafts
- [ ] BUG-09: Await PATCH handleReject + rollback jika gagal
- [ ] BUG-10: Tambahkan date regex ke ExpenseSchema

### Sprint 3 — Mobile & Accessibility
- [ ] UI-01: `max-w-[calc(100vw-2rem)]` di panel
- [ ] UI-02: `aria-label` di tombol expand/collapse
- [ ] UI-04: Entry point chat di mobile (BottomNav atau sheet)
- [ ] UI-05: `tabIndex` + `role` di UsageMeter
- [ ] UI-06: Fix touch target 44px di globals.css
- [ ] UI-07: `max-h` + scroll di section "Draft tertunda"
- [ ] UI-08: Naikkan `text-[9px]` ke `text-[10px]`
- [ ] UI-09: `aria-live` di messages container

### Sprint 4 — Polish & Cleanup
- [ ] PERF-02: Paralelkan dua fetch saat panel buka
- [ ] PERF-03: Tambahkan `total` count di GET /drafts response
- [ ] CLEANUP-01: Hapus duplikat `limitNumber` dan `idr()`
- [ ] UI-03: Ganti `bg-primary/25` dengan variabel chat-aware
- [ ] UI-10: Fix double-styling code block di ReactMarkdown
- [ ] UI-11: Pilih salah satu: `top/bottom` atau `max-h`

---

## Catatan Arsitektur

### Rate Limit In-Memory
`usageMap` di `route.ts` adalah module-level `Map` — reset saat server restart dan tidak shared antar instance horizontal. Di deployment multi-container ini berarti user bisa melewati limit 20/hari. Untuk production scale: ganti dengan Redis atau `AgentRateLimit` tabel di DB.

### Draft Truncation
GET /drafts hanya mengembalikan 10 draft terbaru. Draft ke-11+ tidak bisa diakses via UI dan expire setelah 7 hari. Tambahkan pagination atau naikkan limit jika use case memungkinkan banyak draft concurrent.

### Prompt Injection
Mitigasi saat ini (kebijakan dalam system prefix + delimiter `USER_DATA_JSON`) adalah soft guardrail — LLM tidak enforce boundary secara protokol. Untuk hardening lebih lanjut: pertimbangkan memisahkan data user ke `user` turn terpisah setelah `assistant` ack, sehingga data tidak berada di system prompt sama sekali.
