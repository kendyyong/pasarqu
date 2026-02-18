import React from "react";
import { ShoppingBag, Wallet, Package, Truck, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface OrderStatusProps {
  stats: { unpaid: number; packing: number; delivering: number };
}

export const CustomerOrderStatus: React.FC<OrderStatusProps> = ({ stats }) => {
  const navigate = useNavigate();

  return (
    <section className="bg-white p-6 shadow-sm border border-slate-100">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-800 flex items-center gap-2">
          <ShoppingBag size={14} className="text-teal-600" /> PESANAN SAYA
        </h3>
        <button
          onClick={() => navigate("/customer-orders")}
          className="text-[9px] font-black text-slate-400 uppercase hover:text-teal-600 transition-all tracking-widest"
        >
          LIHAT RIWAYAT →
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <StatusItem
          icon={<Wallet size={22} />}
          label="Belum Bayar"
          count={stats.unpaid}
          onClick={() => navigate("/customer-orders?status=UNPAID")}
        />
        <StatusItem
          icon={<Package size={22} />}
          label="Kemas"
          count={stats.packing}
          onClick={() => navigate("/customer-orders?status=PAID")}
        />
        <StatusItem
          icon={<Truck size={22} />}
          label="Kirim"
          count={stats.delivering}
          onClick={() => navigate("/customer-orders?status=SHIPPING")}
        />
        {/* ✅ TOMBOL ULASAN SEKARANG PUNYA NAVIGASI */}
        <StatusItem
          icon={<Star size={22} />}
          label="Ulasan"
          onClick={() => navigate("/customer-orders?status=COMPLETED")}
        />
      </div>
    </section>
  );
};

const StatusItem = ({ icon, label, count, onClick }: any) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center gap-3 group relative py-2"
  >
    <div className="relative w-14 h-14 bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-teal-50 group-hover:text-teal-600 transition-all border border-slate-100">
      {icon}
      {count > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[9px] font-black w-6 h-6 flex items-center justify-center border-2 border-white shadow-md">
          {count}
        </span>
      )}
    </div>
    <p className="text-[9px] font-black text-slate-500 uppercase tracking-tighter group-hover:text-teal-700">
      {label}
    </p>
  </button>
);
