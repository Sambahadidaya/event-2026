dihalaman verifikasi itu tepatnya disite pkkmb dan ketika aku cetak pdf itu malah ada error ini ;
```log
Error generating verifikasi PDF with Puppeteer: TypeError: Cannot read properties of undefined (reading 'map')
    at generateVerifikasiPDF (src\lib\pdf\report.js:815:43)
    at async generatePdfAction (src\api\pdf\route.js:129:25)
  813 |         for (const dataSet of dataSets) {
  814 |             let dataRowCounter = 0;
> 815 |             const rowsHtml = dataSet.data.map((item) => {
      |                                           ^
  816 |                 dataRowCounter++;
  817 |                 totalRecords++;
  818 |                 const cellsHtml = columns.map(col => {
Error in generatePdfAction server action: TypeError: Cannot read properties of undefined (reading 'map')
    at generateVerifikasiPDF (src\lib\pdf\report.js:815:43)
    at async generatePdfAction (src\api\pdf\route.js:129:25)
  813 |         for (const dataSet of dataSets) {
  814 |             let dataRowCounter = 0;
> 815 |             const rowsHtml = dataSet.data.map((item) => {
      |                                           ^
  816 |                 dataRowCounter++;
  817 |                 totalRecords++;
  818 |                 const cellsHtml = columns.map(col => {
 POST /panitia/keuangan/verifikasi 200 in 2.3s (next.js: 10ms, proxy.ts: 12ms, application-code: 2.3s)
  └─ ƒ generatePdfAction({"columns":["[Object]","[Object]","[Object]","... 4 items not stringified"],"data":["[Object]","[Object]","[Object]","... 7 items not stringified"],"metrics":{},"...":"4 items not stringified"}) in 2308ms src/api/pdf/route.js
[browser] Print PDF Error: Error: Cannot read properties of undefined (reading 'map')
    at handleCetakPDF (file://C:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/.next/dev/static/chunks/src_13vpn_3._.js:1289:23) (file://C:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/.next/dev/static/chunks/src_13vpn_3._.js:1314:21)
```
dan sekalian halaman keuangan lain tombol cetaknya ganti jadi pakai components yang sudah dibuat tadi yaitu TombolCetak.js