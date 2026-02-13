import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as Icons from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useMarket } from "../contexts/MarketContext";

const MenuIcon = ({ icon, label, color, onClick }: any) => (
  <div
    onClick={onClick}
    className="flex flex-col items-center gap-1.5 cursor-pointer active:scale-90 transition-all flex-shrink-0 w-[72px] group"
  >
    <div
      className={`w-12 h-12 ${
        color
          ? color
              .replace("text-", "bg-")
              .replace("600", "100")
              .replace("500", "100")
          : "bg-slate-50"
      } rounded-xl flex items-center justify-center ${color || "text-slate-600"}`}
    >
      {icon}
    </div>
    <span className="text-[10px] font-black text-slate-500 text-center leading-tight truncate w-full px-1 uppercase tracking-tighter">
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
     * KALIBRASI POSISI TURUN (GIVE SOME SPACE):
     * mt-2: Di ponsel, memberikan jarak 8px dari iklan (sebelumnya negatif/nempel).
     * md:mt-6: Di desktop, memberikan jarak 24px agar lebih elegan dan lega.
     */
    <div className="-mx-5 md:mx-0 relative z-10 mt-2 md:mt-6 pb-2">
      {/* py-4: Padding vertikal dikembalikan sedikit lebih longgar agar tidak terlihat pesek */}
      <div className="w-full bg-white py-4 px-4 md:p-5 rounded-none md:rounded-xl border-b md:border border-slate-50 shadow-none md:shadow-sm">
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
                  <div className="w-12 h-12 bg-slate-50 rounded-xl"></div>
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
