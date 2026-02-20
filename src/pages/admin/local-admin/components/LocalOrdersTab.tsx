import React, { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import {
  ShoppingBag,
  Clock,
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

      // ✅ LOGIKA FILTER KHUSUS PENDING (BELUM BAYAR)
      if (filter === "PENDING") {
        query = query.eq("status", "UNPAID");
      } else if (filter !== "ALL") {
        query = query.eq("shipping_status", filter);
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) {
        // Fallback jika relasi Foreign Key bermasalah
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
      showToast("GAGAL LOAD DATA", "error");
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
    <div className="space-y-4 animate-in fade-in duration-500 text-left pb-20 font-black uppercase tracking-tighter">
      {/* HEADER MONITOR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center shadow-inner">
            <ActivityIcon className="animate-pulse" />
          </div>
          <div className="leading-none text-left">
            <h3 className="text-[16px] font-black text-slate-800 italic leading-none">
              ORDER CONTROL TOWER
            </h3>
            <p className="text-[9px] text-slate-400 tracking-widest uppercase mt-1">
              MONITORING LOGISTIK WILAYAH
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1 md:flex-none">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
              size={14}
            />
            <input
              type="text"
              placeholder="CARI NAMA / ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl text-[12px] font-black uppercase outline-none focus:ring-2 ring-teal-500 w-full md:w-48 transition-all"
            />
          </div>
          <button
            onClick={fetchOrders}
            className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* TAB FILTER */}
      <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
        {[
          { label: "SEMUA", value: "ALL" },
          { label: "PENDING (BELUM BAYAR)", value: "PENDING" },
          { label: "DIKEMAS", value: "PACKING" },
          { label: "DIKIRIM", value: "SHIPPING" },
          { label: "SELESAI", value: "COMPLETED" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all border whitespace-nowrap ${
              filter === tab.value
                ? tab.value === "PENDING"
                  ? "bg-[#FF6600] text-white border-transparent shadow-lg"
                  : "bg-teal-600 text-white border-transparent shadow-lg"
                : "bg-white text-slate-400 border-slate-100 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* LIST ORDERS */}
      <div className="space-y-2">
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-2">
            <Loader2 className="animate-spin text-teal-600" size={32} />
            <p className="text-[10px] text-slate-400">MEMPROSES DATA...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white p-20 rounded-[2rem] text-center border-2 border-dashed border-slate-100">
            <ShoppingBag className="mx-auto text-slate-100 mb-2" size={48} />
            <p className="text-[12px] text-slate-300 uppercase italic leading-none">
              Belum ada aktivitas di jalur ini
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 group hover:border-teal-200 transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="lg:w-1/4 space-y-2 border-b lg:border-b-0 lg:border-r border-slate-50 pb-4 lg:pb-0 lg:pr-4 text-left">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] bg-slate-900 text-white px-2 py-0.5 rounded font-sans font-bold">
                      #{order.id.slice(0, 8)}
                    </span>
                    <span className="text-[9px] text-slate-400 font-sans">
                      {new Date(order.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <h4 className="text-[14px] text-slate-800 leading-none truncate font-black">
                    {order.customer?.name || "PEMBELI"}
                  </h4>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <MapPin size={12} className="text-red-500 shrink-0" />
                    <p className="text-[11px] font-sans lowercase truncate italic leading-none font-bold">
                      {order.address}
                    </p>
                  </div>
                </div>

                <div className="flex-1 flex items-center justify-between px-2 relative">
                  <div className="absolute top-5 left-10 right-10 h-0.5 bg-slate-50 -z-0" />
                  <Step
                    icon={<Wallet size={14} />}
                    label="LUNAS"
                    done={order.status === "PAID"}
                  />
                  <Step
                    icon={<Package size={14} />}
                    label="PROSES"
                    active={order.shipping_status === "PACKING"}
                    done={["SHIPPING", "COMPLETED"].includes(
                      order.shipping_status,
                    )}
                  />
                  <Step
                    icon={<Truck size={14} />}
                    label="KURIR"
                    active={order.shipping_status === "SHIPPING"}
                    done={order.shipping_status === "COMPLETED"}
                  />
                  <Step
                    icon={<CheckCircle2 size={14} />}
                    label="DANA"
                    active={order.shipping_status === "COMPLETED"}
                    done={order.shipping_status === "COMPLETED"}
                    isDana
                  />
                </div>

                <div className="lg:w-1/4 flex flex-col gap-2 border-t lg:border-t-0 lg:border-l border-slate-50 pt-4 lg:pt-0 lg:pl-4 text-left">
                  <div className="flex justify-between items-center text-[12px]">
                    <span className="text-slate-400">TAGIHAN</span>
                    <span className="text-[#FF6600] font-sans font-black">
                      RP {order.total_price?.toLocaleString()}
                    </span>
                  </div>
                  {filter === "PENDING" ? (
                    <button
                      onClick={() =>
                        window.open(
                          `https://wa.me/${order.customer?.phone?.replace(/^0/, "62")}`,
                          "_blank",
                        )
                      }
                      className="w-full py-2 bg-green-500 text-white rounded-xl text-[10px] flex items-center justify-center gap-2 hover:bg-green-600 transition-all font-black uppercase shadow-md shadow-green-100"
                    >
                      <MessageCircle size={14} /> HUBUNGI (TAGIH WA)
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        window.open(`/invoice/${order.id}`, "_blank")
                      }
                      className="w-full py-2 bg-slate-900 text-white rounded-xl text-[10px] flex items-center justify-center gap-2 hover:bg-teal-600 transition-all font-black uppercase shadow-sm"
                    >
                      <Eye size={12} /> LIHAT DETAIL
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

const Step = ({ icon, label, active, done, isDana }: any) => (
  <div className="relative z-10 flex flex-col items-center gap-1 w-12 text-center">
    <div
      className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all ${done ? "bg-teal-600 border-teal-600 text-white shadow-md" : active ? "bg-white border-teal-500 text-teal-600 scale-110 shadow-lg" : "bg-white border-slate-50 text-slate-200"}`}
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
      className={`text-[8px] font-black leading-none mt-1 ${active || done ? "text-slate-800" : "text-slate-300"}`}
    >
      {label}
    </span>
  </div>
);

const ActivityIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);
