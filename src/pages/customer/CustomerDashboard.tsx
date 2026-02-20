import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { useNavigate } from "react-router-dom";
import {
  User,
  Settings,
  LogOut,
  ChevronRight,
  ShieldCheck,
  CreditCard,
  MapPin,
  Bell,
  ShoppingBag,
} from "lucide-react";
import { CustomerOrderStatus } from "./components/CustomerOrderStatus";

export const CustomerDashboard = () => {
  const { user, profile, logout } = useAuth() as any;
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    unpaid: 0,
    packing: 0,
    delivering: 0,
    reviewable: 0,
  });

  useEffect(() => {
    if (user) {
      fetchOrderStats();
    }
  }, [user]);

  const fetchOrderStats = async () => {
    try {
      const { data: orders, error } = await supabase
        .from("orders")
        .select("status, shipping_status")
        .eq("customer_id", user?.id);

      if (error) throw error;

      const newStats = {
        unpaid: orders.filter((o) => o.status === "UNPAID").length,
        packing: orders.filter((o) => o.shipping_status === "PACKING").length,
        delivering: orders.filter((o) => o.shipping_status === "SHIPPING")
          .length,
        reviewable: orders.filter((o) => o.shipping_status === "COMPLETED")
          .length,
      };

      setStats(newStats);
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const handleLogout = async () => {
    try {
      if (logout) {
        await logout();
      } else {
        await supabase.auth.signOut();
      }
      showToast("BERHASIL KELUAR", "success");
      navigate("/");
    } catch (error) {
      showToast("GAGAL KELUAR", "error");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-black uppercase tracking-tighter pb-10">
      {/* HEADER PROFIL */}
      <section className="bg-white p-3 md:p-6 border-b border-slate-100 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <div className="w-14 h-14 md:w-16 md:h-16 bg-teal-600 rounded-xl flex items-center justify-center text-white shadow-md overflow-hidden border-2 border-white shrink-0">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={24} />
            )}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <h2 className="text-[14px] md:text-[16px] font-black leading-tight truncate">
              {profile?.name || "PENGGUNA PASAR"}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[9px] bg-teal-50 text-teal-600 px-1.5 py-0.5 rounded border border-teal-100 font-bold flex items-center gap-0.5 uppercase">
                <ShieldCheck size={10} /> VERIFIED
              </span>
              <span className="text-[10px] text-slate-400 font-sans font-bold lowercase truncate italic">
                {user?.email}
              </span>
            </div>
          </div>
          <button
            onClick={() => navigate("/settings")}
            className="p-1.5 bg-slate-50 rounded-lg hover:bg-slate-100 transition-all border border-slate-100"
          >
            <Settings size={18} className="text-slate-500" />
          </button>
        </div>
      </section>

      {/* STATUS PESANAN */}
      <div className="max-w-6xl mx-auto px-1 mt-1 text-left">
        <CustomerOrderStatus stats={stats} />
      </div>

      {/* MENU UTAMA - DITAMBAHKAN PESANAN SAYA */}
      <main className="max-w-6xl mx-auto p-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
        {/* ✅ TOMBOL BARU: RIWAYAT PESANAN */}
        <MenuButton
          icon={<ShoppingBag className="text-teal-600" size={16} />}
          label="PESANAN SAYA"
          sub="RIWAYAT & STATUS BELANJA"
          onClick={() => navigate("/order-history")}
        />

        <MenuButton
          icon={<MapPin className="text-red-500" size={16} />}
          label="ALAMAT SAYA"
          sub="LOKASI PENGIRIMAN"
          onClick={() => navigate("/settings/address")}
        />
        <MenuButton
          icon={<CreditCard className="text-blue-500" size={16} />}
          label="PEMBAYARAN"
          sub="METODE PEMBAYARAN"
          onClick={() => showToast("SEGERA HADIR!", "info")}
        />
        <MenuButton
          icon={<Bell className="text-[#FF6600]" size={16} />}
          label="NOTIFIKASI"
          sub="PROMO & INFO STATUS"
          onClick={() => navigate("/notifications")}
        />

        {/* LOGOUT BUTTON */}
        <button
          onClick={handleLogout}
          className="w-full p-2.5 bg-red-50 border border-red-100 rounded-xl flex items-center justify-between group active:scale-95 transition-all mt-0.5"
        >
          <div className="flex items-center gap-3 text-left">
            <div className="p-1.5 bg-white rounded-lg text-red-600 shadow-sm border border-red-50">
              <LogOut size={16} />
            </div>
            <p className="text-[12px] font-black text-red-600 uppercase leading-none">
              KELUAR AKUN
            </p>
          </div>
          <ChevronRight size={14} className="text-red-200" />
        </button>
      </main>
    </div>
  );
};

const MenuButton = ({ icon, label, sub, onClick }: any) => (
  <button
    onClick={onClick}
    className="w-full p-2.5 bg-white border border-slate-100 rounded-xl flex items-center justify-between group active:scale-[0.98] transition-all shadow-sm"
  >
    <div className="flex items-center gap-3 text-left">
      <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-teal-50 transition-all border border-slate-100 group-hover:border-teal-100">
        {icon}
      </div>
      <div className="text-left leading-none">
        <p className="text-[12px] font-black text-slate-800 uppercase mb-0.5">
          {label}
        </p>
        <p className="text-[9px] text-slate-400 font-sans font-bold tracking-widest uppercase">
          {sub}
        </p>
      </div>
    </div>
    <ChevronRight
      size={14}
      className="text-slate-300 group-hover:text-teal-600 transition-all"
    />
  </button>
);
