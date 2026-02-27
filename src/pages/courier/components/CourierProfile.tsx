import React from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useAuth } from "../../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../../contexts/ToastContext";
import {
  User,
  Wallet,
  Package,
  Smartphone,
  MapPin,
  ShieldCheck,
  LogOut,
  Bike,
  Contact2, // 🚀 FIX: Mengganti IdCard menjadi Contact2
} from "lucide-react";

interface Props {
  courierData: any;
}

export const CourierProfile: React.FC<Props> = ({ courierData }) => {
  // 🚀 FIX: Menggunakan 'logout' (sesuai context Bos) bukan 'signOut'
  const { logout } = useAuth() as any;
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleLogout = async () => {
    if (!window.confirm("YAKIN INGIN MENGAKHIRI SHIFT DAN KELUAR?")) return;

    try {
      // Set status offline dulu sebelum logout
      if (courierData?.id) {
        await supabase
          .from("profiles")
          .update({ is_active: false })
          .eq("id", courierData.id);
      }

      if (logout) {
        await logout();
      } else {
        await supabase.auth.signOut();
      }

      showToast("BERHASIL KELUAR. SELAMAT ISTIRAHAT!", "success");
      navigate("/login");
    } catch (error) {
      showToast("GAGAL LOGOUT, PERIKSA KONTAK ADMIN.", "error");
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500 text-left pb-24">
      {/* CARD PROFIL UTAMA */}
      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="w-24 h-24 bg-teal-50 rounded-[2rem] mx-auto flex items-center justify-center text-teal-600 mb-6 border-4 border-white shadow-xl">
          <User size={48} />
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-black uppercase text-slate-800 tracking-tight leading-none">
            {courierData?.name || courierData?.full_name || "NAMA KURIR"}
          </h2>
          <div className="inline-flex items-center gap-1 mt-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest">
            <ShieldCheck size={12} /> Mitra Terverifikasi
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatBox
            label="Saldo Dompet"
            value={`Rp ${(courierData?.wallet_balance || 0).toLocaleString("id-ID")}`}
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

      {/* DETAIL INFO KENDARAAN & AKUN */}
      <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm space-y-2">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-2">
          Info Operasional & Akun
        </h4>

        <InfoRow
          icon={<Bike size={18} />}
          label="Tipe Kendaraan"
          value={courierData?.vehicle_type || "SEPEDA MOTOR"}
        />
        <InfoRow
          icon={<Contact2 size={18} />} // 🚀 FIX PAKAI CONTACT2
          label="Plat Nomor"
          value={
            <span className="bg-slate-100 px-2 py-1 rounded border border-slate-300 tracking-widest shadow-inner inline-block">
              {courierData?.vehicle_plate || "KT 0000 XX"}
            </span>
          }
        />
        <div className="h-[1px] bg-slate-100 w-full my-2"></div>

        <InfoRow
          icon={<Smartphone size={18} />}
          label="Nomor WhatsApp"
          value={courierData?.phone_number || "-"}
        />
        <InfoRow
          icon={<MapPin size={18} />}
          label="Area Operasi"
          value={courierData?.markets?.name || "Wilayah Belum Diset"}
        />
      </div>

      {/* TOMBOL LOGOUT AMAN */}
      <button
        onClick={handleLogout}
        className="w-full py-4 mt-2 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border-2 border-red-200 hover:border-red-600 rounded-[1.5rem] font-[1000] tracking-widest text-[13px] flex justify-center items-center gap-3 active:scale-95 transition-all shadow-sm group"
      >
        <LogOut
          size={18}
          strokeWidth={3}
          className="group-hover:animate-pulse"
        />{" "}
        KELUAR DARI APLIKASI
      </button>
    </div>
  );
};

// --- SUB COMPONENTS ---

const StatBox = ({ label, value, icon, color }: any) => (
  <div className="p-5 bg-white border border-slate-100 rounded-[1.5rem] flex items-center gap-4 shadow-sm group hover:border-teal-200 transition-all">
    <div
      className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center shadow-inner shrink-0`}
    >
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 truncate">
        {label}
      </p>
      <p className="text-sm font-black text-slate-800 truncate">{value}</p>
    </div>
  </div>
);

const InfoRow = ({ icon, label, value }: any) => (
  <div className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors">
    <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center shrink-0 border border-slate-100">
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">
        {label}
      </p>
      <div className="text-xs font-bold text-slate-700 mt-1.5 uppercase truncate">
        {value}
      </div>
    </div>
  </div>
);
