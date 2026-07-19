masih ada error ini ;
```log
POST /panitia/dashboard/trafik 200 in 236ms (next.js: 10ms, proxy.ts: 30ms, application-code: 196ms)
  └─ ƒ getCurrentAdmin() in 181ms src/api/supabase/admin/auth.js
Internal Log - Error fetching trafik: Error: Unauthorized access
    at getTrafik (src\api\supabase\admin\admin.js:184:30)
  182 |     try {
  183 |         const { user, error: authError } = await checkAdminAuth();
> 184 |         if (authError) throw new Error(authError);
      |                              ^
  185 |
  186 |         let query = supabaseAdmin.from('trafik_kunjungan').select('*');
  187 |         if (isoDateStart) {
 POST /panitia/dashboard/trafik 200 in 670ms (next.js: 35ms, proxy.ts: 34ms, application-code: 600ms)
  └─ ƒ getTrafik("2026-06-18T14:12:35.033Z") in 573ms src/api/supabase/admin/admin.js
```