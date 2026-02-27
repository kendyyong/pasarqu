import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../lib/supabaseClient";
import { useAuth } from "../../../contexts/AuthContext";
import { useToast } from "../../../contexts/ToastContext";
import { MobileLayout } from "../../../components/layout/MobileLayout";
import {
  ShoppingBag,
  ChevronRight,
  Clock,
  CheckCircle2,
  Store,
  PackageX,
  Loader2,
  ArrowLeft,
  Ban,
  Trash2, // 🚀 Ikon Tong Sampah
} from "lucide-react";

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

  // 🚀 STATE UNTUK PESANAN YANG DISEMBUNYIKAN (HAPUS RIWAYAT - SOFT DELETE)
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

      // 🚀 KABEL SENSOR REALTIME (AUTO-SYNC)
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
            if (payload.new.status === "CANCELLED") {
              showToast("PESANAN DIBATALKAN OLEH TOKO.", "error");
            } else if (payload.new.status === "PACKING") {
              showToast("PESANAN SEDANG DISIAPKAN TOKO!", "success");
            }
            fetchOrders(true);
          },
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  // FUNGSI PEMBATALAN CEPAT OLEH PEMBELI
  const handleCancelOrder = async (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation();
    if (
      !window.confirm(
        "Yakin ingin membatalkan pesanan ini? Saldo Anda akan otomatis dikembalikan 100%.",
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

  // 🚀 FUNGSI MENYEMBUNYIKAN PESANAN DARI DAFTAR (SOFT DELETE)
  const handleHideOrder = (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation();
    if (!window.confirm("Hapus pesanan ini dari riwayat belanja Anda?")) return;

    const updatedHidden = [...hiddenOrders, orderId];
    setHiddenOrders(updatedHidden);
    localStorage.setItem("hidden_orders", JSON.stringify(updatedHidden));
    showToast("Riwayat pesanan berhasil dihapus", "success");
  };

  const statusMap: any = {
    UNPAID: "BELUM BAYAR",
    PROCESSING: "MENUNGGU TOKO",
    READY_TO_PICKUP: "SIAP DIAMBIL",
    SHIPPING: "DIKIRIM",
    DELIVERING: "MENUJU LOKASI",
    DELIVERED: "SUDAH TIBA",
    COMPLETED: "SELESAI",
    CANCELLED: "DIBATALKAN",
  };

  const getStatusColor = (status: string, shippingStatus: string) => {
    if (status === "COMPLETED" || shippingStatus === "COMPLETED")
      return "text-green-600 bg-green-50 border-green-200";
    if (status === "CANCELLED") return "text-red-600 bg-red-50 border-red-200";
    return "text-[#FF6600] bg-orange-50 border-orange-200";
  };

  // 🚀 FILTER PESANAN (MENGABAIKAN YANG SUDAH DI-HIDE)
  const filteredOrders = orders.filter((order) => {
    // Jika pesanan ada di daftar hidden, jangan tampilkan sama sekali
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
      <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-black uppercase tracking-tighter pb-32 text-left not-italic">
        {/* --- HEADER --- */}
        <header className="bg-[#008080] sticky top-0 z-50 pt-4 pb-0 shadow-md w-full">
          <div className="max-w-[1200px] mx-auto px-4">
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => navigate("/customer-dashboard")}
                className="p-2 bg-white/10 text-white hover:bg-white/20 rounded-md transition-all active:scale-90"
              >
                <ArrowLeft size={20} strokeWidth={3} />
              </button>
              <h1 className="text-[14px] font-[1000] text-white tracking-[0.1em]">
                RIWAYAT BELANJA
              </h1>
            </div>

            <div className="flex gap-2 pb-0 overflow-x-auto hide-scrollbar border-b border-white/10 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {["ALL", "ACTIVE", "COMPLETED"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-5 py-3 text-[11px] font-[1000] tracking-widest whitespace-nowrap border-b-4 transition-all ${
                    activeTab === tab
                      ? "border-[#FF6600] text-[#FF6600] bg-white/10 rounded-t-md"
                      : "border-transparent text-teal-200 hover:text-white"
                  }`}
                >
                  {tab === "ALL"
                    ? "SEMUA"
                    : tab === "ACTIVE"
                      ? "BERLANGSUNG"
                      : "SELESAI / BATAL"}
                </button>
              ))}
            </div>
          </div>
        </header>

        <main className="w-full max-w-[800px] mx-auto p-4 space-y-4 pt-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
              <Loader2 className="animate-spin text-[#008080]" size={36} />
              <p className="text-[12px] tracking-widest">
                MEMUAT RIWAYAT TRANSAKSI...
              </p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-white p-10 rounded-md border border-slate-200 shadow-sm flex flex-col items-center text-center mt-10">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-5">
                <PackageX size={40} />
              </div>
              <h2 className="text-[14px] font-[1000] text-slate-700 mb-2">
                BELUM ADA TRANSAKSI DI SINI
              </h2>
              <p className="text-[11px] text-slate-400 leading-tight">
                Riwayat belanjamu masih kosong atau sudah dihapus.
              </p>
              <button
                onClick={() => navigate("/")}
                className="mt-6 px-8 py-4 bg-[#FF6600] text-white rounded-md text-[12px] font-black active:scale-95 transition-all shadow-md shadow-orange-100"
              >
                MULAI BELANJA SEKARANG
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const firstItem = order.items?.[0];
                const extraItemsCount = (order.items?.length || 1) - 1;
                const statusText =
                  statusMap[order.shipping_status || order.status] ||
                  order.status;
                const isCancelled = order.status === "CANCELLED";
                const isCompleted = order.status === "COMPLETED";

                const canCancel =
                  order.status === "PAID" ||
                  order.status === "PROCESSING" ||
                  order.status === "PENDING";

                return (
                  <div
                    key={order.id}
                    onClick={() => navigate(`/track-order/${order.id}`)}
                    className={`bg-white rounded-xl border-2 transition-all cursor-pointer group shadow-sm ${isCancelled ? "border-red-100 bg-red-50/20" : "border-slate-200 hover:border-[#008080] active:scale-[0.98]"}`}
                  >
                    <div
                      className={`p-4 border-b flex items-center justify-between ${isCancelled ? "border-red-100" : "border-slate-100"}`}
                    >
                      <div className="flex items-center gap-2">
                        <Store
                          size={16}
                          className={
                            isCancelled ? "text-red-400" : "text-[#008080]"
                          }
                        />
                        <span className="text-[12px] font-[1000] tracking-wider">
                          {order.market?.name || "PASARQU"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold ml-2 hidden sm:inline-block">
                          {new Date(order.created_at).toLocaleDateString(
                            "id-ID",
                            { day: "numeric", month: "short", year: "numeric" },
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className={`px-2 py-1 rounded-sm text-[10px] border font-[1000] tracking-widest ${getStatusColor(order.status, order.shipping_status)}`}
                        >
                          {statusText}
                        </div>

                        {/* 🚀 TOMBOL HAPUS RIWAYAT (HANYA MUNCUL JIKA SELESAI ATAU BATAL) */}
                        {(isCancelled || isCompleted) && (
                          <button
                            onClick={(e) => handleHideOrder(e, order.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                            title="Hapus Riwayat Ini"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="p-4 flex gap-4">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 rounded-md border border-slate-200 shrink-0 overflow-hidden shadow-inner flex items-center justify-center">
                        {firstItem?.product?.image_url ? (
                          <img
                            src={firstItem.product.image_url}
                            alt=""
                            className={`w-full h-full object-cover ${isCancelled ? "grayscale opacity-70" : ""}`}
                          />
                        ) : (
                          <ShoppingBag className="w-1/2 h-1/2 text-slate-300" />
                        )}
                      </div>
                      <div className="flex-1 flex flex-col justify-center min-w-0 py-1">
                        <h3
                          className={`text-[12px] font-black uppercase truncate mb-1 ${isCancelled ? "text-slate-500 line-through" : "text-slate-800"}`}
                        >
                          {firstItem?.product?.name || "PRODUK PASAR"}
                        </h3>
                        <p className="text-[11px] text-slate-500 font-bold">
                          {firstItem?.quantity} BARANG X{" "}
                          <span className="font-sans">
                            RP {firstItem?.price_at_purchase?.toLocaleString()}
                          </span>
                        </p>
                        {extraItemsCount > 0 && (
                          <p
                            className={`text-[10px] ${isCancelled ? "text-red-400" : "text-[#008080]"} mt-1 tracking-widest font-black`}
                          >
                            + {extraItemsCount} PRODUK LAINNYA
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="p-4 pt-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-400 mb-1 tracking-[0.2em]">
                          TOTAL BELANJA
                        </span>
                        <span
                          className={`text-[14px] font-[1000] font-sans leading-none ${isCancelled ? "text-slate-400" : "text-slate-900"}`}
                        >
                          RP {order.total_price.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex gap-2 w-full sm:w-auto">
                        {canCancel && (
                          <button
                            disabled={cancellingId === order.id}
                            onClick={(e) => handleCancelOrder(e, order.id)}
                            className="flex-1 sm:flex-none px-4 py-3 bg-white border border-red-200 text-red-500 rounded-md text-[10px] font-black flex items-center justify-center gap-1 hover:bg-red-50 transition-colors shadow-sm"
                          >
                            {cancellingId === order.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Ban size={14} />
                            )}
                            BATAL
                          </button>
                        )}

                        <button className="flex-1 sm:flex-none px-5 py-3 bg-slate-900 hover:bg-[#008080] text-white rounded-md text-[10px] font-black flex items-center justify-center gap-1 shadow-sm transition-colors">
                          {isCancelled
                            ? "LIHAT DETAIL BATAL"
                            : order.status === "COMPLETED"
                              ? "LIHAT DETAIL"
                              : "LACAK PESANAN"}
                          <ChevronRight size={14} />
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
