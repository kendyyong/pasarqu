import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Store,
  Truck,
  MessageCircle,
  ChevronDown,
  HelpCircle,
  Zap,
} from "lucide-react";

export const HelpCenterPage = () => {
  const navigate = useNavigate();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // --- DATA FAQ KHUSUS MITRA PASARQU ---
  const faqData = [
    {
      id: 1,
      category: "toko",
      icon: <Store size={18} className="text-[#FF6600]" />,
      question: "APA SAJA SYARAT MEMBUKA TOKO DI PASARQU?",
      answer:
        "UNTUK MENDAFTAR SEBAGAI MITRA TOKO, ANDA HANYA PERLU MENYIAPKAN FOTO KTP ASLI, FOTO PRODUK YANG AKAN DIJUAL, DETAIL LOKASI TOKO ATAU TITIK JEMPUT, SERTA NOMOR REKENING AKTIF UNTUK PENCAIRAN DANA PENJUALAN.",
    },
    {
      id: 2,
      category: "toko",
      icon: <Store size={18} className="text-[#FF6600]" />,
      question: "BAGAIMANA SISTEM BAGI HASIL UNTUK TOKO?",
      answer:
        "PASARQU BERKOMITMEN MEMAJUKAN UMKM LOKAL DENGAN MENERAPKAN POTONGAN KOMISI YANG SANGAT RENDAH DAN TRANSPARAN PADA TIAP TRANSAKSI BERHASIL. DETAIL PERSENTASE KOMISI DAPAT DILIHAT PADA KONTRAK DIGITAL SAAT PENDAFTARAN.",
    },
    {
      id: 3,
      category: "kurir",
      icon: <Truck size={18} className="text-[#FF6600]" />,
      question: "APA SYARAT MENJADI MITRA KURIR PASARQU?",
      answer:
        "SYARAT WAJIB MELIPUTI: MEMILIKI KENDARAAN RODA DUA PRIBADI YANG LAYAK JALAN, SIM C AKTIF, KTP ASLI, DAN SMARTPHONE ANDROID DENGAN KONEKSI INTERNET YANG STABIL.",
    },
    {
      id: 4,
      category: "kurir",
      icon: <Truck size={18} className="text-[#FF6600]" />,
      question: "KAPAN KURIR BISA MENCAIRKAN PENDAPATAN?",
      answer:
        "PENDAPATAN DARI ONGKOS KIRIM AKAN LANGSUNG MASUK KE SALDO MITRA ANDA. PENCAIRAN (WITHDRAWAL) DAPAT DILAKUKAN SETIAP HARI KERJA LANGSUNG KE REKENING BANK ATAU E-WALLET YANG ANDA DAFTARKAN.",
    },
    {
      id: 5,
      category: "umum",
      icon: <HelpCircle size={18} className="text-white/70" />,
      question: "SAYA LUPA KATA SANDI, APA YANG HARUS DILAKUKAN?",
      answer:
        "ANDA DAPAT MENGGUNAKAN FITUR 'LUPA SANDI' PADA HALAMAN LOGIN PORTAL MITRA. TAUTAN RESET KATA SANDI AKAN DIKIRIMKAN MELALUI EMAIL ATAU SMS KE NOMOR HP YANG TERDAFTAR.",
    },
  ];

  const toggleFaq = (id: number) => {
    if (activeFaq === id) {
      setActiveFaq(null);
    } else {
      setActiveFaq(id);
    }
  };

  return (
    // BACKGROUND: Gradasi Orange Gelap (Deep Amber/Rust)
    <div className="min-h-screen w-full bg-gradient-to-br from-[#4d1a00] via-[#260d00] to-[#0d0400] flex flex-col items-center px-4 md:px-6 font-sans relative overflow-x-hidden text-left transition-colors duration-700 pb-20">
      {/* --- DEKORASI MOTIF & CAHAYA (ORANGE & TOSCA GLOW) --- */}
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none fixed"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.8) 1px, transparent 0)`,
          backgroundSize: "24px 24px",
        }}
      ></div>
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#FF6600]/25 rounded-full blur-[120px] pointer-events-none mix-blend-screen fixed"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#008080]/15 rounded-full blur-[120px] pointer-events-none mix-blend-screen fixed"></div>

      {/* --- TOP NAVIGATION (KEMBALI) --- */}
      <div className="sticky top-0 left-0 w-full py-5 md:py-8 z-50 flex justify-start max-w-[600px]">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-full text-white/80 hover:text-white hover:bg-white/20 hover:border-[#FF6600]/50 backdrop-blur-md transition-all text-[10px] font-black uppercase tracking-[0.2em] group active:scale-95 shadow-lg"
        >
          <ArrowLeft
            size={16}
            className="group-hover:-translate-x-1 transition-transform"
          />
          <span className="hidden sm:inline">KEMBALI KE PORTAL</span>
        </button>
      </div>

      {/* --- KONTEN UTAMA --- */}
      <div className="relative z-10 w-full max-w-[600px] flex flex-col animate-in slide-in-from-bottom-8 duration-700 mt-2">
        {/* HEADER BANTUAN */}
        <div className="w-full text-left mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-4 backdrop-blur-md">
            <Zap size={12} className="text-[#FF6600]" fill="currentColor" />
            <span className="text-[9px] md:text-[10px] font-black text-white/80 uppercase tracking-[0.3em]">
              PUSAT INFORMASI
            </span>
          </div>

          <h1 className="text-[32px] md:text-[48px] font-[1000] uppercase tracking-tighter text-white leading-[1] drop-shadow-lg mb-3">
            BANTUAN <span className="text-[#FF6600]">MITRA</span>
          </h1>

          <p className="w-full text-orange-100/70 text-[10px] md:text-[12px] font-black uppercase tracking-widest leading-relaxed border-l-2 border-[#FF6600] pl-3 text-justify">
            TEMUKAN JAWABAN ATAS PERTANYAAN SEPUTAR PENDAFTARAN DAN OPERASIONAL
            KEMITRAAN PASARQU.
          </p>
        </div>

        {/* LIST FAQ (ACCORDION) */}
        <div className="w-full space-y-3 mb-10">
          {faqData.map((faq) => (
            <div
              key={faq.id}
              className={`w-full bg-white/5 backdrop-blur-md border rounded-[1.2rem] md:rounded-[1.5rem] overflow-hidden transition-all duration-300 ${activeFaq === faq.id ? "border-[#FF6600]/50 shadow-[0_0_25px_-5px_rgba(255,102,0,0.3)] bg-white/10" : "border-white/10 hover:border-white/20 hover:bg-white/10"}`}
            >
              <button
                onClick={() => toggleFaq(faq.id)}
                className="w-full flex items-center justify-between p-4 md:p-5 text-left active:scale-[0.99] transition-transform outline-none"
              >
                <div className="flex items-center gap-3 pr-4">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                    {faq.icon}
                  </div>
                  {/* ✅ TEKS PERTANYAAN DIUBAH MENJADI FONT-NORMAL (TIDAK BOLD) */}
                  <span className="text-[11px] md:text-[12px] font-normal text-white uppercase tracking-wider leading-snug">
                    {faq.question}
                  </span>
                </div>
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-white/50 flex-shrink-0 transition-all duration-300 ${activeFaq === faq.id ? "rotate-180 bg-[#FF6600]/20 text-[#FF6600] border-[#FF6600]/50" : ""}`}
                >
                  <ChevronDown size={14} strokeWidth={3} />
                </div>
              </button>

              {/* JAWABAN FAQ */}
              <div
                className={`w-full px-4 md:px-5 overflow-hidden transition-all duration-300 ease-in-out ${activeFaq === faq.id ? "max-h-[300px] pb-5 opacity-100" : "max-h-0 opacity-0"}`}
              >
                <div className="pt-3 border-t border-white/10">
                  {/* ✅ TEKS JAWABAN JUGA DIUBAH MENJADI FONT-NORMAL (TIDAK BOLD) AGAR SERAGAM */}
                  <p className="text-[10px] md:text-[11px] font-normal text-orange-100/70 uppercase tracking-widest leading-relaxed text-justify">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* HUBUNGI ADMIN (WHATSAPP CALL TO ACTION) */}
        <div className="w-full mt-auto">
          <div className="w-full flex flex-col items-center justify-center p-6 md:p-8 bg-black/40 backdrop-blur-xl border border-white/10 rounded-[1.5rem] md:rounded-[2rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF6600]/15 rounded-full blur-[40px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#008080]/15 rounded-full blur-[40px] pointer-events-none"></div>

            <MessageCircle
              size={36}
              className="text-[#FF6600] mb-4 group-hover:scale-110 transition-transform duration-500"
            />

            <h3 className="text-[14px] md:text-[16px] font-[1000] text-white uppercase tracking-tighter mb-2 text-center">
              MASIH MEMBUTUHKAN BANTUAN?
            </h3>

            <p className="text-[9px] md:text-[10px] font-black text-white/50 uppercase tracking-widest text-center max-w-[280px] mb-6 leading-relaxed">
              TIM ADMIN KAMI SIAP MEMBANTU KENDALA PENDAFTARAN DAN OPERASIONAL
              ANDA SECARA LANGSUNG.
            </p>

            <button
              onClick={() =>
                window.open("https://wa.me/6281234567890", "_blank")
              }
              className="w-full max-w-[280px] py-4 bg-[#FF6600] rounded-2xl hover:bg-orange-600 transition-all shadow-[0_0_20px_-5px_rgba(255,102,0,0.5)] active:scale-95 border border-orange-400/50 flex items-center justify-center gap-2"
            >
              <MessageCircle size={16} className="text-white" />
              <span className="text-[11px] font-[1000] uppercase text-white tracking-widest">
                HUBUNGI KAMI VIA WA
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenterPage;
