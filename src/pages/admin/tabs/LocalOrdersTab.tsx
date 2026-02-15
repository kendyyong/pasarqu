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
  DollarSign,
  Loader2,
  RefreshCw,
  Store,
  Eye,
} from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";

interface Props {
  marketId: string;
}

export const LocalOrdersTab: React.FC<Props> = ({ marketId }) => {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL"); // ALL, PENDING, DELIVERING, COMPLETED
  const [searchTerm, setSearchTerm] = useState("");

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("orders")
        .select(
          `
          *,
          profiles:customer_id(full_name, phone_number),
          merchants:merchant_id(shop_name),
          couriers:courier_id(full_name, phone_number)
        `,
        )
        .eq("market_id", marketId);

      if (filter !== "ALL") {
        query = query.eq("shipping_status", filter);
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) throw error;
      setOrders(data || []);
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // 🔴 MONITOR LIVE: Update Otomatis jika status berubah
    const channel = supabase
      .channel("local_orders_stream")
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
      o.id.includes(searchTerm) ||
      o.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-left pb-20">
      {/* HEADER MONITOR & SEARCH */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center shadow-inner">
            <ActivityIcon className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter italic">
              Order Control Tower
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Monitoring Alur Logistik & Dana
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={14}
            />
            <input
              type="text"
              placeholder="CARI NAMA / ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-6 py-3 bg-slate-50 border-none rounded-xl text-[10px] font-black uppercase outline-none focus:ring-2 ring-teal-500 w-48 transition-all"
            />
          </div>
          <button
            onClick={fetchOrders}
            className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-white rounded-[2rem] border border-slate-100 shadow-sm w-fit">
        {["ALL", "PAID", "PICKING_UP", "DELIVERING", "COMPLETED"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-6 py-2.5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${
              filter === s
                ? "bg-teal-600 text-white shadow-lg"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            {s.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* LIST ORDER DENGAN PIPELINE VISUAL */}
      <div className="grid grid-cols-1 gap-5">
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-teal-600" size={40} />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Sinkronisasi Data Transaksi...
            </p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white p-20 rounded-[3rem] text-center border-2 border-dashed border-slate-100">
            <ShoppingBag className="mx-auto text-slate-100 mb-4" size={64} />
            <p className="text-xs font-black text-slate-300 uppercase tracking-widest">
              Belum ada aktivitas di jalur ini
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden hover:border-teal-200 transition-all group"
            >
              <div className="p-6 md:p-8 flex flex-col lg:flex-row lg:items-center gap-10">
                {/* 1. KARTU IDENTITAS ORDER */}
                <div className="lg:w-1/4 space-y-3 border-b lg:border-b-0 lg:border-r border-slate-50 pb-6 lg:pb-0 lg:pr-8">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 bg-slate-900 text-white text-[8px] font-black rounded-lg uppercase tracking-widest shadow-lg">
                      #{order.id.slice(0, 8)}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400">
                      {new Date(order.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <h4 className="font-black text-slate-800 text-base uppercase leading-none tracking-tighter">
                    {order.profiles?.full_name}
                  </h4>
                  <div className="flex items-center gap-2 text-teal-600">
                    <Store size={14} />
                    <p className="text-[10px] font-black uppercase truncate">
                      {order.merchants?.shop_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <MapPin size={12} />
                    <p className="text-[9px] font-bold uppercase truncate italic">
                      {order.address || "Alamat tidak terbaca"}
                    </p>
                  </div>
                </div>

                {/* 2. PIPELINE VISUAL (ALUR BARANG & DANA) */}
                <div className="flex-1 px-4">
                  <div className="flex items-center justify-between relative">
                    {/* Background Progress Line */}
                    <div className="absolute top-1/2 left-0 w-full h-[3px] bg-slate-50 -translate-y-1/2 z-0"></div>

                    <Step
                      icon={<CreditCard size={14} />}
                      label="Lunas"
                      active={true}
                      done={true}
                    />
                    <Step
                      icon={<Store size={14} />}
                      label="Toko"
                      active={order.shipping_status !== "SEARCHING_COURIER"}
                      done={[
                        "PICKING_UP",
                        "DELIVERING",
                        "DELIVERED",
                        "COMPLETED",
                      ].includes(order.shipping_status)}
                    />
                    <Step
                      icon={<Truck size={14} />}
                      label="Kurir"
                      active={order.shipping_status === "DELIVERING"}
                      done={["DELIVERED", "COMPLETED"].includes(
                        order.shipping_status,
                      )}
                    />

                    {/* INDIKATOR BAGI HASIL DANA ($) */}
                    <div
                      className={`z-10 flex flex-col items-center gap-2 group relative`}
                    >
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all border-4 shadow-xl ${
                          order.shipping_status === "COMPLETED"
                            ? "bg-teal-500 border-teal-100 text-white"
                            : "bg-white border-slate-50 text-slate-200"
                        }`}
                      >
                        <DollarSign
                          size={20}
                          className={
                            order.shipping_status === "COMPLETED"
                              ? "animate-bounce"
                              : ""
                          }
                        />
                      </div>
                      <span
                        className={`text-[8px] font-black uppercase tracking-widest ${order.shipping_status === "COMPLETED" ? "text-teal-600" : "text-slate-300"}`}
                      >
                        {order.shipping_status === "COMPLETED"
                          ? "Dana Cair"
                          : "Pending"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. INFO LOGISTIK & FINANCE (PEEK) */}
                <div className="lg:w-1/4 flex flex-col gap-3 border-t lg:border-t-0 lg:border-l border-slate-50 pt-6 lg:pt-0 lg:pl-8">
                  <div className="bg-slate-50 p-3 rounded-2xl flex items-center justify-between border border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        <Truck size={14} className="text-teal-600" />
                      </div>
                      <div>
                        <p className="text-[7px] font-black text-slate-400 uppercase">
                          Kurir
                        </p>
                        <p className="text-[10px] font-black text-slate-700 uppercase">
                          {order.couriers?.full_name?.split(" ")[0] || "..."}
                        </p>
                      </div>
                    </div>
                    <p className="text-[10px] font-black text-teal-600">
                      Rp {order.courier_earning_total?.toLocaleString()}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-2xl flex items-center justify-between border border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        <DollarSign size={14} className="text-orange-500" />
                      </div>
                      <div>
                        <p className="text-[7px] font-black text-slate-400 uppercase">
                          Platform
                        </p>
                        <p className="text-[10px] font-black text-slate-700 uppercase">
                          Revenue
                        </p>
                      </div>
                    </div>
                    <p className="text-[10px] font-black text-orange-600">
                      Rp {order.app_earning_total?.toLocaleString()}
                    </p>
                  </div>

                  <button className="w-full py-2 bg-slate-900 text-white rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-teal-600 transition-all">
                    <Eye size={12} /> Cek Detail Item
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// HELPER COMPONENTS
const Step = ({ icon, label, active, done }: any) => (
  <div className={`z-10 flex flex-col items-center gap-2 group relative`}>
    <div
      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border-2 ${
        done
          ? "bg-teal-600 border-teal-600 text-white shadow-lg"
          : active
            ? "bg-white border-teal-500 text-teal-600 shadow-xl scale-110"
            : "bg-white border-slate-100 text-slate-200"
      }`}
    >
      {done ? <CheckCircle2 size={16} /> : icon}
    </div>
    <span
      className={`text-[8px] font-black uppercase tracking-widest ${active || done ? "text-slate-800" : "text-slate-300"}`}
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

const CreditCard = ({ size }: { size: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="20" height="14" x="2" y="5" rx="2" />
    <line x1="2" x2="22" y1="10" y2="10" />
  </svg>
);
