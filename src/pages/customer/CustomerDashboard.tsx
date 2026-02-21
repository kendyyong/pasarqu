import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { useNavigate } from "react-router-dom";
import {
  User,
  ShoppingBag,
  Wallet,
  Zap,
  TicketPercent,
  MapPin,
  Bell,
  LogOut,
  ShieldCheck,
  Star,
  Settings,
} from "lucide-react";

import { MobileLayout } from "../../components/layout/MobileLayout";
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
    if (user) fetchOrderStats();
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
      console.error(err);
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
    <MobileLayout
      activeTab="account"
      onTabChange={(tab) => {
        if (tab === "home") navigate("/");
        if (tab === "search") navigate("/search");
        if (tab === "orders") navigate("/order-history");
      }}
      onSearch={() => {}}
      onCartClick={() => navigate("/checkout")}
      cartCount={0}
    >
      <div className="min-h-screen bg-[#F1F5F9] text-slate-900 font-black uppercase tracking-tighter pb-10 text-left">
        <div className="max-w-7xl mx-auto px-2 pt-0">
          {/* PROFILE CARD: MEPET KE TOP BAR */}
          <div className="bg-white border-x border-b border-slate-200 rounded-b-xl p-3 mb-2 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-50 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center shrink-0">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    className="w-full h-full object-cover"
                    alt="User"
                  />
                ) : (
                  <User size={24} className="text-slate-300" />
                )}
              </div>
              <div className="text-left leading-none">
                <h1 className="text-[14px] font-black text-[#008080] mb-1.5 uppercase">
                  {profile?.name || "PENGGUNA PASARQU"}
                </h1>
                <div className="flex gap-1">
                  <span className="bg-teal-50 text-[#008080] text-[8px] px-1.5 py-0.5 rounded border border-teal-100 font-black uppercase leading-none">
                    <ShieldCheck size={8} className="inline mr-1" /> VERIFIED
                  </span>
                  <span className="bg-orange-50 text-[#FF6600] text-[8px] px-1.5 py-0.5 rounded border border-orange-100 font-black uppercase leading-none">
                    <Star
                      size={8}
                      fill="currentColor"
                      className="inline mr-1"
                    />{" "}
                    GOLD
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate("/settings")}
              className="p-2 bg-slate-50 text-slate-400 hover:text-[#FF6600] rounded-lg transition-all border border-slate-100 active:scale-95 shadow-sm"
            >
              <Settings size={18} />
            </button>
          </div>

          {/* GRID UTAMA (HYBRID) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between min-h-[110px]">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-teal-50 text-[#008080] rounded-lg">
                    <Wallet size={18} />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase leading-none">
                    SALDO
                  </span>
                </div>
                <span className="text-[12px] font-black text-[#008080] uppercase leading-none">
                  PASARQU PAY
                </span>
              </div>
              <h2 className="text-[20px] font-black leading-none uppercase mb-3">
                RP 1.250.000
              </h2>
              <button className="w-full py-2.5 bg-[#FF6600] text-white rounded-lg text-[12px] font-black active:scale-95 transition-all uppercase tracking-widest leading-none">
                ISI SALDO
              </button>
            </div>

            <div className="md:col-span-1 lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
              <div className="bg-slate-50 p-2 border-b border-slate-100 flex justify-between items-center px-4">
                <h3 className="text-[10px] font-black text-slate-400 tracking-widest uppercase text-left leading-none">
                  AKTIVITAS PESANAN
                </h3>
                <div className="flex items-center gap-1 text-[#008080] animate-pulse">
                  <Zap size={10} fill="currentColor" />
                  <span className="text-[9px] font-black leading-none uppercase">
                    LIVE DATA
                  </span>
                </div>
              </div>
              <div className="p-2 h-full flex items-center">
                <div className="w-full">
                  <CustomerOrderStatus stats={stats} />
                </div>
              </div>
            </div>
          </div>

          {/* MENU TILES */}
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            <DashboardTile
              icon={<ShoppingBag size={20} />}
              label="PESANAN SAYA"
              sub="RIWAYAT"
              color="text-[#008080]"
              bgColor="bg-teal-50"
              onClick={() => navigate("/order-history")}
            />
            <DashboardTile
              icon={<TicketPercent size={20} />}
              label="PROMO VOUCHER"
              sub="DISKON"
              color="text-[#FF6600]"
              bgColor="bg-orange-50"
              onClick={() => showToast("VOUCHER AKTIF", "info")}
            />
            <DashboardTile
              icon={<MapPin size={20} />}
              label="ALAMAT"
              sub="PENGIRIMAN"
              color="text-red-600"
              bgColor="bg-red-50"
              onClick={() => navigate("/settings/address")}
            />
            <DashboardTile
              icon={<Bell size={20} />}
              label="NOTIFIKASI"
              sub="INFO UPDATE"
              color="text-blue-600"
              bgColor="bg-blue-50"
              onClick={() => navigate("/notifications")}
            />
            <button
              onClick={handleLogout}
              className="flex flex-col items-center justify-center p-4 bg-red-50 border border-red-100 rounded-xl hover:bg-red-600 group transition-all h-[110px] shadow-sm"
            >
              <div className="p-2.5 bg-white rounded-lg text-red-600 mb-2 group-hover:scale-110 transition-transform shadow-sm">
                <LogOut size={20} />
              </div>
              <p className="text-[12px] font-black text-red-600 group-hover:text-white leading-none uppercase">
                KELUAR
              </p>
            </button>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
};

const DashboardTile = ({ icon, label, sub, color, bgColor, onClick }: any) => (
  <button
    onClick={onClick}
    className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-[#008080] transition-all flex flex-col items-center text-center group h-[110px] justify-center"
  >
    <div
      className={`p-3 ${bgColor} ${color} rounded-lg mb-2 group-hover:scale-110 transition-transform duration-300`}
    >
      {icon}
    </div>
    <p className="text-[12px] font-black text-slate-800 leading-tight mb-1 uppercase text-center">
      {label}
    </p>
    <p className="text-[8px] text-slate-400 font-bold tracking-widest uppercase leading-none text-center">
      {sub}
    </p>
  </button>
);
