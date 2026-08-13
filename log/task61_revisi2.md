fokus ke halaman form wajib yang site pkkmb yang difile components/public/FormWajib.js. ada beberapa perbaikan UI, yaitu ;
saya ingin ketika yang div 
```js
<div className="space-y-2">
   <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400">NIM (dari Pendaftaran Tahap 1) *</label>
   <div className="relative">
       <input
           type="text"
           value={nimTahap2}
           onChange={(e) => setNimTahap2(e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 9))}
           placeholder="Masukkan NIM 9 karakter"
           maxLength={9}
           className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
       />
       {validatingNim && (
           <div className="absolute right-3 top-3.5 animate-spin h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
       )}
   </div>
   {firstSubmissionData && (
       <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl text-green-800 dark:text-green-300 text-xs">
           ✅ <strong>{firstSubmissionData.nama}</strong> ditemukan. Data akan otomatis terisi.
       </div>
   )}
</div>
```
itu akan tersubmit atau mengecek ketika datanya sudah terisi 9karakter itu juga ada delay 2 detik, jadi jangan langsung cek terus menerus, dan ketika user mengedit juga delaynya akan diriset jadi delaynya akan terus berjalan dari awal lagi. Terus data yang di get itu harusnya bisa menyimpan data yang kosong juga.
terus ketika memilih kelas itukan ada Reguler, dan ketika memilih regulerkan ada opsi atau inputan lagi yaitu Jenis Pembayaran, nah jika kelasnya reguler terus jenis pembayarannya `langsung full` itukan ada opsi lagi yaitu `full (lunas sekaligus)` nah saya ingin `full (lunas sekaligus)` itu langsung difixkan seperti pada kip karnakan namanya juga langsung full ya opsinya cuman itu aja.