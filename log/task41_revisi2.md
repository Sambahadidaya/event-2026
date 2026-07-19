masih ada error ini ;
```log
⨯ unhandledRejection:  TypeError: cookieStore.get is not a function
    at Object.get (src\api\supabase\admin\audit.js:20:44)
  18 |                 cookies: {
  19 |                     get(name) {
> 20 |                         return cookieStore.get(name)?.value;
     |                                            ^
  21 |                     },
  22 |                 },
  23 |             }
 POST /panitia/dashboard/trafik 200 in 2.3s (next.js: 82ms, proxy.ts: 71ms, application-code: 2.1s)
  └─ ƒ getTrafik("2026-06-18T13:57:59.472Z") in 1747ms src/api/supabase/admin/admin.js
```