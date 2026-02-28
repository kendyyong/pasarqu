import React, { useState } from "react";
import {
  TrendingUp,
  Package,
  ShoppingBag,
  ArrowRight,
  Clock,
  LayoutDashboard,
  Star,
  PlusCircle,
  Megaphone,
  Headset,
  X,
  MapPin,
  Truck,
  CheckCircle2,
  Info,
} from "lucide-react";

interface Props {
  merchantProfile: any;
  stats: {
    orders: number;
    products: number;
    todayOmzet?: number;
    pendingOrders?: number;
  };
  recentOrders?: any[];
  onNavigate?: (tab: string) => void;
}

export const MerchantOverview: React.FC<Props> = ({
  merchantProfile,
  stats,
  recentOrders = [],
  onNavigate,
}) => {
  const [showTips, setShowTips] = useState(true);

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const omzetHariIni = stats.todayOmzet || 0;
  const pesananTertunda = stats.pendingOrders || 0;

  // 🚀 LOGIKA HANDLING TOMBOL AKSI PRO
  const handleQuickAction = (type: "katalog" | "promo" | "bantuan") => {
    if (type === "katalog") {
      // Buka tab produk normal
      onNavigate?.("products");
    } else if (type === "promo") {
      // 🚀 Kirim kode "promo" agar sistem tahu kita mau edit harga instan
      onNavigate?.("promo");
    } else if (type === "bantuan") {
      // 🚀 Kirim kode "help" agar sistem langsung membuka chat dengan Admin
      onNavigate?.("help");
    }
  };

  return (
    <div className="w-full space-y-4 md:space-y-6 animate-in fade-in duration-700 text-left font-sans pb-24 md:pb-10">
      {/* 1. HERO BANNER */}
      <div className="bg-slate-900 rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden shadow-xl border-b-4 border-[#FF6600]">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2 opacity-60">
            <LayoutDashboard size={12} className="text-[#008080]" />
            <p className="text-[9px] text-white font-bold tracking-[0.15em] uppercase">
              {today}
            </p>
          </div>
          <h1 className="text-2xl md:text-4xl text-white font-[1000] leading-tight uppercase tracking-tighter">
            {merchantProfile?.shop_name || "TOKO SAYA"}
          </h1>
          <div className="flex items-center gap-2 mt-3">
            <div
              className={`px-3 py-1 rounded-lg text-[9px] font-black tracking-widest flex items-center gap-1.5 shadow-sm ${merchantProfile?.is_shop_open ? "bg-teal-500/20 text-teal-400 border border-teal-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full ${merchantProfile?.is_shop_open ? "bg-teal-400 animate-pulse" : "bg-red-400"}`}
              ></div>
              {merchantProfile?.is_shop_open ? "OPEN" : "CLOSED"}
            </div>
            {merchantProfile?.is_verified && (
              <span className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-[9px] font-black tracking-widest flex items-center gap-1">
                <CheckCircle2 size={10} /> MITRA VERIFIED
              </span>
            )}
          </div>
        </div>

        <div className="relative z-10 bg-white/5 backdrop-blur-md p-4 md:p-6 rounded-2xl border border-white/10 w-full md:w-auto text-left md:text-right">
          <p className="text-[9px] text-slate-400 font-bold tracking-widest uppercase mb-1">
            OMSET HARI INI
          </p>
          <div className="flex items-center md:justify-end gap-1">
            <span className="text-[#FF6600] font-black text-sm">RP</span>
            <h2 className="text-2xl md:text-3xl text-white font-[1000] tracking-tighter">
              {omzetHariIni.toLocaleString()}
            </h2>
          </div>
        </div>
        <TrendingUp
          size={120}
          className="absolute -right-5 -bottom-5 text-white opacity-[0.03] rotate-12"
        />
      </div>

      {/* 2. QUICK ACTIONS */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        <QuickActionBtn
          icon={<Package size={22} />} // 🚀 Ikon diganti jadi Package
          label="Katalog Produk" // 🚀 Teks diganti
          color="bg-[#008080] text-white"
          onClick={() => handleQuickAction("katalog")}
        />
        <QuickActionBtn
          icon={<Megaphone size={22} />}
          label="Promo"
          color="bg-white border border-slate-200 text-slate-700 hover:text-[#FF6600]"
          onClick={() => handleQuickAction("promo")}
          note="Instan"
        />
        <QuickActionBtn
          icon={<Headset size={22} />}
          label="Bantuan"
          color="bg-white border border-slate-200 text-slate-700 hover:text-[#008080]"
          onClick={() => handleQuickAction("bantuan")}
        />
      </div>

      {/* 3. METRIK UTAMA */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          icon={<ShoppingBag size={18} />}
          label="Order Aktif"
          value={pesananTertunda}
          color={pesananTertunda > 0 ? "text-red-600" : "text-slate-700"}
          bgColor={
            pesananTertunda > 0
              ? "bg-red-50 border-red-100"
              : "bg-white border-slate-100"
          }
          alert={pesananTertunda > 0}
        />
        <StatCard
          icon={<Package size={18} />}
          label="Katalog Aktif" // 🚀 Teks disesuaikan
          value={stats.products}
          color="text-[#008080]"
          bgColor="bg-white border-slate-100"
        />
        <StatCard
          icon={<Star size={18} />}
          label="Rating Toko"
          value="4.9"
          color="text-orange-500"
          bgColor="bg-white border-slate-100"
        />
        <StatCard
          icon={<TrendingUp size={18} />}
          label="Performa"
          value="100%"
          color="text-blue-500"
          bgColor="bg-white border-slate-100"
        />
      </div>

      {/* 4. AREA TENGAH: LIVE ORDERS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="md:col-span-2 bg-white border border-slate-100 p-5 md:p-6 rounded-[1.5rem] shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[11px] font-[1000] text-slate-800 tracking-wider flex items-center gap-2 uppercase">
              <TrendingUp size={14} className="text-[#008080]" /> Penjualan
              Mingguan
            </h3>
          </div>
          <div className="h-40 bg-slate-50/50 border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-center p-4">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed max-w-[200px]">
              Grafik otomatis terisi setelah transaksi perdana
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 md:p-6 rounded-[1.5rem] shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-5 border-b border-slate-50 pb-3">
            <h3 className="text-[11px] font-[1000] text-slate-800 tracking-wider flex items-center gap-2 uppercase">
              <Clock size={14} className="text-[#FF6600]" /> Live Orders
            </h3>
            {recentOrders.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto pr-1 no-scrollbar space-y-3">
            {recentOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 opacity-30">
                <ShoppingBag size={32} className="text-slate-300 mb-2" />
                <p className="text-[9px] font-black tracking-widest text-center uppercase">
                  Belum ada pesanan
                </p>
              </div>
            ) : (
              recentOrders.slice(0, 3).map((order, idx) => (
                <div
                  key={idx}
                  className="flex gap-3 items-center p-2 hover:bg-slate-50 rounded-xl transition-all border-l-4 border-[#FF6600]"
                >
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#008080] flex items-center justify-center shrink-0">
                    <Truck size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-[11px] font-black text-slate-800 truncate uppercase tracking-tight">
                      {order.customer?.full_name || "PEMBELI"}
                    </h4>
                    <p className="text-[10px] font-black text-[#008080]">
                      RP {order.total_price?.toLocaleString()}
                    </p>
                  </div>
                  <ArrowRight size={12} className="text-slate-300" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 5. PROMO INFO BOX */}
      <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl flex items-start gap-3">
        <div className="bg-orange-500 text-white p-2 rounded-lg shrink-0">
          <Info size={16} />
        </div>
        <div className="text-left">
          <h4 className="text-[11px] font-black text-orange-800 uppercase tracking-wide">
            Info Atur Promo
          </h4>
          <p className="text-[10px] font-bold text-orange-700/80 normal-case leading-snug">
            Anda dapat mengubah harga produk sewaktu-waktu untuk membuat promo
            kilat. Perubahan harga akan{" "}
            <span className="underline">langsung aktif</span> tanpa perlu
            verifikasi Admin.
          </p>
        </div>
      </div>

      {/* 6. TIPS SECTION */}
      {showTips && (
        <div className="bg-[#008080] p-6 md:p-8 rounded-[2rem] text-white relative overflow-hidden shadow-xl mt-4">
          <button
            onClick={() => setShowTips(false)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all z-20"
          >
            <X size={14} />
          </button>
          <div className="relative z-10">
            <h3 className="text-lg md:text-xl font-[1000] uppercase tracking-tighter mb-1">
              Tips Sukses PasarQu
            </h3>
            <p className="text-[9px] text-teal-200 font-bold tracking-[0.2em] mb-4 uppercase opacity-80">
              Rahasia Omset Meroket
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <TipItem text="RESPON CHAT DI BAWAH 5 MENIT MENINGKATKAN PENJUALAN HINGGA 80%." />
              <TipItem text="PASTIKAN STOK PRODUK SELALU UPDATE UNTUK MENJAGA RATING TOKO." />
            </div>
          </div>
          <TrendingUp
            size={120}
            className="absolute -left-10 -bottom-10 text-white opacity-5 rotate-12"
          />
        </div>
      )}
    </div>
  );
};

const TipItem = ({ text }: { text: string }) => (
  <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 flex items-start gap-2">
    <CheckCircle2 size={12} className="text-[#FF6600] shrink-0 mt-0.5" />
    <p className="text-[9px] font-bold leading-relaxed text-white uppercase tracking-tight">
      {text}
    </p>
  </div>
);

const QuickActionBtn = ({ icon, label, color, onClick, note }: any) => (
  <button
    onClick={onClick}
    className={`${color} flex flex-col items-center justify-center gap-1.5 p-3 md:p-5 rounded-2xl shadow-sm active:scale-90 transition-all relative overflow-hidden group`}
  >
    <div className="relative z-10">{icon}</div>
    <span className="relative z-10 text-[9px] md:text-[11px] font-black uppercase tracking-widest">
      {label}
    </span>
    {note && (
      <span className="absolute top-1 right-1 bg-orange-500 text-white text-[7px] px-1 rounded-sm font-black uppercase tracking-tighter">
        {note}
      </span>
    )}
  </button>
);

const StatCard = ({ icon, label, value, color, bgColor, alert }: any) => (
  <div
    className={`${bgColor} p-4 rounded-2xl border flex flex-col gap-3 shadow-sm transition-all hover:translate-y-[-2px]`}
  >
    <div className="flex justify-between items-start">
      <div className={`${color} opacity-80`}>{icon}</div>
      {alert && (
        <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span>
      )}
    </div>
    <div>
      <p className="text-[18px] md:text-2xl font-[1000] text-slate-800 leading-none tracking-tighter">
        {value}
      </p>
      <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
        {label}
      </p>
    </div>
  </div>
);
