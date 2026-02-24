import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ShoppingBag, MessageCircle, User, MapPin } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

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

  return (
    <header className="fixed top-0 left-0 right-0 z-[1000] bg-[#008080] border-b border-white/10 shadow-lg transition-all duration-300">
      <div className="max-w-[1200px] mx-auto px-4 h-[60px] md:h-[70px] flex items-center gap-3 md:gap-6">
        {/* AREA LOGO */}
        <div
          className="flex items-center cursor-pointer shrink-0 group active:scale-95 transition-all duration-200"
          onClick={() => navigate("/")}
        >
          {/* 1. LOGO ICON (Tampilan Mobile) */}
          <div className="relative h-10 w-10 flex items-center justify-center bg-white rounded-xl shadow-xl border border-white/20 overflow-hidden p-0 md:hidden">
            <img
              src="/logo-pasarqu.png"
              alt="Icon"
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.src = "https://via.placeholder.com/100?text=P";
              }}
            />
          </div>

          {/* 2. LOGO TULISAN (Tampilan Desktop) */}
          <div className="hidden md:flex flex-col text-left">
            <img
              src="/logo-text.png"
              alt="PASARQU"
              className="h-10 w-auto object-contain group-hover:opacity-90 transition-all"
              style={{
                filter: `drop-shadow(1px 0px 1px white) drop-shadow(-1px 0px 1px white) drop-shadow(0px 1px 1px white) drop-shadow(0px -1px 1px white)`,
              }}
            />
            <div className="flex items-center gap-1.5 mt-1 opacity-90 border-l-2 border-orange-400 pl-2">
              <MapPin size={10} className="text-orange-400" />
              <p className="text-[10px] text-teal-50 font-black uppercase tracking-[0.15em]">
                {regionName || "PILIH PASAR"}
              </p>
            </div>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="flex-1 bg-white/95 rounded-xl flex items-center p-1 shadow-inner h-10 overflow-hidden border border-slate-200 focus-within:ring-2 focus-within:ring-orange-400 transition-all">
          <div className="flex-1 flex items-center px-4">
            <Search size={18} className="text-slate-400 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Cari kebutuhan dapur..."
              className="w-full text-[12px] outline-none text-slate-800 font-black bg-transparent border-none focus:ring-0 uppercase"
              onChange={(e) => onSearch(e.target.value)}
            />
          </div>
        </div>

        {/* ACTION AREA: ICONS + PROFIL */}
        <div className="flex items-center gap-1 md:gap-3 shrink-0">
          {/* ✅ REVISI: Tombol "Mitra" telah dihapus dari mode Desktop untuk menjaga kerapihan Header */}

          {/* Icon Chat */}
          <div
            className="p-2 text-white cursor-pointer hover:bg-white/10 rounded-xl transition-all active:scale-90"
            onClick={handleChatClick}
          >
            <MessageCircle size={22} />
          </div>

          {/* Icon Cart */}
          <div
            className={`relative p-2 text-white cursor-pointer hover:bg-white/10 rounded-xl transition-all ${isBump ? "scale-110" : ""}`}
            onClick={onCartClick}
          >
            <ShoppingBag size={22} />
            {cartCount > 0 && (
              <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-md border-2 border-[#008080] shadow-md">
                {cartCount}
              </div>
            )}
          </div>

          {/* Profil (Hanya Desktop) */}
          <div
            onClick={onUserClick}
            className="hidden md:flex items-center gap-2 cursor-pointer bg-white/10 p-1.5 pr-3 rounded-xl border border-white/10 transition-all active:scale-95 hover:bg-white/20 ml-2"
          >
            {user && userAvatar ? (
              <img
                src={userAvatar}
                className="w-8 h-8 rounded-lg object-cover border border-white/20 shadow-sm"
                alt="User"
              />
            ) : (
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-white">
                <User size={18} />
              </div>
            )}
            <div className="flex flex-col text-left">
              <span className="text-[11px] font-black text-white uppercase leading-none">
                {finalDisplayName}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
