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
  Store,
  ChevronRight,
  Gift,
  Coins,
  Clock,
} from "lucide-react";

import { MobileLayout } from "../../components/layout/MobileLayout";

export const CustomerDashboard = () => {
  const authContext = useAuth() as any;
  const { showToast } = useToast();
  const navigate = useNavigate();

  if (!authContext) {
    return <div className="min-h-screen bg-[#F8FAFC]"></div>;
  }

  const { user, profile, logout } = authContext;

  const [stats, setStats] = useState({
    unpaid: 0,
    packing: 0,
    delivering: 0,
    reviewable: 0,
  });
  const [activeOrder, setActiveOrder] = useState<any>(null); // 🚀 LIVE TRACKER STATE
  const [loading, setLoading] = useState(false);

  const avatarUrl = profile?.avatar_url
    ? supabase.storage.from("avatars").getPublicUrl(profile.avatar_url)?.data
        ?.publicUrl
    : null;

  useEffect(() => {
    if (user?.id) fetchOrderStats();
  }, [user]);

  const fetchOrderStats = async () => {
    setLoading(true);
    try {
      const { data: orders, error } = await supabase
        .from("orders")
        .select("id, status, shipping_status, total_price, created_at")
        .eq("customer_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (orders && orders.length > 0) {
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

        // 🚀 CARI 1 PESANAN TERAKHIR YANG SEDANG AKTIF UNTUK LIVE TRACKER
        const ongoingOrder = orders.find(
          (o: any) =>
            o.shipping_status !== "COMPLETED" && o.status !== "CANCELLED",
        );
        setActiveOrder(ongoingOrder || null);
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
      navigate("/login");
    } catch (error) {
      showToast("GAGAL KELUAR", "error");
    }
  };

  // 🚀 JEMBATAN TRANSPORTER MODE TOKO
  const handleReturnToShop = () => {
    sessionStorage.removeItem("app_mode");
    if (profile?.is_verified === true) {
      navigate("/merchant-dashboard");
    } else {
      navigate("/waiting-approval");
    }
  };

  return (
    <MobileLayout
      activeTab="account"
      onTabChange={(tab: string) => {
        if (tab === "home") navigate("/");
        if (tab === "search") navigate("/search");
        if (tab === "orders") navigate("/order-history");
        if (tab === "mitra") {
          sessionStorage.removeItem("app_mode");
          navigate("/merchant-dashboard");
        }
      }}
      onSearch={() => {}}
      onCartClick={() => navigate("/checkout")}
      cartCount={0}
    >
      <div className="min-h-screen bg-[#F1F5F9] text-slate-900 pb-32 text-left font-sans selection:bg-[#008080] selection:text-white">
        {/* 🚀 HEADER STICKY */}
        <div className="sticky top-0 z-[100] bg-white border-b border-slate-200 shadow-sm w-full h-[60px] flex items-center">
          <div className="max-w-[1200px] w-full mx-auto px-4 flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-md transition-all active:scale-90"
            >
              <ArrowLeft size={24} strokeWidth={2.5} />
            </button>
            <h1 className="text-[14px] font-[1000] uppercase tracking-[0.2em] text-slate-800">
              MEMBER HUB
            </h1>
            <button
              onClick={() => navigate("/settings/address")}
              className="p-2 text-slate-600 hover:text-[#FF6600] rounded-md transition-all active:scale-90"
            >
              <Settings size={22} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        <div className="max-w-[1200px] mx-auto px-4 pt-6 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* 🚀 KOLOM KIRI: PROFIL & HARTA */}
            <div className="lg:col-span-1 space-y-4">
              {/* KARTU PROFIL VIP */}
              <div className="bg-slate-900 rounded-2xl p-6 shadow-xl relative overflow-hidden border-b-8 border-[#FF6600]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none"></div>
                <div className="relative z-10 flex items-center gap-4 mb-5">
                  <div className="w-16 h-16 bg-slate-800 rounded-xl overflow-hidden border-2 border-slate-700 flex items-center justify-center shrink-0 shadow-inner">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        className="w-full h-full object-cover"
                        alt="Profile"
                      />
                    ) : (
                      <User size={32} className="text-slate-400" />
                    )}
                  </div>
                  <div className="text-left leading-none flex-1">
                    <h1 className="text-[16px] font-[1000] text-white mb-2 uppercase truncate">
                      {profile?.full_name || profile?.name || "MEMBER PASARQU"}
                    </h1>
                    <div className="flex gap-2">
                      <span className="bg-yellow-400/20 text-yellow-400 text-[9px] px-2 py-1 rounded border border-yellow-400/30 font-black uppercase flex items-center gap-1">
                        <Star size={10} fill="currentColor" /> GOLD MEMBER
                      </span>
                    </div>
                  </div>
                </div>

                {/* GAMIFIKASI LEVEL */}
                <div className="relative z-10 bg-white/5 p-3 rounded-xl border border-white/10">
                  <div className="flex justify-between text-[9px] font-black tracking-widest text-slate-400 mb-2">
                    <span className="text-yellow-500">GOLD</span>
                    <span>PLATINUM</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-2 shadow-inner">
                    <div className="bg-gradient-to-r from-yellow-600 to-yellow-400 w-[65%] h-full rounded-full"></div>
                  </div>
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">
                    Belanja Rp 150.000 lagi untuk naik level!
                  </p>
                </div>
              </div>

              {/* BRANKAS HARTA (DOMPET, POIN, VOUCHER) */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-[11px] font-black text-slate-800 tracking-widest uppercase flex items-center gap-2">
                    <Wallet size={16} className="text-[#008080]" /> Saldo &
                    Benefit
                  </h3>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                        Saldo PasarQu Pay
                      </p>
                      <h2 className="text-[18px] font-black text-slate-800 leading-none">
                        RP{" "}
                        {Number(profile?.balance || 0).toLocaleString("id-ID")}
                      </h2>
                    </div>
                    <button className="px-3 py-1.5 bg-[#FF6600] text-white rounded-lg text-[9px] font-black uppercase tracking-widest active:scale-95 shadow-sm">
                      TOP UP
                    </button>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-1 bg-orange-50 p-3 rounded-xl border border-orange-100 flex flex-col justify-center">
                      <p className="text-[9px] font-bold text-orange-600/70 uppercase tracking-widest mb-1 flex items-center gap-1">
                        <Coins size={12} /> Poin
                      </p>
                      <h3 className="text-[14px] font-black text-orange-600">
                        {profile?.points || "1.250"}
                      </h3>
                    </div>
                    <div
                      className="flex-1 bg-teal-50 p-3 rounded-xl border border-teal-100 flex flex-col justify-center cursor-pointer hover:bg-teal-100 transition-colors"
                      onClick={() => showToast("Fitur Segera Hadir", "info")}
                    >
                      <p className="text-[9px] font-bold text-teal-600/70 uppercase tracking-widest mb-1 flex items-center gap-1">
                        <TicketPercent size={12} /> Voucher
                      </p>
                      <h3 className="text-[14px] font-black text-[#008080]">
                        3 Aktif
                      </h3>
                    </div>
                  </div>
                </div>
              </div>

              {/* 🚀 JEMBATAN TRANSPORTER KE TOKO */}
              {profile?.role === "MERCHANT" && (
                <button
                  onClick={handleReturnToShop}
                  className="w-full bg-gradient-to-r from-teal-800 to-[#008080] p-4 rounded-2xl flex items-center justify-between group active:scale-95 transition-all shadow-lg border border-teal-700 relative overflow-hidden"
                >
                  <div className="absolute right-0 top-0 opacity-10">
                    <Store size={80} />
                  </div>
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="w-10 h-10 bg-white/20 text-white rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                      <Store size={18} />
                    </div>
                    <div className="text-left">
                      <h3 className="text-[13px] font-[1000] text-white uppercase tracking-wide">
                        KEMBALI KE TOKO
                      </h3>
                      <p className="text-[9px] text-teal-200 font-bold tracking-widest uppercase">
                        Kelola Produk & Pesanan
                      </p>
                    </div>
                  </div>
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-sm relative z-10">
                    <ChevronRight size={16} />
                  </div>
                </button>
              )}
            </div>

            {/* 🚀 KOLOM KANAN: LIVE TRACKER & MENU */}
            <div className="lg:col-span-2 space-y-4">
              {/* LIVE TRACKER PESANAN AKTIF */}
              {activeOrder && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="bg-[#FF6600] px-4 py-2 flex justify-between items-center">
                    <span className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                      <Clock size={12} className="animate-pulse" /> LIVE TRACKER
                      PESANAN
                    </span>
                    <span className="text-[9px] font-bold text-orange-100 uppercase">
                      ID: #{activeOrder.id.slice(0, 8).toUpperCase()}
                    </span>
                  </div>
                  <div className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-[#FF6600]">
                        <Truck size={24} />
                      </div>
                      <div>
                        <h3 className="text-[14px] font-black text-slate-800 uppercase leading-none mb-1">
                          Pesanan{" "}
                          {activeOrder.shipping_status === "SHIPPING"
                            ? "Sedang Dikirim"
                            : "Sedang Diproses"}
                        </h3>
                        <p className="text-[11px] font-bold text-slate-400">
                          Total: Rp {activeOrder.total_price?.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate("/order-history")}
                      className="px-4 py-2 border-2 border-slate-200 text-slate-600 text-[10px] font-black rounded-xl uppercase hover:border-[#008080] hover:text-[#008080] transition-colors"
                    >
                      Lacak
                    </button>
                  </div>
                </div>
              )}

              {/* STATUS PIPELINE PESANAN */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="text-[12px] font-[1000] text-slate-800 tracking-widest uppercase">
                    AKTIVITAS PESANAN
                  </h3>
                  {loading && (
                    <RefreshCw
                      size={14}
                      className="animate-spin text-slate-400"
                    />
                  )}
                </div>

                <div className="p-6 flex justify-between items-center gap-2 relative">
                  {/* Garis konektor */}
                  <div className="absolute top-1/2 left-10 right-10 h-[2px] bg-slate-100 -translate-y-4 z-0 hidden md:block"></div>

                  <StatusNode
                    icon={<Wallet size={20} />}
                    count={stats.unpaid}
                    label="Belum Bayar"
                    onClick={() => navigate("/order-history")}
                  />
                  <StatusNode
                    icon={<Package size={20} />}
                    count={stats.packing}
                    label="Dikemas"
                    onClick={() => navigate("/order-history")}
                  />
                  <StatusNode
                    icon={<Truck size={20} />}
                    count={stats.delivering}
                    label="Dikirim"
                    onClick={() => navigate("/order-history")}
                  />
                  <StatusNode
                    icon={<MessageSquare size={20} />}
                    count={stats.reviewable}
                    label="Beri Ulasan"
                    onClick={() => navigate("/order-history")}
                  />
                </div>
              </div>

              {/* SMART MENU LIST */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <MenuRow
                  icon={<ShoppingBag size={18} />}
                  label="Riwayat Pesanan Lengkap"
                  onClick={() => navigate("/order-history")}
                />
                <MenuRow
                  icon={<Gift size={18} />}
                  label="Voucher & Promo"
                  onClick={() => showToast("Fitur Segera Hadir", "info")}
                />
                <MenuRow
                  icon={<MapPin size={18} />}
                  label="Buku Alamat Pengiriman"
                  onClick={() => navigate("/settings/address")}
                />
                <MenuRow
                  icon={<Bell size={18} />}
                  label="Notifikasi & Chat"
                  onClick={() => showToast("Fitur Segera Hadir", "info")}
                />
              </div>

              {/* TOMBOL LOGOUT SAFETY */}
              <button
                onClick={handleLogout}
                className="w-full mt-4 p-4 rounded-2xl border-2 border-red-100 text-red-500 flex items-center justify-center gap-2 font-black text-[11px] uppercase tracking-widest hover:bg-red-50 active:scale-95 transition-all"
              >
                <LogOut size={16} /> KELUAR DARI AKUN
              </button>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center opacity-40 gap-2 pb-6">
            <ShieldCheck size={28} className="text-slate-400" />
            <p className="text-[9px] font-black tracking-[0.3em] uppercase text-slate-500 text-center">
              DILINDUNGI OLEH
              <br />
              PASARQU SECURITY NODE &copy; 2026
            </p>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
};

// --- SUB COMPONENTS ---

const StatusNode = ({
  icon,
  count,
  label,
  onClick,
}: {
  icon: any;
  count: number;
  label: string;
  onClick: () => void;
}) => (
  <div
    onClick={onClick}
    className="flex flex-col items-center gap-2 cursor-pointer group active:scale-90 transition-all z-10 w-16 md:w-20"
  >
    <div
      className={`relative w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-300 ${count > 0 ? "bg-teal-50 border-2 border-[#008080] text-[#008080] shadow-md scale-110" : "bg-white border-2 border-slate-200 text-slate-400 group-hover:border-[#008080] group-hover:text-[#008080]"}`}
    >
      {icon}
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-[#FF6600] text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
          {count}
        </span>
      )}
    </div>
    <span
      className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest text-center leading-tight transition-colors ${count > 0 ? "text-[#008080]" : "text-slate-500 group-hover:text-[#008080]"}`}
    >
      {label}
    </span>
  </div>
);

const MenuRow = ({
  icon,
  label,
  onClick,
}: {
  icon: any;
  label: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="w-full flex items-center justify-between p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 active:bg-slate-100 transition-colors group"
  >
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center group-hover:bg-teal-50 group-hover:text-[#008080] transition-colors">
        {icon}
      </div>
      <span className="text-[12px] font-[1000] text-slate-700 uppercase tracking-wide group-hover:text-[#008080] transition-colors">
        {label}
      </span>
    </div>
    <ChevronRight
      size={16}
      className="text-slate-300 group-hover:text-[#008080] transition-colors"
    />
  </button>
);

export default CustomerDashboard;
