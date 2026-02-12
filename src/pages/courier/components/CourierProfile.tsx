import React from "react";
import {
  User,
  Wallet,
  Package,
  DollarSign,
  Smartphone,
  MapPin,
  ShieldCheck,
} from "lucide-react";

interface Props {
  courierData: any;
}

export const CourierProfile: React.FC<Props> = ({ courierData }) => {
  return (
    <div className="max-w-xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500 text-left">
      {/* CARD PROFIL UTAMA */}
      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="w-24 h-24 bg-teal-50 rounded-[2rem] mx-auto flex items-center justify-center text-teal-600 mb-6 border-4 border-white shadow-xl">
          <User size={48} />
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-black uppercase text-slate-800 tracking-tight leading-none">
            {courierData?.name}
          </h2>
          <div className="inline-flex items-center gap-1 mt-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest">
            <ShieldCheck size={12} /> Mitra Terverifikasi
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatBox
            label="Saldo Dompet"
            value={`Rp${courierData?.wallet_balance?.toLocaleString() || 0}`}
            icon={<Wallet size={18} />}
            color="bg-teal-50 text-teal-600"
          />
          <StatBox
            label="Total Pengiriman"
            value="0"
            icon={<Package size={18} />}
            color="bg-orange-50 text-orange-600"
          />
        </div>
      </div>

      {/* DETAIL INFO */}
      <div className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm space-y-4">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-2">
          Informasi Akun
        </h4>
        <InfoRow
          icon={<Smartphone size={16} />}
          label="Nomor WhatsApp"
          value={courierData?.phone_number}
        />
        <InfoRow
          icon={<MapPin size={16} />}
          label="Area Operasi"
          value={courierData?.markets?.name || "Wilayah Belum Diset"}
        />
      </div>
    </div>
  );
};

const StatBox = ({ label, value, icon, color }: any) => (
  <div className="p-5 bg-white border border-slate-100 rounded-3xl flex items-center gap-4 shadow-sm group hover:border-teal-200 transition-all">
    <div
      className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center shadow-inner`}
    >
      {icon}
    </div>
    <div>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
        {label}
      </p>
      <p className="text-sm font-black text-slate-800">{value}</p>
    </div>
  </div>
);

const InfoRow = ({ icon, label, value }: any) => (
  <div className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
    <div className="text-slate-400">{icon}</div>
    <div>
      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">
        {label}
      </p>
      <p className="text-xs font-bold text-slate-700 mt-1">{value}</p>
    </div>
  </div>
);
