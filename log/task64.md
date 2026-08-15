fokus ke halaman chatbot yang ada difile src/components/SamsChatbot.js dengan apinya di src/api/openai/chat.js dan di src/api/supabase/public/admin.js yang function saveChatHistory.
didalam api src/api/openai/chat.js itukan ada consloge `console.log("Processing :", response.headers.get("openai-processing-ms"));`, nah saya ingin nominal atau angka itu ingin disimpan di database di table riwayat_pertanyaan dengan nama kolom `token`. sudah saya tambahkan kolom token di table riwayat_pertanyaan dengan menjalankan sql ini ;
```sql
alter table riwayat_pertanyaan ADD COLUMN token int4;
```
jadi setiap ada yang nanya atau memakai chatbot maka setiap selesai itu token yang terpakai akan kesimpan