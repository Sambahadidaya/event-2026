pada halaman login ada 2 bug yaitu 
1. tidak bisa login (ketika menekan tombol masuk malah terus loading,padahal sudah benar 200)
2. tidak bisa pakai scan qr
dan berikut lognya
```log
[browser] Scan crop failed: imageFile argument is mandatory and should be instance of File. Use 'event.target.files[0]'.
    at eval (file://C:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/.next/dev/static/chunks/src_0ypmn8w._.js?id=%255Bproject%255D%252Fsrc%252Fapp%252Fpanitia%252Flogin%252Fpage.js+%255Bapp-client%255D+%2528ecmascript%2529:188:25) (file://C:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/.next/dev/static/chunks/src_0ypmn8w._.js?id=%255Bproject%255D%252Fsrc%252Fapp%252Fpanitia%252Flogin%252Fpage.js+%255Bapp-client%255D+%2528ecmascript%2529:188:25)
 POST /panitia/login 200 in 1543ms (next.js: 13ms, proxy.ts: 27ms, application-code: 1503ms)
  └─ ƒ loginAdmin("Sambaa", "1", "nama") in 1409ms src/api/supabase/admin/auth.js
```
jadi bacalah 4 file ini yaitu file proxy.js,admin/auth.js,admin/admin.js dan login/page.js
tapi saya ingin tetap menggunakan routerpush bukan statis pindah,jadi untuk itu jangan diubah