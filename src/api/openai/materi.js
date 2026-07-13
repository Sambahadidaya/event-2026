'use server';

import { openai } from '@/lib/openai';

/**
 * Menghasilkan jawaban AI secara dinamis khusus untuk materi.
 * AI menjawab dengan bahasa formal, akademis, dan hanya fokus pada materi.
 * 
 * @returns {{ answer: string }}
 */
export const generateMateriAnswer = async (text, materiContext) => {
    try {
        if (!text || !materiContext) {
            throw new Error('Parameter text dan materiContext wajib diisi');
        }

        const systemPrompt = `Kamu adalah "SamsMateriBot", asisten akademik cerdas untuk portal PKKMB.
Tugas utamamu adalah membantu mahasiswa baru memahami materi yang sedang mereka baca.

PANDUAN MENJAWAB:
- Jawab dengan bahasa Indonesia yang formal, akademis, terstruktur, dan jelas.
- Jangan menggunakan emoji/emote berlebihan atau bahasa gaul.
- Jawab dengan ringkas namun komprehensif.

DATA MATERI SAAT INI (gunakan ini sebagai SATU-SATUNYA acuan utama saat menjawab):
---
${materiContext}
---

ATURAN PENTING:
1. Jika pertanyaan BERKAITAN dengan konteks materi di atas, berikan jawaban analitis dan membantu.
2. Jika pertanyaan TIDAK BERKAITAN dengan konteks materi di atas (walaupun berkaitan dengan FAQ umum PKKMB/POSE), tolak dengan sopan. Berikan respons: "Maaf, saya hanya diprogram untuk menjawab pertanyaan spesifik mengenai materi ini. Untuk pertanyaan umum lainnya, silakan kembali ke halaman utama."
3. Jangan pernah memberikan informasi di luar konteks materi yang diberikan.`;

        const { data, response } = await openai.chat.completions.create({
            model: "gpt-5.4-mini", // Or whatever model you prefer
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: text }
            ],
            temperature: 0.5, // Lower temperature for more focused and factual answers
            max_completion_tokens: 300,
        }).withResponse();

        console.log("===== DATA OPENAI (MATERI BOT) =====");
        console.log("Token Usage :", data.usage);
        console.log("Status :", response.status);
        console.log("Request ID :", response.headers.get("x-request-id"));
        console.log("Processing :", response.headers.get("openai-processing-ms"));

        const answer = data.choices[0].message.content.trim();

        return { answer };
    } catch (error) {
        console.error("OpenAI Error:", error);
        throw error;
    }
};
