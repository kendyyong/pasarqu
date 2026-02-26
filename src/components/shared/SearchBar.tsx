import React, { useState, useEffect, useRef } from "react";
import { Search, X, TrendingUp, Clock, ArrowRight, Zap } from "lucide-react"; // 🚀 Zap sudah ditambahkan di sini!

interface Props {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<Props> = ({
  value,
  onChange,
  placeholder,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // 🚀 DATA TRENDING (Bisa disesuaikan dengan stok pasar yang lagi melimpah)
  const popularSearches = [
    "Pisang Mahuli",
    "Ayam Potong Segar",
    "Cabe Rawit",
    "Bawang Merah",
    "Ikan Layang",
  ];

  // Fungsi untuk menutup overlay jika klik di luar area search
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      ref={searchRef}
      className="relative w-full max-w-[600px] mx-auto z-[100]"
    >
      {/* --- INPUT FIELD --- */}
      <div
        className={`relative flex items-center transition-all duration-300 ${isFocused ? "scale-[1.02]" : ""}`}
      >
        <div className="absolute left-4 text-slate-400">
          <Search size={18} strokeWidth={2.5} />
        </div>

        <input
          type="text"
          value={value}
          onFocus={() => setIsFocused(true)}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "Cari pisang, sayur, atau ikan..."}
          className="w-full h-[45px] pl-12 pr-12 bg-slate-100 border-none rounded-full text-sm font-medium focus:bg-white focus:ring-2 focus:ring-teal-500/20 transition-all outline-none shadow-sm"
        />

        {value && (
          <button
            onClick={() => {
              onChange("");
              setIsFocused(false);
            }}
            className="absolute right-4 p-1 bg-slate-200 rounded-full text-slate-500 hover:bg-slate-300 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* --- OVERLAY SUGGESTION (PRO STYLE) --- */}
      {isFocused && !value && (
        <div className="absolute top-[55px] left-0 w-full bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Section: Trending */}
          <div className="p-4">
            <div className="flex items-center gap-2 mb-4 text-slate-800">
              <div className="p-1 bg-red-50 rounded-lg">
                <TrendingUp size={14} className="text-red-500" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Pencarian Populer
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {popularSearches.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onChange(item);
                    setIsFocused(false);
                  }}
                  className="px-4 py-2 bg-slate-50 hover:bg-teal-50 hover:text-teal-600 rounded-full text-xs font-medium border border-slate-100 transition-all active:scale-95"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Section: Banner Promo (Marketing Trick) */}
          <div className="bg-gradient-to-r from-teal-500 to-emerald-500 p-3 flex items-center justify-between cursor-pointer group">
            <div className="flex items-center gap-2 text-white">
              <div className="p-1.5 bg-white/20 rounded-lg group-hover:rotate-12 transition-transform">
                <Zap size={14} fill="white" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-tight leading-none">
                  Flash Sale Hari Ini
                </p>
                <p className="text-[9px] opacity-80">
                  Diskon sampai 50% di Muara Jawa
                </p>
              </div>
            </div>
            <ArrowRight
              size={14}
              className="text-white group-hover:translate-x-1 transition-transform"
            />
          </div>
        </div>
      )}
    </div>
  );
};
