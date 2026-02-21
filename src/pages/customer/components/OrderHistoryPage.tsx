import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../lib/supabaseClient";
import { useAuth } from "../../../contexts/AuthContext";
import { useToast } from "../../../contexts/ToastContext";
import {
  ArrowLeft,
  ShoppingBag,
  ChevronRight,
  Clock,
  CheckCircle2,
  Package,
  Bike,
  Loader2,
  AlertCircle,
} from "lucide-react";

export const OrderHistoryPage = () => {
  const { user } = useAuth() as any;
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          order_items (
            id,
            product_id,
            products (name)
          )
        `,
        )
        .eq("customer_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return {
          icon: <CheckCircle2 size={14} />,
          label: "SELESAI",
          color: "text-teal-600 bg-teal-50",
        };
      case "SHIPPING":
        return {
          icon: <Bike size={14} />,
          label: "DIKIRIM",
          color: "text-[#FF6600] bg-orange-50",
        };
      case "PACKING":
        return {
          icon: <Package size={14} />,
          label: "DIPROSES",
          color: "text-blue-600 bg-blue-50",
        };
      case "UNPAID":
        return {
          icon: <AlertCircle size={14} />,
          label: "BELUM BAYAR",
          color: "text-red-600 bg-red-50",
        };
      default:
        return {
          icon: <Clock size={14} />,
          label: "MENUNGGU",
          color: "text-slate-400 bg-slate-50",
        };
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-900 font-black uppercase tracking-tighter pb-10 text-left">
      {/* HEADER COMPACT (TOSCA) */}
      <header className="bg-[#008080] sticky top-0 z-50 h-12 flex items-center px-4 shadow-md">
        <div className="w-full max-w-2xl mx-auto flex items-center gap-4">
          {/* 🚀 NAVIGASI: Dikunci ke rute sesuai AppRoutes.tsx */}
          <button
            onClick={() => navigate("/customer-dashboard")}
            className="p-1.5 bg-white/10 text-white hover:bg-[#FF6600] rounded-lg border border-white/10 transition-all active:scale-95 shrink-0"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="text-[14px] flex-1 font-black text-white">
            RIWAYAT <span className="text-orange-400">BELANJA</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-2 space-y-1.5 mt-1">
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-2">
            <Loader2 className="animate-spin text-[#008080]" size={28} />
            <p className="text-[10px] text-slate-400 tracking-widest font-black">
              MEMUAT DATA...
            </p>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-xl border border-dashed border-slate-200 m-2">
            <ShoppingBag size={40} className="mx-auto text-slate-200 mb-3" />
            <p className="text-[12px] text-slate-400 mb-4 font-black">
              BELUM ADA TRANSAKSI
            </p>
            <button
              onClick={() => navigate("/")}
              className="bg-[#008080] text-white px-6 py-2 rounded-lg text-[12px] font-black shadow-md active:scale-95 transition-all"
            >
              MULAI BELANJA
            </button>
          </div>
        ) : (
          orders.map((order) => {
            const status = getStatusInfo(order.shipping_status || order.status);
            const firstItemName =
              order.order_items?.[0]?.products?.name || "PRODUK";
            const otherItemsCount = (order.order_items?.length || 1) - 1;

            return (
              <div
                key={order.id}
                onClick={() => navigate(`/track-order/${order.id}`)}
                className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 active:bg-slate-50 transition-all cursor-pointer group"
              >
                <div
                  className={`w-10 h-10 ${status.color} rounded-lg flex items-center justify-center shrink-0 border border-current`}
                >
                  {status.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-[9px] text-slate-400 font-black tracking-widest">
                      #{order.id.slice(0, 8)}
                    </span>
                    <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      {new Date(order.created_at).toLocaleDateString("id-ID")}
                    </span>
                  </div>

                  <h3 className="text-[12px] text-slate-800 font-black leading-tight mb-1 truncate">
                    {firstItemName}
                    {otherItemsCount > 0 && (
                      <span className="text-[#008080] ml-1">
                        + {otherItemsCount} ITEM
                      </span>
                    )}
                  </h3>

                  <div className="flex justify-between items-center">
                    <p className="text-[13px] text-[#FF6600] font-black leading-none">
                      RP{" "}
                      {(
                        order.total_price ||
                        order.total_amount ||
                        0
                      ).toLocaleString()}
                    </p>
                    <div
                      className={`text-[9px] font-black px-1.5 py-0.5 rounded border border-current ${status.color} leading-none`}
                    >
                      {status.label}
                    </div>
                  </div>
                </div>

                <ChevronRight
                  size={16}
                  className="text-slate-300 group-hover:text-[#008080] transition-colors"
                />
              </div>
            );
          })
        )}
      </main>
    </div>
  );
};

export default OrderHistoryPage;
