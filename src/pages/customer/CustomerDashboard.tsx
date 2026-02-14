import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import {
  User,
  Wallet,
  ShoppingBag,
  MapPin,
  Heart,
  Lock,
  LogOut,
  ChevronRight,
  Package,
  Truck,
  Star,
  MessageCircle,
  Headset,
  Settings,
  Bell,
  TicketPercent,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export const CustomerDashboard = () => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ unpaid: 2, packing: 1, delivering: 5 });

  const handleLogout = async () => {
    if (window.confirm("Keluar dari aplikasi?")) {
      await logout();
      navigate("/");
    }
  };

  return (
    // Wrapper Utama: bg-slate-50 untuk kesan bersih
    <div className="min-h-screen bg-[#f1f5f9] font-sans text-left">
      {/* Container Responsif: max-w-4xl (Desktop) & w-full (Mobile) */}
      <div className="max-w-4xl mx-auto bg-white min-h-screen shadow-2xl shadow-slate-200">
        {/* HEADER AREA (Profil & Saldo) */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 md:p-10 rounded-b-[2.5rem] md:rounded-b-[4rem] text-white relative overflow-hidden">
          <div className="relative z-10 flex items-center justify-between mb-8">
            <div className="flex items-center gap-4 md:gap-6">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-teal-500 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center text-white text-2xl font-black shadow-lg border-2 border-white/20">
                {profile?.full_name?.charAt(0) || "U"}
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight leading-none">
                  {profile?.full_name || "Pembeli Satu"}
                </h2>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="px-3 py-1 bg-yellow-400 text-slate-900 text-[8px] md:text-[9px] font-black rounded-full uppercase tracking-widest flex items-center gap-1">
                    <Star size={10} fill="currentColor" /> Gold Member
                  </span>
                  <span className="px-3 py-1 bg-white/10 text-white text-[8px] md:text-[9px] font-black rounded-full uppercase tracking-widest">
                    1.250 Poin
                  </span>
                </div>
              </div>
            </div>
            <button className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-all">
              <Settings size={20} />
            </button>
          </div>

          {/* CARD SALDO & DOMPET */}
          <div className="relative z-10 bg-white/10 backdrop-blur-md rounded-[2rem] p-6 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Wallet size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase opacity-60 tracking-widest">
                  Saldo Anda
                </p>
                <h3 className="text-2xl font-black tracking-tighter">
                  Rp450.000
                </h3>
              </div>
            </div>
            <button className="text-[10px] font-black bg-white text-slate-900 px-4 py-2 rounded-xl uppercase tracking-widest hover:bg-teal-400 transition-all">
              Top Up
            </button>
          </div>

          {/* Aksesoris Visual Background */}
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-teal-500/20 rounded-full blur-3xl"></div>
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="p-4 md:p-8 -mt-6 relative z-20 space-y-6">
          {/* PESANAN SAYA (GRID STATUS) */}
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

          {/* TOMBOL CS (KUNING STABILO) */}
          <section>
            <button
              onClick={() => navigate("/messages")}
              className="w-full bg-yellow-400 p-6 rounded-[2.5rem] flex items-center justify-between shadow-xl shadow-yellow-200/50 active:scale-[0.98] transition-all border-4 border-white"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg">
                  <Headset size={28} />
                </div>
                <div className="text-left">
                  <h4 className="font-black text-slate-900 uppercase text-sm leading-none tracking-tight">
                    Layanan Chat Bantuan
                  </h4>
                  <p className="text-[10px] font-bold text-slate-800/60 uppercase mt-1">
                    Solusi Cepat Tanya Toko & Kurir
                  </p>
                </div>
              </div>
              <div className="w-10 h-10 bg-white/40 rounded-full flex items-center justify-center">
                <ChevronRight size={20} className="text-slate-900" />
              </div>
            </button>
          </section>

          {/* MENU GRID LAINNYA */}
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

          {/* ACTION BUTTONS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <button
              onClick={() => navigate("/")}
              className="w-full py-5 bg-teal-600 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-[0.2em] shadow-lg shadow-teal-100 active:scale-95 transition-all"
            >
              Mulai Belanja Lagi
            </button>
            <button
              onClick={handleLogout}
              className="w-full py-5 bg-white text-red-500 border border-red-100 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.2em] active:scale-95 transition-all"
            >
              Keluar Aplikasi
            </button>
          </div>

          <p className="text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.5em] pt-6">
            PasarQu v2.0.26
          </p>
        </div>
      </div>
    </div>
  );
};

// --- SUB-KOMPONEN STATUS ---
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

// --- SUB-KOMPONEN MENU ---
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
