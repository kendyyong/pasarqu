import React, { useState, useEffect, useCallback } from "react";
// ✅ PERBAIKAN PATH: Naik 3 tingkat (../../../)
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

  // ✅ FETCH DATA YANG STABIL (Menggunakan useCallback)
  const fetchOrders = useCallback(
    async (isSilent = false) => {
      if (!user || !merchantProfile?.market_id) return;

      if (!isSilent) setLoading(true);

      try {
        const { data, error } = await supabase
          .from("orders")
          .select(
            `
          *,
          profiles:customer_id (full_name, phone, address),
          order_items (
            quantity,
            price_at_purchase,
            products (name)
          )
        `,
          )
          .eq("market_id", merchantProfile.market_id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        // Filter Client Side: Hanya ambil order yang memiliki items valid
        const myOrders =
          data?.filter(
            (order: any) => order.order_items && order.order_items.length > 0,
          ) || [];

        setOrders(myOrders);
      } catch (err: any) {
        console.error("Fetch Orders Error:", err.message);
      } finally {
        setLoading(false);
      }
    },
    [user, merchantProfile?.market_id],
  );

  // ✅ REALTIME SUBSCRIPTION
  useEffect(() => {
    fetchOrders();

    const marketId = merchantProfile?.market_id;
    if (!marketId) return;

    const channel = supabase
      .channel(`orders_market_${marketId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `market_id=eq.${marketId}`,
        },
        () => {
          // Silent refresh saat ada data baru
          fetchOrders(true);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrders, merchantProfile?.market_id]);

  const handlePrintLabel = (order: any) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const html = `
      <html>
        <head>
          <title>Label Pasarqu - ${order.id.substring(0, 8)}</title>
          <style>
            @page { size: 58mm auto; margin: 0; }
            body { font-family: 'Courier New', monospace; width: 48mm; padding: 5mm; font-size: 11px; line-height: 1.2; }
            .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 5px; }
            .bold { font-weight: bold; }
            .footer { text-align: center; font-size: 9px; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="bold">PASARQU</div>
            <div>${merchantProfile?.shop_name || "TOKO"}</div>
          </div>
          <p><span class="bold">INV:</span> #${order.id.substring(0, 8)}</p>
          <p><span class="bold">KE:</span> ${order.profiles?.full_name || "Pelanggan"}</p>
          <div style="border-bottom:1px dashed #000; margin-bottom:5px"></div>
          ${order.order_items?.map((item: any) => `<div>${item.quantity}x ${item.products?.name || "Produk"}</div>`).join("")}
          <div style="border-top:1px dashed #000; margin-top:5px; font-weight:bold">TOTAL: Rp ${order.total_price?.toLocaleString()}</div>
          <div class="footer">Simpan struk ini sebagai bukti.</div>
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

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
      showToast("Pesanan diproses! Mencari kurir...", "success");
      fetchOrders(true);
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsUpdating(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter === "pending")
      return o.status === "PAID" || o.status === "PENDING";
    if (statusFilter === "shipping")
      return (
        o.status === "READY_FOR_PICKUP" ||
        o.status === "ON_DELIVERY" ||
        o.shipping_status === "ON_THE_WAY"
      );
    if (statusFilter === "completed") return o.status === "COMPLETED";
    return true;
  });

  return (
    <div className="space-y-4 animate-in fade-in duration-500 text-left">
      {/* FILTER HEADER */}
      <div className="bg-white border border-slate-200 p-4 rounded-none flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
        <div>
          <h2 className="text-sm md:text-lg font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2">
            <ShoppingBag size={18} className="text-teal-600" /> Manajemen
            Pesanan
          </h2>
          <p className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            Siapkan produk dan panggil kurir terdekat
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 border border-slate-200 rounded-none overflow-x-auto no-scrollbar">
          <TabButton
            active={statusFilter === "pending"}
            label="BARU"
            onClick={() => setStatusFilter("pending")}
            count={orders.filter((o) => o.status === "PAID").length}
          />
          <TabButton
            active={statusFilter === "shipping"}
            label="DIKIRIM"
            onClick={() => setStatusFilter("shipping")}
            count={orders.filter((o) => o.status === "READY_FOR_PICKUP").length}
          />
          <TabButton
            active={statusFilter === "completed"}
            label="SELESAI"
            onClick={() => setStatusFilter("completed")}
          />
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="animate-spin text-teal-600 mx-auto" size={24} />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="py-20 text-center bg-white border border-dashed border-slate-200 rounded-none">
          <AlertCircle size={32} className="mx-auto text-slate-200 mb-2" />
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">
            Tidak ada pesanan di tab ini
          </p>
        </div>
      ) : (
        <div className="grid gap-2">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-slate-200 rounded-none hover:border-slate-900 transition-all shadow-sm"
            >
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight font-mono">
                    #{order.id.substring(0, 8)}
                  </p>
                  <div className="flex items-center gap-1 text-slate-400">
                    <Clock size={10} />
                    <span className="text-[8px] font-bold uppercase">
                      {new Date(order.created_at).toLocaleTimeString("id-ID")}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePrintLabel(order)}
                    className="p-1.5 border border-slate-200 text-slate-400 hover:text-slate-900 bg-white rounded-none"
                  >
                    <Printer size={14} />
                  </button>
                  <span
                    className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest ${
                      order.status === "PAID"
                        ? "bg-orange-500 text-white"
                        : "bg-teal-600 text-white"
                    }`}
                  >
                    {order.status === "PAID" ? "PERLU PROSES" : order.status}
                  </span>
                </div>
              </div>

              <div className="p-4 border-b border-slate-100 space-y-2">
                {order.order_items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-start">
                    <p className="text-[10px] font-black text-slate-800 uppercase leading-none">
                      {item.quantity}x {item.products?.name}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400">
                      Rp {item.price_at_purchase?.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-2 max-w-sm text-left">
                  <MapPin size={12} className="text-teal-600 shrink-0 mt-0.5" />
                  <p className="text-[9px] font-bold uppercase tracking-tight text-slate-500 leading-tight">
                    {order.profiles?.address ||
                      order.address ||
                      "Ambil di Toko"}
                  </p>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-3 md:pt-0 border-dashed border-slate-100">
                  <div className="text-left md:text-right">
                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                      Total Tagihan
                    </p>
                    <p className="text-xs md:text-sm font-black text-teal-600 tracking-tighter leading-none italic">
                      Rp {order.total_price?.toLocaleString()}
                    </p>
                  </div>

                  {order.status === "PAID" && (
                    <button
                      disabled={isUpdating === order.id}
                      onClick={() => handleProcessOrder(order.id)}
                      className="px-6 py-3 bg-slate-900 text-white rounded-none font-black text-[9px] uppercase tracking-widest flex items-center gap-2 hover:bg-teal-600 transition-all active:scale-95 shadow-lg"
                    >
                      {isUpdating === order.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Send size={12} />
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
    className={`px-4 py-2 rounded-none text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
      active
        ? "bg-white text-slate-900 border-b-2 border-slate-900"
        : "text-slate-400 hover:text-slate-600"
    }`}
  >
    {label}
    {count > 0 && (
      <span className="bg-red-500 text-white text-[7px] px-1.5 py-0.5 rounded-full font-bold">
        {count}
      </span>
    )}
  </button>
);
