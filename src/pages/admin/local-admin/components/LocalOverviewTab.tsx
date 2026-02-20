import React from "react";
import { Store, Truck, Package, DollarSign, ArrowUpRight } from "lucide-react";

interface Props {
  stats: {
    pendingProducts: number;
    merchants: number;
    couriers: number;
    adminShare: number;
  };
}

export const LocalOverviewTab: React.FC<Props> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-500 font-black uppercase tracking-tighter text-left">
      <StatCard
        label="PRODUK PENDING"
        value={stats.pendingProducts}
        icon={<Package size={20} />}
        iconColor="text-[#FF6600]"
        isAlert={stats.pendingProducts > 0}
      />
      <StatCard
        label="MITRA TOKO"
        value={stats.merchants}
        icon={<Store size={20} />}
        iconColor="text-[#008080]"
      />
      <StatCard
        label="MITRA KURIR"
        value={stats.couriers}
        icon={<Truck size={20} />}
        iconColor="text-slate-900"
      />
      <StatCard
        label="PROFIT WILAYAH"
        value={`RP ${stats.adminShare.toLocaleString()}`}
        icon={<DollarSign size={20} />}
        iconColor="text-[#008080]"
      />
    </div>
  );
};

const StatCard = ({ label, value, icon, iconColor, isAlert }: any) => (
  // 🚩 Garis keliling (border) dan garis bawah (border-b) sudah dihapus total
  <div className="bg-white p-6 rounded-md shadow-sm relative overflow-hidden group hover:bg-slate-50 transition-all">
    <div className="flex justify-between items-start mb-4">
      <div
        className={`w-10 h-10 bg-slate-100 ${iconColor} flex items-center justify-center rounded-md shadow-inner group-hover:bg-slate-900 group-hover:text-white transition-all`}
      >
        {icon}
      </div>
      {isAlert && (
        <span className="flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-[#FF6600] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF6600]"></span>
        </span>
      )}
    </div>

    <div className="space-y-1">
      <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest leading-none">
        {label}
      </p>
      <div className="flex items-baseline justify-between">
        <h3 className="text-xl font-black text-slate-900 tracking-tighter leading-none">
          {value}
        </h3>
        <ArrowUpRight
          size={14}
          className="text-slate-200 group-hover:text-slate-900 transition-colors"
        />
      </div>
    </div>

    {/* DECORATION */}
    <div className="absolute -right-2 -bottom-2 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
      {icon}
    </div>
  </div>
);
