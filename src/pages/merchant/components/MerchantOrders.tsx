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
        // STEP 1: Ambil items
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

        // STEP 2: Ambil Produk & Profiles secara paralel agar cepat
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
            .select("id, full_name, phone")
            .in("id", customerIds),
        ]);

        const products = resProducts.data || [];
        const customers = resCustomers.data || [];

        // STEP 4: Gabungkan data dengan proteksi null (Safety Check)
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
    const channelName = `merchant_orders_${user?.id || "guest"}_${Date.now()}`;
    const channel = supabase
      .channel(channelName)
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

  const handleProcessOrder = async (orderId: string) => {
    setIsUpdating(orderId);
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          status: "READY_FOR_PICKUP",
          shipping_status: "SEARCHING_COURIER",
        })
        .eq("id", orderId);

      if (error) throw error;
      showToast("Mencari kurir terdekat...", "success");
      fetchOrders(true);
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsUpdating(null);
    }
  };

  // ✅ REDIRECT KE HALAMAN INVOICE BARU
  const handlePrintLabel = (order: any) => {
    // Membuka halaman Invoice Lebar dengan Cap Lunas di tab baru
    window.open(`/invoice/${order.id}`, "_blank");
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter === "pending")
      return o.status === "PAID" || o.status === "PENDING";
    if (statusFilter === "shipping")
      return ["READY_FOR_PICKUP", "ON_DELIVERY"].includes(o.status);
    if (statusFilter === "completed") return o.status === "COMPLETED";
    return true;
  });

  return (
    <div className="space-y-4 animate-in fade-in duration-500 text-left font-sans pb-20">
      <div className="bg-white border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2">
            <ShoppingBag size={20} className="text-teal-600" /> Pesanan Masuk
          </h2>
          <p className="text-[10px] font-black text-slate-400 uppercase mt-0.5">
            Admin Toko Pasarqu
          </p>
        </div>
        <div className="flex bg-slate-100 p-1 border border-slate-200">
          <TabButton
            active={statusFilter === "pending"}
            label="BARU"
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
          <Loader2 className="animate-spin text-teal-600" size={32} />
          <p className="font-black text-[10px] text-slate-400 uppercase tracking-widest">
            Menghubungkan ke Pasar...
          </p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="py-20 text-center bg-white border border-dashed border-slate-200">
          <AlertCircle size={40} className="mx-auto text-slate-100 mb-2" />
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest text-center">
            Belum ada pesanan masuk
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white border-2 border-slate-100 shadow-sm overflow-hidden hover:border-teal-500 transition-all"
            >
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-black text-slate-900 font-mono">
                    #{order.id.toString().substring(0, 8)}
                  </span>
                  <div className="flex items-center gap-1 text-slate-400">
                    <Clock size={12} />
                    <span className="text-[9px] font-bold uppercase">
                      {new Date(order.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePrintLabel(order)}
                    className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-teal-600 active:scale-90 transition-transform"
                    title="Cetak Invoice Lebar"
                  >
                    <Printer size={16} />
                  </button>
                  <span className="px-3 py-1 bg-teal-600 text-white text-[9px] font-black uppercase tracking-widest">
                    {order.status}
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-3 text-left">
                {order.my_items?.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center bg-slate-50 p-3 border border-slate-100"
                  >
                    <div className="flex-1">
                      <p className="text-[11px] font-black text-slate-800 uppercase leading-none mb-1">
                        {item.product_details?.name}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">
                        {item.quantity} {item.product_details?.unit} x Rp{" "}
                        {item.price_at_purchase?.toLocaleString()}
                      </p>
                    </div>
                    <p className="text-xs font-black text-teal-700">
                      Rp{" "}
                      {(
                        item.quantity * item.price_at_purchase
                      ).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              {/* RINCIAN BIAYA PECAHAN */}
              <div className="px-4 py-3 bg-white border-t border-slate-50 space-y-2 text-left">
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                  <span>Admin Aplikasi</span>
                  <span>Rp {order.service_fee?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                  <span>Kurir (Pokok)</span>
                  <span>
                    Rp{" "}
                    {(
                      order.shipping_cost - (order.courier_surge_fee || 0)
                    ).toLocaleString()}
                  </span>
                </div>
                {order.courier_surge_fee > 0 && (
                  <div className="flex justify-between text-[10px] font-black text-orange-600 uppercase">
                    <div className="flex items-center gap-1">
                      <Store size={10} />
                      <span>Ekstra Toko</span>
                    </div>
                    <span>
                      + Rp {order.courier_surge_fee?.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              <div className="px-4 py-4 bg-slate-50 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-start gap-2 text-left w-full md:w-auto">
                  <MapPin size={14} className="text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">
                      Penerima: {order.customer?.full_name}
                    </p>
                    <p className="text-[10px] font-bold text-slate-600 uppercase mt-1 line-clamp-1">
                      {order.address}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                  <div className="text-right">
                    <p className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">
                      Total Bayar
                    </p>
                    <p className="text-xl font-black text-orange-500 tracking-tighter leading-none mt-1">
                      Rp {order.total_price?.toLocaleString()}
                    </p>
                  </div>
                  {order.status === "PAID" && (
                    <button
                      disabled={isUpdating === order.id}
                      onClick={() => handleProcessOrder(order.id)}
                      className="px-6 py-3 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest hover:bg-teal-700 active:scale-95 transition-all shadow-lg"
                    >
                      {isUpdating === order.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Send size={14} />
                      )}
                      PANGGIL KURIR
                    </button>
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
    className={`flex-1 md:flex-none px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
      active
        ? "bg-white text-slate-900 border-b-2 border-slate-900 shadow-sm"
        : "text-slate-400"
    }`}
  >
    {label}{" "}
    {count > 0 && (
      <span className="ml-1 bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold">
        {count}
      </span>
    )}
  </button>
);
