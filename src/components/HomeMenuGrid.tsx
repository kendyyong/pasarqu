import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as Icons from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useMarket } from "../contexts/MarketContext";

const MenuIcon = ({ icon, label, color, onClick }: any) => (
  <div
    onClick={onClick}
    /**
     * gap-1.5: Jarak ikon ke teks yang sudah kita rapatkan.
     * pb-0: Menghilangkan padding bawah item agar teks tetap naik.
     */
    className="flex flex-col items-center gap-1.5 cursor-pointer active:scale-90 transition-all flex-shrink-0 w-[72px] group pb-0"
  >
    {/* Box Ikon */}
    <div
      className={`w-12 h-12 ${
        color
          ? color
              .replace("text-", "bg-")
              .replace("600", "100")
              .replace("500", "100")
          : "bg-slate-50"
      } rounded-2xl flex items-center justify-center ${color || "text-slate-600"} shadow-sm`}
    >
      {React.cloneElement(icon as React.ReactElement, { size: 22 })}
    </div>

    {/* Label Teks - leading-none agar rapat ke bawah */}
    <span className="text-[10px] font-black text-slate-500 text-center leading-none truncate w-full px-1 uppercase tracking-tighter">
      {label}
    </span>
  </div>
);

const DynamicIcon = ({ name, size = 22 }: { name: string; size?: number }) => {
  // @ts-ignore
  const IconComponent = Icons[name];
  return IconComponent ? (
    <IconComponent size={size} strokeWidth={2.5} />
  ) : (
    <Icons.HelpCircle size={size} />
  );
};

export const HomeMenuGrid = () => {
  const navigate = useNavigate();
  const marketContext = useMarket();
  const [menus, setMenus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    /**
     * WRAPPER UTAMA
     * mt-2: Jarak atas dari iklan utama.
     */
    <div className="-mx-5 md:mx-0 relative z-10 mt-2 md:mt-3 pb-0 bg-transparent">
      {/* KONTEN MENU (PUTIH BERSIH)
          pt-2: Jarak atas ikon.
          pb-1: Jarak bawah teks ke garis (sangat pendek sesuai permintaan).
      */}
      <div className="w-full bg-white pt-2 pb-1 px-4 md:px-5 rounded-none md:rounded-xl border-b md:border border-slate-50 shadow-none">
        <div
          className="flex flex-nowrap items-center gap-4 overflow-x-auto no-scrollbar"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {loading
            ? [...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-2 flex-shrink-0 w-[72px] animate-pulse"
                >
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl"></div>
                  <div className="w-10 h-2 bg-slate-50 rounded"></div>
                </div>
              ))
            : menus.map((menu) => (
                <MenuIcon
                  key={menu.id}
                  icon={<DynamicIcon name={menu.icon_name} />}
                  label={menu.label}
                  color={menu.color_class}
                  onClick={() => handleMenuClick(menu.target_url || menu.path)}
                />
              ))}
        </div>
      </div>
    </div>
  );
};

export default HomeMenuGrid;
