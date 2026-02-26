import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, MessageCircle, User, MapPin } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
// 🚀 IMPORT SEARCH BAR PRO
import { SearchBar } from "../shared/SearchBar";

interface AppHeaderProps {
  userName: string;
  userAvatar: string | null;
  cartCount: number;
  regionName?: string;
  onCartClick: () => void;
  onSearch: (query: string) => void;
  onUserClick: () => void;
  searchQuery: string;
}

// 🚀 NAMED EXPORT
export const AppHeader: React.FC<AppHeaderProps> = ({
  userName,
  userAvatar,
  cartCount,
  regionName,
  onCartClick,
  onSearch,
  onUserClick,
  searchQuery,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isBump, setIsBump] = useState(false);

  const finalDisplayName = user ? userName || "Pengguna" : "Tamu";

  useEffect(() => {
    if (cartCount > 0) {
      setIsBump(true);
      const timer = setTimeout(() => setIsBump(false), 300);
      return () => clearTimeout(timer);
    }
  }, [cartCount]);

  const handleChatClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (user) {
      navigate("/chat");
    } else {
      navigate("/login");
    }
  };

  const handleMarketChange = () => {
    navigate("/select-market");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-[1000] bg-[#008080] border-b border-white/[0.02] transition-all duration-300">
      <div className="max-w-[1200px] mx-auto px-4 h-[65px] md:h-[85px] flex items-center gap-3 md:gap-6">
        {/* AREA LOGO & GANTI PASAR */}
        <div
          className="flex items-center cursor-pointer shrink-0 group active:scale-95 transition-all duration-200"
          onClick={handleMarketChange}
        >
          {/* Logo Mobile (DIPERBESAR ke h-12) */}
          <div className="relative h-12 w-12 flex items-center justify-center bg-white rounded-xl shadow-xl border border-white/20 overflow-hidden p-0 md:hidden">
            <img
              src="/logo-pasarqu.png"
              alt="Ganti Pasar"
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.src =
                  "https://ui-avatars.com/api/?name=Toko&background=008080&color=fff";
              }}
            />
          </div>

          {/* Logo Desktop (DIPERBESAR ke h-14) */}
          <div className="hidden md:flex flex-col text-left">
            <img
              src="/logo-text.png"
              alt="PASARQU"
              className="h-14 w-auto object-contain" // 🚀 Ukuran dinaikkan dari h-10 ke h-14
              style={{
                filter: `drop-shadow(1.5px 0px 0px white) drop-shadow(-1.5px 0px 0px white) drop-shadow(0px 1.5px 0px white) drop-shadow(0px -1.5px 0px white)`,
              }}
            />
            <div className="flex items-center gap-1.5 mt-0 opacity-95 border-l-2 border-orange-400 pl-2">
              <MapPin size={11} className="text-orange-400" />
              <p className="text-[11px] text-teal-50 font-black uppercase tracking-[0.2em]">
                {regionName || "PILIH PASAR"}
              </p>
            </div>
          </div>
        </div>

        {/* 🚀 SEARCH BAR PRO */}
        <div className="flex-1">
          <SearchBar
            value={searchQuery}
            onChange={onSearch}
            placeholder="Cari kebutuhan dapur..."
          />
        </div>

        {/* ACTION AREA */}
        <div className="flex items-center gap-1 md:gap-3 shrink-0">
          <div
            className="p-2 text-white cursor-pointer hover:bg-white/10 rounded-xl transition-all active:scale-90"
            onClick={handleChatClick}
          >
            <MessageCircle size={24} />
          </div>

          <div
            className={`relative p-2 text-white cursor-pointer hover:bg-white/10 rounded-xl transition-all ${isBump ? "scale-110" : ""}`}
            onClick={onCartClick}
          >
            <ShoppingBag size={24} />
            {cartCount > 0 && (
              <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-md border-2 border-[#008080] shadow-md">
                {cartCount}
              </div>
            )}
          </div>

          <div
            onClick={onUserClick}
            className="hidden md:flex items-center gap-2 cursor-pointer bg-white/10 p-1.5 pr-3 rounded-xl border border-white/10 transition-all active:scale-95 hover:bg-white/20 ml-2"
          >
            {user && userAvatar ? (
              <img
                src={userAvatar}
                className="w-9 h-9 rounded-lg object-cover shadow-sm"
                alt="User"
              />
            ) : (
              <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center text-white">
                <User size={20} />
              </div>
            )}
            <div className="flex flex-col text-left">
              <span className="text-[12px] font-black text-white uppercase leading-none">
                {finalDisplayName}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
