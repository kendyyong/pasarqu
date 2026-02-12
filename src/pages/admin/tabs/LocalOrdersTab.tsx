import React, { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";
import {
  ShoppingBag,
  Clock,
  Truck,
  CheckCircle2,
  Search,
  MoreVertical,
  Phone,
  MapPin,
  ExternalLink,
} from "lucide-react";

interface Props {
  marketId: string;
}

export const LocalOrdersTab: React.FC<Props> = ({ marketId }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING");

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select(
        "*, profiles!customer_id(full_name, phone_number), merchants(shop_name)",
      )
      .eq("market_id", marketId)
      .eq("status", filter)
      .order("created_at", { ascending: false });

    if (data) setOrders(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();

    // REALTIME: Update otomatis jika ada status pesanan berubah
    const channel = supabase
      .channel("order_updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `market_id=eq.${marketId}`,
        },
        () => fetchOrders(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filter, marketId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-orange-100 text-orange-600";
      case "PICKING_UP":
        return "bg-blue-100 text-blue-600";
      case "DELIVERING":
        return "bg-teal-100 text-teal-600";
      case "COMPLETED":
        return "bg-green-100 text-green-600";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-left">
      {/* FILTER TABS */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-white rounded-[2rem] border border-slate-100 shadow-sm w-fit">
        {["PENDING", "PICKING_UP", "DELIVERING", "COMPLETED"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-6 py-2.5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${
              filter === s
                ? "bg-teal-600 text-white shadow-lg shadow-teal-600/20"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            {s.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* ORDERS LIST */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="animate-spin text-teal-600" />
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white p-20 rounded-[3rem] text-center border border-dashed border-slate-200">
            <ShoppingBag className="mx-auto text-slate-200 mb-4" size={48} />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
              Tidak ada pesanan dalam status ini
            </p>
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:border-teal-200 transition-all group relative overflow-hidden"
            >
              <div className="flex flex-col md:flex-row justify-between gap-6 relative z-10">
                {/* INFO PEMBELI & TOKO */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${getStatusColor(order.status)}`}
                    >
                      {order.status}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      ID: #{order.id.substring(0, 8)}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-lg font-black text-slate-800 tracking-tighter leading-none uppercase">
                      {order.profiles?.full_name}
                    </h4>
                    <p className="text-xs font-bold text-teal-600 mt-2 flex items-center gap-1 uppercase tracking-widest">
                      <ShoppingBag size={12} /> {order.merchants?.shop_name}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-4 text-[10px] font-bold text-slate-400 uppercase">
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} />{" "}
                      {new Date(order.created_at).toLocaleTimeString()}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin size={14} />{" "}
                      {order.shipping_address?.substring(0, 30)}...
                    </div>
                  </div>
                </div>

                {/* AKSES CEPAT ADMIN */}
                <div className="flex items-center gap-3">
                  <div className="text-right mr-4 hidden md:block">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1 leading-none">
                      Total Bayar
                    </p>
                    <p className="text-xl font-black text-slate-900 leading-none">
                      Rp {order.total_amount?.toLocaleString()}
                    </p>
                  </div>

                  <button className="p-4 bg-slate-50 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-2xl transition-all border border-transparent hover:border-teal-100">
                    <Phone size={20} />
                  </button>
                  <button className="p-4 bg-teal-600 text-white rounded-2xl shadow-lg shadow-teal-600/20 hover:bg-teal-700 transition-all">
                    <ExternalLink size={20} />
                  </button>
                </div>
              </div>

              {/* DEKORASI BACKGROUND */}
              <div className="absolute -right-10 -bottom-10 text-slate-50 group-hover:text-teal-50/50 transition-colors pointer-events-none">
                <ShoppingBag size={180} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const Loader2 = ({ className, size = 24 }: any) => (
  <svg
    className={`animate-spin ${className}`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    width={size}
    height={size}
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);
