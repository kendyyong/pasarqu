import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  ChevronRight,
  Loader2,
  Search,
  Store,
  Map,
} from "lucide-react";
import { useMarket } from "../../contexts/MarketContext";
import { supabase } from "../../lib/supabaseClient";

export const MarketSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const { setSelectedMarket } = useMarket();
  const [markets, setMarkets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // --- LOGIKA DATABASE ---
  useEffect(() => {
    const fetchMarketsFromDB = async () => {
      try {
        const { data, error } = await supabase
          .from("markets")
          .select("*")
          .eq("is_active", true)
          .order("name", { ascending: true });

        if (error) throw error;
        if (data) setMarkets(data);
      } catch (error) {
        console.error("Gagal memuat data pasar:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMarketsFromDB();
  }, []);

  // --- HANDLER PEMILIHAN PASAR ---
  const handleSelect = (market: any) => {
    localStorage.setItem("selected_market_id", market.id);
    setSelectedMarket(market);
    navigate("/", { replace: true });
  };

  const filteredMarkets = markets.filter((market) =>
    market.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (isLoading) {
    return (
      // 🚀 LOADING: Tema Hijau Tosca
      <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#004d4d] to-[#008080] relative overflow-hidden">
        <div className="absolute w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="relative z-10 flex flex-col items-center">
          <Loader2 className="animate-spin text-white mb-4" size={50} />
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-teal-100 font-sans">
            Memuat Wilayah...
          </p>
        </div>
      </div>
    );
  }

  return (
    // 🚀 BACKGROUND LUAS: Hijau Tosca Elegan
    <div className="min-h-screen bg-gradient-to-br from-[#004d4d] via-[#008080] to-[#006666] flex flex-col items-center justify-center p-4 relative font-sans overflow-hidden text-left">
      {/* --- DEKORASI BACKGROUND --- */}
      <div
        className="absolute inset-0 opacity-[0.1]"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
      ></div>
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-[#FF6600]/20 rounded-full blur-[100px] pointer-events-none mix-blend-screen"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 bg-[#FF6600]/20 rounded-full blur-[100px] pointer-events-none mix-blend-screen"></div>

      {/* --- KOLOM KARTU UTAMA (ORANYE) --- */}
      <div className="w-full max-w-md bg-gradient-to-br from-[#FF6600] to-[#D95300] rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.4)] border border-orange-400/50 p-6 md:p-8 relative z-10 animate-in zoom-in-95 duration-500">
        {/* Header (Logo & Teks) */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img
              src="/logo-text.png"
              alt="PasarQu"
              className="h-10 md:h-12 w-auto object-contain"
              style={{
                filter:
                  "drop-shadow(1px 1px 0px white) drop-shadow(-1px -1px 0px white) drop-shadow(1px -1px 0px white) drop-shadow(-1px 1px 0px white)",
              }}
            />
          </div>
          <h1 className="text-2xl font-[1000] text-white tracking-tight leading-none uppercase">
            Pilih Lokasi <span className="text-yellow-300">Pasar</span>
          </h1>
          {/* 🚀 SLOGAN BARU: Pro UMKM Lokal */}
          <p className="text-orange-100 text-[10px] font-bold uppercase tracking-widest mt-3 leading-relaxed px-4">
            Berdayakan UMKM & Pedagang Lokal. Belanja Segar, Hidupkan Ekonomi
            Sekitar.
          </p>
        </div>

        {/* Search Bar (Kaca Gelap agar menyatu dengan Oranye) */}
        <div className="relative mb-6 group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search
              className="text-orange-200 group-focus-within:text-white transition-colors"
              size={18}
            />
          </div>
          <input
            type="text"
            placeholder="Cari nama pasar / daerah..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 bg-black/10 border border-black/10 rounded-xl text-sm font-black text-white focus:outline-none focus:border-white/50 focus:bg-black/20 focus:ring-2 focus:ring-white/20 transition-all placeholder:font-bold placeholder:text-orange-200/60 uppercase tracking-widest"
          />
        </div>

        {/* LIST PASAR */}
        <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2 custom-orange-scrollbar">
          {filteredMarkets.length > 0 ? (
            filteredMarkets.map((market) => (
              <button
                key={market.id}
                onClick={() => handleSelect(market)}
                className="group w-full bg-white/95 hover:bg-white border-2 border-transparent hover:border-yellow-400 rounded-2xl p-4 flex items-center justify-between transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1 active:scale-95"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-orange-100 text-[#FF6600] flex items-center justify-center group-hover:bg-[#FF6600] group-hover:text-white transition-colors shadow-inner">
                    <MapPin size={20} strokeWidth={2.5} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-[13px] font-[1000] text-slate-800 group-hover:text-[#FF6600] transition-colors uppercase tracking-tighter leading-none mb-1">
                      {market.name}
                    </h3>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      Wilayah {market.name}
                    </p>
                  </div>
                </div>
                <div className="text-slate-300 group-hover:text-[#FF6600] transition-colors">
                  <ChevronRight size={20} strokeWidth={3} />
                </div>
              </button>
            ))
          ) : (
            <div className="text-center py-8 bg-black/5 rounded-2xl border-2 border-dashed border-white/20">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3 text-white">
                <Store size={24} />
              </div>
              <p className="text-white font-black text-xs uppercase tracking-widest">
                Lokasi Tidak Ditemukan
              </p>
            </div>
          )}
        </div>

        {/* Footer Info (Di dalam Kolom) */}
        <div className="mt-8 border-t border-white/20 pt-5 flex justify-between items-center">
          <div className="flex items-center gap-1.5 text-[9px] font-black text-orange-900 bg-white/80 px-3 py-1.5 rounded-full uppercase tracking-tighter shadow-sm">
            <Map size={12} />
            <span>{markets.length} Area Tersedia</span>
          </div>
          <span className="text-[9px] text-orange-100 font-bold uppercase tracking-widest">
            v1.0 Pasarqu
          </span>
        </div>
      </div>

      {/* Teks Copyright di luar kolom (Di atas Hijau Tosca) */}
      <p className="absolute bottom-6 text-[9px] text-teal-100 font-black uppercase tracking-[0.3em] opacity-80">
        &copy; 2026 Pasarqu Ecosystem
      </p>

      {/* --- INJECT CSS CUSTOM SCROLLBAR UNTUK TEMA ORANYE --- */}
      <style>{`
        .custom-orange-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-orange-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 10px;
        }
        .custom-orange-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.5);
          border-radius: 10px;
        }
        .custom-orange-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.8);
        }
      `}</style>
    </div>
  );
};

export default MarketSelectionPage;
