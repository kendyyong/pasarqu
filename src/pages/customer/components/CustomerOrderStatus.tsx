import React from "react";
import { ShoppingBag, Wallet, Package, Truck, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface OrderStatusProps {
  stats: { unpaid: number; packing: number; delivering: number };
}

export const CustomerOrderStatus: React.FC<OrderStatusProps> = ({ stats }) => {
  const navigate = useNavigate();

  return (
    <section className="bg-white rounded-[2.5rem] p-6 shadow-xl shadow-slate-200/50 border border-slate-50">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-800 flex items-center gap-2">
          <ShoppingBag size={14} className="text-teal-600" /> Pesanan Saya
        </h3>
        <button
          onClick={() => navigate("/orders")}
          className="text-[9px] font-black text-slate-400 uppercase hover:text-teal-600 transition-all"
        >
          Lihat Riwayat →
        </button>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <StatusItem
          icon={<Wallet size={22} />}
          label="Belum Bayar"
          count={stats.unpaid}
        />
        <StatusItem
          icon={<Package size={22} />}
          label="Kemas"
          count={stats.packing}
        />
        <StatusItem
          icon={<Truck size={22} />}
          label="Kirim"
          count={stats.delivering}
          onClick={() => navigate("/orders/delivering")}
        />
        <StatusItem icon={<Star size={22} />} label="Ulasan" />
      </div>
    </section>
  );
};

const StatusItem = ({ icon, label, count, onClick }: any) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center gap-3 group relative py-2"
  >
    <div className="relative w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center group-hover:bg-teal-50 group-hover:text-teal-600 transition-all shadow-sm">
      {icon}
      {count > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-black w-6 h-6 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
          {count}
        </span>
      )}
    </div>
    <p className="text-[9px] font-black text-slate-500 uppercase tracking-tighter group-hover:text-teal-700">
      {label}
    </p>
  </button>
);
