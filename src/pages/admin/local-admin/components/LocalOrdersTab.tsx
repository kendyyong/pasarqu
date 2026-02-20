import React, { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import {
  ShoppingBag,
  Truck,
  CheckCircle2,
  Search,
  MapPin,
  Loader2,
  RefreshCw,
  Store,
  Eye,
  DollarSign,
  Package,
  Wallet,
  MessageCircle,
  Clock,
  ChevronRight,
  Activity,
} from "lucide-react";
import { useToast } from "../../../../contexts/ToastContext";

interface Props {
  marketId: string;
}

export const LocalOrdersTab: React.FC<Props> = ({ marketId }) => {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchOrders = async () => {
    if (!marketId) return;
    setLoading(true);
    try {
      let query = supabase
        .from("orders")
        .select(
          `
          *,
          customer:profiles!customer_id(name, phone),
          courier:couriers!courier_id(full_name, phone_number)
        `,
        )
        .eq("market_id", marketId);

      if (filter === "PENDING") {
        query = query.eq("status", "UNPAID");
      } else if (filter !== "ALL") {
        query = query.eq("shipping_status", filter);
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) {
        const { data: fallbackData } = await supabase
          .from("orders")
          .select(`*, customer:profiles!customer_id(name, phone)`)
          .eq("market_id", marketId)
          .order("created_at", { ascending: false });

        const manualFiltered =
          filter === "ALL"
            ? fallbackData
            : filter === "PENDING"
              ? fallbackData?.filter((o) => o.status === "UNPAID")
              : fallbackData?.filter((o) => o.shipping_status === filter);

        setOrders(manualFiltered || []);
      } else {
        setOrders(data || []);
      }
    } catch (err: any) {
      showToast("GAGAL LOAD DATA PESANAN", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const channel = supabase
      .channel(`local_orders_${marketId}`)
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

  const filteredOrders = orders.filter(
    (o) =>
      o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.customer?.name || "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-3 animate-in fade-in duration-500 text-left pb-24 font-black uppercase tracking-tighter">
      {/* 🟢 HEADER COMPACT */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-3 rounded-md border-b-4 border-[#008080] shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-slate-900 text-[#008080] rounded-md flex items-center justify-center shadow-lg border-b-2 border-[#FF6600] shrink-0">
            <Activity size={20} className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-[14px] font-black text-slate-900 leading-none">
              ORDER CONTROL
            </h3>
            <p className="text-[9px] text-slate-400 tracking-widest mt-0.5">
              MONITORING NODE
            </p>
          </div>
        </div>

        <div className="flex gap-2 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={14}
            />
            <input
              type="text"
              placeholder="CARI NAMA / ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-100 border-none rounded-md text-[11px] font-black outline-none focus:ring-2 ring-[#008080]"
            />
          </div>
          <button
            onClick={fetchOrders}
            className="p-2 bg-slate-900 text-white rounded-md hover:bg-[#008080] transition-all"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* 🔵 FILTER TABS COMPACT */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {[
          { label: "SEMUA", value: "ALL" },
          { label: "UNPAID", value: "PENDING" },
          { label: "DIKEMAS", value: "PACKING" },
          { label: "DIKIRIM", value: "SHIPPING" },
          { label: "SELESAI", value: "COMPLETED" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-2 rounded-md text-[10px] font-black transition-all border-b-2 whitespace-nowrap ${
              filter === tab.value
                ? tab.value === "PENDING"
                  ? "bg-[#FF6600] text-white border-orange-900 shadow-sm"
                  : "bg-[#008080] text-white border-teal-900 shadow-sm"
                : "bg-white text-slate-400 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 🟠 ORDERS LIST COMPACT */}
      <div className="grid grid-cols-1 gap-3">
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-[#008080]" size={40} />
            <p className="text-[10px] text-slate-500 font-black tracking-widest">
              SINKRONISASI...
            </p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white py-16 rounded-md text-center border-2 border-dashed border-slate-200">
            <p className="text-[12px] text-slate-300 font-black uppercase tracking-widest">
              KOSONG
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-md border-l-4 border-[#008080] shadow-sm p-3 lg:p-4 group hover:shadow-md transition-all border border-slate-100"
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* IDENTITAS */}
                <div className="lg:w-1/3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] bg-slate-900 text-white px-1.5 py-0.5 rounded-sm font-black">
                      ID: {order.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span className="text-[9px] text-slate-400 font-black flex items-center gap-1 uppercase">
                      <Clock size={10} />{" "}
                      {new Date(order.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-[14px] md:text-[16px] text-slate-900 font-black leading-none truncate">
                      {order.customer?.name || "PEMBELI"}
                    </h4>
                    <p className="text-[9px] text-[#008080] font-black flex items-center gap-1 mt-1">
                      <Store size={10} /> MITRA LOKAL
                    </p>
                  </div>
                  <div className="flex items-start gap-1.5 text-slate-500 bg-slate-50 p-2 rounded-md border border-slate-100">
                    <MapPin
                      size={12}
                      className="text-[#FF6600] shrink-0 mt-0.5"
                    />
                    <p className="text-[10px] font-black lowercase leading-tight line-clamp-1">
                      {order.address}
                    </p>
                  </div>
                </div>

                {/* PROGRESS TRACKER COMPACT */}
                <div className="flex-1 flex items-center justify-between px-1 md:px-6 relative py-2 lg:py-0">
                  <div className="absolute top-1/2 left-8 right-8 h-1 bg-slate-100 -translate-y-4 z-0 rounded-full" />
                  <Step
                    icon={<Wallet size={14} />}
                    label="PAY"
                    done={order.status === "PAID"}
                  />
                  <Step
                    icon={<Package size={14} />}
                    label="PACK"
                    active={order.shipping_status === "PACKING"}
                    done={["SHIPPING", "COMPLETED"].includes(
                      order.shipping_status,
                    )}
                  />
                  <Step
                    icon={<Truck size={14} />}
                    label="SHIP"
                    active={order.shipping_status === "SHIPPING"}
                    done={order.shipping_status === "COMPLETED"}
                  />
                  <Step
                    icon={<CheckCircle2 size={14} />}
                    label="DONE"
                    active={order.shipping_status === "COMPLETED"}
                    done={order.shipping_status === "COMPLETED"}
                    isDana
                  />
                </div>

                {/* FINANCE & BUTTONS */}
                <div className="lg:w-1/4 flex flex-row lg:flex-col items-center lg:items-end justify-between gap-3 border-t lg:border-t-0 lg:border-l border-slate-100 pt-3 lg:pt-0 lg:pl-6">
                  <div className="text-left lg:text-right shrink-0">
                    <p className="text-[8px] text-slate-400 font-black tracking-widest mb-0.5">
                      TAGIHAN
                    </p>
                    <p className="text-[16px] text-[#FF6600] font-black leading-none">
                      RP {order.total_price?.toLocaleString()}
                    </p>
                  </div>

                  {filter === "PENDING" ? (
                    <button
                      onClick={() =>
                        window.open(
                          `https://wa.me/${order.customer?.phone?.replace(/^0/, "62")}`,
                          "_blank",
                        )
                      }
                      className="flex-1 lg:w-full py-2 bg-green-600 text-white rounded-md text-[10px] font-black flex items-center justify-center gap-1.5 hover:bg-green-700 transition-all shadow-sm active:translate-y-0.5"
                    >
                      <MessageCircle size={14} /> TAGIH
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        window.open(`/invoice/${order.id}`, "_blank")
                      }
                      className="flex-1 lg:w-full py-2 bg-slate-900 text-white rounded-md text-[10px] font-black flex items-center justify-center gap-1.5 hover:bg-[#008080] transition-all shadow-sm active:translate-y-0.5"
                    >
                      <Eye size={14} /> DETAIL
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// --- SUB-COMPONENTS COMPACT ---

const Step = ({ icon, label, active, done, isDana }: any) => (
  <div className="relative z-10 flex flex-col items-center gap-1.5 w-10 text-center">
    <div
      className={`w-9 h-9 md:w-11 md:h-11 rounded-md flex items-center justify-center border-2 transition-all ${
        done
          ? "bg-[#008080] border-[#008080] text-white shadow-md"
          : active
            ? "bg-white border-[#FF6600] text-[#FF6600] scale-110 shadow-lg"
            : "bg-white border-slate-100 text-slate-200"
      }`}
    >
      {isDana && done ? (
        <DollarSign size={16} className="animate-bounce" />
      ) : done ? (
        <CheckCircle2 size={16} />
      ) : (
        icon
      )}
    </div>
    <span
      className={`text-[8px] font-black tracking-widest leading-none ${active || done ? "text-slate-900" : "text-slate-300"}`}
    >
      {label}
    </span>
  </div>
);
