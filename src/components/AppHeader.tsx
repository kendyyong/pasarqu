import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ShoppingBag, User } from "lucide-react";
import { AppLogo } from "./AppLogo";
import { useToast } from "../contexts/ToastContext";

interface AppHeaderProps {
  userName: string;
  userAvatar: string | null;
  cartCount: number;
  onCartClick: () => void;
  onSearch: (query: string) => void;
  onUserClick: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  userName,
  userAvatar,
  cartCount,
  onCartClick,
  onSearch,
  onUserClick,
}) => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // --- LOGIKA RAHASIA SUPER ADMIN (Klik Logo 5x) ---
  const [tapCount, setTapCount] = useState(0);

  const handleSecretLogoClick = () => {
    setTapCount((p) => p + 1);
    setTimeout(() => setTapCount(0), 1000);

    if (tapCount + 1 === 5) {
      showToast("🔓 Akses Super Admin Terbuka...", "success");
      navigate("/login/master");
      setTapCount(0);
    } else if (tapCount === 0) {
      navigate("/");
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-[1000] shadow-md">
      {/* MAIN HEADER */}
      <div className="bg-teal-600">
        <div className="max-w-[1200px] mx-auto px-3 h-[60px] md:h-[70px] flex items-center justify-between gap-3">
          {/* LOGO (Pintu Rahasia Master tetap ada di sini) */}
          <div
            className="flex items-center cursor-pointer shrink-0 select-none"
            onClick={handleSecretLogoClick}
          >
            <AppLogo
              size="sm"
              regionName="PASARQU"
              className="text-white scale-90 md:scale-100 origin-left"
            />
          </div>

          {/* SEARCH BAR (Gaya Rounded Full agar Modern) */}
          <div className="flex-1 bg-white rounded-full flex items-center p-1 shadow-inner h-10 md:h-11 overflow-hidden">
            <div className="flex-1 flex items-center px-3">
              <Search size={18} className="text-slate-400 mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Cari sayur, daging, atau bumbu..."
                className="w-full text-xs md:text-sm outline-none text-slate-800 font-medium bg-transparent"
                onChange={(e) => onSearch(e.target.value)}
              />
            </div>
            <button className="hidden md:block bg-orange-500 hover:bg-orange-600 text-white px-6 h-full rounded-full transition-colors font-bold text-sm">
              Cari
            </button>
          </div>

          {/* ACTIONS (KERANJANG & USER) */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* KERANJANG - Tetap muncul di Mobile & Desktop */}
            <div
              className="relative cursor-pointer text-white p-2 group"
              onClick={onCartClick}
            >
              <ShoppingBag
                className="w-6 h-6 md:w-7 md:h-7 group-hover:scale-105 transition-transform"
                strokeWidth={1.5}
              />
              {cartCount > 0 && (
                <div className="absolute top-1 right-1 bg-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border-2 border-teal-600 shadow-sm">
                  {cartCount}
                </div>
              )}
            </div>

            {/* USER PROFILE - INI YANG KITA UBAH!
                Class 'hidden md:flex' artinya:
                - Di HP (layar kecil): HILANG (Hidden)
                - Di Laptop (layar md ke atas): MUNCUL (Flex)
            */}
            <div
              onClick={onUserClick}
              className="hidden md:flex items-center gap-2 cursor-pointer bg-teal-700/50 hover:bg-teal-700 px-2 py-1.5 md:pr-4 rounded-full transition-all border border-white/10"
            >
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt="User"
                  className="w-7 h-7 md:w-8 md:h-8 rounded-full border border-white/20 object-cover"
                />
              ) : (
                <div className="w-7 h-7 md:w-8 md:h-8 bg-white/20 rounded-full flex items-center justify-center text-white">
                  <User size={18} />
                </div>
              )}
              <span className="hidden md:block text-xs font-bold text-white max-w-[80px] truncate">
                {userName}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
