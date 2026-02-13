import React, { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useAuth } from "../../../contexts/AuthContext";
import { useToast } from "../../../contexts/ToastContext";
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  Truck,
  MoreVertical,
  ExternalLink,
  Loader2,
  Calendar,
  User,
  MapPin,
  Send,
  Printer, // Ikon baru untuk cetak
  X,
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

  const fetchOrders = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          profiles:customer_id (full_name, phone_number, address),
          order_items:order_items (
            quantity,
            price,
            product_name
          )
        `,
        )
        .eq("merchant_id", merchantProfile?.id || user.id)
        .order("created_at", { ascending: false });

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

    const channel = supabase
      .channel("merchant_orders_channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `merchant_id=eq.${merchantProfile?.id || user?.id}`,
        },
        () => fetchOrders(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, merchantProfile]);

  // --- FUNGSI CETAK LABEL PROFESIONAL (Thermal Printer Ready) ---
  const handlePrintLabel = (order: any) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>Label Pasarqu - ${order.id.substring(0, 8)}</title>
          <style>
            @page { size: 58mm auto; margin: 0; }
            body { 
              font-family: 'Courier New', Courier, monospace; 
              width: 48mm; 
              padding: 5mm; 
              font-size: 11px; 
              color: #000;
              line-height: 1.2;
            }
            .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 5px; }
            .logo { font-size: 14px; font-weight: bold; }
            .info { margin-bottom: 5px; }
            .items { border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 5px; }
            .item { display: flex; justify-content: space-between; margin-bottom: 2px; }
            .footer { text-align: center; font-size: 9px; margin-top: 8px; }
            .bold { font-weight: bold; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">PASARQU</div>
            <div class="bold">${merchantProfile?.shop_name || "TOKO PASAR"}</div>
          </div>
          
          <div class="info">
            <span class="bold">INV:</span> #${order.id.substring(0, 8)}<br>
            <span class="bold">TGL:</span> ${new Date(order.created_at).toLocaleDateString("id-ID")}<br>
            <span class="bold">KE:</span> ${order.profiles?.full_name || "Pelanggan"}
          </div>

          <div class="items">
            ${order.order_items
              ?.map(
                (item: any) => `
              <div class="item">
                <span>${item.quantity}x ${item.product_name || "Produk"}</span>
              </div>
            `,
              )
              .join("")}
          </div>

          <div class="item bold">
            <span>TOTAL</span>
            <span>Rp ${order.total_amount?.toLocaleString()}</span>
          </div>

          <div class="footer">
            <p>Simpan struk ini sebagai bukti belanja.<br>Dibuat via Aplikasi Pasarqu.</p>
          </div>

          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
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
        .update({ status: "READY_FOR_PICKUP" })
        .eq("id", orderId);

      if (error) throw error;
      showToast("Pesanan diproses! Mencari kurir terdekat...", "success");
    } catch (err: any) {
      showToast("Gagal memproses pesanan: " + err.message, "error");
    } finally {
      setIsUpdating(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter === "pending")
      return o.status === "pending" || o.status === "READY_FOR_PICKUP";
    if (statusFilter === "shipping") return o.status === "ON_DELIVERY";
    if (statusFilter === "completed") return o.status === "completed";
    return true;
  });

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 text-left">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
            Manajemen Pesanan
          </h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
            Siapkan produk dan cetak label pengiriman
          </p>
        </div>
      </div>

      {/* STATUS TABS */}
      <div className="flex p-1 bg-slate-100 rounded-2xl w-full md:w-fit border border-slate-200">
        <TabButton
          active={statusFilter === "pending"}
          label="Perlu Diproses"
          onClick={() => setStatusFilter("pending")}
          count={orders.filter((o) => o.status === "pending").length}
        />
        <TabButton
          active={statusFilter === "shipping"}
          label="Dalam Pengiriman"
          onClick={() => setStatusFilter("shipping")}
          count={orders.filter((o) => o.status === "ON_DELIVERY").length}
        />
        <TabButton
          active={statusFilter === "completed"}
          label="Selesai"
          onClick={() => setStatusFilter("completed")}
        />
      </div>

      {/* ORDERS LIST */}
      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="animate-spin text-teal-600 mx-auto" size={40} />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-20 text-center opacity-30 flex flex-col items-center">
          <ShoppingBag size={48} className="mx-auto mb-4 text-slate-300" />
          <p className="font-black uppercase text-[10px] tracking-[0.3em]">
            Belum ada pesanan {statusFilter}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow group"
            >
              {/* Card Header */}
              <div className="p-5 border-b border-slate-50 bg-slate-50/50 flex flex-wrap justify-between items-center gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-teal-600 shadow-sm font-black text-xs">
                    {order.profiles?.full_name?.substring(0, 1).toUpperCase() ||
                      "U"}
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-800 uppercase tracking-tight">
                      {order.profiles?.full_name || "Pembeli Pasarqu"}
                    </p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase flex items-center gap-1">
                      <Clock size={10} />{" "}
                      {new Date(order.created_at).toLocaleTimeString("id-ID")} •
                      ID: #{order.id.substring(0, 8)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* TOMBOL CETAK LABEL (FITUR PRO) */}
                  <button
                    onClick={() => handlePrintLabel(order)}
                    className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-900 rounded-xl transition-all shadow-sm"
                    title="Cetak Label"
                  >
                    <Printer size={18} />
                  </button>
                  <span
                    className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                      order.status === "pending"
                        ? "bg-orange-50 text-orange-600 border-orange-100"
                        : "bg-teal-50 text-teal-600 border-teal-100"
                    }`}
                  >
                    {order.status === "pending"
                      ? "Baru"
                      : order.status.replace(/_/g, " ")}
                  </span>
                </div>
              </div>

              {/* Card Body (Items) */}
              <div className="p-5 space-y-4">
                {order.order_items?.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-4 border-b border-slate-50 pb-2 last:border-0 last:pb-0"
                  >
                    <div className="flex-1 text-left">
                      <p className="text-xs font-bold text-slate-800 leading-tight uppercase">
                        {item.product_name}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium">
                        x{item.quantity} Unit
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-slate-800 italic">
                        Rp {(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Card Footer */}
              <div className="p-5 border-t border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-2 max-w-sm text-left">
                  <MapPin size={14} className="text-teal-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] font-bold uppercase tracking-tight text-slate-500 leading-relaxed line-clamp-2">
                    {order.profiles?.address ||
                      "Alamat Pengiriman Sesuai Sistem"}
                  </p>
                </div>
                <div className="flex items-center justify-between md:justify-end gap-6">
                  <div className="text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                      Total Belanja
                    </p>
                    <p className="text-lg font-black text-teal-600 tracking-tighter">
                      Rp {order.total_amount?.toLocaleString()}
                    </p>
                  </div>

                  {order.status === "pending" && (
                    <button
                      disabled={isUpdating === order.id}
                      onClick={() => handleProcessOrder(order.id)}
                      className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-teal-600 transition-all active:scale-95 flex items-center gap-2"
                    >
                      {isUpdating === order.id ? (
                        <Loader2 className="animate-spin" size={14} />
                      ) : (
                        <Send size={14} className="text-teal-400" />
                      )}
                      Proses & Panggil Kurir
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
    className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
      active
        ? "bg-white text-teal-600 shadow-sm"
        : "text-slate-400 hover:text-slate-600"
    }`}
  >
    {label}
    {count > 0 && (
      <span className="bg-orange-500 text-white text-[9px] px-1.5 py-0.5 rounded-md font-bold">
        {count}
      </span>
    )}
  </button>
);
