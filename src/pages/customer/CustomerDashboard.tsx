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
  AlertTriangle,
  Ban,
  X,
  ShieldCheck,
  ShoppingBasket,
  Bike, // 🚀 TAMBAHAN IMPORT
  ArrowRight, // 🚀 TAMBAHAN IMPORT
} from "lucide-react";

import { MobileLayout } from "../../components/layout/MobileLayout";

export const CustomerDashboard = () => {
  const authContext = useAuth() as any;
  const { showToast } = useToast();
  const navigate = useNavigate();

  if (!authContext) return <div className="min-h-screen bg-[#F8FAFC]"></div>;

  const { user, profile, logout } = authContext;
  const [stats, setStats] = useState({
    unpaid: 0,
    packing: 0,
    delivering: 0,
    reviewable: 0,
  });
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [latestCanceledOrder, setLatestCanceledOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // 🚀 STATE PINTAR: Menyimpan data order per kategori
  const [categorizedOrders, setCategorizedOrders] = useState({
    unpaid: [] as any[],
    packing: [] as any[],
    delivering: [] as any[],
    reviewable: [] as any[],
  });

  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("dismissed_alerts") || "[]");
    } catch {
      return [];
    }
  });

  const avatarUrl = profile?.avatar_url
    ? supabase.storage.from("avatars").getPublicUrl(profile.avatar_url)?.data
        ?.publicUrl
    : null;

  useEffect(() => {
    if (user?.id) fetchOrderStats();
  }, [user, dismissedAlerts]);

  const fetchOrderStats = async () => {
    setLoading(true);
    try {
      const { data: orders, error } = await supabase
        .from("orders")
        .select(
          "id, status, shipping_status, total_price, created_at, used_balance, reviews(id)",
        )
        .eq("customer_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (orders) {
        // PENGELOMPOKAN PINTAR
        const unpaid = orders.filter(
          (o: any) =>
            (o.status === "UNPAID" || o.status === "PROCESSING") &&
            o.status !== "CANCELLED",
        );
        const packing = orders.filter(
          (o: any) =>
            (o.shipping_status === "PACKING" ||
              o.shipping_status === "READY_TO_PICKUP" ||
              o.status === "PACKING") &&
            o.status !== "CANCELLED",
        );
        const delivering = orders.filter(
          (o: any) =>
            (o.shipping_status === "SHIPPING" ||
              o.shipping_status === "DELIVERING") &&
            o.status !== "CANCELLED",
        );

        const reviewable = orders.filter(
          (o: any) =>
            (o.shipping_status === "COMPLETED" || o.status === "COMPLETED") &&
            (!o.reviews || o.reviews.length === 0),
        );

        setCategorizedOrders({ unpaid, packing, delivering, reviewable });
        setStats({
          unpaid: unpaid.length,
          packing: packing.length,
          delivering: delivering.length,
          reviewable: reviewable.length,
        });

        const ongoing = orders.filter(
          (o: any) =>
            o.shipping_status !== "COMPLETED" &&
            o.status !== "COMPLETED" &&
            o.status !== "CANCELLED",
        );
        setActiveOrders(ongoing);

        const canceled = orders.filter(
          (o: any) =>
            o.status === "CANCELLED" && !dismissedAlerts.includes(o.id),
        );
        setLatestCanceledOrder(canceled.length > 0 ? canceled[0] : null);
      }
    } catch (err) {
      console.error("Gagal tarik data dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`db_buyer_realtime_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `customer_id=eq.${user.id}`,
        },
        () => fetchOrderStats(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleLogout = async () => {
    try {
      if (logout) await logout();
      else await supabase.auth.signOut();
      showToast("BERHASIL KELUAR", "success");
      navigate("/login");
    } catch (error) {
      showToast("GAGAL KELUAR", "error");
    }
  };

  const handleReturnToShop = () => {
    sessionStorage.removeItem("app_mode");
    if (profile?.is_verified) navigate("/merchant-dashboard");
    else navigate("/waiting-approval");
  };

  // 🚀 FUNGSI KEMBALI KE MODE KURIR
  const handleReturnToCourier = () => {
    sessionStorage.removeItem("app_mode");
    navigate("/courier-dashboard");
  };

  const handleDismissAlert = (e: React.MouseEvent, orderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const newDismissed = [...dismissedAlerts, orderId];
    setDismissedAlerts(newDismissed);
    localStorage.setItem("dismissed_alerts", JSON.stringify(newDismissed));
    setLatestCanceledOrder(null);
  };

  const getStepForOrder = (order: any) => {
    if (
      order.shipping_status === "SHIPPING" ||
      order.shipping_status === "DELIVERING"
    )
      return 2;
    if (
      order.status === "PACKING" ||
      order.shipping_status === "PACKING" ||
      order.shipping_status === "READY_TO_PICKUP"
    )
      return 1;
    return 0;
  };

  const handleSmartNavigation = (
    category: "unpaid" | "packing" | "delivering" | "reviewable",
  ) => {
    const targets = categorizedOrders[category];
    if (targets && targets.length > 0) {
      navigate(`/track-order/${targets[0].id}`);
    } else {
      navigate("/order-history");
    }
  };

  return (
    <MobileLayout
      activeTab="account"
      onTabChange={(tab: string) => {
        if (tab === "home") navigate("/");
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
      <div className="min-h-screen bg-[#F1F5F9] text-slate-900 pb-32 text-left font-sans font-black uppercase tracking-tighter not-italic">
        {/* HEADER */}
        <div className="sticky top-0 z-[100] bg-white border-b border-slate-200 shadow-sm w-full h-[60px] flex items-center px-4">
          <div className="max-w-[1200px] w-full mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/")}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-md active:scale-90 transition-all"
              >
                <ArrowLeft size={24} strokeWidth={3} />
              </button>
              <h1 className="text-[14px] font-black uppercase tracking-[0.2em] text-slate-800">
                MEMBER HUB
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF6600]/10 text-[#FF6600] border border-[#FF6600]/20 rounded-lg text-[10px] font-black uppercase hover:bg-[#FF6600] hover:text-white transition-all"
              >
                <ShoppingBasket size={14} /> BELANJA LAGI
              </button>
              <button
                onClick={() => navigate("/settings/profile")}
                className="p-2 text-slate-600 hover:text-[#008080] active:scale-90"
              >
                <Settings size={22} strokeWidth={3} />
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-[1200px] mx-auto px-4 pt-6 space-y-4">
          {/* BANNER ALERT BATAL */}
          {latestCanceledOrder && (
            <div
              onClick={() => navigate(`/track-order/${latestCanceledOrder.id}`)}
              className="w-full bg-red-50 border-2 border-red-500 rounded-2xl p-4 flex items-center justify-between gap-4 cursor-pointer relative animate-in slide-in-from-top-4 shadow-lg shadow-red-500/10"
            >
              <button
                onClick={(e) => handleDismissAlert(e, latestCanceledOrder.id)}
                className="absolute top-2 right-2 p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-600 hover:text-white transition-all z-20"
              >
                <X size={16} strokeWidth={4} />
              </button>
              <div className="flex items-center gap-3 pr-6">
                <div className="w-10 h-10 bg-red-500 text-white rounded-xl flex items-center justify-center shrink-0 shadow-inner">
                  <Ban size={20} />
                </div>
                <div>
                  <h3 className="text-[13px] font-black text-red-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <AlertTriangle size={14} /> PESANAN DIBATALKAN
                  </h3>
                  <p className="text-[10px] font-bold text-red-500/80 leading-snug uppercase">
                    ID: #{latestCanceledOrder.id.slice(0, 8)}.{" "}
                    {latestCanceledOrder.used_balance > 0
                      ? "DANA DIKEMBALIKAN."
                      : "CEK DETAIL."}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* KIRI: PROFIL */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-slate-900 rounded-2xl p-6 shadow-xl relative overflow-hidden border-b-8 border-[#FF6600]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl"></div>
                <div className="relative z-10 flex items-center gap-4 mb-5">
                  <div className="w-16 h-16 bg-slate-800 rounded-xl overflow-hidden border-2 border-slate-700 flex items-center justify-center">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={32} className="text-slate-400" />
                    )}
                  </div>
                  <div className="text-left leading-none flex-1 min-w-0">
                    <h1 className="text-[16px] font-black text-white mb-2 uppercase truncate">
                      {profile?.full_name || "MEMBER PASARQU"}
                    </h1>
                    <span className="bg-yellow-400/20 text-yellow-400 text-[9px] px-2 py-1 rounded border border-yellow-400/30 font-black uppercase flex items-center gap-1 w-fit">
                      <Star size={10} fill="currentColor" /> GOLD MEMBER
                    </span>
                  </div>
                </div>
                <div className="relative z-10 bg-white/5 p-3 rounded-xl border border-white/10">
                  <div className="flex justify-between text-[9px] font-black tracking-widest text-slate-400 mb-2">
                    <span>GOLD</span>
                    <span>PLATINUM</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-2 shadow-inner">
                    <div className="bg-gradient-to-r from-yellow-600 to-yellow-400 w-[65%] h-full rounded-full"></div>
                  </div>
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">
                    TINGKATKAN TERUS BELANJAMU!
                  </p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-[11px] font-black text-slate-800 tracking-widest uppercase flex items-center gap-2 mb-4">
                  <Wallet size={16} className="text-[#008080]" /> SALDO &
                  BENEFIT
                </h3>
                <div className="flex flex-col gap-3">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                        PASARQU PAY
                      </p>
                      <h2 className="text-[18px] font-black text-slate-800 leading-none truncate">
                        RP{" "}
                        {Number(profile?.balance || 0).toLocaleString("id-ID")}
                      </h2>
                    </div>
                    <button
                      onClick={() => navigate("/pasarqu-pay")}
                      className="px-3 py-1.5 bg-[#FF6600] text-white rounded-lg text-[9px] font-black uppercase tracking-widest active:scale-95 shadow-sm"
                    >
                      TOP UP
                    </button>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1 bg-orange-50 p-3 rounded-xl border border-orange-100 flex flex-col justify-center">
                      <p className="text-[9px] font-bold text-orange-600/70 uppercase tracking-widest mb-1 flex items-center gap-1">
                        <Coins size={12} /> POIN
                      </p>
                      <h3 className="text-[14px] font-black text-orange-600">
                        {profile?.points || "1.250"}
                      </h3>
                    </div>
                    <div
                      className="flex-1 bg-teal-50 p-3 rounded-xl border border-teal-100 flex flex-col justify-center cursor-pointer hover:bg-teal-100 transition-colors"
                      onClick={() => showToast("Segera Hadir", "info")}
                    >
                      <p className="text-[9px] font-bold text-teal-600/70 uppercase tracking-widest mb-1 flex items-center gap-1">
                        <TicketPercent size={12} /> VOUCHER
                      </p>
                      <h3 className="text-[14px] font-black text-[#008080]">
                        3 AKTIF
                      </h3>
                    </div>
                  </div>
                </div>
              </div>

              {/* 🚀 TOMBOL SAKTI UNTUK MERCHANT */}
              {profile?.role?.toUpperCase() === "MERCHANT" && (
                <button
                  onClick={handleReturnToShop}
                  className="w-full mt-2 bg-gradient-to-r from-teal-800 to-[#008080] p-4 rounded-2xl flex items-center justify-between group active:scale-95 shadow-lg border border-teal-700 relative overflow-hidden transition-all"
                >
                  <div className="absolute right-0 top-0 opacity-10">
                    <Store size={80} />
                  </div>
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="w-10 h-10 bg-white/20 text-white rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                      <Store size={18} />
                    </div>
                    <div className="text-left">
                      <h3 className="text-[13px] font-black text-white uppercase tracking-wide leading-none mb-1">
                        KEMBALI KE TOKO
                      </h3>
                      <p className="text-[9px] text-teal-200 font-bold tracking-widest uppercase">
                        KELOLA PRODUK & PESANAN
                      </p>
                    </div>
                  </div>
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-sm relative z-10">
                    <ChevronRight size={16} />
                  </div>
                </button>
              )}

              {/* 🚀 TOMBOL SAKTI UNTUK KURIR */}
              {(profile?.role?.toLowerCase() === "courier" ||
                profile?.role?.toUpperCase() === "COURIER") && (
                <button
                  onClick={handleReturnToCourier}
                  className="w-full mt-2 bg-gradient-to-r from-slate-900 to-slate-800 border-2 border-[#FF6600] p-4 rounded-2xl flex items-center justify-between group active:scale-95 shadow-xl shadow-[#FF6600]/20 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#FF6600]/20 rounded-xl flex items-center justify-center border border-[#FF6600]/30">
                      <Bike size={20} className="text-[#FF6600]" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-[13px] font-black text-white uppercase tracking-wide leading-none mb-1">
                        MODE DRIVER
                      </h3>
                      <p className="text-[9px] text-slate-400 font-bold tracking-widest uppercase">
                        KEMBALI CARI CUAN HARI INI!
                      </p>
                    </div>
                  </div>
                  <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-[#FF6600] group-hover:translate-x-1 transition-transform">
                    <ArrowRight size={16} />
                  </div>
                </button>
              )}
            </div>

            {/* KANAN: ADAPTIVE TRACKER */}
            <div className="lg:col-span-2 space-y-6">
              {/* MODE 1: SINGLE ORDER TIMELINE */}
              {activeOrders.length === 1 && (
                <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
                  <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-[12px] font-black text-slate-800 tracking-widest uppercase flex items-center gap-2">
                      <Zap size={14} className="text-[#FF6600]" /> AKTIVITAS
                      TRANSAKSI
                    </h3>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      LIVE RADAR
                    </span>
                  </div>
                  <div className="p-8 flex justify-between items-center gap-2 relative">
                    <div className="absolute top-1/2 left-10 right-10 h-[2px] bg-slate-100 -translate-y-4 z-0 hidden md:block"></div>

                    <StatusNode
                      icon={<Wallet size={20} />}
                      count={stats.unpaid}
                      label="Bayar"
                      isActive={getStepForOrder(activeOrders[0]) === 0}
                      onClick={() => handleSmartNavigation("unpaid")}
                    />
                    <StatusNode
                      icon={<Package size={20} />}
                      count={stats.packing}
                      label="Kemas"
                      isActive={getStepForOrder(activeOrders[0]) === 1}
                      onClick={() => handleSmartNavigation("packing")}
                    />
                    <StatusNode
                      icon={<Truck size={20} />}
                      count={stats.delivering}
                      label="Kirim"
                      isActive={getStepForOrder(activeOrders[0]) === 2}
                      onClick={() => handleSmartNavigation("delivering")}
                    />
                    <StatusNode
                      icon={<MessageSquare size={20} />}
                      count={stats.reviewable}
                      label="Ulasan"
                      onClick={() => handleSmartNavigation("reviewable")}
                    />
                  </div>
                  <div
                    className="p-4 bg-orange-50 border-t border-orange-100 flex items-center justify-between cursor-pointer group hover:bg-orange-100 transition-colors"
                    onClick={() =>
                      navigate(`/track-order/${activeOrders[0].id}`)
                    }
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-[#FF6600] shadow-sm">
                        <ShoppingBag size={16} />
                      </div>
                      <div>
                        <p className="text-[11px] font-black text-slate-800 uppercase truncate">
                          #{activeOrders[0].id.slice(0, 8)} - LACAK LOKASI PAKET
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      size={16}
                      className="text-[#FF6600] group-hover:translate-x-1 transition-transform"
                    />
                  </div>
                </section>
              )}

              {/* MODE 2: MULTI-ORDER LIST SUSUN */}
              {activeOrders.length > 1 && (
                <section className="space-y-3 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <Clock
                        size={14}
                        className="text-[#FF6600] animate-pulse"
                      />
                      <h3 className="text-[12px] font-black text-slate-800 tracking-widest uppercase">
                        PESANAN BERJALAN ({activeOrders.length})
                      </h3>
                    </div>
                    <span className="text-[9px] font-black text-teal-600 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                      RADAR AKTIF
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {activeOrders.map((order) => (
                      <div
                        key={order.id}
                        onClick={() => navigate(`/track-order/${order.id}`)}
                        className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden cursor-pointer hover:border-[#008080] transition-all group"
                      >
                        <div className="bg-slate-50 px-4 py-2 flex justify-between border-b border-slate-100">
                          <span className="text-[10px] font-black text-slate-500 uppercase">
                            #{order.id.slice(0, 8)}
                          </span>
                          <span className="text-[9px] font-black text-[#FF6600] uppercase flex items-center gap-1">
                            <Zap size={10} fill="currentColor" />{" "}
                            {order.shipping_status === "SHIPPING"
                              ? "DIANTAR KURIR"
                              : "DIPROSES TOKO"}
                          </span>
                        </div>
                        <div className="p-4 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-[#FF6600] shrink-0 border border-orange-100 group-hover:bg-[#FF6600] group-hover:text-white transition-all">
                              {order.status === "PACKING" ? (
                                <Package size={24} />
                              ) : (
                                <Truck size={24} />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="text-[14px] font-black text-slate-800 uppercase truncate mb-1 leading-none">
                                {order.shipping_status === "SHIPPING"
                                  ? "PAKET DI JALAN"
                                  : "SEDANG DIKEMAS"}
                              </h3>
                              <p className="text-[10px] font-bold text-slate-400 truncate uppercase">
                                TOTAL: RP{" "}
                                {order.total_price?.toLocaleString("id-ID")}
                              </p>
                            </div>
                          </div>
                          <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center group-hover:bg-[#008080] shadow-md transition-all">
                            <ChevronRight size={20} strokeWidth={3} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* MODE 3: SUMMARY IDLE (0 PESANAN AKTIF) */}
              {activeOrders.length === 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-[12px] font-black text-slate-800 tracking-widest uppercase">
                      RINGKASAN AKTIVITAS
                    </h3>
                    {loading && (
                      <RefreshCw
                        size={14}
                        className="animate-spin text-slate-400"
                      />
                    )}
                  </div>
                  <div className="p-6 flex justify-between items-center gap-2 relative">
                    <div className="absolute top-1/2 left-10 right-10 h-[2px] bg-slate-100 -translate-y-4 z-0 hidden md:block"></div>

                    <StatusNode
                      icon={<Wallet size={20} />}
                      count={stats.unpaid}
                      label="Bayar"
                      onClick={() => handleSmartNavigation("unpaid")}
                    />
                    <StatusNode
                      icon={<Package size={20} />}
                      count={stats.packing}
                      label="Kemas"
                      onClick={() => handleSmartNavigation("packing")}
                    />
                    <StatusNode
                      icon={<Truck size={20} />}
                      count={stats.delivering}
                      label="Kirim"
                      onClick={() => handleSmartNavigation("delivering")}
                    />
                    <StatusNode
                      icon={<MessageSquare size={20} />}
                      count={stats.reviewable}
                      label="Ulasan"
                      onClick={() => handleSmartNavigation("reviewable")}
                    />
                  </div>
                </div>
              )}

              {/* LIST MENU SMART */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <MenuRow
                  icon={<ShoppingBag size={18} />}
                  label="Riwayat Pesanan Lengkap"
                  onClick={() => navigate("/order-history")}
                />
                <button
                  onClick={() => showToast("Fitur Chat Segera Hadir", "info")}
                  className="w-full flex items-center justify-between p-4 border-b border-slate-100 hover:bg-slate-50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center group-hover:bg-red-50 group-hover:text-red-500 transition-all">
                      <Bell size={18} />
                      {latestCanceledOrder && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                      )}
                    </div>
                    <span className="text-[12px] font-black text-slate-700 uppercase tracking-wide group-hover:text-red-600">
                      Notifikasi & Peringatan
                    </span>
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-slate-300 group-hover:text-red-500"
                  />
                </button>
                <MenuRow
                  icon={<Gift size={18} />}
                  label="Voucher & Promo"
                  onClick={() => showToast("Segera Hadir", "info")}
                />
                <MenuRow
                  icon={<MapPin size={18} />}
                  label="Buku Alamat Pengiriman"
                  onClick={() => navigate("/settings/address")}
                />
              </div>

              <button
                onClick={handleLogout}
                className="w-full mt-4 p-4 rounded-2xl border-2 border-red-100 text-red-500 flex items-center justify-center gap-2 font-black text-[11px] uppercase tracking-widest hover:bg-red-50 active:scale-95 transition-all shadow-sm"
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

const StatusNode = ({ icon, count, label, onClick, isActive }: any) => (
  <div
    onClick={onClick}
    className="flex flex-col items-center gap-2 cursor-pointer group active:scale-90 transition-all z-10 w-16 md:w-20"
  >
    <div
      className={`relative w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-300 ${count > 0 ? "bg-teal-50 border-2 border-[#008080] text-[#008080] shadow-md scale-110" : "bg-white border-2 border-slate-200 text-slate-400 group-hover:border-[#008080] group-hover:text-[#008080]"} ${isActive ? "ring-4 ring-[#008080]/10 animate-pulse border-[#008080]" : ""}`}
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

const MenuRow = ({ icon, label, onClick }: any) => (
  <button
    onClick={onClick}
    className="w-full flex items-center justify-between p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 active:bg-slate-100 transition-colors group"
  >
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center group-hover:bg-teal-50 group-hover:text-[#008080] transition-colors">
        {icon}
      </div>
      <span className="text-[12px] font-black text-slate-700 uppercase tracking-wide group-hover:text-[#008080] transition-colors">
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
