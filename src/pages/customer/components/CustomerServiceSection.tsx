import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  HelpCircle,
  Truck,
  CreditCard,
  MessageSquare,
  ShieldCheck,
  ChevronRight,
  Search,
  Headphones,
  ChevronDown,
  ShoppingBag,
  Clock,
  RefreshCcw,
} from "lucide-react";

export const CustomerServiceSection = () => {
  const navigate = useNavigate();
  const [orderId, setOrderId] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "BAGAIMANA CARA BELANJA DI PASARQU?",
      answer:
        "Pilih pasar terdekat, masukkan produk segar ke keranjang, tentukan alamat pengiriman, dan pilih metode pembayaran. Pesanan Anda akan diproses oleh mitra kurir kami.",
      icon: <ShoppingBag size={14} />,
    },
    {
      question: "KAPAN JADWAL PENGIRIMAN BARANG?",
      answer:
        "Untuk menjaga kesegaran, pengiriman dilakukan setiap pagi mulai pukul 06.00 - 10.00 WIB. Pesanan di atas jam 09.00 akan dikirim keesokan harinya.",
      icon: <Clock size={14} />,
    },
    {
      question: "APAKAH ADA JAMINAN BARANG SEGAR?",
      answer:
        "Tentu! Jika barang yang diterima busuk atau tidak layak, Anda bisa mengajukan komplain melalui Pusat Resolusi dalam waktu 2 jam setelah barang diterima.",
      icon: <ShieldCheck size={14} />,
    },
    {
      question: "BAGAIMANA CARA JADI MITRA TOKO?",
      answer:
        "Anda bisa mendaftar melalui halaman Portal Partner. Tim PASARQU akan melakukan verifikasi lokasi dan kelayakan toko sebelum Anda mulai berjualan.",
      icon: <RefreshCcw size={14} />,
    },
  ];

  const handleTrackOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderId.trim()) {
      navigate(`/track-order/${orderId}`);
    }
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <section className="bg-white border-t border-slate-100 mt-10 pt-12 pb-24 px-4 font-sans uppercase">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* 1. PUSAT BANTUAN & FAQ */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="bg-teal-50 p-3 rounded-2xl text-[#008080]">
                <HelpCircle size={24} />
              </div>
              <h2 className="text-sm font-black text-slate-900 tracking-tighter">
                Bantuan & FAQ
              </h2>
            </div>

            <div className="space-y-2">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="border border-slate-100 rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className={`w-full flex items-center justify-between p-3 text-left transition-all ${openFaq === index ? "bg-[#008080] text-white" : "bg-slate-50 text-slate-700 hover:bg-slate-100"}`}
                  >
                    <div className="flex items-center gap-2">
                      {faq.icon}
                      <span className="text-[9px] font-black tracking-widest">
                        {faq.question}
                      </span>
                    </div>
                    <ChevronDown
                      size={14}
                      className={`transition-transform ${openFaq === index ? "rotate-180" : ""}`}
                    />
                  </button>
                  {openFaq === index && (
                    <div className="p-4 bg-white text-[10px] font-bold text-slate-500 leading-relaxed normal-case border-t border-slate-100">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate("/chat")}
              className="w-full flex items-center justify-center gap-2 p-4 bg-orange-100 text-orange-600 rounded-2xl text-[10px] font-black tracking-[0.2em] hover:bg-orange-600 hover:text-white transition-all shadow-sm shadow-orange-200/50"
            >
              <MessageSquare size={16} /> HUBUNGI ADMIN PASARQU
            </button>
          </div>

          {/* 2. METODE PEMBAYARAN */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="bg-orange-50 p-3 rounded-2xl text-orange-500">
                <CreditCard size={24} />
              </div>
              <h2 className="text-sm font-black text-slate-900 tracking-tighter">
                Pembayaran Aman
              </h2>
            </div>

            <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100">
              <p className="text-[9px] font-black text-slate-400 mb-5 tracking-widest text-center">
                TRANSAKSI TERVERIFIKASI:
              </p>
              <div className="grid grid-cols-3 gap-3">
                {["DANA", "OVO", "GOPAY", "QRIS", "COD", "TRANSFER"].map(
                  (pay) => (
                    <div
                      key={pay}
                      className="h-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center font-black text-[9px] text-slate-600 shadow-sm"
                    >
                      {pay}
                    </div>
                  ),
                )}
              </div>
              <div className="mt-6 flex items-center gap-3 p-3 bg-white rounded-2xl border border-teal-100">
                <ShieldCheck className="text-teal-600" size={20} />
                <p className="text-[8px] font-black text-teal-700 leading-tight">
                  SELURUH TRANSAKSI DILINDUNGI SISTEM ENKRIPSI PASARQU
                </p>
              </div>
            </div>
          </div>

          {/* 3. LACAK PESANAN CEPAT */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 p-3 rounded-2xl text-blue-500">
                <Truck size={24} />
              </div>
              <h2 className="text-sm font-black text-slate-900 tracking-tighter">
                Status Kiriman
              </h2>
            </div>

            <form onSubmit={handleTrackOrder} className="space-y-3">
              <p className="text-[9px] font-black text-slate-400 tracking-widest">
                INPUT ID PESANAN:
              </p>
              <div className="relative">
                <input
                  type="text"
                  placeholder="MISAL: PSQ-2026-XXXX"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value.toUpperCase())}
                  className="w-full pl-5 pr-14 py-4 bg-slate-100 border-2 border-transparent rounded-2xl font-black text-xs outline-none focus:border-[#008080] focus:bg-white transition-all"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-[#008080] text-white rounded-xl hover:bg-slate-900 transition-all shadow-lg shadow-teal-900/20"
                >
                  <Search size={18} />
                </button>
              </div>
            </form>

            <div className="bg-slate-900 p-5 rounded-[2rem] flex items-center gap-4 text-white shadow-2xl">
              <div className="p-3 bg-[#008080] rounded-2xl shadow-inner">
                <Headphones size={24} className="text-white" />
              </div>
              <div>
                <p className="text-[8px] font-bold text-teal-400 tracking-[0.2em] mb-1">
                  CUSTOMER CARE 24/7
                </p>
                <p className="text-sm font-black tracking-tight">
                  HELP@PASARQU.ID
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER BOTTOM */}
        <div className="mt-20 pt-10 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-[#008080] rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-teal-900/20">
              P
            </div>
            <div className="text-left">
              <p className="text-sm font-black text-slate-900 leading-none tracking-tighter">
                PASARQU INDONESIA
              </p>
              <p className="text-[9px] font-bold text-slate-400 mt-2 tracking-widest leading-none">
                © 2026 PLATFORM DIGITAL PASAR TRADISIONAL
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <p className="text-[8px] font-black text-slate-400 tracking-widest mb-2">
                DOWNLOAD APLIKASI:
              </p>
              <div className="flex gap-2">
                <div className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[9px] font-black tracking-widest cursor-pointer hover:bg-[#008080] transition-colors">
                  GOOGLE PLAY
                </div>
                <div className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[9px] font-black tracking-widest cursor-pointer hover:bg-[#008080] transition-colors">
                  APP STORE
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
