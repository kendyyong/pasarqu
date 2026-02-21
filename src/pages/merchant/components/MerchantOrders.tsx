import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useAuth } from "../../../contexts/AuthContext";
import { useToast } from "../../../contexts/ToastContext";
import {
  ShoppingBag,
  Clock,
  Loader2,
  MapPin,
  Send,
  Printer,
  AlertCircle,
  Package,
  Store,
  CreditCard,
  ChevronRight,
  User,
  Phone,
} from "lucide-react";

interface Props {
  merchantProfile: any;
}

export const MerchantOrders: React.FC<Props> = ({ merchantProfile }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const fetchOrders = useCallback(
    async (isSilent = false) => {
      if (!user?.id) return;
      if (!isSilent) setLoading(true);

      try {
        const { data: items, error: itemsError } = await supabase
          .from("order_items")
          .select(
            `
            *,
            orders!inner (
              id, status, shipping_status, created_at, total_price,
              shipping_cost, service_fee, courier_surge_fee,
              total_merchants, address, notes, customer_id
            )
          `,
          )
          .eq("merchant_id", user.id);

        if (itemsError) throw itemsError;

        if (!items || items.length === 0) {
          setOrders([]);
          setLoading(false);
          return;
        }

        const productIds = [...new Set(items.map((i) => i.product_id))];
        const customerIds = [
          ...new Set(items.map((i) => i.orders?.customer_id)),
        ].filter(Boolean);

        const [resProducts, resCustomers] = await Promise.all([
          supabase
            .from("products")
            .select("id, name, image_url, unit")
            .in("id", productIds),
          supabase
            .from("profiles")
            .select("id, full_name, phone_number")
            .in("id", customerIds),
        ]);

        const products = resProducts.data || [];
        const customers = resCustomers.data || [];

        const grouped = items.reduce((acc: any, item: any) => {
          const orderData = item.orders;
          if (!orderData) return acc;
          const orderId = orderData.id;

          if (!acc[orderId]) {
            const customer = customers.find(
              (c) => c.id === orderData.customer_id,
            );
            acc[orderId] = {
              ...orderData,
              customer: customer || { full_name: "PELANGGAN PASARQU" },
              my_items: [],
            };
          }

          const product = products.find((p) => p.id === item.product_id);
          acc[orderId].my_items.push({
            ...item,
            product_details: product || {
              name: "PRODUK TIDAK TERDAFTAR",
              unit: "PCS",
            },
          });
          return acc;
        }, {});

        const sortedOrders = Object.values(grouped).sort(
          (a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );

        setOrders(sortedOrders);
      } catch (err: any) {
        console.error("Fetch Orders Error:", err.message);
      } finally {
        setLoading(false);
      }
    },
    [user?.id],
  );

  useEffect(() => {
    fetchOrders();
    const channel = supabase
      .channel(`merchant_orders_${user?.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => fetchOrders(true),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrders, user?.id]);

  // 🚀 PERBAIKAN: Selaraskan Status agar "Radar" Pelanggan Merespons
  const handleProcessOrder = async (orderId: string) => {
    setIsUpdating(orderId);
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          // Ubah status ke PACKING agar progress bar di HP pembeli maju ke "DIKEMAS"
          status: "PACKING",
          shipping_status: "SEARCHING_COURIER",
        })
        .eq("id", orderId);

      if (error) throw error;
      showToast("PESANAN DITERIMA. MENCARI KURIR...", "success");
      fetchOrders(true);
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsUpdating(null);
    }
  };

  const handlePrintLabel = (order: any) => {
    window.open(`/invoice/${order.id}`, "_blank");
  };

  // Sesuaikan filter dengan status baru
  const filteredOrders = orders.filter((o) => {
    if (statusFilter === "pending")
      return o.status === "PAID" || o.status === "PENDING";
    if (statusFilter === "shipping")
      return (
        ["PACKING", "READY_FOR_PICKUP", "ON_DELIVERY", "SHIPPING"].includes(
          o.status,
        ) || ["SEARCHING_COURIER"].includes(o.shipping_status)
      );
    if (statusFilter === "completed") return o.status === "COMPLETED";
    return true;
  });

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500 text-left font-sans pb-20">
      {/* HEADER & FILTER TABS */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-[18px] font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2 leading-none">
            <ShoppingBag size={20} className="text-[#008080]" /> Daftar Pesanan
          </h2>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-2">
            Kelola Transaksi Penjualan Toko
          </p>
        </div>

        <div className="flex bg-slate-50 p-1.5 rounded-xl border border-slate-100 w-full md:w-auto">
          <TabButton
            active={statusFilter === "pending"}
            label="MASUK"
            onClick={() => setStatusFilter("pending")}
            count={orders.filter((o) => o.status === "PAID").length}
          />
          <TabButton
            active={statusFilter === "shipping"}
            label="PROSES"
            onClick={() => setStatusFilter("shipping")}
          />
          <TabButton
            active={statusFilter === "completed"}
            label="SELESAI"
            onClick={() => setStatusFilter("completed")}
          />
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-[#008080]" size={32} />
          <p className="font-bold text-[10px] text-slate-400 uppercase tracking-widest">
            Sinkronisasi Pasar...
          </p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="py-24 text-center bg-white border border-dashed border-slate-200 rounded-[2rem]">
          <AlertCircle size={48} className="mx-auto text-slate-100 mb-4" />
          <p className="text-[12px] font-bold text-slate-300 uppercase tracking-widest">
            Belum ada pesanan aktif
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-slate-200 rounded-[1.5rem] shadow-sm overflow-hidden hover:border-[#008080] transition-all group"
            >
              {/* ORDER TOP BAR */}
              <div className="px-5 py-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm">
                    <span className="text-[11px] font-black text-slate-900 font-mono tracking-tighter">
                      ORD#{order.id.toString().substring(0, 8).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Clock size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-tight">
                      {new Date(order.created_at).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handlePrintLabel(order)}
                    className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-[#008080] hover:border-[#008080] rounded-xl active:scale-90 transition-all shadow-sm"
                    title="Cetak Invoice"
                  >
                    <Printer size={16} />
                  </button>
                  <span
                    className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                      order.status === "PAID"
                        ? "bg-teal-50 text-[#008080]"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>

              {/* ITEMS LIST */}
              <div className="p-5 space-y-3">
                {order.my_items?.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 shrink-0">
                        <Package size={20} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12px] font-bold text-slate-800 uppercase leading-none mb-1.5">
                          {item.product_details?.name}
                        </p>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                          {item.quantity} {item.product_details?.unit} x Rp
                          {item.price_at_purchase?.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <p className="text-[13px] font-black text-[#008080] tracking-tighter">
                      Rp
                      {(
                        item.quantity * item.price_at_purchase
                      ).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              {/* FEE BREAKDOWN */}
              <div className="px-5 py-4 bg-slate-50/30 border-t border-slate-50 space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <span>Biaya Admin</span>
                  <span>Rp{order.service_fee?.toLocaleString() || 0}</span>
                </div>
                {order.courier_surge_fee > 0 && (
                  <div className="flex justify-between text-[10px] font-bold text-orange-600 uppercase tracking-widest">
                    <div className="flex items-center gap-1">
                      <Store size={10} /> <span>Ekstra Jarak Toko</span>
                    </div>
                    <span>+ Rp{order.courier_surge_fee?.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* BOTTOM INFO & ACTION */}
              <div className="px-5 py-5 bg-white border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-start gap-3 w-full md:w-auto">
                  <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center text-[#008080] shrink-0">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-[11px] font-bold text-slate-800 uppercase">
                        {order.customer?.full_name}
                      </p>
                      <span className="text-slate-300">•</span>
                      <p className="text-[10px] font-bold text-[#008080]">
                        {order.customer?.phone_number || order.customer?.phone}
                      </p>
                    </div>
                    <p className="text-[11px] font-medium text-slate-400 uppercase leading-tight line-clamp-1">
                      {order.address}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0 border-slate-50">
                  <div className="text-right">
                    <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.2em] mb-1">
                      Total Bayar
                    </p>
                    <p className="text-2xl font-black text-orange-500 tracking-tighter leading-none">
                      Rp{order.total_price?.toLocaleString()}
                    </p>
                  </div>

                  {order.status === "PAID" ? (
                    <button
                      disabled={isUpdating === order.id}
                      onClick={() => handleProcessOrder(order.id)}
                      className="px-8 py-4 bg-[#008080] text-white font-bold text-[12px] uppercase tracking-[0.1em] rounded-xl hover:bg-slate-800 active:scale-95 transition-all shadow-lg shadow-teal-900/10 flex items-center justify-center gap-3"
                    >
                      {isUpdating === order.id ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Send size={18} />
                      )}
                      TERIMA & PANGGIL KURIR
                    </button>
                  ) : (
                    <div className="px-6 py-3 bg-slate-100 text-slate-500 font-bold text-[11px] uppercase tracking-widest rounded-xl flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin" />
                      MENUNGGU KURIR
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const TabButton = ({ active, label, onClick, count }: any) => (
  <button
    onClick={onClick}
    className={`flex-1 md:flex-none px-6 py-2.5 text-[11px] font-bold uppercase tracking-widest transition-all rounded-lg ${
      active
        ? "bg-[#008080] text-white shadow-md shadow-teal-900/10"
        : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
    }`}
  >
    {label}
    {count > 0 && (
      <span
        className={`ml-2 text-[9px] px-1.5 py-0.5 rounded-md font-black ${active ? "bg-white text-[#008080]" : "bg-red-500 text-white"}`}
      >
        {count}
      </span>
    )}
  </button>
);
