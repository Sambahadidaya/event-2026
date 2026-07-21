fokus ke halaman login, ada bug ini ;
```log
 useSearchParams() should be wrapped in a suspense boundary at page "/panitia/login". Read more: https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout
    at S (C:\Users\samba\OneDrive\Documents\PKKMB-POSE\portal-kampus-2026\.next\server\chunks\ssr\node_modules_next_1iemwhs._.js:2:2692)
    at r (C:\Users\samba\OneDrive\Documents\PKKMB-POSE\portal-kampus-2026\.next\server\chunks\ssr\node_modules_next_1iemwhs._.js:4:6760)
    at C:\Users\samba\OneDrive\Documents\PKKMB-POSE\portal-kampus-2026\.next\server\chunks\ssr\_1e1t7-t._.js:1:385166
    at an (C:\Users\samba\OneDrive\Documents\PKKMB-POSE\portal-kampus-2026\node_modules\next\dist\compiled\next-server\app-page-turbo.runtime.prod.js:2:84267)
    at ai (C:\Users\samba\OneDrive\Documents\PKKMB-POSE\portal-kampus-2026\node_modules\next\dist\compiled\next-server\app-page-turbo.runtime.prod.js:2:86086)
    at al (C:\Users\samba\OneDrive\Documents\PKKMB-POSE\portal-kampus-2026\node_modules\next\dist\compiled\next-server\app-page-turbo.runtime.prod.js:2:107860)
    at as (C:\Users\samba\OneDrive\Documents\PKKMB-POSE\portal-kampus-2026\node_modules\next\dist\compiled\next-server\app-page-turbo.runtime.prod.js:2:105275)
    at aa (C:\Users\samba\OneDrive\Documents\PKKMB-POSE\portal-kampus-2026\node_modules\next\dist\compiled\next-server\app-page-turbo.runtime.prod.js:2:84619)
    at ai (C:\Users\samba\OneDrive\Documents\PKKMB-POSE\portal-kampus-2026\node_modules\next\dist\compiled\next-server\app-page-turbo.runtime.prod.js:2:86135)
    at ai (C:\Users\samba\OneDrive\Documents\PKKMB-POSE\portal-kampus-2026\node_modules\next\dist\compiled\next-server\app-page-turbo.runtime.prod.js:2:104615)
Error occurred prerendering page "/panitia/login". Read more: https://nextjs.org/docs/messages/prerender-error
Export encountered an error on /panitia/login/page: /panitia/log
```
jadi saya ingin memindahkan logika login ini ke componen baru yang sudah aku persiapkan di components/panitia/LoginContent.js