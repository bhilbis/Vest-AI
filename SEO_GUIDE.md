# 🚀 Panduan SEO & Registrasi Search Engine - Vest AI

Panduan lengkap untuk mendaftarkan website Vest AI (https://go-aoixsy.my.id) ke berbagai search engines dan mengoptimalkan SEO.

---

## 📋 Daftar Isi

1. [Google Search Console](#1-google-search-console)
2. [Bing Webmaster Tools](#2-bing-webmaster-tools)
3. [Yandex Webmaster](#3-yandex-webmaster-opsional)
4. [Submit Sitemap](#4-submit-sitemap)
5. [Monitoring & Analytics](#5-monitoring--analytics)
6. [Tips Optimisasi Tambahan](#6-tips-optimisasi-tambahan)

---

## 1. Google Search Console

### Langkah Pendaftaran:

#### Step 1: Akses Google Search Console

1. Buka [Google Search Console](https://search.google.com/search-console/)
2. Login dengan akun Google Anda
3. Klik **"Add Property"** atau **"Tambahkan Properti"**

#### Step 2: Pilih Tipe Properti

Pilih salah satu metode:

- **Domain** (Recommended): `go-aoixsy.my.id` - Mencakup semua subdomain
- **URL Prefix**: `https://go-aoixsy.my.id` - Hanya untuk URL spesifik

#### Step 3: Verifikasi Kepemilikan Domain

**Metode A: HTML Tag (Paling Mudah)**

1. Google akan memberikan meta tag seperti:
   ```html
   <meta name="google-site-verification" content="YOUR_VERIFICATION_CODE" />
   ```
2. Update file `src/app/layout.tsx`:
   ```tsx
   verification: {
     google: "YOUR_VERIFICATION_CODE", // Ganti dengan kode dari Google
   }
   ```
3. Deploy perubahan ke production
4. Klik **"Verify"** di Google Search Console

**Metode B: HTML File**

1. Download file HTML verification dari Google
2. Upload file ke folder `/public` di project Anda
3. Deploy ke production
4. Klik **"Verify"**

**Metode C: DNS Record (Untuk Domain Verification)**

1. Google akan memberikan TXT record
2. Login ke dashboard domain Anda (Cloudflare, GoDaddy, dll)
3. Tambahkan TXT record ke DNS settings
4. Tunggu propagasi (bisa sampai 24 jam)
5. Klik **"Verify"**

#### Step 4: Submit Sitemap

1. Setelah terverifikasi, buka **Sitemaps** di menu kiri
2. Masukkan URL sitemap: `https://go-aoixsy.my.id/sitemap.xml`
3. Klik **"Submit"**

#### Step 5: Request Indexing

1. Buka **URL Inspection** di menu kiri
2. Masukkan URL homepage: `https://go-aoixsy.my.id`
3. Klik **"Request Indexing"**
4. Ulangi untuk halaman penting lainnya

---

## 2. Bing Webmaster Tools

### Langkah Pendaftaran:

#### Step 1: Akses Bing Webmaster

1. Buka [Bing Webmaster Tools](https://www.bing.com/webmasters/)
2. Login dengan akun Microsoft

#### Step 2: Import dari Google (Tercepat)

1. Klik **"Import from Google Search Console"**
2. Authorize akses
3. Pilih property `go-aoixsy.my.id`
4. Sitemap akan otomatis ter-import!

**ATAU** Manual:

#### Step 3: Manual Add Site

1. Klik **"Add a Site"**
2. Masukkan URL: `https://go-aoixsy.my.id`

#### Step 4: Verifikasi

Pilih salah satu metode:

**Metode A: XML File**

1. Download file XML dari Bing
2. Upload ke `/public` folder
3. Klik **"Verify"**

**Metode B: Meta Tag**

1. Copy meta tag yang diberikan Bing
2. Update `layout.tsx`:
   ```tsx
   verification: {
     google: "...",
     bing: "YOUR_BING_CODE", // Tambahkan ini
   }
   ```
3. Deploy dan verify

#### Step 5: Submit Sitemap

1. Buka **Sitemaps** menu
2. Submit: `https://go-aoixsy.my.id/sitemap.xml`

---

## 3. Yandex Webmaster (Opsional)

Untuk traffic dari Rusia dan negara CIS:

1. Buka [Yandex Webmaster](https://webmaster.yandex.com/)
2. Login atau register
3. Klik **"Add Site"**
4. Masukkan: `https://go-aoixsy.my.id`
5. Verifikasi dengan meta tag atau HTML file
6. Submit sitemap

---

## 4. Submit Sitemap

### Cara Manual Submit ke Search Engines:

#### Google

```
GET https://www.google.com/ping?sitemap=https://go-aoixsy.my.id/sitemap.xml
```

Buka URL di browser atau gunakan curl:

```bash
curl "https://www.google.com/ping?sitemap=https://go-aoixsy.my.id/sitemap.xml"
```

#### Bing

```
GET https://www.bing.com/ping?sitemap=https://go-aoixsy.my.id/sitemap.xml
```

### Verifikasi Sitemap

1. Akses langsung: https://go-aoixsy.my.id/sitemap.xml
2. Pastikan XML ter-render dengan benar
3. Check semua URL listed dengan benar

---

## 5. Monitoring & Analytics

### Google Search Console - Monitor SEO Performance

Dashboard utama menampilkan:

- **Performance**: Clicks, impressions, CTR, position
- **Coverage**: Indexed pages, errors, warnings
- **Enhancements**: Mobile usability, Core Web Vitals
- **Links**: Internal & external links

### Key Metrics to Monitor:

1. **Index Coverage**

   - Total indexed pages
   - Errors/warnings

2. **Performance**

   - Average position di search results
   - Click-through rate (CTR)
   - Top queries yang membawa traffic

3. **Core Web Vitals**
   - Largest Contentful Paint (LCP)
   - First Input Delay (FID)
   - Cumulative Layout Shift (CLS)

### Setup Google Analytics (Recommended)

1. Buat property di [Google Analytics](https://analytics.google.com/)
2. Install tracking code di Next.js:

```bash
npm install @next/third-parties
```

Update `layout.tsx`:

```tsx
import { GoogleAnalytics } from "@next/third-parties/google";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <GoogleAnalytics gaId="G-YOUR-GA-ID" />
      </body>
    </html>
  );
}
```

---

## 6. Tips Optimisasi Tambahan

### A. Content Optimization

- ✅ Tulis content berkualitas (min 300 kata per page)
- ✅ Gunakan heading hierarchy (H1, H2, H3)
- ✅ Include keywords naturally
- ✅ Update content secara regular

### B. Technical SEO

- ✅ Ensure HTTPS aktif (Sudah ✓)
- ✅ Mobile-responsive design
- ✅ Fast loading time (<3 detik)
- ✅ Valid HTML/CSS
- ✅ Fix broken links

### C. Build Backlinks

- Share di social media
- Submit ke directory websites
- Write guest posts
- Collaborate dengan website lain

### D. Local SEO (Jika Relevan)

- Create Google Business Profile
- Add alamat di website
- Consistent NAP (Name, Address, Phone)

### E. Social Signals

- Active di social media
- Encourage social sharing
- Add social share buttons

---

## 🎯 Quick Action Checklist

Setelah deploy, lakukan segera:

- [ ] Verify domain di Google Search Console
- [ ] Submit sitemap ke Google
- [ ] Request indexing untuk homepage
- [ ] Verify domain di Bing Webmaster
- [ ] Submit sitemap ke Bing
- [ ] Test Open Graph di https://www.opengraph.xyz/
- [ ] Test mobile-friendly di Google Mobile-Friendly Test
- [ ] Run PageSpeed Insights test
- [ ] Setup Google Analytics
- [ ] Share website di social media

---

## 📊 Expected Timeline

- **Day 1-3**: Verification & sitemap submission
- **Week 1-2**: Google mulai crawl & index
- **Week 2-4**: Muncul di search results
- **Month 2-3**: Ranking mulai stabil
- **Month 3+**: Optimisasi berkelanjutan

---

## 🆘 Troubleshooting

### Website Belum Muncul di Google?

1. Check Google Search Console > Coverage
2. Ensure no `noindex` tags
3. Verify robots.txt tidak block Googlebot
4. Request indexing manual

### Sitemap Error?

1. Validate XML syntax
2. Check semua URLs accessible
3. Ensure HTTPS valid
4. Re-submit sitemap

### Low Ranking?

1. Analyze competitors
2. Improve content quality
3. Build more backlinks
4. Optimize page speed
5. Improve user experience

---

## 📚 Resources

- [Google SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [Bing Webmaster Guidelines](https://www.bing.com/webmasters/help/webmaster-guidelines-30fba23a)
- [Next.js SEO Documentation](https://nextjs.org/learn/seo/introduction-to-seo)
- [Schema.org Documentation](https://schema.org/)

---

**Good luck with your SEO journey! 🚀**

Jika ada pertanyaan, konsultasi dengan SEO expert atau ikuti tutorial di atas step-by-step.
