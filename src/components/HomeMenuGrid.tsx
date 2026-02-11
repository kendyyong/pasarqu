import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as Icons from "lucide-react"; // Import semua icon agar bisa dipanggil namanya dari DB
import { supabase } from "../lib/supabaseClient";
import { useMarket } from "../contexts/MarketContext";
import { MenuIcon, PromoBox } from "./NavigationItems";

// Helper: Mengubah string nama icon (misal "Zap") menjadi Komponen Icon (<Zap />)
const DynamicIcon = ({ name, size = 18 }: { name: string; size?: number }) => {
  // @ts-ignore
  const IconComponent = Icons[name];
  // Jika icon tidak ditemukan, tampilkan tanda tanya (HelpCircle)
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

  // 1. Ambil Data Menu dari Database Supabase
  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const { data, error } = await supabase
          .from("app_menus")
          .select("*")
          .eq("is_active", true) // Hanya ambil yang aktif
          .order("order_index", { ascending: true }); // Urutkan sesuai index

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
      // Logic khusus untuk tombol "Ganti Pasar"
      marketContext?.setSelectedMarket(null);
      localStorage.removeItem("selected_market_id");
      window.location.reload();
    } else {
      // Navigasi halaman biasa
      navigate(path);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-2 md:px-0 relative z-10 -mt-2">
      {/* MENU GRID (DINAMIS DARI DB) */}
      <div className="bg-white pt-4 pb-2 mb-2 grid grid-cols-5 md:grid-cols-10 gap-y-3 px-2 rounded-b-lg shadow-sm border-t border-slate-50 min-h-[100px]">
        {loading
          ? // Tampilan Loading (Skeleton)
            [...Array(10)].map((_, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-2 animate-pulse"
              >
                <div className="w-10 h-10 bg-slate-100 rounded-xl"></div>
                <div className="w-8 h-2 bg-slate-100 rounded"></div>
              </div>
            ))
          : // Tampilan Menu Asli
            menus.map((menu) => (
              <MenuIcon
                key={menu.id}
                icon={<DynamicIcon name={menu.icon_name} />}
                label={menu.label}
                color={menu.color}
                onClick={() => handleMenuClick(menu.path)}
              />
            ))}
      </div>

      {/* PROMO BOX (TETAP STATIS AGAR CEPAT) */}
      <div className="grid grid-cols-3 gap-1.5 mb-3">
        <PromoBox
          onClick={() => navigate("/promo/toko")}
          icon={<Icons.Store size={16} />}
          label="Mulai Jualan"
          color="text-teal-700"
          borderColor="hover:border-teal-400"
        />
        <PromoBox
          onClick={() => navigate("/promo/kurir")}
          icon={<Icons.Bike size={16} />}
          label="Daftar Kurir"
          color="text-orange-700"
          borderColor="hover:border-orange-400"
        />
        <PromoBox
          onClick={() => navigate("/promo/admin")}
          icon={<Icons.Globe size={16} />}
          label="Mitra Zona"
          color="text-blue-700"
          borderColor="hover:border-blue-400"
        />
      </div>
    </div>
  );
};
