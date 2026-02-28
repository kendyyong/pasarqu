import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../lib/supabaseClient";
import { useAuth } from "../../../contexts/AuthContext";
import { useToast } from "../../../contexts/ToastContext";
import { MobileLayout } from "../../../components/layout/MobileLayout";
import {
  ShoppingBag,
  ChevronRight,
  Store,
  PackageX,
  Loader2,
  ArrowLeft,
  Ban,
  Trash2,
  Search,
} from "lucide-react";

// 🚀 KOMPONEN SKELETON BERLOGO PASARQU
const OrderSkeleton = () => (
  <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm animate-pulse">
    {/* Header Skeleton */}
    <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-50">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-slate-200 rounded-full"></div>
        <div className="w-24 h-3.5 bg-slate-200 rounded-full"></div>
      </div>
      <div className="w-16 h-5 bg-slate-100 rounded-md"></div>
    </div>

    {/* Body Skeleton dengan Logo Bos */}
    <div className="flex gap-3 mb-4">
      {/* 🚀 KOTAK GAMBAR DENGAN LOGO TRANSLUCENT */}
      <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center shrink-0 border border-slate-50 overflow-hidden">
        <img
          src="/logo.png" // Pastikan file logo.png ada di folder public
          alt="Loading..."
          className="w-10 h-10 opacity-30 object-contain grayscale"
        />
      </div>

      {/* Garis Teks Skeleton */}
      <div className="flex-1 flex flex-col justify-center space-y-2 py-1">
        <div className="w-3/4 h-3.5 bg-slate-200 rounded-full"></div>
        <div className="w-1/2 h-3 bg-slate-100 rounded-full"></div>
        <div className="w-1/3 h-3.5 bg-slate-100 rounded-md mt-1"></div>
      </div>
    </div>

    {/* Footer Skeleton */}
    <div className="flex justify-between items-end pt-1">
      <div className="space-y-1.5">
        <div className="w-16 h-2 bg-slate-200 rounded-full"></div>
        <div className="w-24 h-4 bg-slate-200 rounded-full"></div>
      </div>
      <div className="flex gap-2">
        <div className="w-20 h-9 bg-slate-100 rounded-xl"></div>
        <div className="w-24 h-9 bg-[#008080]/10 rounded-xl"></div>
      </div>
    </div>
  </div>
);

export const OrderHistoryPage = () => {
  const { user } = useAuth() as any;
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"ALL" | "ACTIVE" | "COMPLETED">(
    "ALL",
  );

  const [hiddenOrders, setHiddenOrders] = useState<string[]>(
    JSON.parse(localStorage.getItem("hidden_orders") || "[]"),
  );

  const fetchOrders = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          id, 
          status, 
          shipping_status, 
          total_price, 
          created_at,
          market:markets(name),
          items:order_items(
            quantity, 
            price_at_purchase,
            product:products(name, image_url)
          )
        `,
        )
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
      const channel = supabase
        .channel(`buyer_orders_${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "orders",
            filter: `customer_id=eq.${user.id}`,
          },
          (payload) => {
            if (payload.new.status === "CANCELLED")
              showToast("Pesanan dibatalkan oleh toko.", "error");
            else if (payload.new.status === "PACKING")
              showToast("Pesanan sedang disiapkan toko!", "success");
            fetchOrders(true);
          },
        )
        .subscribe();
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const handleCancelOrder = async (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation();
    if (
      !window.confirm(
        "Yakin ingin membatalkan pesanan ini? Saldo akan otomatis dikembalikan.",
      )
    )
      return;
    setCancellingId(orderId);
    try {
      const { error } = await supabase.rpc("cancel_order_and_refund", {
        p_order_id: orderId,
        p_user_id: user.id,
      });
      if (error) throw error;
      showToast("Pesanan Berhasil Dibatalkan!", "success");
      fetchOrders(true);
    } catch (err: any) {
      showToast(err.message || "Gagal membatalkan pesanan.", "error");
    } finally {
      setCancellingId(null);
    }
  };

  const handleHideOrder = (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation();
    if (!window.confirm("Hapus pesanan ini dari riwayat belanja Anda?")) return;
    const updatedHidden = [...hiddenOrders, orderId];
    setHiddenOrders(updatedHidden);
    localStorage.setItem("hidden_orders", JSON.stringify(updatedHidden));
    showToast("Riwayat pesanan dihapus", "success");
  };

  const getStatusDisplay = (status: string, shippingStatus: string) => {
    const finalStatus = shippingStatus || status;
    const map: any = {
      UNPAID: {
        text: "BELUM BAYAR",
        style: "bg-slate-100 text-slate-600 border-slate-200",
      },
      PROCESSING: {
        text: "MENUNGGU TOKO",
        style: "bg-blue-50 text-blue-600 border-blue-200",
      },
      PACKING: {
        text: "DIKEMAS",
        style: "bg-orange-50 text-[#FF6600] border-orange-200",
      },
      READY_TO_PICKUP: {
        text: "SIAP DIAMBIL",
        style: "bg-orange-50 text-[#FF6600] border-orange-200",
      },
      SHIPPING: {
        text: "DIKIRIM KURIR",
        style: "bg-teal-50 text-[#008080] border-teal-200",
      },
      DELIVERING: {
        text: "MENUJU LOKASI",
        style: "bg-teal-50 text-[#008080] border-teal-200",
      },
      COMPLETED: {
        text: "SELESAI",
        style: "bg-green-50 text-green-600 border-green-200",
      },
      CANCELLED: {
        text: "DIBATALKAN",
        style: "bg-red-50 text-red-600 border-red-200",
      },
    };
    return (
      map[finalStatus] || {
        text: finalStatus,
        style: "bg-slate-100 text-slate-600 border-slate-200",
      }
    );
  };

  const filteredOrders = orders.filter((order) => {
    if (hiddenOrders.includes(order.id)) return false;
    if (activeTab === "ACTIVE")
      return order.status !== "COMPLETED" && order.status !== "CANCELLED";
    if (activeTab === "COMPLETED")
      return order.status === "COMPLETED" || order.status === "CANCELLED";
    return true;
  });

  return (
    <MobileLayout
      activeTab="orders"
      onTabChange={(tab: string) => {
        if (tab === "home") navigate("/");
        if (tab === "account") navigate("/customer-dashboard");
        if (tab === "orders") navigate("/order-history");
      }}
      onSearch={() => {}}
      onCartClick={() => {}}
      cartCount={0}
    >
      <div className="min-h-screen bg-[#F8FAFC] font-sans pb-28 text-left">
        {/* HEADER TOSCA */}
        <header className="bg-[#008080] px-4 pt-4 pb-0 sticky top-0 z-20 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/customer-dashboard")}
                className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors active:scale-90"
              >
                <ArrowLeft size={20} className="text-white" />
              </button>
              <h1 className="text-[16px] font-[1000] text-white tracking-widest uppercase">
                Riwayat Belanja
              </h1>
            </div>
            <button className="p-2 text-white hover:bg-white/10 rounded-full active:scale-95 transition-all">
              <Search size={20} />
            </button>
          </div>

          <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
            {[
              { id: "ALL", label: "SEMUA" },
              { id: "ACTIVE", label: "BERLANGSUNG" },
              { id: "COMPLETED", label: "SELESAI / BATAL" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`relative pb-3 text-[11px] font-[1000] tracking-widest whitespace-nowrap transition-colors ${
                  activeTab === tab.id ? "text-white" : "text-teal-200"
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 w-full h-[4px] bg-[#FF6600] rounded-t-full"></div>
                )}
              </button>
            ))}
          </div>
        </header>

        {/* AREA KONTEN UTAMA */}
        <main className="w-full max-w-[800px] mx-auto p-3 space-y-3 pt-4">
          {/* 🚀 SKELETON BERLOGO SUDAH AKTIF DI SINI! */}
          {loading ? (
            <div className="space-y-3">
              <OrderSkeleton />
              <OrderSkeleton />
              <OrderSkeleton />
              <OrderSkeleton />
            </div>
          ) : filteredOrders.length === 0 ? (
            // JIKA KOSONG
            <div className="bg-white p-10 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center mt-6">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                <PackageX size={40} />
              </div>
              <h2 className="text-[14px] font-[1000] text-slate-800 mb-1 uppercase tracking-tight">
                Belum Ada Transaksi
              </h2>
              <p className="text-[11px] font-bold text-slate-400 leading-tight">
                Riwayat belanjamu masih kosong.
              </p>
              <button
                onClick={() => navigate("/")}
                className="mt-6 px-6 py-3 bg-[#FF6600] text-white rounded-xl text-[11px] font-black tracking-widest uppercase active:scale-95 transition-transform shadow-md"
              >
                Mulai Belanja
              </button>
            </div>
          ) : (
            // JIKA ADA DATA PESANAN
            <div className="space-y-3">
              {filteredOrders.map((order) => {
                const firstItem = order.items?.[0];
                const extraItemsCount = (order.items?.length || 1) - 1;
                const statusBadge = getStatusDisplay(
                  order.status,
                  order.shipping_status,
                );
                const isCancelled = order.status === "CANCELLED";
                const isCompleted = order.status === "COMPLETED";
                const canCancel = [
                  "UNPAID",
                  "PAID",
                  "PENDING",
                  "PROCESSING",
                ].includes(order.status);
                const dateStr = new Date(order.created_at).toLocaleDateString(
                  "id-ID",
                  { day: "numeric", month: "short", year: "numeric" },
                );

                return (
                  <div
                    key={order.id}
                    onClick={() => navigate(`/track-order/${order.id}`)}
                    className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md active:bg-slate-50 transition-all cursor-pointer"
                  >
                    {/* Header Kartu */}
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <Store
                          size={14}
                          className={
                            isCancelled ? "text-slate-400" : "text-[#FF6600]"
                          }
                        />
                        <span
                          className={`font-[1000] text-[12px] truncate max-w-[140px] uppercase ${isCancelled ? "text-slate-500" : "text-slate-800"}`}
                        >
                          {order.market?.name || "PASARQU"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold hidden sm:inline-block">
                          • {dateStr}
                        </span>
                      </div>
                      <div
                        className={`px-2 py-1 rounded-md text-[9px] font-[1000] border uppercase tracking-widest ${statusBadge.style}`}
                      >
                        {statusBadge.text}
                      </div>
                    </div>

                    {/* Body Kartu */}
                    <div className="flex gap-3 mb-4">
                      <div className="w-16 h-16 bg-slate-50 rounded-xl border border-slate-100 shrink-0 overflow-hidden flex items-center justify-center">
                        {firstItem?.product?.image_url ? (
                          <img
                            src={firstItem.product.image_url}
                            alt=""
                            className={`w-full h-full object-cover ${isCancelled ? "grayscale opacity-50" : ""}`}
                          />
                        ) : (
                          <ShoppingBag className="w-1/2 h-1/2 text-slate-300" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <h4
                          className={`font-bold text-[13px] leading-snug line-clamp-1 ${isCancelled ? "text-slate-400 line-through" : "text-slate-800"}`}
                        >
                          {firstItem?.product?.name || "PRODUK PASAR"}
                        </h4>
                        <p className="text-[11px] font-bold text-slate-500 mt-1">
                          {firstItem?.quantity} BARANG x RP{" "}
                          {firstItem?.price_at_purchase?.toLocaleString()}
                        </p>

                        {extraItemsCount > 0 && (
                          <p className="text-[9px] font-[1000] text-slate-500 mt-1.5 bg-slate-100 inline-block px-2 py-0.5 rounded-md w-fit tracking-wider">
                            +{extraItemsCount} PRODUK LAINNYA
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Footer Kartu */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 tracking-widest mb-0.5 uppercase">
                          TOTAL BELANJA
                        </p>
                        <p
                          className={`text-[14px] font-[1000] leading-none ${isCancelled ? "text-slate-400" : "text-slate-900"}`}
                        >
                          RP {order.total_price.toLocaleString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        {canCancel && (
                          <button
                            disabled={cancellingId === order.id}
                            onClick={(e) => handleCancelOrder(e, order.id)}
                            className="flex-1 sm:flex-none px-4 py-2 border border-red-200 text-red-500 rounded-xl text-[10px] font-black tracking-widest flex items-center justify-center gap-1 active:scale-95 transition-transform uppercase"
                          >
                            {cancellingId === order.id ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Ban size={12} />
                            )}
                            BATAL
                          </button>
                        )}

                        {(isCancelled || isCompleted) && (
                          <button
                            onClick={(e) => handleHideOrder(e, order.id)}
                            className="p-2 border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 rounded-xl active:scale-scale-95 transition-all"
                            title="Hapus Riwayat"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}

                        <button
                          className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase flex items-center justify-center gap-1 active:scale-95 transition-transform ${isCompleted ? "bg-[#008080] text-white shadow-sm" : isCancelled ? "border border-slate-200 text-slate-600 bg-slate-50" : "border border-[#008080] text-[#008080] bg-teal-50/50"}`}
                        >
                          {isCancelled
                            ? "DETAIL BATAL"
                            : isCompleted
                              ? "BELI LAGI"
                              : "LACAK PESANAN"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </MobileLayout>
  );
};

export default OrderHistoryPage;
