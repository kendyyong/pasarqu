import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
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
  KeyRound,
  UserCheck,
  X,
  Truck, // 🚀 FIX 1: Ikon Truck sudah ditambahkan di sini
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

  // STATE UNTUK MODAL PIN AMBIL SENDIRI
  const [pinModalOrder, setPinModalOrder] = useState<any>(null);
  const [pinInput, setPinInput] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

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
              total_merchants, address, notes, customer_id,
              shipping_method, pickup_code, pickup_expired_at
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

  // PROSES PESANAN MASUK
  const handleProcessOrder = async (order: any) => {
    setIsUpdating(order.id);
    const isPickup = order.shipping_method === "pickup";

    try {
      const { error } = await supabase
        .from("orders")
        .update({
          status: "PACKING",
          shipping_status: isPickup ? "READY_TO_PICKUP" : "SEARCHING_COURIER",
        })
        .eq("id", order.id);

      if (error) throw error;
      showToast(
        isPickup ? "PESANAN DISIAPKAN!" : "PESANAN DITERIMA. MENCARI KURIR...",
        "success",
      );
      fetchOrders(true);
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsUpdating(null);
    }
  };

  // VERIFIKASI PIN & CAIRKAN UANG UNTUK AMBIL SENDIRI
  const handleVerifyPIN = async () => {
    if (!pinModalOrder || pinInput.length !== 4) {
      showToast("Masukkan 4 digit PIN dengan benar", "error");
      return;
    }
    setIsVerifying(true);

    try {
      if (new Date() > new Date(pinModalOrder.pickup_expired_at)) {
        throw new Error(
          "WAKTU PENGAMBILAN 1x24 JAM SUDAH HABIS. DANA DITAHAN SISTEM.",
        );
      }

      if (pinInput !== pinModalOrder.pickup_code) {
        throw new Error("PIN YANG DIMASUKKAN SALAH!");
      }

      const { error: rpcError } = await supabase.rpc(
        "complete_order_transaction",
        { p_order_id: pinModalOrder.id },
      );

      if (rpcError) throw rpcError;

      showToast("PIN COCOK! PESANAN SELESAI & SALDO MASUK.", "success");
      setPinModalOrder(null);
      setPinInput("");
      fetchOrders(true);
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsVerifying(false);
    }
  };

  const handlePrintLabel = (order: any) => {
    window.open(`/invoice/${order.id}`, "_blank");
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter === "pending")
      return o.status === "PAID" || o.status === "PENDING";
    if (statusFilter === "shipping")
      return (
        ["PACKING", "ON_DELIVERY", "SHIPPING"].includes(o.status) ||
        ["SEARCHING_COURIER", "READY_TO_PICKUP"].includes(o.shipping_status)
      );
    if (statusFilter === "completed") return o.status === "COMPLETED";
    return true;
  });

  return (
    <>
      {/* MODAL INPUT PIN PEMBELI */}
      {pinModalOrder &&
        createPortal(
          <div className="fixed inset-0 z-[99999] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl relative">
              <button
                onClick={() => {
                  setPinModalOrder(null);
                  setPinInput("");
                }}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200"
              >
                <X size={16} />
              </button>
              <div className="bg-[#FF6600] p-8 text-center text-white flex flex-col items-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
                  <KeyRound size={32} />
                </div>
                <h3 className="font-black tracking-widest uppercase text-[16px]">
                  VERIFIKASI PIN
                </h3>
                <p className="text-[10px] mt-2 opacity-80 uppercase tracking-widest font-bold">
                  Minta 4 Angka Rahasia ke Pembeli
                </p>
              </div>
              <div className="p-8 space-y-6 text-center">
                <input
                  type="text"
                  maxLength={4}
                  value={pinInput}
                  onChange={(e) =>
                    setPinInput(e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="0 0 0 0"
                  className="w-full text-center text-[32px] font-black tracking-[1em] py-4 border-b-4 border-slate-200 focus:border-[#FF6600] outline-none text-slate-800 transition-colors bg-slate-50 rounded-t-xl"
                />
                <div className="bg-red-50 p-3 rounded-xl border border-red-100 flex items-start gap-2 text-left">
                  <AlertCircle
                    size={14}
                    className="text-red-500 shrink-0 mt-0.5"
                  />
                  <p className="text-[9px] font-black text-red-600 uppercase leading-relaxed">
                    Batas waktu verifikasi 1x24 jam. Jika lewat batas, dana
                    tidak akan cair ke toko.
                  </p>
                </div>
                <button
                  disabled={isVerifying || pinInput.length !== 4}
                  onClick={handleVerifyPIN}
                  className="w-full py-4 rounded-xl bg-[#008080] text-white font-black uppercase text-[12px] tracking-[0.1em] active:scale-95 transition-all disabled:opacity-50 disabled:bg-slate-300 flex justify-center items-center gap-2 shadow-lg"
                >
                  {isVerifying ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <UserCheck size={18} />
                  )}
                  VALIDASI & CAIRKAN DANA
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      <div className="w-full space-y-6 animate-in fade-in duration-500 text-left font-sans pb-20">
        {/* HEADER & FILTER TABS */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h2 className="text-[18px] font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2 leading-none">
              <ShoppingBag size={20} className="text-[#008080]" /> Daftar
              Pesanan
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
            {filteredOrders.map((order) => {
              const isPickup = order.shipping_method === "pickup";

              return (
                <div
                  key={order.id}
                  className={`bg-white border-2 rounded-[1.5rem] shadow-sm overflow-hidden transition-all group ${
                    isPickup
                      ? "border-[#FF6600]/30 hover:border-[#FF6600]"
                      : "border-slate-200 hover:border-[#008080]"
                  }`}
                >
                  {/* ORDER TOP BAR */}
                  <div
                    className={`px-5 py-4 flex justify-between items-center border-b ${isPickup ? "bg-orange-50/50 border-orange-100" : "bg-slate-50/50 border-slate-100"}`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`px-3 py-1.5 rounded-lg border shadow-sm flex items-center gap-2 ${isPickup ? "bg-white border-orange-200 text-[#FF6600]" : "bg-white border-slate-100 text-[#008080]"}`}
                      >
                        {isPickup ? (
                          <ShoppingBag size={14} />
                        ) : (
                          <Truck size={14} />
                        )}
                        <span className="text-[11px] font-black uppercase tracking-tighter">
                          {isPickup ? "AMBIL SENDIRI" : "KURIR PASAR"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Clock size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-tight">
                          {new Date(order.created_at).toLocaleTimeString(
                            "id-ID",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
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

                  {/* BOTTOM INFO & ACTION */}
                  <div className="px-5 py-5 bg-white border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-start gap-3 w-full md:w-auto">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isPickup ? "bg-orange-50 text-[#FF6600]" : "bg-teal-50 text-[#008080]"}`}
                      >
                        <MapPin size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-[11px] font-bold text-slate-800 uppercase">
                            {order.customer?.full_name}
                          </p>
                          <span className="text-slate-300">•</span>
                          <p className="text-[10px] font-bold text-[#008080]">
                            {order.customer?.phone_number ||
                              order.customer?.phone}
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

                      {/* TOMBOL AKSI BERDASARKAN STATUS DAN METODE PENGIRIMAN */}
                      {order.status === "PAID" ? (
                        <button
                          disabled={isUpdating === order.id}
                          onClick={() => handleProcessOrder(order)}
                          className={`px-8 py-4 text-white font-bold text-[12px] uppercase tracking-[0.1em] rounded-xl active:scale-95 transition-all flex items-center justify-center gap-3 shadow-lg ${
                            isPickup
                              ? "bg-[#FF6600] hover:bg-orange-700 shadow-orange-900/10"
                              : "bg-[#008080] hover:bg-slate-800 shadow-teal-900/10"
                          }`}
                        >
                          {isUpdating === order.id ? (
                            <Loader2 size={18} className="animate-spin" />
                          ) : isPickup ? (
                            <Package size={18} />
                          ) : (
                            <Send size={18} />
                          )}
                          {isPickup
                            ? "TERIMA & SIAPKAN BARANG"
                            : "TERIMA & PANGGIL KURIR"}
                        </button>
                      ) : order.status === "PACKING" && isPickup ? (
                        <button
                          onClick={() => setPinModalOrder(order)}
                          className="px-6 py-4 bg-slate-900 text-white font-black text-[11px] uppercase tracking-widest rounded-xl hover:bg-[#FF6600] transition-colors flex items-center gap-2 shadow-xl"
                        >
                          <KeyRound size={16} className="animate-pulse" /> INPUT
                          PIN PEMBELI
                        </button>
                      ) : (
                        <div className="px-6 py-3 bg-slate-100 text-slate-500 font-bold text-[11px] uppercase tracking-widest rounded-xl flex items-center gap-2">
                          <Loader2 size={14} className="animate-spin" />
                          {isPickup ? "MENUNGGU DIAMBIL" : "MENUNGGU KURIR"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

// 🚀 FIX 2: Perbaikan sintaks className pada TabButton agar tidak memunculkan error boolean
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
    {count !== undefined && count > 0 && (
      <span
        className={`ml-2 text-[9px] px-1.5 py-0.5 rounded-md font-black ${
          active ? "bg-white text-[#008080]" : "bg-red-500 text-white"
        }`}
      >
        {count}
      </span>
    )}
  </button>
);

export default MerchantOrders;
// --- AKHIR FILE ---
