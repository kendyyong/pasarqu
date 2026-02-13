import React from "react";
import { useNavigate } from "react-router-dom";
import { Search, ShoppingBag, MessageCircle, User } from "lucide-react";
import { AppLogo } from "./AppLogo";

interface AppHeaderProps {
  userName: string;
  userAvatar: string | null;
  cartCount: number;
  regionName?: string;
  onCartClick: () => void;
  onSearch: (query: string) => void;
  onUserClick: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  userName,
  userAvatar,
  cartCount,
  regionName,
  onCartClick,
  onSearch,
  onUserClick,
}) => {
  const navigate = useNavigate();

  return (
    // HEADER DENGAN EFEK GLASSMORPHISM
    // bg-teal-600/90: Membuat warna teal sedikit transparan (90%)
    // backdrop-blur-md: Memberikan efek blur pada konten di belakangnya
    <header className="fixed top-0 left-0 right-0 z-[1000] bg-teal-600/90 backdrop-blur-md border-b border-white/10 shadow-lg">
      <div className="max-w-[1200px] mx-auto px-3 h-[64px] md:h-[74px] flex items-center gap-2 md:gap-8">
        {/* 1. SISI KIRI (DESKTOP ONLY) */}
        <div className="hidden md:block shrink-0">
          <AppLogo
            size="sm"
            regionName={regionName || "MUARA JAWA"}
            className="text-white"
          />
        </div>

        {/* 2. TENGAH: SEARCH BAR (Satu-satunya yang tetap di tengah) 
            bg-white/95: Kolom pencarian dibuat hampir solid agar teks tetap terbaca jelas
        */}
        <div className="flex-1 bg-white/95 rounded-full flex items-center p-1 shadow-inner h-10 md:h-11 overflow-hidden border border-white/20">
          <div className="flex-1 flex items-center px-3 md:px-4">
            <Search size={18} className="text-slate-400 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Cari kebutuhan harian..."
              className="w-full text-[12px] md:text-sm outline-none text-slate-800 font-medium bg-transparent border-none focus:ring-0 p-0 placeholder:text-slate-400"
              onChange={(e) => onSearch(e.target.value)}
            />
          </div>
        </div>

        {/* 3. SISI KANAN: MESSENGER & KERANJANG */}
        <div className="flex items-center gap-1 md:gap-4 shrink-0">
          {/* MESSENGER */}
          <div
            className="p-2 text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer active:scale-90"
            onClick={() => navigate("/chat")}
          >
            <MessageCircle size={24} strokeWidth={2.2} />
          </div>

          {/* KERANJANG */}
          <div
            className="relative p-2 text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer active:scale-90"
            onClick={onCartClick}
          >
            <ShoppingBag size={24} strokeWidth={2.2} />
            {cartCount > 0 && (
              <div className="absolute top-1 right-1 bg-[#FF6600] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border-2 border-teal-600 shadow-sm animate-bounce">
                {cartCount}
              </div>
            )}
          </div>

          {/* PROFILE (HANYA DESKTOP) */}
          <div
            onClick={onUserClick}
            className="hidden md:flex items-center gap-2 cursor-pointer bg-teal-700/40 p-1.5 px-3 rounded-full border border-white/10 ml-2"
          >
            {userAvatar ? (
              <img
                src={userAvatar}
                className="w-8 h-8 rounded-full object-cover"
                alt="User"
              />
            ) : (
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white">
                <User size={16} />
              </div>
            )}
            <span className="text-xs font-bold text-white max-w-[80px] truncate">
              {userName.split(" ")[0]}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
