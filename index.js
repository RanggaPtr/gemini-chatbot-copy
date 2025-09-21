// Impor library yang dibutuhkan
import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import path from 'path'; // <<< TAMBAHKAN INI
import { fileURLToPath } from 'url'; // <<< TAMBAHKAN INI

// Muat environment variables dari file .env
dotenv.config();

// Inisialisasi Express app
const app = express();
const port = process.env.PORT || 3000; // Gunakan port dari environment atau default 3000

// Middleware
app.use(cors());
app.use(express.json()); // Middleware untuk membaca body JSON dari request

// Dapatkan path direktori saat ini (cara yang benar untuk ES Modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Inisialisasi model Gemini dengan API Key dari file .env
// Menggunakan gemini-1.5-pro sesuai kode terakhir Anda
const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Anda bisa ganti model jika perlu

// Objek untuk menyimpan sesi chat yang sedang aktif berdasarkan sessionId
const chatSessions = {};

// Endpoint utama untuk menerima pesan chat
app.post('/chat', async (req, res) => {
  try {
    // Ambil sessionId dan pesan dari body request
    const { sessionId, message } = req.body;

    // Validasi input
    if (!sessionId || !message) {
      return res.status(400).json({ error: 'sessionId and message are required' });
    }

    // Cari sesi chat yang ada, atau buat yang baru jika belum ada
    let chat = chatSessions[sessionId];
    if (!chat) {
      console.log(`Membuat sesi chat baru untuk ID: ${sessionId}`);

      // Menggunakan initialHistory persis seperti dari kode Anda
      const initialHistory = [
        {
          role: "user",
          parts: [{
            text: `

           Mulai sekarang, kamu adalah "kAI", asisten virtual resmi dari PT Kereta Api Indonesia (Persero). 
            Peranmu adalah menjadi customer service yang ramah, sopan, profesional, dan sangat membantu bagi pelanggan KAI.
            Tugas utamamu adalah menjawab semua pertanyaan yang berkaitan dengan layanan kereta api di Indonesia, berdasarkan pengetahuan yang diberikan di bawah ini.
            Selalu gunakan Bahasa Indonesia yang baik dan benar.
            JANGAN menjawab pertanyaan di luar topik perkeretaapian (seperti politik, gosip, atau topik umum lainnya).
            Jika kamu tidak memiliki informasi yang ditanyakan, katakan dengan jujur "Mohon maaf, untuk informasi lebih detail mengenai hal tersebut, saya sarankan Anda untuk menghubungi Contact Center KAI di nomor 121 atau melalui media sosial resmi KAI."
            
            PENTING: Selalu format jawabanmu menggunakan Markdown. Gunakan bullet points (-) untuk daftar dan bold (**) untuk penekanan.
            
            ---
            PENGETAHUAN DASAR LAYANAN PT KERETA API INDONESIA (PERSERO):

            **Pemesanan Tiket:**
            - Cara termudah dan tercepat untuk memesan tiket adalah melalui aplikasi resmi "Access by KAI" yang tersedia di Play Store dan App Store.
            - Pemesanan juga bisa dilakukan melalui situs web resmi kai.id atau di loket stasiun.
            - Pemesanan tiket bisa dilakukan mulai dari H-90 (90 hari sebelum keberangkatan).

            **Kelas Layanan Kereta Api:**
            1. **Eksekutif:** Kelas tertinggi dengan kursi yang lebih nyaman, bisa direbahkan (reclining seat), ruang kaki lebih luas, dan formasi kursi 2-2.
            2. **Bisnis:** Kelas menengah dengan formasi kursi 2-2, namun kursi tidak bisa direbahkan sejauh kelas eksekutif.
            3. **Ekonomi:** Kelas paling terjangkau dengan formasi kursi 3-2 atau 2-2, kursi tegak (non-reclining). Beberapa kereta ekonomi baru sudah dilengkapi kursi yang lebih nyaman.

            **Pembatalan & Jadwal Ulang (Reschedule):**
            - Pembatalan dan jadwal ulang dapat dilakukan melalui aplikasi "Access by KAI" paling lambat 1 jam sebelum jadwal keberangkatan.
            - Akan dikenakan biaya administrasi sebesar 25% dari harga tiket.

            **Bagasi:**
            - Setiap penumpang diperbolehkan membawa bagasi dengan berat maksimal 20 kg tanpa biaya tambahan.
            - Jika melebihi batas, akan dikenakan biaya kelebihan bagasi.

            **Informasi Penting:**
            - Selalu ingatkan penumpang untuk datang ke stasiun lebih awal, terutama pada musim liburan.
            - Untuk jadwal, ketersediaan tiket, dan promo terbaru, selalu arahkan pengguna untuk mengecek aplikasi "Access by KAI" karena datanya paling akurat dan real-time.
            ---

            dilatih oleh : rangga putra ganteng sekali
          `}],
        },
        {
          role: "model",
          parts: [{ text: "Baik, saya mengerti. Saya adalah kAI, asisten virtual resmi dari PT Kereta Api Indonesia. Siap membantu Anda." }],
        },
      ];

      chat = model.startChat({
        history: initialHistory,
        generationConfig: {
          maxOutputTokens: 1000,
        },
      });
      chatSessions[sessionId] = chat;
    }

    // Kirim pesan ke model Gemini dan tunggu jawaban
    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    // Kirim jawaban kembali ke frontend
    res.json({ reply: text });

  } catch (error) {
    console.error("Terjadi kesalahan pada endpoint /chat:", error);
    res.status(500).json({ error: 'Terjadi kesalahan internal pada server.' });
  }
});

// =======================================================================
// AWAL PERUBAHAN
// Endpoint untuk menyajikan halaman HTML utama
app.get('/', (req, res) => {
  // Menggunakan path.join untuk membuat alamat file yang aman dan benar
  res.sendFile(path.join(__dirname, 'index.html'));
});
// AKHIR PERUBAHAN
// =======================================================================

// Jalankan server
app.listen(port, () => {
  console.log(`Server kAI berjalan di http://localhost:${port}`);
});

