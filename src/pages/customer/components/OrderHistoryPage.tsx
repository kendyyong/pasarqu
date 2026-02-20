import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../lib/supabaseClient";
import { useAuth } from "../../../contexts/AuthContext";
import {
  ArrowLeft,
  ShoppingBag,
  ChevronRight,
  Clock,
  CheckCircle2,
  Package,
  Bike,
  Loader2,
  Store,
} from "lucide-react";

export const OrderHistoryPage = () => {
  const { user } = useAuth() as any;
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    try {
      // ✅ Query diperbaiki untuk mengambil data item dan nama produk
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
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle2 size={16} className="text-teal-600" />;
      case "SHIPPING":
        return <Bike size={16} className="text-[#FF6600]" />;
      case "PACKING":
        return <Package size={16} className="text-blue-500" />;
      default:
        return <Clock size={16} className="text-slate-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-black uppercase tracking-tighter pb-10">
      {/* HEADER - SYNC h-12 */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50 h-12 flex items-center px-4">
        <div className="w-full max-w-2xl mx-auto flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="p-1 text-slate-400 hover:bg-slate-50 rounded-lg"
          >
            <ArrowLeft size={22} />
          </button>
          <div className="text-[14px] flex-1 font-black">
            <span className="text-teal-600">PESANAN</span>{" "}
            <span className="text-[#FF6600]">SAYA</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-2 space-y-2">
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-2">
            <Loader2 className="animate-spin text-teal-600" />
            <p className="text-[10px] text-slate-400 tracking-widest">
              MEMUAT RIWAYAT...
            </p>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <ShoppingBag size={48} className="mx-auto text-slate-100" />
            <p className="text-[12px] text-slate-400">BELUM ADA TRANSAKSI</p>
            <button
              onClick={() => navigate("/")}
              className="bg-teal-600 text-white px-6 py-2 rounded-xl text-[10px] font-black"
            >
              MULAI BELANJA
            </button>
          </div>
        ) : (
          orders.map((order) => {
            // ✅ Ambil nama produk pertama dan hitung sisa item
            const firstItemName =
              order.order_items?.[0]?.products?.name || "PRODUK";
            const otherItemsCount = order.order_items?.length - 1;

            return (
              <div
                key={order.id}
                onClick={() => navigate(`/track-order/${order.id}`)}
                className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3 active:scale-[0.98] transition-all cursor-pointer"
              >
                {/* BOX ICON */}
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center shrink-0 border border-slate-100">
                  {getStatusIcon(order.shipping_status)}
                </div>

                {/* RINCIAN PESANAN */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-[10px] text-slate-400 font-black">
                      #{order.id.slice(0, 8)}
                    </p>
                    <span className="text-[10px] font-black text-slate-400">
                      {new Date(order.created_at).toLocaleDateString("id-ID")}
                    </span>
                  </div>

                  {/* ✅ KETERANGAN BARANG YANG DIBELI */}
                  <h3 className="text-[12px] text-slate-800 font-black leading-tight mb-0.5 truncate uppercase">
                    {firstItemName}
                    {otherItemsCount > 0 && (
                      <span className="text-teal-600 ml-1">
                        + {otherItemsCount} PRODUK LAINNYA
                      </span>
                    )}
                  </h3>

                  <div className="flex justify-between items-end">
                    <p className="text-[12px] text-[#FF6600] font-black">
                      RP {order.total_price.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-slate-400 font-black">
                      {order.shipping_status || "PENDING"}
                    </p>
                  </div>
                </div>

                <ChevronRight size={18} className="text-slate-200" />
              </div>
            );
          })
        )}
      </main>
    </div>
  );
};
