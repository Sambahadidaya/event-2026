ada bug saat mendaftar diform_register pose tepatnya pada file /components/public/FormRegistration
berikut errornya ;

```log
Console Error



Submission error: {}
Call Stack
4

Hide 3 ignore-listed frame(s)
createConsoleError
node_modules/next/src/next-devtools/shared/console-error.ts (16:35)
handleConsoleError
node_modules/next/src/next-devtools/userspace/app/errors/use-error-handler.ts (31:31)
console.error
node_modules/next/src/next-devtools/userspace/app/errors/intercept-console-error.ts (36:27)
handleSubmit
file:///C:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/.next/dev/static/chunks/_0mmd75s._.js (329:21)
```
dan diterminal ada ini ;
```log
 GET /pose/register/0fUgM3_13vAkEzHHiz0PEpSlNrexUPw18FuF4oRtzGgXaRsoIOy_lQo3gS_HanEp 200 in 177ms (next.js: 56ms, application-code: 121ms)
[browser] Submission error: {
  code: '22P02',
  details: null,
  hint: null,
  message: 'invalid input syntax for type uuid: "aVvJtxCu64EnvtRI1kcZ3qUGEFQARZQo"'
}
    at handleSubmit (file://C:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/.next/dev/static/chunks/_0mmd75s._.js:329:21) (file://C:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/.next/dev/static/chunks/_0mmd75s._.js:329:21)
```