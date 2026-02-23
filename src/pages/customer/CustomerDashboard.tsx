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
  RefreshCw,
  Package,
  Truck,
  MessageSquare,
  ArrowLeft,
} from "lucide-react";

import { MobileLayout } from "../../components/layout/MobileLayout";

// --- TYPE DEFINITIONS ---
interface StatusItemProps {
  icon: React.ReactNode;
  count: number;
  label: string;
  color: string;
  bgColor: string;
  onClick: () => void;
}

interface DashboardTileProps {
  icon: React.ReactNode;
  label: string;
  sub: string;
  color: string;
  bgColor: string;
  onClick: () => void;
}

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
  const [loading, setLoading] = useState(false);

  const avatarUrl = profile?.avatar_url
    ? supabase.storage.from("avatars").getPublicUrl(profile.avatar_url).data
        .publicUrl
    : null;

  useEffect(() => {
    if (user) fetchOrderStats();
  }, [user]);

  const fetchOrderStats = async () => {
    setLoading(true);
    try {
      const { data: orders, error } = await supabase
        .from("orders")
        .select("status, shipping_status")
        .eq("customer_id", user?.id);

      if (error) throw error;

      if (orders) {
        setStats({
          unpaid: orders.filter((o: any) => o.status === "UNPAID").length,
          packing: orders.filter(
            (o: any) =>
              o.shipping_status === "PACKING" ||
              o.shipping_status === "READY_TO_PICKUP",
          ).length,
          delivering: orders.filter(
            (o: any) =>
              o.shipping_status === "SHIPPING" ||
              o.shipping_status === "DELIVERING",
          ).length,
          reviewable: orders.filter(
            (o: any) => o.shipping_status === "COMPLETED",
          ).length,
        });
      }
    } catch (err) {
      console.error("Gagal memuat stats:", err);
    } finally {
      setLoading(false);
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
      /** 🚀 FIX: Mengubah "portal" menjadi "account"
       * agar tab "SAYA" terlihat aktif di navigasi bawah.
       */
      activeTab="account"
      onTabChange={(tab: string) => {
        if (tab === "home") navigate("/");
        if (tab === "search") navigate("/search");
        if (tab === "orders") navigate("/order-history");
        if (tab === "mitra") navigate("/portal"); // Mengarah ke Portal Mitra
      }}
      onSearch={() => {}}
      onCartClick={() => navigate("/checkout")}
      cartCount={0}
    >
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 tracking-tighter pb-32 text-left not-italic font-black">
        {/* --- TOP BAR --- */}
        <div className="sticky top-0 z-[100] bg-[#008080] shadow-md w-full h-16 flex items-center">
          <div className="max-w-[1200px] w-full mx-auto px-4 flex items-center">
            <button
              onClick={() => navigate("/")}
              className="hidden md:flex p-2 bg-white/10 text-white hover:bg-white/20 rounded-md transition-all active:scale-90 mr-3"
            >
              <ArrowLeft size={24} strokeWidth={3} />
            </button>
            <h1 className="text-[14px] font-[1000] uppercase tracking-[0.1em] text-white flex-1 text-center md:text-left">
              PROFIL SAYA
            </h1>
          </div>
        </div>

        {/* --- MAIN CONTENT --- */}
        <div className="max-w-[1200px] mx-auto px-4 pt-5">
          {/* PROFILE CARD */}
          <div className="bg-white border border-slate-200 rounded-md p-5 mb-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-slate-50 rounded-md overflow-hidden border-2 border-slate-100 flex items-center justify-center shrink-0 shadow-inner">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    className="w-full h-full object-cover"
                    alt="Profile"
                  />
                ) : (
                  <User size={32} className="text-slate-300" />
                )}
              </div>
              <div className="text-left leading-none">
                <h1 className="text-[14px] font-[1000] text-[#008080] mb-2 uppercase">
                  {profile?.full_name || "PENGGUNA BARU"}
                </h1>
                <div className="flex gap-2">
                  <span className="bg-teal-50 text-[#008080] text-[10px] px-2 py-1 rounded-md border border-teal-100 font-black uppercase flex items-center gap-1">
                    <ShieldCheck
                      size={12}
                      fill="currentColor"
                      className="opacity-30"
                    />
                    VERIFIED
                  </span>
                  <span className="bg-orange-50 text-[#FF6600] text-[10px] px-2 py-1 rounded-md border border-orange-100 font-black uppercase flex items-center gap-1">
                    <Star size={12} fill="currentColor" /> MEMBER
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate("/settings/address")}
              className="p-3 bg-slate-50 text-slate-400 hover:text-[#FF6600] rounded-md transition-all border border-slate-100 active:scale-95 shadow-sm"
            >
              <Settings size={22} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* SALDO CARD */}
            <div className="bg-white p-6 rounded-md shadow-sm border border-slate-200 flex flex-col justify-between min-h-[150px] relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12">
                <Wallet size={100} />
              </div>
              <div className="flex justify-between items-center mb-5 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-teal-50 text-[#008080] rounded-md">
                    <Wallet size={20} />
                  </div>
                  <span className="text-[12px] font-black text-slate-400 tracking-widest uppercase">
                    SALDO AKTIF
                  </span>
                </div>
                <span className="text-[12px] font-black text-[#008080] uppercase tracking-widest">
                  PAY
                </span>
              </div>
              <h2 className="text-[28px] font-[1000] font-sans leading-none uppercase mb-5 relative z-10 tracking-tighter">
                RP {(profile?.balance || 0).toLocaleString()}
              </h2>
              <button className="w-full py-4 bg-[#FF6600] text-white rounded-md text-[12px] font-black active:scale-95 transition-all uppercase tracking-widest shadow-md">
                TOP UP SALDO
              </button>
            </div>

            {/* STATUS PESANAN CARD */}
            <div className="md:col-span-2 bg-white rounded-md shadow-sm border border-slate-200 flex flex-col overflow-hidden">
              <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center px-6">
                <h3 className="text-[12px] font-black text-slate-400 tracking-widest uppercase">
                  STATUS PESANAN
                </h3>
                <div className="flex items-center gap-2 text-[#008080] bg-white px-2 py-1 rounded-md border border-slate-200">
                  {loading ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <Zap size={14} fill="currentColor" />
                  )}
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    LIVE
                  </span>
                </div>
              </div>

              <div className="p-6 flex justify-around items-center h-full gap-2">
                <StatusItem
                  icon={<Wallet size={24} />}
                  count={stats.unpaid}
                  label="BELUM BAYAR"
                  color="text-orange-500"
                  bgColor="bg-orange-50"
                  onClick={() => navigate("/order-history")}
                />
                <StatusItem
                  icon={<Package size={24} />}
                  count={stats.packing}
                  label="DIKEMAS"
                  color="text-[#008080]"
                  bgColor="bg-teal-50"
                  onClick={() => navigate("/order-history")}
                />
                <StatusItem
                  icon={<Truck size={24} />}
                  count={stats.delivering}
                  label="DIKIRIM"
                  color="text-blue-600"
                  bgColor="bg-blue-50"
                  onClick={() => navigate("/order-history")}
                />
                <StatusItem
                  icon={<MessageSquare size={24} />}
                  count={stats.reviewable}
                  label="ULASAN"
                  color="text-purple-600"
                  bgColor="bg-purple-50"
                  onClick={() => navigate("/order-history")}
                />
              </div>
            </div>
          </div>

          {/* MENU GRID TILES */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            <DashboardTile
              icon={<ShoppingBag size={24} />}
              label="DAFTAR PESANAN"
              sub="RIWAYAT"
              color="text-[#008080]"
              bgColor="bg-teal-50"
              onClick={() => navigate("/order-history")}
            />
            <DashboardTile
              icon={<TicketPercent size={24} />}
              label="VOUCHER SAYA"
              sub="DISKON"
              color="text-[#FF6600]"
              bgColor="bg-orange-50"
              onClick={() => showToast("FITUR SEGERA HADIR", "info")}
            />
            <DashboardTile
              icon={<MapPin size={24} />}
              label="BUKU ALAMAT"
              sub="LOKASI PENGIRIMAN"
              color="text-red-600"
              bgColor="bg-red-50"
              onClick={() => navigate("/settings/address")}
            />
            <DashboardTile
              icon={<Bell size={24} />}
              label="NOTIFIKASI"
              sub="PESAN MASUK"
              color="text-blue-600"
              bgColor="bg-blue-50"
              onClick={() => showToast("FITUR SEGERA HADIR", "info")}
            />

            <button
              onClick={handleLogout}
              className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 rounded-md hover:bg-red-50 group transition-all h-[130px] shadow-sm active:scale-95"
            >
              <div className="p-4 bg-red-50 text-red-600 rounded-md mb-3 group-hover:bg-red-600 group-hover:text-white transition-all shadow-sm">
                <LogOut size={24} />
              </div>
              <p className="text-[12px] font-black text-slate-800 uppercase tracking-widest">
                KELUAR
              </p>
            </button>
          </div>

          {/* SECURITY FOOTER */}
          <div className="mt-12 flex flex-col items-center opacity-30 gap-2 pb-10">
            <ShieldCheck size={36} className="text-slate-400" />
            <p className="text-[10px] font-black tracking-[0.3em] uppercase">
              DILINDUNGI OLEH PASARQU SECURITY NODE &copy; 2026
            </p>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
};

// --- KOMPONEN KECIL ---

const StatusItem: React.FC<StatusItemProps> = ({
  icon,
  count,
  label,
  color,
  bgColor,
  onClick,
}) => (
  <div
    onClick={onClick}
    className="flex flex-col items-center gap-3 cursor-pointer group active:scale-90 transition-all flex-1"
  >
    <div
      className={`relative p-4 ${bgColor} ${color} rounded-md shadow-sm flex items-center justify-center w-full max-w-[60px] group-hover:shadow-md transition-all`}
    >
      {icon}
      {count > 0 && (
        <span className="absolute -top-2 -right-2 bg-[#FF6600] text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
          {count}
        </span>
      )}
    </div>
    <span className="text-[10px] font-black text-slate-600 uppercase tracking-tight text-center leading-none group-hover:text-[#008080] transition-colors">
      {label}
    </span>
  </div>
);

const DashboardTile: React.FC<DashboardTileProps> = ({
  icon,
  label,
  sub,
  color,
  bgColor,
  onClick,
}) => (
  <button
    onClick={onClick}
    className="bg-white p-4 rounded-md border border-slate-200 shadow-sm hover:border-[#008080] transition-all flex flex-col items-center text-center group h-[130px] justify-center active:scale-95"
  >
    <div
      className={`p-4 ${bgColor} ${color} rounded-md mb-3 group-hover:scale-110 transition-transform shadow-sm`}
    >
      {icon}
    </div>
    <p className="text-[12px] font-black text-slate-800 uppercase leading-none mb-1">
      {label}
    </p>
    <p className="text-[9px] text-slate-400 font-black tracking-widest uppercase">
      {sub}
    </p>
  </button>
);
