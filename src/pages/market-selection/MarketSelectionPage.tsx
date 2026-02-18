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
import { AppLogo } from "../../components/ui/AppLogo";

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
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden">
        <div className="absolute w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="relative z-10 flex flex-col items-center">
          <Loader2 className="animate-spin text-emerald-600 mb-4" size={50} />
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-800 font-sans">
            Memuat Wilayah...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative font-sans overflow-hidden text-left">
      {/* --- DEKORASI BACKGROUND --- */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 bg-orange-500/10 rounded-full blur-3xl"></div>

      {/* --- KARTU UTAMA --- */}
      <div className="w-full max-w-md bg-white/80 backdrop-blur-md rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white p-6 md:p-8 relative z-10 animate-in zoom-in-95 duration-500">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex justify-center mb-4 p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
            <div className="text-emerald-600">
              <AppLogo size="md" regionName="ID" />
            </div>
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none uppercase">
            Pilih Lokasi <span className="text-emerald-600">Pasar</span>
          </h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-3">
            Temukan produk segar dari petani lokal.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6 group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search
              className="text-slate-400 group-focus-within:text-emerald-500 transition-colors"
              size={18}
            />
          </div>
          <input
            type="text"
            placeholder="Cari kecamatan kamu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:font-normal placeholder:text-slate-400"
          />
        </div>

        {/* LIST PASAR */}
        <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
          {filteredMarkets.length > 0 ? (
            filteredMarkets.map((market) => (
              <button
                key={market.id}
                onClick={() => handleSelect(market)}
                className="group w-full bg-white hover:bg-emerald-600 border border-slate-100 hover:border-emerald-600 rounded-2xl p-4 flex items-center justify-between transition-all duration-300 hover:shadow-lg hover:shadow-emerald-600/20 hover:-translate-y-1 active:scale-95"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-white/20 group-hover:text-white transition-colors">
                    <MapPin size={20} strokeWidth={2.5} />
                  </div>
                  <div className="text-left">
                    {/* ✅ Teks Nama Pasar (Italic dihapus) */}
                    <h3 className="text-sm font-black text-slate-700 group-hover:text-white transition-colors uppercase tracking-tighter leading-none mb-1">
                      {market.name}
                    </h3>
                    <p className="text-[9px] font-bold text-slate-400 group-hover:text-emerald-100 uppercase tracking-widest">
                      Wilayah {market.name}
                    </p>
                  </div>
                </div>
                <div className="text-slate-300 group-hover:text-white transition-colors">
                  <ChevronRight size={20} />
                </div>
              </button>
            ))
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                <Store size={24} />
              </div>
              <p className="text-slate-500 font-bold text-sm uppercase">
                Lokasi tidak ditemukan
              </p>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-8 border-t border-slate-100 pt-5 flex justify-between items-center">
          <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full uppercase tracking-tighter">
            <Map size={12} />
            <span>{markets.length} Area Tersedia</span>
          </div>
          <span className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">
            v1.0 Pasarqu
          </span>
        </div>
      </div>

      <p className="absolute bottom-6 text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em] opacity-60">
        &copy; 2026 Pasarqu Ecosystem
      </p>
    </div>
  );
};

export default MarketSelectionPage;
