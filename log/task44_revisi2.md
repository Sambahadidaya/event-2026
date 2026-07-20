masih errorloh,kan awalnya errornya ini ;
```log
[browser] Scan crop failed: [object Event] 
    at eval (file://C:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/.next/dev/static/chunks/src_0ypmn8w._.js?id=%255Bproject%255D%252Fsrc%252Fapp%252Fpanitia%252Flogin%252Fpage.js+%255Bapp-client%255D+%2528ecmascript%2529:192:25) (file://C:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/.next/dev/static/chunks/src_0ypmn8w._.js?id=%255Bproject%255D%252Fsrc%252Fapp%252Fpanitia%252Flogin%252Fpage.js+%255Bapp-client%255D+%2528ecmascript%2529:192:25)
```
menjadi ini
```log
[browser] Scan crop failed: [object Event] 
    at handleScanCrop (file://C:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/.next/dev/static/chunks/src_19ebdym._.js:255:21) (file://C:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/.next/dev/static/chunks/src_19ebdym._.js:255:21)
```
apakah perlu menginstall ulang? coba lihat file package.json