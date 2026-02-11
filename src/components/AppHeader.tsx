import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Store, Bike, Search, ShoppingBag, User, Globe } from "lucide-react";
import { AppLogo } from "./AppLogo";
import { useToast } from "../contexts/ToastContext";

interface AppHeaderProps {
  userName: string;
  cartCount: number;
  onCartClick: () => void;
  onSearch: (query: string) => void;
  onUserClick: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  userName,
  cartCount,
  onCartClick,
  onSearch,
  onUserClick,
}) => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // --- LOGIKA RAHASIA SUPER ADMIN ---
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
    <header className="fixed top-0 left-0 right-0 z-[1000] shadow-sm">
      {/* BARIS 1: PARTNER BAR (SEKARANG HIJAU TOSCA TUA) */}
      {/* Perubahan: bg-slate-950 -> bg-teal-900 */}
      <div className="bg-teal-900 text-white border-b border-white/10">
        <div className="max-w-[1200px] mx-auto px-4 h-8 flex justify-between items-center text-[9px] md:text-[10px] font-bold uppercase tracking-tight">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/login/toko")}
              className="flex items-center gap-1.5 hover:text-teal-200 transition-colors"
            >
              <Store size={12} className="text-teal-300" /> Login Toko
            </button>
            <span className="opacity-20">|</span>
            <button
              onClick={() => navigate("/login/kurir")}
              className="flex items-center gap-1.5 hover:text-orange-300 transition-colors"
            >
              <Bike size={12} className="text-orange-400" /> Login Kurir
            </button>
            <span className="opacity-20 hidden md:inline">|</span>
            <button
              onClick={() => navigate("/login/admin")}
              className="hidden md:flex items-center gap-1.5 hover:text-blue-300 transition-colors"
            >
              <Globe size={12} className="text-blue-400" /> Login Admin
            </button>
          </div>
          <button
            onClick={onUserClick}
            className="flex items-center gap-1.5 hover:text-teal-200 transition-colors"
          >
            <User size={12} className="text-orange-500" />{" "}
            <span>{userName}</span>
          </button>
        </div>
      </div>

      {/* BARIS 2: MAIN HEADER (HIJAU TOSCA STANDAR) */}
      <div className="bg-teal-600">
        <div className="max-w-[1200px] mx-auto px-3 h-[54px] md:h-[64px] flex items-center justify-between gap-3">
          {/* LOGO */}
          <div
            className="hidden md:flex items-center cursor-pointer shrink-0 select-none"
            onClick={handleSecretLogoClick}
          >
            <AppLogo
              size="sm"
              regionName="PASARQU"
              className="text-white scale-90 origin-left"
            />
          </div>

          {/* SEARCH BAR */}
          <div className="flex-1 bg-white rounded-sm flex items-center p-1 shadow-inner h-9 md:h-10">
            <div className="flex-1 px-2">
              {/* Icon User Mobile */}
              <div
                className="md:hidden mr-2 shrink-0 cursor-pointer"
                onClick={onUserClick}
              >
                <div className="w-6 h-6 bg-teal-50 rounded-full flex items-center justify-center text-teal-600 border border-teal-100">
                  <User size={14} />
                </div>
              </div>
              <input
                type="text"
                placeholder={`Cari di Pasarqu...`}
                className="w-full text-xs md:text-sm outline-none text-slate-800 font-medium bg-transparent"
                onChange={(e) => onSearch(e.target.value)}
              />
            </div>
            <button className="bg-orange-500 hover:bg-orange-600 text-white w-10 md:w-16 h-full rounded-sm flex items-center justify-center transition-colors shadow-sm">
              <Search size={18} />
            </button>
          </div>

          {/* KERANJANG */}
          <div
            className="relative cursor-pointer text-white px-2 group"
            onClick={onCartClick}
          >
            <ShoppingBag
              className="w-6 h-6 md:w-7 md:h-7 group-hover:scale-105 transition-transform"
              strokeWidth={1.5}
            />
            {cartCount > 0 && (
              <div className="absolute -top-1 right-0 bg-orange-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full border-2 border-teal-600 shadow-sm">
                {cartCount}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
