waktu aku mau mencetak pdf kenapa ada error ini mulu ;
```log
[browser] Print PDF Error: Error: spawn UNKNOWN
    at handlePrintPDF (file://C:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/.next/dev/static/chunks/src_19qr9rr._.js:3453:23) (file://C:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/.next/dev/static/chunks/src_19qr9rr._.js:3476:21)
Error generating team report PDF with Puppeteer: Error: spawn UNKNOWN
    at async generateTeamReportPDF (src\lib\pdf\teamReport.js:298:19)
    at async generatePdfAction (src\api\pdf\route.js:136:25)
  296 |         `;
  297 |
> 298 |         browser = await getBrowser();
      |                   ^
  299 |
  300 |         const page = await browser.newPage();
  301 |         await page.setContent(html, { waitUntil: 'networkidle0' }); {
  errno: -4094,
  code: 'UNKNOWN',
  syscall: 'spawn'
}
Error in generatePdfAction server action: Error: spawn UNKNOWN
    at async generateTeamReportPDF (src\lib\pdf\teamReport.js:298:19)
    at async generatePdfAction (src\api\pdf\route.js:136:25)
  296 |         `;
  297 |
> 298 |         browser = await getBrowser();
      |                   ^
  299 |
  300 |         const page = await browser.newPage();
  301 |         await page.setContent(html, { waitUntil: 'networkidle0' }); {
  errno: -4094,
  code: 'UNKNOWN',
  syscall: 'spawn'
}
 POST /panitia/pj_lomba/form_register 200 in 3.0s (next.js: 8ms, proxy.ts: 10ms, application-code: 2.9s)
  └─ ƒ generatePdfAction({"activeTab":"pendaftar","data":["[Object]"],"lombaName":"Desain Poster","...":"3 items not stringified"}) in 2917ms src/api/pdf/route.js
[browser] Print PDF Error: Error: spawn UNKNOWN
    at handlePrintPDF (file://C:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/.next/dev/static/chunks/src_19qr9rr._.js:3453:23) (file://C:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/.next/dev/static/chunks/src_19qr9rr._.js:3476:21)
 POST /panitia/pj_lomba/form_register 200 in 401ms (next.js: 10ms, proxy.ts: 16ms, application-code: 375ms)
  └─ ƒ getPengumpulanLomba() in 352ms src/api/supabase/admin/submission.js
 POST /panitia/pj_lomba/form_register 200 in 252ms (next.js: 12ms, proxy.ts: 9ms, application-code: 231ms)
  └─ ƒ getPengumpulanLomba() in 209ms src/api/supabase/admin/submission.js
  ```