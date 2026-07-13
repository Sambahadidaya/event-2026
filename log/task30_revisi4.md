ada sedikit bug, berikut log bugnya ;
```log
Console Error

In HTML, <td> cannot be a child of <tbody>.
This will cause a hydration error.
See more info here: https://nextjs.org/docs/messages/react-hydration-error

+
Client
-
Server
...
    <InnerScrollAndFocusHandlerOld focusAndScrollRef={{...}} cacheNode={{rsc:<Fragment>, ...}}>
      <ErrorBoundary errorComponent={undefined} errorStyles={undefined} errorScripts={undefined}>
        <LoadingBoundary name="peserta_wa..." loading={null}>
          <HTTPAccessFallbackBoundary notFound={undefined} forbidden={undefined} unauthorized={undefined}>
            <RedirectBoundary>
              <RedirectErrorBoundary router={{...}}>
                <InnerLayoutRouter url="/panitia/p..." tree={[...]} params={{}} cacheNode={{rsc:<Fragment>, ...}} ...>
                  <SegmentViewNode type="page" pagePath="panitia/pk...">
                    <SegmentTrieNode>
                    <PkkmbPesertaWajibPage>
                      <AdminPesertaWajib siteType="pkkmb">
                        <div className="space-y-4 ...">
                          <DashboardHeaderFilters>
                          <div className="bg-white d...">
                            <div>
                            <div className="overflow-x...">
                              <table className="w-full tex...">
                                <thead>
>                               <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
>                                 <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                ...
                          ...
                  ...
                ...
      ...
src\app\panitia\pkkmb\peserta_wajib\page.js (8:12) @ PkkmbPesertaWajibPage


   6 |
   7 | export default function PkkmbPesertaWajibPage() {
>  8 |     return <AdminPesertaWajib siteType="pkkmb" />;
     |            ^
   9 | }
  10 |
Call Stack
16

Show 13 ignore-listed frame(s)
td
<anonymous>
AdminPesertaWajib
file:///C:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/.next/dev/static/chunks/_045yjxl._.js (1684:250)
PkkmbPesertaWajibPage
src\app\panitia\pkkmb\peserta_wajib\page.js (8:12)
```