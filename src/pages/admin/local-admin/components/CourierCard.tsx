import React from "react";
import { Trophy, MessageCircle, Phone } from "lucide-react";

interface Props {
  courier: any;
  index: number;
  onChat: (c: any) => void;
}

export const CourierCard: React.FC<Props> = ({ courier, index, onChat }) => {
  const isFrozen = (courier.wallet_balance || 0) < 5000;
  const isTop = index === 0 && courier.total_orders > 0;

  return (
    <div
      className={`bg-white p-6 rounded-[2.5rem] border transition-all relative overflow-hidden ${isFrozen ? "border-red-200 bg-red-50/30 shadow-lg shadow-red-100/30" : "border-slate-100 shadow-sm hover:shadow-xl"}`}
    >
      {isTop && (
        <div className="absolute -right-1 -top-1 bg-yellow-400 text-white p-4 rounded-bl-[2rem] shadow-lg">
          <Trophy size={16} />
        </div>
      )}

      <div className="flex items-center gap-4 mb-6">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white ${isFrozen ? "bg-red-500 shadow-lg" : "bg-slate-800 shadow-lg"}`}
        >
          {(courier.name || "K").charAt(0).toUpperCase()}
        </div>
        <div>
          <h4 className="font-black text-slate-800 text-sm uppercase mb-1">
            {courier.name}
          </h4>
          <span
            className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase ${isFrozen ? "bg-red-600 text-white animate-pulse" : "bg-teal-500 text-white"}`}
          >
            {isFrozen ? "FROZEN" : "ACTIVE"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white border border-slate-50 p-4 rounded-3xl shadow-sm">
          <p className="text-[8px] font-black text-slate-400 uppercase mb-1">
            Saldo
          </p>
          <p
            className={`text-xs font-black ${isFrozen ? "text-red-600" : "text-slate-800"}`}
          >
            Rp {Number(courier.wallet_balance || 0).toLocaleString("id-ID")}
          </p>
        </div>
        <div className="bg-white border border-slate-50 p-4 rounded-3xl shadow-sm">
          <p className="text-[8px] font-black text-teal-600 uppercase mb-1">
            Performa
          </p>
          <p className="text-xs font-black text-slate-800 uppercase">
            {courier.total_orders} Order
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onChat(courier)}
          className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg ${isFrozen ? "bg-red-600 text-white hover:bg-red-700" : "bg-emerald-500 text-white hover:bg-emerald-600"}`}
        >
          <MessageCircle size={16} /> Chat WA
        </button>
        <a
          href={`tel:${courier.phone}`}
          className="p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-800 hover:text-white transition-all shadow-sm"
        >
          <Phone size={16} />
        </a>
      </div>
    </div>
  );
};
