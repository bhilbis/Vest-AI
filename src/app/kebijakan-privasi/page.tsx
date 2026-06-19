import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description:
    "Kebijakan Privasi Financial Tracker — pelajari bagaimana kami mengumpulkan, menggunakan, dan melindungi data pribadi Anda.",
  alternates: { canonical: "/kebijakan-privasi" },
  robots: { index: true, follow: true },
};

const LAST_UPDATED = "18 Juni 2026";
const APP_NAME = "Financial Tracker";
const CONTACT_EMAIL = "lbbpramuka@gmail.com";

export default function KebijakanPrivasiPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top nav */}
      <nav className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-6 py-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Kembali ke Aplikasi
          </Link>
          <span className="text-muted-foreground/40">·</span>
          <Link
            href="/syarat-ketentuan"
            className="text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            Syarat &amp; Ketentuan
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
        {/* Header */}
        <header className="mb-10 border-b border-border pb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2a5 5 0 1 0 0 10A5 5 0 0 0 12 2zm0 12c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z"/>
            </svg>
            Dokumen Resmi
          </div>
          <h1 className="mb-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Kebijakan Privasi
          </h1>
          <p className="text-base text-muted-foreground">
            Terakhir diperbarui: <span className="font-medium text-foreground">{LAST_UPDATED}</span>
          </p>
        </header>

        {/* Intro */}
        <section className="mb-10 rounded-xl border border-primary/20 bg-primary/5 p-5">
          <p className="text-sm leading-relaxed text-foreground/80">
            {APP_NAME} berkomitmen untuk melindungi privasi Anda. Kebijakan ini menjelaskan bagaimana kami
            mengumpulkan, menggunakan, menyimpan, dan melindungi informasi pribadi Anda saat menggunakan
            layanan kami. Dengan menggunakan aplikasi ini, Anda menyetujui praktik yang dijelaskan dalam
            kebijakan ini.
          </p>
        </section>

        <div className="space-y-10">
          {/* Section 1 */}
          <section>
            <h2 className="mb-4 text-xl font-semibold tracking-tight">
              1. Informasi yang Kami Kumpulkan
            </h2>
            <div className="space-y-5 text-sm leading-relaxed text-foreground/80">
              <div>
                <h3 className="mb-2 font-semibold text-foreground">
                  1.1 Informasi yang Anda Berikan Secara Langsung
                </h3>
                <ul className="ml-4 space-y-1.5 list-disc marker:text-primary">
                  <li>Nama dan alamat email saat registrasi akun.</li>
                  <li>Data keuangan: transaksi pemasukan, pengeluaran, transfer, dan budget yang Anda masukkan secara manual.</li>
                  <li>Data akademik (modul Kuliah): nilai, mata kuliah, dan target IPK jika Anda menggunakan fitur ini.</li>
                  <li>Preferensi dan pengaturan aplikasi yang Anda konfigurasi.</li>
                </ul>
              </div>
              <div>
                <h3 className="mb-2 font-semibold text-foreground">
                  1.2 Informasi yang Dikumpulkan Secara Otomatis
                </h3>
                <ul className="ml-4 space-y-1.5 list-disc marker:text-primary">
                  <li>Data sesi autentikasi (token sesi, waktu login/logout).</li>
                  <li>Log aktivitas dalam aplikasi untuk keperluan keamanan dan pemecahan masalah.</li>
                  <li>Informasi perangkat: jenis browser, sistem operasi, dan resolusi layar.</li>
                  <li>Alamat IP untuk keperluan keamanan dan pencegahan penipuan.</li>
                </ul>
              </div>
              <div>
                <h3 className="mb-2 font-semibold text-foreground">
                  1.3 Informasi dari Layanan AI
                </h3>
                <p>
                  Saat Anda menggunakan fitur AI Assistant, percakapan dan konteks keuangan yang relevan
                  dikirim ke layanan AI pihak ketiga (Anthropic Claude) untuk menghasilkan respons.
                  Percakapan ini tidak disimpan secara permanen setelah sesi berakhir kecuali ditampilkan
                  dalam riwayat percakapan Anda di aplikasi.
                </p>
              </div>
            </div>
          </section>

          <hr className="border-border" />

          {/* Section 2 */}
          <section>
            <h2 className="mb-4 text-xl font-semibold tracking-tight">
              2. Cara Kami Menggunakan Informasi Anda
            </h2>
            <div className="space-y-3 text-sm leading-relaxed text-foreground/80">
              <p>Kami menggunakan informasi yang dikumpulkan untuk tujuan berikut:</p>
              <ul className="ml-4 space-y-2 list-disc marker:text-primary">
                <li><span className="font-medium text-foreground">Menyediakan layanan:</span> Menampilkan data keuangan, menghasilkan laporan, dan menjalankan fitur-fitur aplikasi.</li>
                <li><span className="font-medium text-foreground">Personalisasi:</span> Menyesuaikan tampilan dan rekomendasi AI berdasarkan data keuangan Anda.</li>
                <li><span className="font-medium text-foreground">Keamanan akun:</span> Memverifikasi identitas Anda dan mencegah akses tidak sah.</li>
                <li><span className="font-medium text-foreground">Peningkatan layanan:</span> Menganalisis pola penggunaan secara anonim untuk meningkatkan performa dan fitur aplikasi.</li>
                <li><span className="font-medium text-foreground">Komunikasi:</span> Mengirimkan pemberitahuan penting terkait akun atau perubahan layanan.</li>
              </ul>
              <p className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-amber-700 dark:text-amber-400">
                Kami <strong>tidak</strong> menjual, menyewakan, atau memperdagangkan data pribadi Anda kepada pihak ketiga untuk tujuan pemasaran.
              </p>
            </div>
          </section>

          <hr className="border-border" />

          {/* Section 3 */}
          <section>
            <h2 className="mb-4 text-xl font-semibold tracking-tight">
              3. Keamanan Data
            </h2>
            <div className="space-y-4 text-sm leading-relaxed text-foreground/80">
              <p>
                Kami menerapkan langkah-langkah keamanan teknis dan organisasi yang wajar untuk melindungi
                data Anda dari akses, pengungkapan, perubahan, atau penghancuran yang tidak sah:
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { icon: "🔐", title: "Enkripsi Data", desc: "Data sensitif dienkripsi saat disimpan dan dikirim menggunakan protokol HTTPS/TLS." },
                  { icon: "🔑", title: "Autentikasi Aman", desc: "Password di-hash menggunakan bcrypt. Sesi dikelola dengan token yang aman." },
                  { icon: "🛡️", title: "Kontrol Akses", desc: "Setiap pengguna hanya dapat mengakses data miliknya sendiri." },
                  { icon: "🔄", title: "Backup Rutin", desc: "Data dicadangkan secara berkala untuk mencegah kehilangan data." },
                ].map((item) => (
                  <div key={item.title} className="rounded-lg border border-border bg-card p-4">
                    <div className="mb-1.5 text-lg">{item.icon}</div>
                    <div className="mb-1 font-semibold text-foreground text-sm">{item.title}</div>
                    <div className="text-xs text-muted-foreground">{item.desc}</div>
                  </div>
                ))}
              </div>
              <p>
                Meskipun kami berupaya semaksimal mungkin, tidak ada sistem keamanan yang sempurna.
                Anda bertanggung jawab menjaga kerahasiaan kredensial akun Anda.
              </p>
            </div>
          </section>

          <hr className="border-border" />

          {/* Section 4 */}
          <section>
            <h2 className="mb-4 text-xl font-semibold tracking-tight">
              4. Cookies dan Teknologi Pelacakan
            </h2>
            <div className="space-y-4 text-sm leading-relaxed text-foreground/80">
              <p>Kami menggunakan cookies dan penyimpanan lokal browser untuk:</p>
              <div className="overflow-hidden rounded-lg border border-border">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left font-semibold text-foreground">Jenis</th>
                      <th className="px-4 py-3 text-left font-semibold text-foreground">Tujuan</th>
                      <th className="px-4 py-3 text-left font-semibold text-foreground">Durasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr>
                      <td className="px-4 py-3 font-medium text-foreground">Sesi Auth</td>
                      <td className="px-4 py-3">Menjaga status login Anda</td>
                      <td className="px-4 py-3">Hingga logout</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-foreground">Preferensi</td>
                      <td className="px-4 py-3">Menyimpan pengaturan tema (gelap/terang)</td>
                      <td className="px-4 py-3">1 tahun</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-foreground">Fungsional</td>
                      <td className="px-4 py-3">Cache data untuk performa aplikasi (PWA)</td>
                      <td className="px-4 py-3">Bervariasi</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                Anda dapat menghapus cookies melalui pengaturan browser. Namun, menghapus cookies sesi
                autentikasi akan mengharuskan Anda login kembali.
              </p>
            </div>
          </section>

          <hr className="border-border" />

          {/* Section 5 */}
          <section>
            <h2 className="mb-4 text-xl font-semibold tracking-tight">
              5. Berbagi Data dengan Pihak Ketiga
            </h2>
            <div className="space-y-3 text-sm leading-relaxed text-foreground/80">
              <p>Kami dapat berbagi data dengan pihak ketiga terbatas dalam situasi berikut:</p>
              <ul className="ml-4 space-y-2 list-disc marker:text-primary">
                <li><span className="font-medium text-foreground">Penyedia Layanan AI (Anthropic):</span> Konteks percakapan dikirim untuk menghasilkan respons AI. Data ini tunduk pada <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Kebijakan Privasi Anthropic</a>.</li>
                <li><span className="font-medium text-foreground">Penyedia Infrastruktur:</span> Server hosting dan database untuk operasional layanan.</li>
                <li><span className="font-medium text-foreground">Kewajiban Hukum:</span> Jika diwajibkan oleh hukum atau otoritas yang berwenang di Indonesia.</li>
              </ul>
            </div>
          </section>

          <hr className="border-border" />

          {/* Section 6 */}
          <section>
            <h2 className="mb-4 text-xl font-semibold tracking-tight">
              6. Hak-Hak Anda
            </h2>
            <div className="space-y-3 text-sm leading-relaxed text-foreground/80">
              <p>Sesuai dengan peraturan perlindungan data yang berlaku, Anda berhak untuk:</p>
              <ul className="ml-4 space-y-2 list-disc marker:text-primary">
                <li><span className="font-medium text-foreground">Akses:</span> Meminta salinan data pribadi yang kami simpan tentang Anda.</li>
                <li><span className="font-medium text-foreground">Koreksi:</span> Memperbarui data yang tidak akurat melalui pengaturan akun.</li>
                <li><span className="font-medium text-foreground">Penghapusan:</span> Meminta penghapusan akun dan seluruh data Anda.</li>
                <li><span className="font-medium text-foreground">Portabilitas:</span> Mengekspor data transaksi Anda dalam format CSV.</li>
                <li><span className="font-medium text-foreground">Keberatan:</span> Menolak pemrosesan data tertentu untuk tujuan analitik.</li>
              </ul>
              <p>
                Untuk mengajukan permintaan terkait hak-hak Anda, hubungi kami di{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-primary hover:underline">
                  {CONTACT_EMAIL}
                </a>
                . Kami akan merespons dalam 14 hari kerja.
              </p>
            </div>
          </section>

          <hr className="border-border" />

          {/* Section 7 */}
          <section>
            <h2 className="mb-4 text-xl font-semibold tracking-tight">
              7. Retensi Data
            </h2>
            <div className="text-sm leading-relaxed text-foreground/80">
              <p>
                Data akun dan transaksi disimpan selama akun Anda aktif. Setelah penghapusan akun,
                data Anda akan dihapus secara permanen dalam 30 hari, kecuali kami diwajibkan
                menyimpannya lebih lama berdasarkan hukum yang berlaku di Indonesia.
              </p>
            </div>
          </section>

          <hr className="border-border" />

          {/* Section 8 */}
          <section>
            <h2 className="mb-4 text-xl font-semibold tracking-tight">
              8. Perubahan Kebijakan Privasi
            </h2>
            <div className="text-sm leading-relaxed text-foreground/80">
              <p>
                Kami dapat memperbarui kebijakan ini dari waktu ke waktu. Perubahan material akan
                diberitahukan melalui notifikasi dalam aplikasi atau email setidaknya 7 hari sebelum
                berlaku. Penggunaan berkelanjutan setelah perubahan berlaku dianggap sebagai
                persetujuan Anda.
              </p>
            </div>
          </section>

          <hr className="border-border" />

          {/* Contact */}
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-3 text-xl font-semibold tracking-tight">
              Hubungi Kami
            </h2>
            <p className="mb-4 text-sm leading-relaxed text-foreground/80">
              Jika Anda memiliki pertanyaan, kekhawatiran, atau permintaan terkait kebijakan privasi ini
              atau data pribadi Anda, silakan hubungi kami:
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-foreground/80">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary shrink-0">
                  <rect width="20" height="16" x="2" y="4" rx="2"/>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline font-medium">
                  {CONTACT_EMAIL}
                </a>
              </div>
              <div className="flex items-center gap-2 text-foreground/80">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary shrink-0">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <span>Indonesia</span>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="mt-12 flex flex-col items-center gap-3 border-t border-border pt-8 text-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} {APP_NAME}. Seluruh hak dilindungi.</p>
          <div className="flex gap-4">
            <Link href="/kebijakan-privasi" className="text-primary font-medium">Kebijakan Privasi</Link>
            <span>·</span>
            <Link href="/syarat-ketentuan" className="hover:text-foreground transition-colors">Syarat &amp; Ketentuan</Link>
            <span>·</span>
            <Link href="/dashboard" className="hover:text-foreground transition-colors">Kembali ke App</Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
