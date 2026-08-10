lihatlah ada error ini pada saat membuat form register tepatnya pada saat mengatur limit perkampus, yang mana nama kampusnya tidak muncul dan hanya checkbox saja dan juga ketika aku memilih salah satu checkbox itu malah kelima checkboxnya menjadi tercentang padahal seharusnya hanya checkbox yang aku pilih saja yang tercentang, dan juga perbaiki tampilannya karna terlihat jelek checkboxnya. dan ini lognya ;
```log
Console Error



Encountered two children with the same key, `check-kampus-Mahasiswa LP3I-undefined`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
Call Stack
27

Show 21 ignore-listed frame(s)
label
<anonymous>
UnifiedFormDashboard[kategoriPendaftar.map() > (anonymous)()]
file:///C:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/.next/dev/static/chunks/src_01egn0j._.js (5861:306)
Array.map
<anonymous>
UnifiedFormDashboard[kategoriPendaftar.map()]
file:///C:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/.next/dev/static/chunks/src_01egn0j._.js (5858:304)
Array.map
<anonymous>
UnifiedFormDashboard
file:///C:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/.next/dev/static/chunks/src_01egn0j._.js (5618:63)
```