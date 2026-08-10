dihalaman form register public juga error (difile FormRegistration.js) yang kemungkinan masalahnya sama seperti task55_revisi2.md yang tadi, dan log errornya gini ;
```log
 GET /pose/register/RftxO2P9Gn3vWfQoN8z7kF7C0-ug5yjttFkCt490m3vtt02z4RYSmUxLlNWFmbLu 200 in 3.1s (next.js: 2.7s, application-code: 454ms)
 POST /pose/register/RftxO2P9Gn3vWfQoN8z7kF7C0-ug5yjttFkCt490m3vtt02z4RYSmUxLlNWFmbLu 200 in 781ms (next.js: 43ms, application-code: 738ms)
  └─ ƒ recordTrafik("pose") in 657ms src/api/supabase/public/admin.js
 POST /pose/register/RftxO2P9Gn3vWfQoN8z7kF7C0-ug5yjttFkCt490m3vtt02z4RYSmUxLlNWFmbLu 200 in 142ms (next.js: 32ms, application-code: 110ms)
  └─ ƒ getFormRegisterByLinkId("RftxO2P9Gn3vWfQoN8z7kF7C0-ug5yjttFkCt490m3vtt02z4RYSmUxLlNWFmbLu") in 72ms src/api/supabase/public/peserta.js
 POST /pose/register/RftxO2P9Gn3vWfQoN8z7kF7C0-ug5yjttFkCt490m3vtt02z4RYSmUxLlNWFmbLu 200 in 139ms (next.js: 16ms, application-code: 123ms)
  └─ ƒ getJadwalAcara("pose") in 92ms src/api/supabase/public/jadwal.js
[browser] Uncaught ReferenceError: Cannot access 'pricingMap' before initialization
    at FormRegistration (file://C:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/.next/dev/static/chunks/src_1xe46em._.js:567:47)
    at DynamicFormRegisterPage (file://C:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/.next/dev/static/chunks/src_1xe46em._.js:3705:227)
```