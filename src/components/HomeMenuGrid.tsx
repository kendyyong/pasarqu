import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as Icons from "lucide-react";
import { supabase } from "../lib/supabaseClient"; // Path sudah diperbaiki
import { useMarket } from "../contexts/MarketContext"; // Path sudah diperbaiki

// Komponen Sederhana untuk Icon Menu
const MenuIcon = ({ icon, label, color, onClick }: any) => (
  <div
    onClick={onClick}
    className="flex flex-col items-center gap-2 cursor-pointer active:scale-95 transition-transform"
  >
    <div
      className={`w-12 h-12 ${color ? color.replace("text-", "bg-").replace("600", "100").replace("500", "100") : "bg-slate-100"} rounded-2xl flex items-center justify-center ${color || "text-slate-600"}`}
    >
      {icon}
    </div>
    <span className="text-[10px] font-bold text-slate-600 text-center leading-tight px-1 line-clamp-2">
      {label}
    </span>
  </div>
);

// Komponen Sederhana untuk Promo Box
const PromoBox = ({ onClick, icon, label, color, borderColor }: any) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 p-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-all w-full text-left group ${borderColor} hover:border`}
  >
    <div
      className={`${color} bg-slate-50 p-1.5 rounded-lg group-hover:scale-110 transition-transform`}
    >
      {icon}
    </div>
    <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">
      {label}
    </span>
  </button>
);

// Helper: Ubah String nama icon menjadi Komponen
const DynamicIcon = ({ name, size = 20 }: { name: string; size?: number }) => {
  // @ts-ignore
  const IconComponent = Icons[name];
  return IconComponent ? (
    <IconComponent size={size} />
  ) : (
    <Icons.HelpCircle size={size} />
  );
};

export const HomeMenuGrid = () => {
  const navigate = useNavigate();
  const marketContext = useMarket();
  const [menus, setMenus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Ambil Data Menu dari Database
  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const { data, error } = await supabase
          .from("app_menus")
          .select("*")
          .eq("is_active", true)
          .order("order_index", { ascending: true });

        if (error) throw error;
        if (data) setMenus(data);
      } catch (err) {
        console.error("Gagal memuat menu:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMenus();
  }, []);

  // 2. Logic Klik Menu
  const handleMenuClick = (path: string) => {
    if (path === "#RESET") {
      marketContext?.setSelectedMarket(null);
      localStorage.removeItem("selected_market_id");
      window.location.reload();
    } else {
      navigate(path);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 relative z-10 -mt-2">
      {/* GRID MENU DINAMIS */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-4 min-h-[100px]">
        <div className="grid grid-cols-4 md:grid-cols-8 gap-y-6 gap-x-2">
          {loading
            ? // Skeleton Loading
              [...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-2 animate-pulse"
                >
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl"></div>
                  <div className="w-10 h-2 bg-slate-100 rounded"></div>
                </div>
              ))
            : // Render Menu Asli
              menus.map((menu) => (
                <MenuIcon
                  key={menu.id}
                  icon={<DynamicIcon name={menu.icon_name} />}
                  label={menu.label}
                  color={menu.color_class} // Sesuaikan dengan nama kolom di DB (color atau color_class)
                  onClick={() => handleMenuClick(menu.target_url || menu.path)} // Support kedua nama kolom
                />
              ))}
        </div>
      </div>

      {/* PROMO BOX STATIC (Shortcut Pendaftaran) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <PromoBox
          onClick={() => navigate("/promo/toko")}
          icon={<Icons.Store size={16} />}
          label="Buka Toko"
          color="text-orange-600"
          borderColor="hover:border-orange-200"
        />
        <PromoBox
          onClick={() => navigate("/promo/kurir")}
          icon={<Icons.Bike size={16} />}
          label="Jadi Kurir"
          color="text-blue-600"
          borderColor="hover:border-blue-200"
        />
        <PromoBox
          onClick={() => navigate("/promo/admin")}
          icon={<Icons.Globe size={16} />}
          label="Mitra Wilayah"
          color="text-teal-600"
          borderColor="hover:border-teal-200"
        />
      </div>
    </div>
  );
};
