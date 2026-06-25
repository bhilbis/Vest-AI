# MVP Agent Harness Blueprint: Vest AI Financial Assistant

> Dihasilkan dengan skill `agents-best-practices` (MVP Builder Mode), di-grounding ke kode Vest AI.
> Tanggal: 2026-06-23

---

## Ringkasan singkat

App ini **sudah punya** financial assistant Level-0 (answer-only) di
`src/app/api/ai-context-chat/route.ts` — read-only, menyuntik seluruh konteks
user sebagai JSON ke system prompt, rate-limit 20/hari, multi-provider
(Gemini/Groq).

Blueprint ini memetakan kondisi sekarang lalu menunjukkan jalur upgrade ke
agent yang bisa **bertindak** (mencatat transaksi) dengan aman:
**draft -> approve -> commit**.

Dua gotcha utama di kode sekarang:
1. Seluruh konteks user di-`JSON.stringify` ke akhir system prompt
   (`route.ts:250`) -> prompt berubah tiap user -> cache-hit nol -> boros token.
2. Belum ada pemisahan **draft/commit** untuk aksi finansial.

---

## 1. Objective

Membantu user menganalisis keuangan (expense/income/budget/transfer) dan
**mencatat transaksi via percakapan** (contoh: "catat pengeluaran kopi 25rb
dari BCA"), tanpa pernah memindahkan/menghapus uang tanpa persetujuan eksplisit.

## 2. MVP scope & assumptions

- Sudah ada (Level 0): analisis read-only di `ai-context-chat`. Itu fondasinya — jangan dibuang.
- Target MVP (Level 2): tambahkan tool calling untuk draft -> approve -> commit pencatatan expense/income.
- Non-goals MVP: transfer antar-akun otomatis, hapus transaksi, saran investasi yang mengikat, eksekusi otomatis tanpa approval.
- Asumsi: semua aksi tulis approval-gated; agent hanya membaca data milik `session.user.id`.

## 3. Autonomy & risk level

| Aksi                         | Level   | Kebijakan                                  |
|------------------------------|---------|--------------------------------------------|
| Read/analyze                 | Level 0 | Bebas (read-only, scoped per user)         |
| Create expense/income        | Level 2 | Agent mengusulkan, user konfirmasi dulu    |
| Transfer / delete / ubah saldo | -     | Deny by default (irreversible)             |

Prinsip skill: "Draft dan commit harus terpisah untuk aksi finansial."
Kode kamu sudah memisah validasi di `$transaction`
(`src/lib/services/expenseService.ts:131`) — tinggal pisahkan langkah propose
dari execute.

## 4. Core agentic loop

Ganti pola "satu shot dump JSON" jadi loop tool-calling:

```
user message
  -> build context (ringkasan finansial, BUKAN full dump)
  -> model call dengan tool registry
  -> tool_call? validasi schema (zod) -> cek permission
       read tool   -> execute langsung -> observation
       write tool  -> PAUSE, kembalikan draft untuk approval
  -> setelah approval user -> commit tool -> observation
  -> ulangi sampai final answer / budget habis
```

Budget: maksimal ~5 step/turn, plus rate-limit harian yang sudah ada
(`DAILY_LIMIT = 20`).

## 5. Context & instruction architecture

Masalah sekarang: seluruh konteks user di-`JSON.stringify` ke akhir system
prompt (`route.ts:250`) -> prompt berubah tiap user -> cache-hit nol -> boros
token.

Urutan cache-aware yang disarankan:

1. System role + protocol (statis)            <- cacheable prefix
2. Tool schemas (statis)
3. Ringkasan finansial user (dinamis)         <- pakai `financialSummary`
   yang sudah dihitung (runway, budget utilization), bukan 20 row mentah
4. History (sudah dibatasi `HISTORY_WINDOW = 10`)
5. User message

Pisahkan instruksi (trusted) dari data user (untrusted) — jangan biarkan isi
field `title`/`notes` transaksi dianggap perintah.

## 6. Tool registry (typed, narrow)

| tool                        | risk_class        | permission       | side effect                                   |
|-----------------------------|-------------------|------------------|-----------------------------------------------|
| `get_financial_summary`     | read_private_data | allow (user scope) | none                                        |
| `list_expenses` (filter)    | read_private_data | allow            | none — bungkus `getExpenses()` (expenseService.ts:50) |
| `draft_expense`             | propose_write     | allow            | none — hanya kembalikan preview               |
| `commit_expense`            | financial_write   | approval-gated   | bungkus `createExpense()`                     |
| `draft_income` / `commit_income` | financial_write | approval-gated | —                                            |
| `transfer` / `delete_*`     | destructive       | deny (MVP)       | —                                            |

Validasi argumen pakai `ExpenseSchema` (zod) yang sudah ada di
`src/lib/validations.ts` — reuse, jangan bikin baru. Setiap tool kembalikan
hasil terstruktur `{ status, summary, ref }`, termasuk saat ditolak.

## 7. Planning behavior

Aktif saat permintaan ambigu/multi-langkah ("rapikan budget bulan ini"). Saat
planning: hanya `read`/`draft`; `commit_*` diblokir sampai user setuju rencana.

## 8. Goal-like loop

Tidak untuk MVP. Use case ini transaksional, bukan objektif jangka panjang.
Tambahkan nanti hanya jika ada eval yang menuntutnya.

## 9. Memory & compaction

Approval state + draft yang pending harus disimpan di luar prompt (mis. tabel
`Analysis` yang sudah ada, atau record draft baru). Kalau session panjang,
compaction wajib mempertahankan: draft pending, approval state, transaksi yang
sudah ter-commit ("jangan dobel-catat").

## 10. Skills & connectors

MVP belum perlu MCP. Kalau live price CoinGecko (`/api/price`) mau dipakai
agent, perlakukan sebagai connector read-only ber-namespace, dan anggap
responsnya data, bukan instruksi.

## 11. Prompt caching & cost

- Pindahkan dump JSON dari prefix -> suffix (lihat bagian 5) untuk naikkan cache-hit.
- Model kecil (`llama-3.1-8b-instant`) untuk routing/ringkasan; model besar untuk sintesis akhir — `AI_MODELS` sudah punya tier ini.
- Batasi `max_result_chars` per tool (mis. `list_expenses` maksimal 20 row) — sejalan dengan `take: 20` yang sudah dipakai.

## 12. Safety & approvals

- Secrets (`GEMINI_API_KEY` dll) tidak pernah masuk ke model — sudah aman, dipakai server-side via `@/lib/env`.
- `commit_expense` wajib re-cek `userId` + saldo di server (jangan percaya argumen model). Logika `Saldo tidak mencukupi` di `expenseService.ts:141` jadi guardrail kode, bukan sekadar prompt.
- Prompt-injection: data transaksi user yang ditampilkan ke model tidak boleh mengubah kebijakan tool.

## 13. Observability & evals

Trace tiap run: tools exposed, tool calls + args, permission decision, approval
result, tokens/cost, final status.

Eval set minimum:

- happy path (catat 1 expense)
- saldo tidak cukup
- request ambigu
- percobaan bypass approval ("langsung commit tanpa tanya")
- injection di field `title`
- context overflow
- rate-limit (429)

## 14. Minimal implementation path

1. Refactor `buildSystemPrompt` -> prefix statis + suffix dinamis (cache).
2. Tambah tool registry + zod validation (reuse `ExpenseSchema`).
3. Tool read-only dulu (`list_expenses`, `get_financial_summary`).
4. `draft_expense` (preview, no write).
5. `commit_expense` approval-gated -> bungkus `createExpense()` dalam `$transaction`.
6. Simpan approval/draft state + tracing.
7. Eval injection & approval-bypass SEBELUM rollout.

## 15. First release checklist

- [ ] Satu job jelas
- [ ] Write = approval-gated
- [ ] Tiap tool punya schema + risk + limit
- [ ] Saldo/userId dicek di kode, bukan prompt
- [ ] Prefix prompt stabil untuk cache
- [ ] Draft/approval disimpan di luar prompt
- [ ] Eval injection + bypass lulus
- [ ] Rollout ke user terbatas dulu

---

## File terkait di repo

- `src/app/api/ai-context-chat/route.ts` — financial assistant Level-0 saat ini
- `src/app/api/data.ts` — `AI_MODELS` (tier model Gemini/Groq)
- `src/lib/services/expenseService.ts` — `getExpenses()`, `createExpense()`
- `src/lib/actions/expense.ts` — server actions expense (create/update/delete)
- `src/lib/validations.ts` — `ExpenseSchema` (zod) untuk reuse validasi
- `src/lib/env.ts` — akses API key server-side
