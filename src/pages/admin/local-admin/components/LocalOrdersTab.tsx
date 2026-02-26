import React, { useState, useEffect, useCallback } from "react";
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
  Activity,
  Printer,
  Radar,
  X,
  PhoneCall,
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

  // 🚀 STATE UNTUK RADAR KURIR
  const [isRadarOpen, setIsRadarOpen] = useState(false);
  const [selectedOrderForRadar, setSelectedOrderForRadar] = useState<any>(null);
  const [availableCouriers, setAvailableCouriers] = useState<any[]>([]);
  const [loadingRadar, setLoadingRadar] = useState(false);

  // 🚀 CUSTOM HOOK UNTUK TIMER MUNDUR (SLA Timer)
  const useOrderTimer = (
    createdAt: string,
    status: string,
    shippingStatus: string,
  ) => {
    const [timeLeft, setTimeLeft] = useState<{
      text: string;
      isLate: boolean;
      type: string;
    } | null>(null);

    useEffect(() => {
      // Hanya tampilkan timer untuk UNPAID atau PACKING
      if (status !== "UNPAID" && shippingStatus !== "PACKING") {
        setTimeLeft(null);
        return;
      }

      const calculateTime = () => {
        const orderTime = new Date(createdAt).getTime();
        const now = new Date().getTime();
        const diffInMinutes = Math.floor((now - orderTime) / (1000 * 60));

        // SLA Rules: UNPAID max 15 menit, PACKING max 30 menit
        let maxMinutes = status === "UNPAID" ? 15 : 30;
        let type = status === "UNPAID" ? "TUNGGU BAYAR" : "BATAS KEMAS";

        let remaining = maxMinutes - diffInMinutes;

        if (remaining <= 0) {
          setTimeLeft({ text: "TERLAMBAT!", isLate: true, type });
        } else {
          setTimeLeft({ text: `${remaining} MNT LAGI`, isLate: false, type });
        }
      };

      calculateTime();
      const timer = setInterval(calculateTime, 60000); // Update tiap 1 menit
      return () => clearInterval(timer);
    }, [createdAt, status, shippingStatus]);

    return timeLeft;
  };

  const fetchOrders = useCallback(async () => {
    if (!marketId) return;
    setLoading(true);
    try {
      let query = supabase
        .from("orders")
        .select(
          `
          *,
          customer:profiles!customer_id(name, phone_number)
        `,
        )
        .eq("market_id", marketId);

      if (filter === "PENDING") {
        query = query.eq("status", "UNPAID");
      } else if (filter !== "ALL") {
        query = query.eq("shipping_status", filter);
      }

      const { data: ordersData, error: ordersError } = await query.order(
        "created_at",
        { ascending: false },
      );

      if (ordersError) throw ordersError;

      if (ordersData && ordersData.length > 0) {
        const merchantIds = [
          ...new Set(ordersData.map((o) => o.merchant_id).filter(Boolean)),
        ];
        let merchantsData: any[] = [];

        if (merchantIds.length > 0) {
          const { data } = await supabase
            .from("merchants")
            .select("id, shop_name")
            .in("id", merchantIds);

          if (data) merchantsData = data;
        }

        const finalData = ordersData.map((order) => ({
          ...order,
          merchant: merchantsData.find((m) => m.id === order.merchant_id) || {
            shop_name: "TOKO PASARQU",
          },
        }));

        setOrders(finalData);
      } else {
        setOrders([]);
      }
    } catch (err: any) {
      console.error("System Error:", err.message);
    } finally {
      setLoading(false);
    }
  }, [marketId, filter]);

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
  }, [fetchOrders, marketId]);

  // 🚀 FUNGSI BUKA RADAR KURIR
  const openRadar = async (order: any) => {
    setSelectedOrderForRadar(order);
    setIsRadarOpen(true);
    setLoadingRadar(true);

    try {
      // Cari kurir yang terdaftar di pasar ini dan statusnya ACTIVE
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, phone_number, vehicle_plate, wallet_balance")
        .eq("role", "COURIER")
        .eq("managed_market_id", marketId)
        .eq("status", "ACTIVE")
        .eq("is_verified", true);

      if (error) throw error;
      setAvailableCouriers(data || []);
    } catch (err) {
      console.error("Gagal scan kurir:", err);
      showToast("Gagal memindai kurir terdekat", "error");
    } finally {
      setLoadingRadar(false);
    }
  };

  const dispatchCourier = (courier: any) => {
    const phone = courier.phone_number?.replace(/^0/, "62") || "";
    const message = `Halo ${courier.name}! Ada orderan *SIAP AMBIL* di *${selectedOrderForRadar?.merchant?.shop_name}* (ID Order: ${selectedOrderForRadar?.id.slice(0, 8).toUpperCase()}). Tolong merapat ke toko sekarang ya!`;
    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
      "_blank",
    );
    setIsRadarOpen(false);
  };

  const printInvoice = (orderId: string) => {
    // Membuka halaman invoice di tab baru (bisa disambung ke printer thermal)
    window.open(`/invoice/${orderId}`, "_blank");
    showToast("Membuka mode cetak struk...", "success");
  };

  const filteredOrders = orders.filter(
    (o) =>
      o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.customer?.name || "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-3 animate-in fade-in duration-500 text-left pb-24 font-black uppercase tracking-tighter relative">
      {/* 🚀 MODAL RADAR KURIR (AUTO-DISPATCH) */}
      {isRadarOpen && selectedOrderForRadar && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in zoom-in-95">
          <div className="bg-white border-[6px] border-[#008080] p-6 w-full max-w-lg shadow-[15px_15px_0px_0px_rgba(0,128,128,0.3)]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl text-slate-900 flex items-center gap-2">
                <Radar className="text-[#008080] animate-pulse" /> RADAR KURIR
                TERDEKAT
              </h3>
              <button
                onClick={() => setIsRadarOpen(false)}
                className="text-slate-400 hover:text-red-500 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="bg-slate-50 border-2 border-slate-100 p-3 rounded-xl mb-4">
              <p className="text-[10px] text-slate-400 tracking-widest">
                TARGET PENJEMPUTAN:
              </p>
              <h4 className="text-sm text-slate-900 leading-tight">
                {selectedOrderForRadar.merchant?.shop_name}
              </h4>
              <p className="text-[9px] text-[#FF6600]">
                ID: {selectedOrderForRadar.id.slice(0, 8).toUpperCase()}
              </p>
            </div>

            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
              {loadingRadar ? (
                <div className="py-10 text-center flex flex-col items-center">
                  <Radar
                    size={40}
                    className="text-[#008080] animate-spin mb-2"
                  />
                  <p className="text-[10px] tracking-widest text-slate-400">
                    MEMINDAI AREA PASAR...
                  </p>
                </div>
              ) : availableCouriers.length === 0 ? (
                <div className="py-10 text-center border-2 border-dashed border-slate-200">
                  <p className="text-[10px] tracking-widest text-slate-400">
                    TIDAK ADA KURIR AKTIF SAAT INI
                  </p>
                </div>
              ) : (
                availableCouriers.map((courier) => (
                  <div
                    key={courier.id}
                    className="flex items-center justify-between p-3 border-2 border-slate-100 rounded-xl hover:border-[#008080] transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#008080]/10 text-[#008080] rounded-full flex items-center justify-center">
                        <Truck size={20} />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-800">
                          {courier.name}
                        </h4>
                        <p className="text-[9px] text-slate-400 tracking-widest flex items-center gap-1">
                          <Wallet size={8} /> Saldo: Rp{" "}
                          {(courier.wallet_balance || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => dispatchCourier(courier)}
                      className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg flex items-center gap-2 text-[10px] font-black transition-all shadow-sm active:scale-95"
                    >
                      <PhoneCall size={14} /> KONTAS WA
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

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
            <OrderCard
              key={order.id}
              order={order}
              onOpenRadar={openRadar}
              onPrint={printInvoice}
              useTimerHook={useOrderTimer}
            />
          ))
        )}
      </div>
    </div>
  );
};

// --- SUB-COMPONENTS TERPISAH AGAR TIMER BERJALAN INDIVIDUAL ---

const OrderCard = ({ order, onOpenRadar, onPrint, useTimerHook }: any) => {
  // 🚀 Panggil Custom Hook Timer untuk masing-masing kartu
  const timer = useTimerHook(
    order.created_at,
    order.status,
    order.shipping_status,
  );

  return (
    <div
      className={`bg-white rounded-md border-l-4 shadow-sm p-3 lg:p-4 group hover:shadow-md transition-all border border-slate-100 relative overflow-hidden ${timer?.isLate ? "border-l-red-600 bg-red-50/30" : "border-l-[#008080]"}`}
    >
      {/* 🚀 INDIKATOR TIMER MERAH (Jika ada) */}
      {timer && (
        <div
          className={`absolute top-0 right-0 px-3 py-1 text-[8px] font-black tracking-widest rounded-bl-lg flex items-center gap-1 shadow-sm ${timer.isLate ? "bg-red-600 text-white animate-pulse" : "bg-orange-100 text-orange-700"}`}
        >
          <Clock size={10} /> {timer.type}: {timer.text}
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center gap-4 mt-2 lg:mt-0">
        {/* IDENTITAS */}
        <div className="lg:w-1/3 space-y-2">
          <div className="flex items-center justify-between pr-20 lg:pr-0">
            <span className="text-[9px] bg-slate-900 text-white px-1.5 py-0.5 rounded-sm font-black">
              ID: {order.id.slice(0, 8).toUpperCase()}
            </span>
            {!timer && (
              <span className="text-[9px] text-slate-400 font-black flex items-center gap-1 uppercase">
                <Clock size={10} />{" "}
                {new Date(order.created_at).toLocaleTimeString()}
              </span>
            )}
          </div>
          <div>
            <h4 className="text-[14px] md:text-[16px] text-slate-900 font-black leading-none truncate">
              {order.customer?.name || "PEMBELI"}
            </h4>
            <p className="text-[9px] text-[#008080] font-black flex items-center gap-1 mt-1">
              <Store size={10} /> {order.merchant?.shop_name}
            </p>
          </div>
          <div className="flex items-start gap-1.5 text-slate-500 bg-slate-50 p-2 rounded-md border border-slate-100">
            <MapPin size={12} className="text-[#FF6600] shrink-0 mt-0.5" />
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
            done={["SHIPPING", "COMPLETED"].includes(order.shipping_status)}
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

        {/* FINANCE & BUTTONS PRO */}
        <div className="lg:w-1/4 flex flex-col items-end gap-2 border-t lg:border-t-0 lg:border-l border-slate-100 pt-3 lg:pt-0 lg:pl-6">
          <div className="text-right w-full flex lg:block justify-between items-center mb-1">
            <p className="text-[8px] text-slate-400 font-black tracking-widest mb-0.5">
              TAGIHAN
            </p>
            <p className="text-[16px] text-[#FF6600] font-black leading-none">
              RP {order.total_price?.toLocaleString()}
            </p>
          </div>

          <div className="flex gap-2 w-full">
            {order.status === "UNPAID" ? (
              <button
                onClick={() =>
                  window.open(
                    `https://wa.me/${order.customer?.phone_number?.replace(/^0/, "62") || ""}`,
                    "_blank",
                  )
                }
                className="flex-1 py-2 bg-green-600 text-white rounded-md text-[10px] font-black flex items-center justify-center gap-1.5 hover:bg-green-700 transition-all shadow-sm active:translate-y-0.5"
              >
                <MessageCircle size={14} /> TAGIH WA
              </button>
            ) : order.shipping_status === "PACKING" && !order.courier_id ? (
              // 🚀 TOMBOL RADAR (Hanya muncul jika sudah lunas, lagi dikemas, dan belum ada kurir)
              <button
                onClick={() => onOpenRadar(order)}
                className="flex-1 py-2 bg-slate-900 text-[#008080] rounded-md text-[10px] font-black flex items-center justify-center gap-1.5 hover:bg-[#008080] hover:text-white transition-all shadow-sm active:translate-y-0.5 border border-[#008080]"
              >
                <Radar size={14} className="animate-spin-slow" /> RADAR KURIR
              </button>
            ) : (
              <button
                onClick={() => window.open(`/invoice/${order.id}`, "_blank")}
                className="flex-1 py-2 bg-slate-900 text-white rounded-md text-[10px] font-black flex items-center justify-center gap-1.5 hover:bg-[#008080] transition-all shadow-sm active:translate-y-0.5"
              >
                <Eye size={14} /> DETAIL
              </button>
            )}

            {/* 🚀 TOMBOL CETAK RESI THERMAL */}
            <button
              onClick={() => onPrint(order.id)}
              className="px-3 bg-blue-50 text-blue-600 border border-blue-200 rounded-md hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center"
              title="Cetak Struk Thermal"
            >
              <Printer size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

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
