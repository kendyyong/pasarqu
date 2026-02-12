import React from "react";
import { Store, Truck, Package, DollarSign } from "lucide-react";

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
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in">
      <StatCard
        label="Produk Pending"
        value={stats.pendingProducts}
        icon={<Package />}
        color="bg-orange-500"
      />
      <StatCard
        label="Mitra Toko"
        value={stats.merchants}
        icon={<Store />}
        color="bg-blue-600"
      />
      <StatCard
        label="Mitra Kurir"
        value={stats.couriers}
        icon={<Truck />}
        color="bg-indigo-600"
      />
      <StatCard
        label="Profit Wilayah"
        value={`Rp ${stats.adminShare.toLocaleString()}`}
        icon={<DollarSign />}
        color="bg-teal-600"
      />
    </div>
  );
};

const StatCard = ({ label, value, icon, color }: any) => (
  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:scale-[1.02] transition-all">
    <div
      className={`w-12 h-12 ${color} bg-opacity-10 ${color.replace(
        "bg-",
        "text-",
      )} flex items-center justify-center rounded-2xl mb-6 shadow-sm`}
    >
      {icon}
    </div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
      {label}
    </p>
    <h3 className="text-2xl font-black text-slate-800 tracking-tighter">
      {value}
    </h3>
  </div>
);
