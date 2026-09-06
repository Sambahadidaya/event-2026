fokus ke halaman status admin yang ada di src/app/panitia/admin/status/page.js
saya ingin menambah kolom baru ditabelnya yaitu untuk nim dan saya juga sudah menambahkan kolom didatabase adminsnya yang sqlnya seperti ini 
```sql
alter table admins add column nim varchar(20);
```
dan jika kolom nimnya kosong maka isikan dengan "-".