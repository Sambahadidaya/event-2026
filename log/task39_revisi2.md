# ada beberapa revisi yaitu ;
1. saya ingin untuk halaman jelajahi portal atau features saya ingin divnya juga looping sama seperti yang stats dan timeline (terus bisa digeser), terus untuk angkanya itu saya ingin angka yang dirender seperti 1-3/4 karna yang terender atau munculnya itu ada 3 div dan angka ini bisa seperti ini 3-1/4 karna yang munculnya itu div 3,4,1 hasil dari looping tadi.
2. terus untuk div stats dan timeline saya ingin bisa discrol atau digeser manual tanpa harus menekan tombol atau menekan div sebelahnya (seperti di features) tapi animasinya tetap seperti saat menekan tombol (bukan seperti menggeser slide), terus ketika user berada ditampilan destop atau laptop saya ingin yang terender atau muncul atau yang besarnya itu bisa 3 div sekaligus dan tetap ada yang blur disebalh kiri dan kananya. dan angkanya juga sama seperti features (yang revisi di atas). dan untuk stats saya ingin warna teks judulnya mengikuti darkmode atau lighmode (sama seperti yang lain yaitu antara putih atau hitam) jadi jangan statis.
3. terus untuk halaman tombol lihat filosofi itu saya ingin ketika hover itu menjadi tangan seperti pada hover lain.
4. terus untuk div Arunika Harmonia atau Semangat Juara 2026 atau Rangkaian Acara itu saya ingin teks dan warna divnya mengikuti darkmode atau lighmode juga. dan saya ingin div itu melayang (naik turun) tapi tidak terlalu naik turun dan tidak terlalu berat jika dibuka dimobile.
# terus ada bug ini diconsloge ;

[browser] Unknown event handler property `onMouseLeaveCapture`. It will be ignored.
    at validateProperty (file://C:/Users/user/Documents/Project PKKMB/event-2026/.next/dev/static/chunks/node_modules_next_dist_compiled_react-dom_096_9a-._.js:2085:61)
    at warnUnknownProperties (file://C:/Users/user/Documents/Project PKKMB/event-2026/.next/dev/static/chunks/node_modules_next_dist_compiled_react-dom_096_9a-._.js:2203:26)
    at validatePropertiesInDevelopment (file://C:/Users/user/Documents/Project PKKMB/event-2026/.next/dev/static/chunks/node_modules_next_dist_compiled_react-dom_096_9a-._.js:10679:66)    at prepareToHydrateHostInstance (file://C:/Users/user/Documents/Project PKKMB/event-2026/.next/dev/static/chunks/node_modules_next_dist_compiled_react-dom_096_9a-._.js:3326:9)     
    at completeWork (file://C:/Users/user/Documents/Project PKKMB/event-2026/.next/dev/static/chunks/node_modules_next_dist_compiled_react-dom_096_9a-._.js:6922:60)
    at runWithFiberInDEV (file://C:/Users/user/Documents/Project PKKMB/event-2026/.next/dev/static/chunks/node_modules_next_dist_compiled_react-dom_096_9a-._.js:965:74)
    at completeUnitOfWork (file://C:/Users/user/Documents/Project PKKMB/event-2026/.next/dev/static/chunks/node_modules_next_dist_compiled_react-dom_096_9a-._.js:9622:23)
    at performUnitOfWork (file://C:/Users/user/Documents/Project PKKMB/event-2026/.next/dev/static/chunks/node_modules_next_dist_compiled_react-dom_096_9a-._.js:9557:28)
    at workLoopConcurrentByScheduler (file://C:/Users/user/Documents/Project PKKMB/event-2026/.next/dev/static/chunks/node_modules_next_dist_compiled_react-dom_096_9a-._.js:9551:58)   
    at renderRootConcurrent (file://C:/Users/user/Documents/Project PKKMB/event-2026/.next/dev/static/chunks/node_modules_next_dist_compiled_react-dom_096_9a-._.js:9534:71)
    at performWorkOnRoot (file://C:/Users/user/Documents/Project PKKMB/event-2026/.next/dev/static/chunks/node_modules_next_dist_compiled_react-dom_096_9a-._.js:9061:150)
    at performWorkOnRootViaSchedulerTask (file://C:/Users/user/Documents/Project PKKMB/event-2026/.next/dev/static/chunks/node_modules_next_dist_compiled_react-dom_096_9a-._.js:10255:9)
    at MessagePort.performWorkUntilDeadline (file://C:/Users/user/Documents/Project PKKMB/event-2026/.next/dev/static/chunks/node_modules_next_dist_compiled_1amofcm._.js:2647:64) (file://C:/Users/user/Documents/Project PKKMB/event-2026/.next/dev/static/chunks/node_modules_next_dist_compiled_react-dom_096_9a-._.js:2085:61)
[browser] A tree hydrated but some attributes 
of the server rendered HTML didn't match the client properties. This won't be patched up. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't match the server.
- External changing data without sending a snapshot of it along with the HTML.
- Invalid HTML tag nesting.

It can also happen if the client has a browser extension installed which messes with the HTML before React loaded.

https://react.dev/link/hydration-mismatch     

  ...
    <HTTPAccessFallbackBoundary notFound={undefined} forbidden={undefined} unauthorized={undefined}>
      <RedirectBoundary>
        <RedirectErrorBoundary router={{...}}>          <InnerLayoutRouter url="/pkkmb" tree={[...]} params={{}} cacheNode={{rsc:{...}, ...}} segmentPath={[...]} ...>
            <SegmentViewNode type="page" pagePath="pkkmb/page.js">
              <SegmentTrieNode>
              <PkkmbHome>
                <HomeLanding site="pkkmb">    
                  <div className="animate-in...">
                    <section>
                    <section>
                    <section className="relative b...">
                      <div className="w-full max...">
                        <RevealWrapper>       
                          <div ref={{current:null}} className={"transiti..."} style={{...}}>                            <div>
                            <div className="mt-8">
                              <Carousel items={[...]} animated={false} ...>
                                <div
+                                 className={"relative w-full overflow-hidden pb-16 "}      
-                                 className={"jsx-a51735e38dda3ff7 relative w-full overflow-hidden pb-16 "}
                                >
                                  <div        
                                    ref={{current:null}}
+                                   className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-4 sm:gap-..."
-                                   className="jsx-a51735e38dda3ff7 flex overflow-x-auto snap-x snap-mandatory hide-sc..."
                                    style={{scrollbarWidth:"none",msOverflowStyle:"none"}}  
                                    onScroll={function Carousel[<div>.onScroll]}
                                  >
                                    <div      
+                                     className="snap-center shrink-0 w-[85%] sm:w-[45%] md:w-[30%]"
-                                     className="jsx-a51735e38dda3ff7 snap-center shrink-0 w-[85%] sm:w-[45%] md:w-[30%]"
                                    >
                                    <div      
+                                     className="snap-center shrink-0 w-[85%] sm:w-[45%] md:w-[30%]"
-                                     className="jsx-a51735e38dda3ff7 snap-center shrink-0 w-[85%] sm:w-[45%] md:w-[30%]"
                                    >
                                    <div      
+                                     className="snap-center shrink-0 w-[85%] sm:w-[45%] md:w-[30%]"
-                                     className="jsx-a51735e38dda3ff7 snap-center shrink-0 w-[85%] sm:w-[45%] md:w-[30%]"
                                    >
                                    <div      
+                                     className="snap-center shrink-0 w-[85%] sm:w-[45%] md:w-[30%]"
-                                     className="jsx-a51735e38dda3ff7 snap-center shrink-0 w-[85%] sm:w-[45%] md:w-[30%]"
                                    >
                                  <div        
+                                   className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-..."
-                                   className="jsx-a51735e38dda3ff7 absolute bottom-2 left-1/2 -translate-x-1/2 flex i..."
                                  >
                                    <button   
                                      onClick={function Carousel[<button>.onClick]}
+                                     className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 text-gra..."
-                                     className="jsx-a51735e38dda3ff7 p-1.5 rounded-full hover:bg-gray-200 dark:hover:..."
                                      aria-label="Scroll left"
                                    >
                                    <div      
+                                     className="flex items-center gap-1.5 text-sm font-bold"
-                                     className="jsx-a51735e38dda3ff7 flex items-center gap-1.5 text-sm font-bold"
                                    >
                                      <span   
+                                       className="text-gray-900 dark:text-white min-w-[1.2rem] text-center"
-                                       className="jsx-a51735e38dda3ff7 text-gray-900 dark:text-white min-w-[1.2rem] t..."
                                      >       
+                                       1     
                                      <span   
+                                       className="text-gray-400 dark:text-gray-500"        
-                                       className="jsx-a51735e38dda3ff7 text-gray-400 dark:text-gray-500"
                                      >       
+                                       /     
                                      <span   
+                                       className="text-gray-500 dark:text-gray-400 min-w-[1.2rem] text-center"
-                                       className="jsx-a51735e38dda3ff7 text-gray-500 dark:text-gray-400 min-w-[1.2rem..."
                                      >       
+                                       4     
                                    <button   
                                      onClick={function Carousel[<button>.onClick]}
+                                     className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 text-gra..."
-                                     className="jsx-a51735e38dda3ff7 p-1.5 rounded-full hover:bg-gray-200 dark:hover:..."
                                      aria-label="Scroll right"
                                    >
                                  ...
                      ...
                    ...
            ...
          ...

    at <unknown> (file://C:/Users/user/Documents/Project PKKMB/event-2026/.next/dev/static/chunks/node_modules_next_dist_compiled_react-dom_096_9a-._.js:3439:25)
    at runWithFiberInDEV (file://C:/Users/user/Documents/Project PKKMB/event-2026/.next/dev/static/chunks/node_modules_next_dist_compiled_react-dom_096_9a-._.js:965:74)
    at emitPendingHydrationWarnings (file://C:/Users/user/Documents/Project PKKMB/event-2026/.next/dev/static/chunks/node_modules_next_dist_compiled_react-dom_096_9a-._.js:3438:13)    
    at completeWork (file://C:/Users/user/Documents/Project PKKMB/event-2026/.next/dev/static/chunks/node_modules_next_dist_compiled_react-dom_096_9a-._.js:6885:102)
    at runWithFiberInDEV (file://C:/Users/user/Documents/Project PKKMB/event-2026/.next/dev/static/chunks/node_modules_next_dist_compiled_react-dom_096_9a-._.js:965:131)
    at completeUnitOfWork (file://C:/Users/user/Documents/Project PKKMB/event-2026/.next/dev/static/chunks/node_modules_next_dist_compiled_react-dom_096_9a-._.js:9622:23)
    at performUnitOfWork (file://C:/Users/user/Documents/Project PKKMB/event-2026/.next/dev/static/chunks/node_modules_next_dist_compiled_react-dom_096_9a-._.js:9557:28)
    at workLoopConcurrentByScheduler (file://C:/Users/user/Documents/Project PKKMB/event-2026/.next/dev/static/chunks/node_modules_next_dist_compiled_react-dom_096_9a-._.js:9551:58)   
    at renderRootConcurrent (file://C:/Users/user/Documents/Project PKKMB/event-2026/.next/dev/static/chunks/node_modules_next_dist_compiled_react-dom_096_9a-._.js:9534:71)
    at performWorkOnRoot (file://C:/Users/user/Documents/Project PKKMB/event-2026/.next/dev/static/chunks/node_modules_next_dist_compiled_react-dom_096_9a-._.js:9061:150)
    at performWorkOnRootViaSchedulerTask (file://C:/Users/user/Documents/Project PKKMB/event-2026/.next/dev/static/chunks/node_modules_next_dist_compiled_react-dom_096_9a-._.js:10255:9)
    at MessagePort.performWorkUntilDeadline (file://C:/Users/user/Documents/Project PKKMB/event-2026/.next/dev/static/chunks/node_modules_next_dist_compiled_1amofcm._.js:2647:64) (file://C:/Users/user/Documents/Project PKKMB/event-2026/.next/dev/static/chunks/node_modules_next_dist_compiled_react-dom_096_9a-._.js:3439:25)