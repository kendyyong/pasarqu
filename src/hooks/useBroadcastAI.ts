import { useState } from "react";
// ✅ PERBAIKAN: Jalur disesuaikan dari src/hooks ke src/contexts
import { useToast } from "../contexts/ToastContext";

export const useBroadcastAI = (marketName: string) => {
  const { showToast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");

  const generateWithAI = async (onSuccess: (t: string, m: string) => void) => {
    if (!aiPrompt) return showToast("Masukkan topik promo dulu, Gan!", "info");

    setIsGenerating(true);
    try {
      // Simulasi AI Engine (Bisa dihubungkan ke OpenAI/Gemini API nanti)
      await new Promise((res) => setTimeout(res, 1500)); 

      const promptsMap: { [key: string]: { t: string; m: string } } = {
        diskon: {
          t: "🔥 DISKON SERBU PASAR!",
          m: `Halo warga ${marketName}! Khusus hari ini ada harga miring untuk sayur dan daging segar. Stok terbatas, yuk checkout sekarang sebelum kehabisan!`,
        },
        hujan: {
          t: "🌧️ MAGER KELUAR KARENA HUJAN?",
          m: `Tenang! Kurir Pasarqu siap antar belanjaan dapurmu sampai depan pintu. Tetap nyaman di rumah, biar kami yang belanja ke pasar.`,
        },
        pagi: {
          t: "🌅 SEMANGAT PAGI, BUNDA!",
          m: `Bahan masakan baru saja tiba di pasar! Masih segar-segar banget. Pesan sekarang, langsung kami kirim buat menu makan siang spesial keluarga.`,
        },
      };

      // Logika pemilihan prompt (fallback ke 'pagi' jika tidak ada keyword)
      const key = Object.keys(promptsMap).find((k) => 
        aiPrompt.toLowerCase().includes(k)
      ) || "pagi";
      
      const result = promptsMap[key];

      onSuccess(result.t, result.m);
      showToast("AI berhasil membuatkan pesan untukmu!", "success");
      setAiPrompt("");
    } catch (err) {
      showToast("AI sedang lelah, coba ketik manual ya.", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  return { aiPrompt, setAiPrompt, isGenerating, generateWithAI };
};