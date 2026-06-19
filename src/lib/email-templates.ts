const fmt = (n: number) => `Rp ${n.toLocaleString("id-ID")}`

export function weeklyReportTemplate(data: {
  name: string
  totalIncome: number
  totalExpense: number
  netCashflow: number
  topCategory: string
}) {
  const netColor = data.netCashflow >= 0 ? "#16a34a" : "#dc2626"
  const netSign = data.netCashflow >= 0 ? "+" : ""

  return `
<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="background:#0f172a;padding:28px 32px;">
          <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;">Vest AI</p>
          <p style="margin:4px 0 0;font-size:13px;color:#94a3b8;">Laporan Mingguan</p>
        </td></tr>

        <!-- Greeting -->
        <tr><td style="padding:28px 32px 0;">
          <p style="margin:0;font-size:15px;color:#0f172a;">Halo, <strong>${data.name}</strong> 👋</p>
          <p style="margin:8px 0 0;font-size:13px;color:#64748b;">Berikut ringkasan keuangan kamu minggu ini.</p>
        </td></tr>

        <!-- Stats -->
        <tr><td style="padding:20px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="48%" style="background:#f0fdf4;border-radius:8px;padding:16px;vertical-align:top;">
                <p style="margin:0;font-size:11px;color:#16a34a;text-transform:uppercase;letter-spacing:.05em;font-weight:600;">Pemasukan</p>
                <p style="margin:6px 0 0;font-size:20px;font-weight:700;color:#0f172a;">${fmt(data.totalIncome)}</p>
              </td>
              <td width="4%"></td>
              <td width="48%" style="background:#fef2f2;border-radius:8px;padding:16px;vertical-align:top;">
                <p style="margin:0;font-size:11px;color:#dc2626;text-transform:uppercase;letter-spacing:.05em;font-weight:600;">Pengeluaran</p>
                <p style="margin:6px 0 0;font-size:20px;font-weight:700;color:#0f172a;">${fmt(data.totalExpense)}</p>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Net cashflow -->
        <tr><td style="padding:0 32px 20px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:8px;padding:16px;">
            <tr>
              <td><p style="margin:0;font-size:13px;color:#64748b;">Net Cashflow</p></td>
              <td align="right"><p style="margin:0;font-size:16px;font-weight:700;color:${netColor};">${netSign}${fmt(data.netCashflow)}</p></td>
            </tr>
            <tr>
              <td><p style="margin:8px 0 0;font-size:13px;color:#64748b;">Kategori Terbesar</p></td>
              <td align="right"><p style="margin:8px 0 0;font-size:13px;font-weight:600;color:#0f172a;">${data.topCategory}</p></td>
            </tr>
          </table>
        </td></tr>

        <!-- CTA -->
        <tr><td style="padding:0 32px 32px;">
          <a href="${process.env.NEXTAUTH_URL ?? "https://vest-ai.vercel.app"}/financial-overview"
             style="display:inline-block;padding:12px 24px;background:#6366f1;color:#ffffff;font-size:13px;font-weight:600;border-radius:8px;text-decoration:none;">
            Lihat Detail →
          </a>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;">
          <p style="margin:0;font-size:11px;color:#94a3b8;">Email ini dikirim otomatis setiap Senin. Kelola preferensi di Settings.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}
