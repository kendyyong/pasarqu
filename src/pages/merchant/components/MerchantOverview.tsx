import React, { useState } from "react";
import {
  TrendingUp,
  Package,
  ShoppingBag,
  ArrowRight,
  Clock,
  LayoutDashboard,
  Star,
  Wallet,
  PlusCircle,
  Megaphone,
  Headset,
  X,
  MapPin,
  Truck,
  CheckCircle2,
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

  // Format Tanggal Hari Ini
  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const omzetHariIni = stats.todayOmzet || 0;
  const pesananTertunda = stats.pendingOrders || stats.orders || 0;

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-700 text-left font-sans pb-20 font-black uppercase tracking-tighter">
      {/* 1. HERO BANNER */}
      <div className="bg-slate-900 rounded-xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden shadow-xl border-b-8 border-[#FF6600]">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <LayoutDashboard size={14} className="text-[#008080]" />
            <p className="text-[10px] text-slate-400 tracking-[0.2em]">
              RINGKASAN TOKO • {today}
            </p>
          </div>
          <h1 className="text-3xl md:text-4xl text-white leading-none mb-1">
            {merchantProfile?.shop_name || "JURAGAN PASAR"}
          </h1>
          <div className="flex items-center gap-2 mt-4">
            <div
              className={`px-4 py-1.5 rounded-md text-[10px] tracking-widest flex items-center gap-2 shadow-sm ${merchantProfile?.is_shop_open ? "bg-[#008080] text-white" : "bg-red-500 text-white"}`}
            >
              <div
                className={`w-2 h-2 rounded-full animate-pulse ${merchantProfile?.is_shop_open ? "bg-white" : "bg-red-200"}`}
              ></div>
              {merchantProfile?.is_shop_open ? "TOKO BUKA" : "TOKO TUTUP"}
            </div>
            {merchantProfile?.is_verified && (
              <span className="px-3 py-1.5 bg-blue-500 text-white rounded-md text-[9px] tracking-widest flex items-center gap-1 shadow-sm">
                <CheckCircle2 size={12} /> MITRA RESMI
              </span>
            )}
          </div>
        </div>

        <div className="relative z-10 bg-white/10 backdrop-blur-md p-5 rounded-md border border-white/10 w-full md:w-auto text-right">
          <p className="text-[10px] text-slate-300 tracking-[0.2em] mb-1">
            OMSET HARI INI
          </p>
          <div className="flex items-center justify-end gap-2">
            <span className="text-[#FF6600]">RP</span>
            <h2 className="text-4xl text-white leading-none">
              {omzetHariIni.toLocaleString()}
            </h2>
          </div>
        </div>

        <Wallet
          size={200}
          className="absolute -right-10 -bottom-10 text-white opacity-5"
        />
      </div>

      {/* 2. QUICK ACTIONS */}
      <div className="grid grid-cols-3 gap-3">
        <QuickActionBtn
          icon={<PlusCircle size={20} />}
          label="TAMBAH PRODUK"
          color="bg-[#008080] text-white hover:bg-teal-700"
          onClick={() => onNavigate?.("products")}
        />
        <QuickActionBtn
          icon={<Megaphone size={20} />}
          label="ATUR PROMO"
          color="bg-white border-2 border-slate-200 text-slate-700 hover:border-[#FF6600] hover:text-[#FF6600]"
          onClick={() => onNavigate?.("products")}
        />
        <QuickActionBtn
          icon={<Headset size={20} />}
          label="BANTUAN ADMIN"
          color="bg-white border-2 border-slate-200 text-slate-700 hover:border-[#008080] hover:text-[#008080]"
          onClick={() => window.open("https://wa.me/628123456789", "_blank")}
        />
      </div>

      {/* 3. METRIK UTAMA */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<ShoppingBag size={20} />}
          label="PERLU DIKIRIM"
          value={pesananTertunda}
          color={pesananTertunda > 0 ? "text-red-600" : "text-slate-700"}
          bgColor={
            pesananTertunda > 0
              ? "bg-red-50 border-red-200"
              : "bg-slate-50 border-slate-200"
          }
          alert={pesananTertunda > 0}
        />
        <StatCard
          icon={<Package size={20} />}
          label="TOTAL PRODUK"
          value={stats.products}
          color="text-[#008080]"
          bgColor="bg-teal-50 border-teal-100"
        />
        <StatCard
          icon={<Star size={20} />}
          label="RATING TOKO"
          value="4.9"
          color="text-orange-600"
          bgColor="bg-orange-50 border-orange-100"
        />
        <StatCard
          icon={<TrendingUp size={20} />}
          label="PERFORMA"
          value="100%"
          color="text-blue-600"
          bgColor="bg-blue-50 border-blue-100"
        />
      </div>

      {/* 4. AREA TENGAH: GRAFIK & LIVE TRACKER */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white border-2 border-slate-100 p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[12px] text-slate-800 tracking-widest flex items-center gap-2">
              <TrendingUp size={16} className="text-[#008080]" /> ANALISA
              PENJUALAN
            </h3>
            <span className="text-[9px] bg-slate-100 text-slate-500 px-3 py-1 rounded-md">
              7 HARI TERAKHIR
            </span>
          </div>
          <div className="h-52 bg-slate-50 border-2 border-dashed border-slate-200 rounded-md flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-white rounded-md flex items-center justify-center shadow-sm mb-3">
              <TrendingUp size={20} className="text-slate-300" />
            </div>
            <p className="text-[10px] text-slate-400 tracking-widest leading-relaxed max-w-[200px]">
              DATA GRAFIK AKAN TERISI SETELAH TRANSAKSI PERDANA
            </p>
          </div>
        </div>

        <div className="bg-white border-2 border-slate-100 p-6 rounded-xl shadow-sm flex flex-col h-full">
          <div className="flex justify-between items-center mb-6 border-b-2 border-slate-50 pb-4">
            <h3 className="text-[12px] text-slate-800 tracking-widest flex items-center gap-2">
              <Clock size={16} className="text-[#FF6600]" /> LIVE ORDERS
            </h3>
            {recentOrders.length > 0 && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto pr-2 no-scrollbar space-y-4">
            {recentOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full opacity-50">
                <ShoppingBag size={40} className="text-slate-300 mb-3" />
                <p className="text-[10px] text-slate-400 tracking-widest text-center">
                  BELUM ADA
                  <br />
                  PESANAN BARU
                </p>
              </div>
            ) : (
              recentOrders.slice(0, 4).map((order, idx) => (
                <div
                  key={idx}
                  className="flex gap-3 items-start border-l-2 border-slate-100 pl-3"
                >
                  <div
                    className={`mt-0.5 w-6 h-6 rounded-md flex items-center justify-center shrink-0 shadow-sm ${order.status === "UNPAID" ? "bg-orange-100 text-orange-600" : "bg-teal-100 text-[#008080]"}`}
                  >
                    {order.status === "UNPAID" ? (
                      <Wallet size={10} />
                    ) : (
                      <Truck size={10} />
                    )}
                  </div>
                  <div>
                    <h4 className="text-[11px] text-slate-800 leading-tight">
                      {order.customer?.full_name ||
                        order.customer?.name ||
                        "PEMBELI"}
                    </h4>
                    <p className="text-[9px] text-slate-400 tracking-widest mt-0.5 flex items-center gap-1">
                      <MapPin size={8} className="text-[#FF6600]" />{" "}
                      {order.address?.split(",")[0] || "LOKASI"}
                    </p>
                    <p className="text-[10px] text-[#008080] mt-1">
                      RP {order.total_price?.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <button
            onClick={() => onNavigate?.("orders")}
            className="w-full mt-4 py-3 bg-slate-50 text-slate-500 rounded-md border border-slate-200 text-[10px] tracking-widest hover:bg-slate-100 hover:text-slate-800 transition-colors"
          >
            LIHAT SEMUA PESANAN
          </button>
        </div>
      </div>

      {/* 5. TIPS SECTION */}
      {showTips && (
        <div className="bg-[#008080] p-8 rounded-xl text-white relative overflow-hidden shadow-xl border-b-8 border-teal-900 mt-8">
          <button
            onClick={() => setShowTips(false)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-md transition-colors z-20"
          >
            <X size={16} />
          </button>

          <div className="absolute -top-10 -left-10 opacity-10 blur-sm pointer-events-none">
            <TrendingUp size={250} />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1">
              <h3 className="text-2xl leading-none mb-2">
                TIPS SUKSES PASARQU
              </h3>
              <p className="text-[10px] text-teal-200 tracking-[0.2em] mb-6">
                RAHASIA OMSET MEROKET SETIAP HARI
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white/10 backdrop-blur-md rounded-md border border-white/20 hover:bg-white/20 transition-all">
                  <p className="text-[11px] text-teal-100 mb-1 flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-[#FF6600]" /> RESPON
                    CEPAT
                  </p>
                  <p className="text-[10px] leading-relaxed text-white">
                    MEMBALAS CHAT DI BAWAH 5 MENIT MENINGKATKAN POTENSI DEAL
                    HINGGA 80%.
                  </p>
                </div>
                <div className="p-4 bg-white/10 backdrop-blur-md rounded-md border border-white/20 hover:bg-white/20 transition-all">
                  <p className="text-[11px] text-teal-100 mb-1 flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-[#FF6600]" /> UPDATE
                    STOK
                  </p>
                  <p className="text-[10px] leading-relaxed text-white">
                    PASTIKAN STOK SELALU UPDATE UNTUK MENGHINDARI PEMBATALAN
                    PESANAN YANG MERUSAK RATING.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- SUB-COMPONENTS ---
const QuickActionBtn = ({ icon, label, color, onClick }: any) => (
  <button
    onClick={onClick}
    className={`p-4 rounded-md flex flex-col items-center justify-center gap-2 transition-all active:scale-95 shadow-sm ${color}`}
  >
    {icon}
    <span className="text-[9px] tracking-[0.2em] text-center leading-tight">
      {label}
    </span>
  </button>
);

const StatCard = ({ icon, label, value, color, bgColor, alert }: any) => (
  <div
    className={`border-2 p-5 rounded-md flex flex-col gap-4 shadow-sm relative overflow-hidden transition-all hover:scale-[1.02] ${bgColor}`}
  >
    <div className="flex justify-between items-start">
      <div
        className={`w-12 h-12 bg-white rounded-md flex items-center justify-center shadow-inner ${color}`}
      >
        {icon}
      </div>
      {alert && (
        <span className="flex h-3 w-3 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-md bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-md h-3 w-3 bg-red-500"></span>
        </span>
      )}
    </div>
    <div>
      <p className="text-[9px] text-slate-500 tracking-[0.2em] mb-1">{label}</p>
      <p className={`text-2xl leading-none ${color}`}>{value}</p>
    </div>
  </div>
);
