import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../lib/supabaseClient";
import { useAuth } from "../../../contexts/AuthContext";
import { MobileLayout } from "../../../components/layout/MobileLayout";
import {
  ShoppingBag,
  ChevronRight,
  Clock,
  CheckCircle2,
  Store,
  PackageX,
  Loader2,
  ArrowLeft, // 🚀 Menambahkan ArrowLeft untuk navigasi Desktop
} from "lucide-react";

export const OrderHistoryPage = () => {
  const { user } = useAuth() as any;
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ALL" | "ACTIVE" | "COMPLETED">(
    "ALL",
  );

  useEffect(() => {
    if (user) fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
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

  const statusMap: any = {
    UNPAID: "BELUM BAYAR",
    PROCESSING: "DIPROSES",
    READY_TO_PICKUP: "SIAP DIAMBIL",
    SHIPPING: "DIKIRIM",
    DELIVERING: "MENUJU LOKASI",
    DELIVERED: "SUDAH TIBA",
    COMPLETED: "SELESAI",
    CANCELLED: "BATAL",
  };

  const getStatusColor = (status: string, shippingStatus: string) => {
    if (status === "COMPLETED" || shippingStatus === "COMPLETED")
      return "text-green-600 bg-green-50 border-green-200";
    if (status === "CANCELLED") return "text-red-600 bg-red-50 border-red-200";
    return "text-[#FF6600] bg-orange-50 border-orange-200"; // Warna proses/aktif
  };

  const filteredOrders = orders.filter((order) => {
    if (activeTab === "ACTIVE")
      return order.status !== "COMPLETED" && order.status !== "CANCELLED";
    if (activeTab === "COMPLETED") return order.status === "COMPLETED";
    return true; // ALL
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
            {/* 🚀 NAVIGASI & JUDUL HEADER */}
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => navigate("/customer-dashboard")}
                className="hidden md:flex p-2 bg-white/10 text-white hover:bg-white/20 rounded-md transition-all active:scale-90"
              >
                <ArrowLeft size={20} strokeWidth={3} />
              </button>
              <h1 className="text-[14px] font-[1000] text-white tracking-[0.1em]">
                RIWAYAT BELANJA
              </h1>
            </div>

            {/* TABS FILTER */}
            <div className="flex gap-2 pb-0 overflow-x-auto hide-scrollbar border-b border-white/10">
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
                      : "SELESAI"}
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
                BELUM ADA TRANSAKSI
              </h2>
              <p className="text-[11px] text-slate-400 leading-tight">
                YUK MULAI BELANJA KEBUTUHANMU
                <br />
                DI PASAR FAVORIT!
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

                return (
                  <div
                    key={order.id}
                    onClick={() => navigate(`/track-order/${order.id}`)}
                    className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden active:scale-[0.98] hover:border-[#008080] transition-all cursor-pointer group"
                  >
                    {/* CARD HEADER */}
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                      <div className="flex items-center gap-2">
                        <Store size={16} className="text-[#008080]" />
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
                      <div
                        className={`px-2 py-1 rounded-sm text-[10px] border font-[1000] tracking-widest ${getStatusColor(order.status, order.shipping_status)}`}
                      >
                        {statusText}
                      </div>
                    </div>

                    {/* CARD BODY (PRODUK) */}
                    <div className="p-4 flex gap-4">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 rounded-md border border-slate-200 shrink-0 overflow-hidden shadow-inner flex items-center justify-center">
                        {firstItem?.product?.image_url ? (
                          <img
                            src={firstItem.product.image_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ShoppingBag className="w-1/2 h-1/2 text-slate-300" />
                        )}
                      </div>
                      <div className="flex-1 flex flex-col justify-center min-w-0 py-1">
                        <h3 className="text-[12px] font-black text-slate-800 truncate mb-1">
                          {firstItem?.product?.name || "PRODUK PASAR"}
                        </h3>
                        <p className="text-[11px] text-slate-500 font-bold">
                          {firstItem?.quantity} BARANG X{" "}
                          <span className="font-sans">
                            RP {firstItem?.price_at_purchase?.toLocaleString()}
                          </span>
                        </p>
                        {extraItemsCount > 0 && (
                          <p className="text-[10px] text-[#008080] mt-1 tracking-widest font-black">
                            + {extraItemsCount} PRODUK LAINNYA
                          </p>
                        )}
                      </div>
                    </div>

                    {/* CARD FOOTER */}
                    <div className="p-4 pt-0 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-400 mb-1 tracking-[0.2em]">
                          TOTAL BELANJA
                        </span>
                        <span className="text-[14px] font-[1000] font-sans text-slate-900 leading-none">
                          RP {order.total_price.toLocaleString()}
                        </span>
                      </div>
                      <button className="px-5 py-3 bg-slate-900 group-hover:bg-[#FF6600] text-white rounded-md text-[11px] font-black flex items-center gap-1 shadow-sm transition-colors">
                        {order.status === "COMPLETED"
                          ? "LIHAT DETAIL"
                          : "LACAK PESANAN"}{" "}
                        <ChevronRight size={14} />
                      </button>
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
