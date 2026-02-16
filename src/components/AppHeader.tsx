import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ShoppingBag, MessageCircle, User } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

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

  // Logika Menentukan Nama (Jika login pakai nama asli, jika tidak pakai Tamu)
  const finalDisplayName = user ? userName || "Pengguna" : "Tamu";

  // Animasi angka keranjang saat bertambah
  useEffect(() => {
    if (cartCount > 0) {
      setIsBump(true);
      const timer = setTimeout(() => setIsBump(false), 300);
      return () => clearTimeout(timer);
    }
  }, [cartCount]);

  return (
    <header className="fixed top-0 left-0 right-0 z-[1000] bg-teal-600/95 backdrop-blur-md border-b border-white/10 shadow-lg transition-all duration-300">
      <div className="max-w-[1200px] mx-auto px-4 h-[70px] md:h-[80px] flex items-center gap-3 md:gap-8">
        {/* LOGO AREA */}
        <div
          className="flex items-center gap-3 cursor-pointer shrink-0 group"
          onClick={() => navigate("/")}
        >
          <div className="relative h-10 w-10 md:h-12 md:w-12 flex items-center justify-center bg-white rounded-xl shadow-xl border border-white/20 transform group-hover:scale-110 transition-all duration-300 p-1">
            <img
              src="/logo-pasarqu.png"
              alt="Logo"
              className="h-full w-full object-contain"
              onError={(e) => {
                e.currentTarget.src = "https://via.placeholder.com/100?text=P";
              }}
            />
          </div>

          <div className="hidden sm:block text-left">
            <h1 className="text-white font-black text-xl md:text-2xl tracking-tighter leading-none uppercase">
              PASAR<span className="text-orange-400">QU</span>
            </h1>
            <p className="text-[10px] text-teal-50 font-black uppercase tracking-[0.2em] mt-1.5 opacity-90 border-l-2 border-orange-400 pl-2 ml-0.5">
              {regionName || "WILAYAH LOKAL"}
            </p>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="flex-1 bg-white/95 rounded-2xl flex items-center p-1 shadow-inner h-11 overflow-hidden border border-white/20 focus-within:ring-2 focus-within:ring-orange-400 transition-all">
          <div className="flex-1 flex items-center px-4">
            <Search size={18} className="text-slate-400 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Cari kebutuhan dapur..."
              className="w-full text-sm outline-none text-slate-800 font-bold bg-transparent border-none focus:ring-0"
              onChange={(e) => onSearch(e.target.value)}
            />
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex items-center gap-1 md:gap-4 shrink-0">
          {/* Chat */}
          <div
            className="p-2 text-white cursor-pointer hover:bg-white/10 rounded-xl transition-all"
            onClick={() => (user ? navigate("/chat") : navigate("/login"))}
          >
            <MessageCircle size={22} />
          </div>

          {/* Cart */}
          <div
            className={`relative p-2 text-white cursor-pointer hover:bg-white/10 rounded-xl transition-all ${isBump ? "scale-110" : ""}`}
            onClick={onCartClick}
          >
            <ShoppingBag size={22} />
            {cartCount > 0 && (
              <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-teal-600 shadow-md animate-in zoom-in duration-300">
                {cartCount > 99 ? "99+" : cartCount}
              </div>
            )}
          </div>

          {/* USER PROFILE & NAME AREA */}
          <div
            onClick={onUserClick}
            className="flex items-center gap-2 cursor-pointer bg-white/10 p-1.5 pr-3 rounded-xl border border-white/10 transition-all active:scale-95 hover:bg-white/20"
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

            {/* TEXT NAMA: Muncul Nama di samping icon */}
            <div className="flex flex-col text-left">
              <span className="hidden md:block text-[8px] font-black text-teal-100 uppercase tracking-widest leading-none opacity-70">
                Sapaan,
              </span>
              <span className="text-[11px] font-black text-white uppercase italic leading-tight tracking-tight">
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
