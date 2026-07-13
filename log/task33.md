saya ingin migrasi apikey kan awalnya supabase itu pakai anonkey dan sekarang saya memakai secretkey yang tujuannya yaitu agar responenya tidak masuk ke browser(client browser) jadi hanya di server saja, dan saya ingin semua permintaan/querynya ke folder src/api/supabase/ dan setiap permintaan atau query saya ingin memisahkan filenya seperti query jadwal ada di folder src/api/supabase/jadwal.js, dan begitu seterusnya. dan juga saya ingin sebelum  query ini dikirim ke supabase saya ingin ada validasi atau pengecekan atau sanitasi atau sebagainya yang tujuannya untuk keamanan.
pastikan tidak bocor!
lihat saja difile src/lib/supabase.js untuk melihat variabelnya!
dan begitu juga untuk openai, saya ingin permintaan atau query untuk openai juga begitu dengan ke folder src/api/openai/. untuk variabelnya bisa dilihat di src/lib/openai.js. dan saya juga ingin memberi validasi juga seperti di supabase tadi. intinya sama seprti di supabase. kalau untuk openai saya ingin alur atua logikanya seperti codingan dummy aku ini, codingan dummy ini aku tes di lokal :
```javascript
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});
app.post("/chat", async (req, res) => {

    try {

        const { message } = req.body;

        const {
            data,
            response
        } = await client.chat.completions
            .create({
                model: "gpt-5.4-mini",
                messages: [
                    {
                        role: "system",
                        content: "bertindaklah seolah kamu adalah programmer modern."
                    },
                    {
                        role: "user",
                        content: message
                    }
                ],
                max_completion_tokens: 1000
            })
            .withResponse();

        console.log("===== DATA =====");
        console.log(data);

        console.log("===== STATUS =====");
        console.log(response.status);

        console.log("===== HEADERS =====");
        console.log("Request ID :", response.headers.get("x-request-id"));
        console.log("Processing :", response.headers.get("openai-processing-ms"));
        console.log("Organization :", response.headers.get("openai-organization"));

        res.json({
            reply: data.choices[0].message.content
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: err.message
        });

    }

});

app.listen(process.env.PORT, () => {
    console.log("Server running");
});
```