ada beberapa bug yang terjadi.
1. dihalaman form tepatnya pada pembuatan form difile src/app/panitia/form/form pada saat membuat form wajib saya ingin link_id aksesnya bukan all/form/7D3fH_Mce7wREyDnY6T4_PeWzNrN1Qdw tapi tergantung sitenya jika pada pembuatan form pilih site pkkmb maka link_id nya pkkmb/form/7D3fH_Mce7wREyDnY6T4_PeWzNrN1Qdw dan begitu sebaliknya. jadi bukan all. terus dihalaman form pengumpulan malah ada log error ini ;
```log
[browser] Received NaN for the `children` attribute. If this is expected, cast the value to a string.
[browser] In HTML, <tfoot> cannot be a child of <div>.
This will cause a hydration error.

  ...
    <InnerScrollAndFocusHandlerOld focusAndScrollRef={{scrollRef:null, ...}} cacheNode={{rsc:{...}, ...}}>
      <ErrorBoundary errorComponent={undefined} errorStyles={undefined} errorScripts={undefined}>
        <LoadingBoundary name="form/" loading={null}>
          <HTTPAccessFallbackBoundary notFound={undefined} forbidden={undefined} unauthorized={undefined}>
            <RedirectBoundary>
              <RedirectErrorBoundary router={{...}}>
                <InnerLayoutRouter url="/panitia/f..." tree={[...]} params={{}} cacheNode={{rsc:{...}, ...}} ...>
                  <SegmentViewNode type="page" pagePath="panitia/fo...">       
                    <SegmentTrieNode>
                    <ClientPageRoot Component={function UnifiedFormDashboard} serverProvidedParams={{...}}>
                      <UnifiedFormDashboard params={Promise} searchParams={Promise}>
                        <div className="space-y-4 ...">
                          <DashboardHeaderFilters>
                          <div>
                          <AdminFormPengumpulan siteType="all" hideCreateButton={true} refreshTrigger={0}>
                            <div className="space-y-4 ...">
>                             <div
>                               className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-2xl shadow-sm border border-gr..."
>                             >
                                <div>
                                <div>
                                <TablePagination currentPage={1} totalPages={1} ...>
>                                 <tfoot>
                  ...
                ...
      ...

[browser] <div> cannot contain a nested <tfoot>.
See this log for the ancestor stack trace.
```
dan ada error ini juga 
```log
Received NaN for the `children` attribute. If this is expected, cast the value to a string.
Call Stack
21

Show 17 ignore-listed frame(s)
span
<anonymous>
TablePagination
file:///C:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/.next/dev/static/chunks/src_13n7sbe._.js (787:216)
AdminFormPengumpulan
file:///C:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/.next/dev/static/chunks/src_13n7sbe._.js (4160:256)
UnifiedFormDashboard
file:///C:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/.next/dev/static/chunks/src_13n7sbe._.js (4967:248)

Console Error



In HTML, <tfoot> cannot be a child of <div>.
This will cause a hydration error.
See more info here: https://nextjs.org/docs/messages/react-hydration-error


+
Client
-
Server
...
    <InnerScrollAndFocusHandlerOld focusAndScrollRef={{scrollRef:null, ...}} cacheNode={{rsc:{...}, ...}}>
      <ErrorBoundary errorComponent={undefined} errorStyles={undefined} errorScripts={undefined}>
        <LoadingBoundary name="form/" loading={null}>
          <HTTPAccessFallbackBoundary notFound={undefined} forbidden={undefined} unauthorized={undefined}>
            <RedirectBoundary>
              <RedirectErrorBoundary router={{...}}>
                <InnerLayoutRouter url="/panitia/f..." tree={[...]} params={{}} cacheNode={{rsc:{...}, ...}} ...>
                  <SegmentViewNode type="page" pagePath="panitia/fo...">
                    <SegmentTrieNode>
                    <ClientPageRoot Component={function UnifiedFormDashboard} serverProvidedParams={{...}}>
                      <UnifiedFormDashboard params={Promise} searchParams={Promise}>
                        <div className="space-y-4 ...">
                          <DashboardHeaderFilters>
                          <div>
                          <AdminFormPengumpulan siteType="all" hideCreateButton={true} refreshTrigger={0}>
                            <div className="space-y-4 ...">
>                             <div
>                               className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-2xl shadow-sm border border-gr..."
>                             >
                                <div>
                                <div>
                                <TablePagination currentPage={1} totalPages={1} ...>
>                                 <tfoot>
                  ...
                ...
      ...
Call Stack
18

Show 14 ignore-listed frame(s)
tfoot
<anonymous>
TablePagination
file:///C:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/.next/dev/static/chunks/src_13n7sbe._.js (1011:217)
AdminFormPengumpulan
file:///C:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/.next/dev/static/chunks/src_13n7sbe._.js (4160:256)
UnifiedFormDashboard
file:///C:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/.next/dev/static/chunks/src_13n7sbe._.js (4967:248)
Console Error



<div> cannot contain a nested <tfoot>.
See this log for the ancestor stack trace.
Call Stack
19

Show 16 ignore-listed frame(s)
div
<anonymous>
AdminFormPengumpulan
file:///C:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/.next/dev/static/chunks/src_13n7sbe._.js (4179:217)
UnifiedFormDashboard
file:///C:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/.next/dev/static/chunks/src_13n7sbe._.js (4967:248)
```
2. waktu mendaftar diform register tepatnya pada kategori mahasiswa lp3i yang butuh_buktinya true itu ada error ini ;
```log
POST /pose/register/xadrKKiK9KXTz3Q4BGJd67XkhQEAf79yYBdgwsibBKZSHUKjQWvpbhjGpXRlQjqP 200 in 140ms (next.js: 18ms, application-code: 122ms)
  └─ ƒ insertTeamMembers([{"jabatan":"ketua","kode":"202502016","nama":"sam","...":"1 item not stringified"}]) in 79ms src/api/supabase/public/team.js        
Internal Log - Error inserting peserta batch: {
  code: '22P02',
  details: null,
  hint: null,
  message: 'invalid input syntax for type integer: ""'
}
 POST /pose/register/xadrKKiK9KXTz3Q4BGJd67XkhQEAf79yYBdgwsibBKZSHUKjQWvpbhjGpXRlQjqP 200 in 319ms (next.js: 27ms, application-code: 293ms)
  └─ ƒ insertPesertaBatch([{"angkatan":"2025","bukti_bayar":"https://qttrkptegnfwoseutfga.supabase.co/storage/v1/object/public/bukti-bayar/uploads/vB8RJcUSQFJT1Y7H.webp","email_wa":"081","...":"11 items not stringified"}]) in 237ms src/api/supabase/public/peserta.js
[browser] Submission error: Error: Terjadi kesalahan internal pada server saat mendaftar.
    at handleSubmit (file://C:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/.next/dev/static/chunks/src_0p627ik._.js:761:27) (file://C:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/.next/dev/static/chunks/src_0p627ik._.js:770:21)
```
padahal sudah masuk ke tabel team dan team_members, tapi ditabel peserta gak masuk.
3. terus dihalaman form register ini saya ingin ketika nama teamnya sudah dipakai maka alertnya bukan "Terjadi kesalahan internal pada server saat mendaftar." melainkan "Nama tim sudah dipakai".
4. terus dihalaman form register ini tepatnuya pada kategori umum itu input semesternya malah ada, harusnya input semester ada ketika user mengaktifkan tombol ya di switch "apakah anda mahasiswa".
5. terus dihalaman form pengumpulan ketika aku menekan tombol swich antara upload file dan input link itu ada error ini ;
```log
Console Error


A component is changing an uncontrolled input to be controlled. This is likely caused by the value changing from undefined to a defined value, which should not happen. Decide between using a controlled or uncontrolled input element for the lifetime of the component. More info: https://react.dev/link/controlled-components
dan 
Console Error


A component is changing a controlled input to be uncontrolled. This is likely caused by the value changing from a defined to undefined, which should not happen. Decide between using a controlled or uncontrolled input element for the lifetime of the component. More info: https://react.dev/link/controlled-components
Call Stack
54

Show 51 ignore-listed frame(s)
input
<anonymous>
FormPengumpulan
file:///C:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/.next/dev/static/chunks/_05r-uoy._.js (840:223)
SubmissionPage
file:///C:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/.next/dev/static/chunks/_05r-uoy._.js (1458:219)
```