import React from "react";
import { TicketPercent, MapPin, Heart, Lock, ChevronRight } from "lucide-react";

export const CustomerMenuGrid: React.FC = () => {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm">
        <MenuItem
          icon={<TicketPercent size={20} />}
          label="Voucher Saya"
          sub="4 Voucher aktif"
          color="bg-orange-50 text-orange-600"
        />
        <MenuItem
          icon={<MapPin size={20} />}
          label="Daftar Alamat"
          sub="Muara Jawa, Ilir"
          color="bg-blue-50 text-blue-600"
        />
      </div>
      <div className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm">
        <MenuItem
          icon={<Heart size={20} />}
          label="Produk Favorit"
          sub="12 Disukai"
          color="bg-red-50 text-red-600"
        />
        <MenuItem
          icon={<Lock size={20} />}
          label="Keamanan Akun"
          sub="Update Password"
          color="bg-slate-50 text-slate-600"
        />
      </div>
    </section>
  );
};

const MenuItem = ({ icon, label, sub, color }: any) => (
  <button className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-all border-b border-slate-50 last:border-0">
    <div className="flex items-center gap-4">
      <div
        className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center shadow-sm`}
      >
        {icon}
      </div>
      <div className="text-left">
        <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">
          {label}
        </h4>
        <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
          {sub}
        </p>
      </div>
    </div>
    <ChevronRight size={16} className="text-slate-200" />
  </button>
);
