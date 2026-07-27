'use server';

import { openai } from '@/lib/openai';

/**
 * Menghasilkan jawaban AI secara dinamis.
 * faqData digunakan sebagai REFERENSI konteks, bukan jawaban statis.
 * AI menjawab dengan bahasa santai, sopan, dan pakai emote.
 * Juga mengembalikan flag apakah pertanyaan termasuk cakupan FAQ atau tidak.
 * 
 * @returns {{ answer: string, isFaqMatched: boolean }}
 */
export const generateAnswer = async (text, faqData, siteType) => {
    try {
        if (!text || !siteType) {
            throw new Error('Parameter text dan siteType wajib diisi');
        }

        const siteName = siteType === 'pose' ? 'POSE (Pekan Olahraga dan Seni)' : 'PKKMB (Pengenalan Kehidupan Kampus bagi Mahasiswa Baru)';

        // Bangun konteks FAQ sebagai referensi
        const faqContext = faqData
            .filter(f => !['halo', 'hai', 'hi', 'terima kasih'].includes(f.question.toLowerCase()))
            .map(f => `Q: ${f.question}\nA: ${f.answer}`)
            .join('\n\n');

        const systemPrompt = `Kamu adalah "Mba Asisten", asisten virtual yang ramah, lucu dan ceria untuk portal ${siteName} di sebuah universitas. 🎓

PANDUAN MENJAWAB:
- Jika user berbicara dengan bahasa indonesia yang campur bahasa inggris, maka jawab dengan bahasa indonesia yang campur bahasa inggris
- Jika user berbicara dengan bahasa sunda yang campur bahasa indonesia, maka jawab dengan bahasa sunda yang campur bahasa indonesia
- Intinya jawablah dengan bahasa yang sama dengan user tapi tetap santai, sopan, dan friendly
- Selalu sertakan emoji/emote yang relevan dalam jawabanmu (minimal 1-2 emoji)
- Jawab dengan ringkas tapi informatif (maksimal 2-3 kalimat)
- Jika user menyapa (halo, hai, dll), balas sapaan dengan hangat dan tanyakan apa yang bisa dibantu
- Jika user bertanya (siapa kamu, mau bertanya, dll), jawab dengan hangat dan tanyakan apa yang bisa dibantu
- Jika user bertanya yang sama lebih dari 1 kali, jawab dengan hangat dan variasikan jawabanmu
- Jika user mengucapkan terima kasih, balas dengan ramah

DATA REFERENSI FAQ (gunakan ini sebagai acuan utama saat menjawab):
${faqContext}

ATURAN PENTING:
1. Jika pertanyaan user BERKAITAN dengan topik di data referensi FAQ, jawab berdasarkan informasi tersebut tapi JANGAN copy-paste — sampaikan dengan bahasamu sendiri yang natural dan santai.
2. Jika pertanyaan user TIDAK BERKAITAN sama sekali dengan ${siteName} atau topik kampus (misalnya soal cuaca, politik, coding, dll), jawab dengan sopan bahwa kamu tidak bisa membantu dan hanya bisa membantu seputar ${siteName} dan arahkan user ke menu Kontak jika butuh bantuan lebih lanjut.
3. Tambahkan "[FAQ_MATCH]" di AKHIR jawabanmu jika pertanyaan berkaitan dengan data FAQ. Tambahkan "[NOT_FAQ]" di akhir jika tidak berkaitan. Tag ini WAJIB ada di setiap jawaban.
`;

        // Menyimpan logic dummy dari task33 yang menampilkan log di server console
        const {
            data,
            response
        } = await openai.chat.completions.create({
            model: "gpt-5.4-mini", // pastikan modelnya sesuai (gpt-4o-mini / 3.5-turbo biasanya)
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: text }
            ],
            temperature: 0.7,
            max_completion_tokens: 500,

        }).withResponse(); // Added .withResponse() from dummy code

        console.log("===== DATA OPENAI (CHATBOT) =====");
        console.log("Token Usage :", data.usage);
        console.log("Status :", response.status);
        console.log("Request ID :", response.headers.get("x-request-id"));
        console.log("Processing :", response.headers.get("openai-processing-ms"));

        const rawAnswer = data.choices[0].message.content.trim();

        // Parse flag dari jawaban AI
        const isFaqMatched = rawAnswer.includes('[FAQ_MATCH]');

        // Bersihkan tag dari jawaban yang ditampilkan ke user
        const cleanAnswer = rawAnswer
            .replace(/\[FAQ_MATCH\]/g, '')
            .replace(/\[NOT_FAQ\]/g, '')
            .trim();

        return { answer: cleanAnswer, isFaqMatched };
    } catch (error) {
        console.error("OpenAI Error:", error);
        throw error;
    }
};
