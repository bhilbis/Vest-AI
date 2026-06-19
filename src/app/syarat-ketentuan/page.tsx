import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan",
  description:
    "Syarat dan Ketentuan Penggunaan Financial Tracker — pelajari aturan, hak, dan kewajiban Anda sebagai pengguna layanan kami.",
  alternates: { canonical: "/syarat-ketentuan" },
  robots: { index: true, follow: true },
};

const LAST_UPDATED = "18 Juni 2026";
const APP_NAME = "Financial Tracker";
const CONTACT_EMAIL = "lbbpramuka@gmail.com";

export default function SyaratKetentuanPage() {
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
            href="/kebijakan-privasi"
            className="text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            Kebijakan Privasi
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
        {/* Header */}
        <header className="mb-10 border-b border-border pb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            Dokumen Resmi
          </div>
          <h1 className="mb-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Syarat &amp; Ketentuan
          </h1>
          <p className="text-base text-muted-foreground">
            Terakhir diperbarui: <span className="font-medium text-foreground">{LAST_UPDATED}</span>
          </p>
        </header>

        {/* Intro */}
        <section className="mb-10 rounded-xl border border-primary/20 bg-primary/5 p-5">
          <p className="text-sm leading-relaxed text-foreground/80">
            Harap baca Syarat &amp; Ketentuan ini dengan saksama sebelum menggunakan {APP_NAME}.
            Dengan mengakses atau menggunakan layanan kami, Anda menyetujui untuk terikat oleh
            syarat-syarat ini. Jika Anda tidak menyetujui, harap hentikan penggunaan layanan.
          </p>
        </section>

        <div className="space-y-10">
          {/* Section 1 */}
          <section>
            <h2 className="mb-4 text-xl font-semibold tracking-tight">
              1. Penerimaan Syarat
            </h2>
            <div className="space-y-3 text-sm leading-relaxed text-foreground/80">
              <p>
                Dengan mendaftar, masuk, atau menggunakan {APP_NAME} (&ldquo;Layanan&rdquo;), Anda
                menyatakan bahwa:
              </p>
              <ul className="ml-4 space-y-2 list-disc marker:text-primary">
                <li>Anda berusia minimal 17 tahun atau telah mendapat persetujuan orang tua/wali.</li>
                <li>Anda memiliki kapasitas hukum untuk membuat perjanjian yang mengikat.</li>
                <li>Informasi yang Anda berikan saat registrasi adalah akurat dan terkini.</li>
                <li>Anda telah membaca dan memahami <Link href="/kebijakan-privasi" className="text-primary hover:underline">Kebijakan Privasi</Link> kami.</li>
              </ul>
            </div>
          </section>

          <hr className="border-border" />

          {/* Section 2 */}
          <section>
            <h2 className="mb-4 text-xl font-semibold tracking-tight">
              2. Deskripsi Layanan
            </h2>
            <div className="space-y-3 text-sm leading-relaxed text-foreground/80">
              <p>
                {APP_NAME} adalah aplikasi web dan PWA (Progressive Web App) untuk pencatatan
                keuangan pribadi yang mencakup:
              </p>
              <ul className="ml-4 space-y-2 list-disc marker:text-primary">
                <li>Pencatatan transaksi pemasukan, pengeluaran, dan transfer antar akun.</li>
                <li>Pengelolaan anggaran (budget) dan pelacakan aset.</li>
                <li>Laporan dan analisis keuangan personal.</li>
                <li>AI Assistant untuk konsultasi dan analisis keuangan (berbasis Anthropic Claude).</li>
                <li>Pelacak akademik (nilai, IPK, persiapan UAS) sebagai fitur tambahan.</li>
              </ul>
              <p>
                Layanan ini bersifat personal dan dirancang untuk penggunaan individu, bukan entitas
                bisnis atau korporat.
              </p>
            </div>
          </section>

          <hr className="border-border" />

          {/* Section 3 */}
          <section>
            <h2 className="mb-4 text-xl font-semibold tracking-tight">
              3. Ketentuan Penggunaan
            </h2>
            <div className="space-y-5 text-sm leading-relaxed text-foreground/80">
              <div>
                <h3 className="mb-2 font-semibold text-foreground">3.1 Penggunaan yang Diizinkan</h3>
                <ul className="ml-4 space-y-1.5 list-disc marker:text-primary">
                  <li>Menggunakan Layanan untuk keperluan pencatatan keuangan pribadi yang sah.</li>
                  <li>Mengakses Layanan dari perangkat dan lokasi mana pun sesuai hukum setempat.</li>
                  <li>Mengekspor data milik Anda sendiri dalam format yang tersedia.</li>
                </ul>
              </div>
              <div>
                <h3 className="mb-2 font-semibold text-foreground">3.2 Penggunaan yang Dilarang</h3>
                <p className="mb-2">Anda dilarang keras untuk:</p>
                <ul className="ml-4 space-y-1.5 list-disc marker:text-destructive">
                  <li>Menggunakan Layanan untuk aktivitas ilegal, penipuan, atau pencucian uang.</li>
                  <li>Mencoba mengakses akun pengguna lain tanpa izin.</li>
                  <li>Melakukan rekayasa balik, decompile, atau ekstraksi kode sumber aplikasi.</li>
                  <li>Menggunakan bot, scraper, atau alat otomatis untuk mengakses Layanan secara massal.</li>
                  <li>Menyebarkan malware atau kode berbahaya melalui Layanan.</li>
                  <li>Menggunakan Layanan untuk menyimpan atau memproses data orang lain tanpa izin mereka.</li>
                  <li>Menjual kembali atau mengkomersilkan akses ke Layanan.</li>
                </ul>
              </div>
              <div>
                <h3 className="mb-2 font-semibold text-foreground">3.3 Keamanan Akun</h3>
                <p>
                  Anda bertanggung jawab penuh atas semua aktivitas yang terjadi di bawah akun Anda.
                  Segera hubungi kami di <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a> jika
                  Anda mencurigai akses tidak sah ke akun Anda.
                </p>
              </div>
            </div>
          </section>

          <hr className="border-border" />

          {/* Section 4 */}
          <section>
            <h2 className="mb-4 text-xl font-semibold tracking-tight">
              4. Batasan Tanggung Jawab
            </h2>
            <div className="space-y-4 text-sm leading-relaxed text-foreground/80">
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-amber-700 dark:text-amber-400">
                <p className="font-semibold mb-1">Penting untuk Diperhatikan</p>
                <p className="text-xs">
                  {APP_NAME} adalah alat bantu pencatatan keuangan, bukan lembaga keuangan, penasihat
                  investasi, atau konsultan keuangan berlisensi. Saran dari AI Assistant bersifat
                  informatif dan tidak merupakan nasihat keuangan profesional.
                </p>
              </div>
              <p>Kami tidak bertanggung jawab atas:</p>
              <ul className="ml-4 space-y-2 list-disc marker:text-primary">
                <li>Keputusan keuangan yang Anda buat berdasarkan data atau saran AI dalam aplikasi.</li>
                <li>Kehilangan data akibat kesalahan pengguna, kegagalan perangkat, atau keadaan di luar kendali kami.</li>
                <li>Gangguan layanan karena pemeliharaan, gangguan infrastruktur, atau kejadian force majeure.</li>
                <li>Kerugian tidak langsung, insidental, atau konsekuensial yang timbul dari penggunaan Layanan.</li>
                <li>Keakuratan atau kelengkapan respons yang dihasilkan oleh AI Assistant.</li>
              </ul>
              <p>
                Sejauh diizinkan oleh hukum Indonesia, total kewajiban kami kepada Anda tidak
                akan melebihi jumlah yang Anda bayarkan kepada kami dalam 3 bulan terakhir
                (atau Rp 0 jika layanan gratis).
              </p>
            </div>
          </section>

          <hr className="border-border" />

          {/* Section 5 */}
          <section>
            <h2 className="mb-4 text-xl font-semibold tracking-tight">
              5. Hak Kekayaan Intelektual
            </h2>
            <div className="space-y-4 text-sm leading-relaxed text-foreground/80">
              <div>
                <h3 className="mb-2 font-semibold text-foreground">5.1 Kepemilikan Layanan</h3>
                <p>
                  {APP_NAME}, termasuk desain, kode, logo, antarmuka pengguna, dan semua konten
                  yang dibuat oleh kami, adalah milik eksklusif kami dan dilindungi oleh hukum
                  hak cipta, merek dagang, dan kekayaan intelektual lainnya yang berlaku di Indonesia.
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-semibold text-foreground">5.2 Kepemilikan Data Anda</h3>
                <p>
                  Data keuangan yang Anda masukkan ke dalam aplikasi tetap sepenuhnya milik Anda.
                  Kami tidak mengklaim kepemilikan atas data tersebut. Anda dapat mengekspor
                  atau menghapus data Anda kapan saja.
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-semibold text-foreground">5.3 Lisensi Penggunaan</h3>
                <p>
                  Kami memberi Anda lisensi terbatas, non-eksklusif, tidak dapat dipindahkan, dan
                  dapat dibatalkan untuk mengakses dan menggunakan Layanan semata-mata untuk
                  keperluan pribadi dan non-komersial sesuai Syarat ini.
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-semibold text-foreground">5.4 Konten yang Dihasilkan AI</h3>
                <p>
                  Respons yang dihasilkan oleh AI Assistant didasarkan pada teknologi Anthropic Claude.
                  Anda tidak boleh menggunakan output AI untuk tujuan komersial tanpa memverifikasi
                  keakuratannya terlebih dahulu.
                </p>
              </div>
            </div>
          </section>

          <hr className="border-border" />

          {/* Section 6 */}
          <section>
            <h2 className="mb-4 text-xl font-semibold tracking-tight">
              6. Ketersediaan Layanan
            </h2>
            <div className="space-y-3 text-sm leading-relaxed text-foreground/80">
              <p>
                Kami berupaya menjaga ketersediaan Layanan 24/7, namun tidak menjamin uptime 100%.
                Kami berhak untuk:
              </p>
              <ul className="ml-4 space-y-2 list-disc marker:text-primary">
                <li>Melakukan pemeliharaan terjadwal atau darurat yang dapat mengakibatkan downtime sementara.</li>
                <li>Memodifikasi, menambah, atau menghapus fitur dari Layanan tanpa pemberitahuan sebelumnya.</li>
                <li>Menghentikan Layanan secara permanen dengan pemberitahuan minimal 30 hari.</li>
              </ul>
            </div>
          </section>

          <hr className="border-border" />

          {/* Section 7 */}
          <section>
            <h2 className="mb-4 text-xl font-semibold tracking-tight">
              7. Penghentian Akun
            </h2>
            <div className="space-y-4 text-sm leading-relaxed text-foreground/80">
              <div>
                <h3 className="mb-2 font-semibold text-foreground">7.1 Penghentian oleh Pengguna</h3>
                <p>
                  Anda dapat menghapus akun Anda kapan saja melalui pengaturan aplikasi.
                  Setelah penghapusan, data Anda akan dihapus permanen dalam 30 hari.
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-semibold text-foreground">7.2 Penghentian oleh Kami</h3>
                <p>
                  Kami berhak menangguhkan atau menghapus akun Anda tanpa pemberitahuan jika:
                </p>
                <ul className="ml-4 mt-2 space-y-1.5 list-disc marker:text-primary">
                  <li>Anda melanggar Syarat ini.</li>
                  <li>Kami menduga adanya aktivitas penipuan atau ilegal.</li>
                  <li>Diperlukan untuk melindungi keamanan pengguna lain atau integritas sistem.</li>
                </ul>
              </div>
            </div>
          </section>

          <hr className="border-border" />

          {/* Section 8 */}
          <section>
            <h2 className="mb-4 text-xl font-semibold tracking-tight">
              8. Hukum yang Berlaku dan Penyelesaian Sengketa
            </h2>
            <div className="space-y-4 text-sm leading-relaxed text-foreground/80">
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-2xl">⚖️</div>
                  <div>
                    <p className="font-semibold text-foreground mb-1">Yurisdiksi Hukum Indonesia</p>
                    <p className="text-xs">
                      Syarat ini diatur dan ditafsirkan berdasarkan hukum Negara Kesatuan Republik
                      Indonesia, termasuk namun tidak terbatas pada Undang-Undang Nomor 27 Tahun 2022
                      tentang Perlindungan Data Pribadi dan Undang-Undang Nomor 11 Tahun 2008 tentang
                      Informasi dan Transaksi Elektronik (UU ITE) beserta perubahannya.
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="mb-2 font-semibold text-foreground">8.1 Penyelesaian Sengketa</h3>
                <p className="mb-3">Dalam hal terjadi sengketa, para pihak sepakat untuk menyelesaikannya melalui tahapan:</p>
                <div className="space-y-2">
                  {[
                    { step: "1", label: "Mediasi Internal", desc: "Diskusi langsung melalui email dalam 14 hari kerja." },
                    { step: "2", label: "Mediasi BPSK", desc: "Badan Penyelesaian Sengketa Konsumen sesuai UU No. 8/1999." },
                    { step: "3", label: "Litigasi", desc: "Pengadilan Negeri yang berwenang di Indonesia sebagai upaya terakhir." },
                  ].map((item) => (
                    <div key={item.step} className="flex items-start gap-3 rounded-lg border border-border p-3">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {item.step}
                      </div>
                      <div>
                        <div className="font-medium text-foreground text-xs">{item.label}</div>
                        <div className="text-xs text-muted-foreground">{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <hr className="border-border" />

          {/* Section 9 */}
          <section>
            <h2 className="mb-4 text-xl font-semibold tracking-tight">
              9. Tautan ke Layanan Pihak Ketiga
            </h2>
            <div className="text-sm leading-relaxed text-foreground/80">
              <p>
                Layanan kami mengintegrasikan teknologi pihak ketiga termasuk Anthropic Claude (AI),
                NextAuth.js (autentikasi), dan layanan infrastruktur. Kami tidak bertanggung jawab
                atas praktik privasi atau ketentuan layanan pihak ketiga tersebut. Penggunaan Anda
                atas layanan pihak ketiga tunduk pada syarat dan kebijakan masing-masing.
              </p>
            </div>
          </section>

          <hr className="border-border" />

          {/* Section 10 */}
          <section>
            <h2 className="mb-4 text-xl font-semibold tracking-tight">
              10. Ketentuan Umum
            </h2>
            <div className="space-y-3 text-sm leading-relaxed text-foreground/80">
              <ul className="ml-4 space-y-2 list-disc marker:text-primary">
                <li><span className="font-medium text-foreground">Keterpisahan:</span> Jika satu klausul dinyatakan tidak sah, klausul lainnya tetap berlaku penuh.</li>
                <li><span className="font-medium text-foreground">Tidak Ada Pengabaian:</span> Kegagalan kami untuk menegakkan satu hak tidak berarti pengabaian hak tersebut di masa mendatang.</li>
                <li><span className="font-medium text-foreground">Keseluruhan Perjanjian:</span> Syarat ini, bersama Kebijakan Privasi, merupakan keseluruhan perjanjian antara Anda dan kami.</li>
                <li><span className="font-medium text-foreground">Perubahan Syarat:</span> Kami berhak mengubah Syarat ini dengan pemberitahuan 7 hari sebelumnya melalui aplikasi atau email.</li>
                <li><span className="font-medium text-foreground">Bahasa:</span> Syarat ini dibuat dalam Bahasa Indonesia. Jika ada terjemahan, versi Bahasa Indonesia yang mengikat secara hukum.</li>
              </ul>
            </div>
          </section>

          <hr className="border-border" />

          {/* Contact */}
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-3 text-xl font-semibold tracking-tight">
              Pertanyaan dan Kontak
            </h2>
            <p className="mb-4 text-sm leading-relaxed text-foreground/80">
              Untuk pertanyaan tentang Syarat &amp; Ketentuan ini atau layanan kami secara umum,
              silakan hubungi:
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
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 16v-4M12 8h.01"/>
                </svg>
                <span>Respons dalam 14 hari kerja.</span>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="mt-12 flex flex-col items-center gap-3 border-t border-border pt-8 text-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} {APP_NAME}. Seluruh hak dilindungi.</p>
          <div className="flex gap-4">
            <Link href="/kebijakan-privasi" className="hover:text-foreground transition-colors">Kebijakan Privasi</Link>
            <span>·</span>
            <Link href="/syarat-ketentuan" className="text-primary font-medium">Syarat &amp; Ketentuan</Link>
            <span>·</span>
            <Link href="/dashboard" className="hover:text-foreground transition-colors">Kembali ke App</Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
