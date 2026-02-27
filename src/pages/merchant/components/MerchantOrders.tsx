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
  Truck,
  Search,
  MessageCircle,
  Ban,
  CheckCircle2,
  Trash2,
  DownloadCloud, // 🚀 IKON BARU UNTUK EXCEL
} from "lucide-react";

interface Props {
  merchantProfile: any;
  stopAlarm?: () => void;
}

export const MerchantOrders: React.FC<Props> = ({
  merchantProfile,
  stopAlarm,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date().getTime());
  const [hiddenOrders, setHiddenOrders] = useState<string[]>([]);
  const [pinModalOrder, setPinModalOrder] = useState<any>(null);
  const [pinInput, setPinInput] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (user?.id) {
      const hidden = JSON.parse(
        localStorage.getItem(`merchant_hidden_orders_${user.id}`) || "[]",
      );
      setHiddenOrders(hidden);
    }
  }, [user?.id]);

  useEffect(() => {
    const timer = setInterval(
      () => setCurrentTime(new Date().getTime()),
      60000,
    );
    return () => clearInterval(timer);
  }, []);

  const fetchOrders = useCallback(
    async (isSilent = false) => {
      if (!user?.id) return;
      if (!isSilent) setLoading(true);

      try {
        const { data: items, error: itemsError } = await supabase
          .from("order_items")
          .select(
            `*, orders!inner (id, status, shipping_status, created_at, total_price, shipping_cost, service_fee, courier_surge_fee, total_merchants, address, notes, customer_id, shipping_method, pickup_code, pickup_expired_at)`,
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
    if (!user?.id) return;
    const channel = supabase
      .channel(`live_orders_merchant_hub_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "order_items",
          filter: `merchant_id=eq.${user.id}`,
        },
        () => fetchOrders(true),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        () => fetchOrders(true),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrders, user?.id]);

  // 🚀 FUNGSI EXPORT EXCEL/CSV LEVEL DEWA
  const handleExportCSV = () => {
    try {
      if (orders.length === 0)
        return showToast("Belum ada data untuk diexport", "error");

      let csvContent =
        "ID PESANAN,TANGGAL,PELANGGAN,NO HP,STATUS,TOTAL BAYAR (RP)\n";

      orders.forEach((o) => {
        const date = new Date(o.created_at).toLocaleString("id-ID");
        const customer = o.customer?.full_name || "N/A";
        const phone = o.customer?.phone_number || "N/A";
        const status =
          o.status === "COMPLETED" || o.shipping_status === "COMPLETED"
            ? "SELESAI"
            : o.status;
        const total = o.total_price || 0;

        csvContent += `"${o.id}","${date}","${customer}","${phone}","${status}","${total}"\n`;
      });

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `Laporan_PasarQu_${new Date().toISOString().split("T")[0]}.csv`,
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast("Laporan Berhasil Diunduh!", "success");
    } catch (err) {
      showToast("Gagal mengunduh laporan", "error");
    }
  };

  const handleProcessOrder = async (order: any) => {
    /* ... */ setIsUpdating(order.id);
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
      if (stopAlarm) stopAlarm();
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
  const handleRejectOrder = async (order: any) => {
    /* ... */ if (
      !window.confirm(
        "Yakin ingin menolak pesanan ini? Saldo pembeli akan dikembalikan otomatis.",
      )
    )
      return;
    setIsUpdating(order.id);
    try {
      const { error } = await supabase.rpc("cancel_order_and_refund", {
        p_order_id: order.id,
        p_user_id: order.customer_id,
      });
      if (error) throw error;
      if (stopAlarm) stopAlarm();
      showToast("PESANAN BERHASIL DITOLAK.", "info");
      fetchOrders(true);
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsUpdating(null);
    }
  };
  const handleVerifyPIN = async () => {
    /* ... */ if (!pinModalOrder || pinInput.length !== 4) {
      showToast("Masukkan 4 digit PIN dengan benar", "error");
      return;
    }
    setIsVerifying(true);
    try {
      if (new Date() > new Date(pinModalOrder.pickup_expired_at))
        throw new Error("WAKTU PENGAMBILAN HABIS. DANA DITAHAN SISTEM.");
      if (pinInput !== pinModalOrder.pickup_code)
        throw new Error("PIN YANG DIMASUKKAN SALAH!");
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
  const handleHideOrder = (orderId: string) => {
    if (!window.confirm("Sembunyikan pesanan ini dari daftar Anda?")) return;
    const updatedHidden = [...hiddenOrders, orderId];
    setHiddenOrders(updatedHidden);
    if (user?.id)
      localStorage.setItem(
        `merchant_hidden_orders_${user.id}`,
        JSON.stringify(updatedHidden),
      );
    showToast("Pesanan disembunyikan dari daftar.", "success");
  };

  const filteredOrders = orders.filter((o) => {
    if (hiddenOrders.includes(o.id)) return false;
    let matchTab = false;
    if (statusFilter === "pending")
      matchTab = ["PAID", "PENDING", "PROCESSING"].includes(o.status);
    else if (statusFilter === "shipping")
      matchTab =
        ["PACKING", "ON_DELIVERY", "SHIPPING", "DELIVERING"].includes(
          o.status,
        ) ||
        ["SEARCHING_COURIER", "READY_TO_PICKUP"].includes(o.shipping_status);
    else if (statusFilter === "completed")
      matchTab =
        o.status === "COMPLETED" ||
        o.status === "CANCELLED" ||
        o.shipping_status === "COMPLETED";
    const matchSearch =
      o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.customer?.full_name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    return matchTab && matchSearch;
  });

  return (
    <>
      {/* MODAL PIN TETAP SAMA */}
      {pinModalOrder &&
        createPortal(
          <div className="fixed inset-0 z-[99999] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-sm rounded-xl overflow-hidden shadow-2xl relative border-4 border-[#FF6600]">
              <button
                onClick={() => {
                  setPinModalOrder(null);
                  setPinInput("");
                }}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-white/20 rounded-md text-white hover:bg-red-500 transition-colors"
              >
                <X size={16} />
              </button>
              <div className="bg-[#FF6600] p-8 text-center text-white flex flex-col items-center">
                <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                  <KeyRound size={32} />
                </div>
                <h3 className="font-black tracking-widest uppercase text-[16px]">
                  VERIFIKASI PIN
                </h3>
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
                <button
                  disabled={isVerifying || pinInput.length !== 4}
                  onClick={handleVerifyPIN}
                  className="w-full py-4 rounded-xl bg-slate-900 hover:bg-[#008080] text-white font-black uppercase text-[12px] tracking-[0.1em] active:scale-95 transition-all disabled:opacity-50 flex justify-center items-center gap-2 shadow-lg"
                >
                  {isVerifying ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <UserCheck size={18} />
                  )}{" "}
                  VALIDASI & CAIRKAN
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      <div className="w-full space-y-6 animate-in fade-in duration-500 text-left font-sans pb-20 font-black uppercase tracking-tighter">
        {/* 🚀 HEADER & SEARCH BAR & TOMBOL LAPORAN */}
        <div className="bg-white border-2 border-slate-100 p-6 rounded-xl shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b-8 border-[#008080]">
          <div>
            <h2 className="text-2xl text-slate-900 leading-none flex items-center gap-2">
              <ShoppingBag className="text-[#008080]" size={24} /> DAFTAR
              PESANAN
            </h2>
            <p className="text-[10px] text-slate-400 mt-1 tracking-widest">
              KELOLA TRANSAKSI PENJUALAN TOKO
            </p>
          </div>

          <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-3">
            <div className="relative w-full sm:w-72">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <input
                type="text"
                placeholder="CARI NAMA / ID PESANAN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-lg pl-10 pr-4 py-3 text-[11px] font-black outline-none focus:border-[#008080] transition-all"
              />
            </div>
            {/* 🚀 TOMBOL UNDUH LAPORAN */}
            <button
              onClick={handleExportCSV}
              className="w-full sm:w-auto px-5 py-3 bg-slate-900 hover:bg-[#008080] text-white rounded-lg flex items-center justify-center gap-2 text-[11px] tracking-widest transition-colors shadow-md active:scale-95"
            >
              <DownloadCloud size={16} /> EXPORT CSV
            </button>
          </div>
        </div>

        {/* FILTER TABS */}
        <div className="flex bg-slate-50 p-1.5 rounded-xl border-2 border-slate-100 overflow-x-auto no-scrollbar">
          <TabButton
            active={statusFilter === "pending"}
            label="MASUK"
            onClick={() => setStatusFilter("pending")}
            count={
              orders.filter(
                (o) =>
                  ["PAID", "PENDING", "PROCESSING"].includes(o.status) &&
                  !hiddenOrders.includes(o.id),
              ).length
            }
          />
          <TabButton
            active={statusFilter === "shipping"}
            label="DIPROSES"
            onClick={() => setStatusFilter("shipping")}
            count={
              orders.filter(
                (o) =>
                  ([
                    "PACKING",
                    "ON_DELIVERY",
                    "SHIPPING",
                    "DELIVERING",
                  ].includes(o.status) ||
                    ["SEARCHING_COURIER", "READY_TO_PICKUP"].includes(
                      o.shipping_status,
                    )) &&
                  !hiddenOrders.includes(o.id),
              ).length
            }
          />
          <TabButton
            active={statusFilter === "completed"}
            label="SELESAI"
            onClick={() => setStatusFilter("completed")}
          />
        </div>

        {/* LIST PESANAN */}
        {loading ? (
          <div className="py-24 text-center flex flex-col items-center gap-4 bg-white border-2 border-slate-100 rounded-xl">
            <Loader2 className="animate-spin text-[#008080]" size={40} />
            <p className="font-black text-[10px] text-slate-400 tracking-widest">
              MENYINKRONKAN DATA PASAR...
            </p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-24 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl">
            <AlertCircle size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-[12px] font-black text-slate-400 tracking-widest">
              TIDAK ADA PESANAN DI KATEGORI INI
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => {
              const isPickup = order.shipping_method === "pickup";
              const isNew = ["PAID", "PENDING", "PROCESSING"].includes(
                order.status,
              );
              const isCancelled = order.status === "CANCELLED";
              const isCompleted =
                order.status === "COMPLETED" ||
                order.shipping_status === "COMPLETED";

              const orderTime = new Date(order.created_at).getTime();
              const diffInMinutes = Math.floor(
                (currentTime - orderTime) / (1000 * 60),
              );
              const remainingTime = 30 - diffInMinutes;
              const isLate = remainingTime <= 0;

              return (
                <div
                  key={order.id}
                  className={`bg-white border-2 rounded-xl shadow-sm overflow-hidden transition-all relative ${isCancelled ? "border-red-200 opacity-60" : isCompleted ? "border-green-200 opacity-80" : isNew && isLate ? "border-red-500" : isPickup ? "border-[#FF6600]/30 hover:border-[#FF6600]" : "border-slate-100 hover:border-[#008080]"}`}
                >
                  {/* ORDER TOP BAR */}
                  <div
                    className={`px-5 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b-2 ${isCancelled ? "bg-red-50 border-red-100" : isCompleted ? "bg-green-50 border-green-100" : isPickup ? "bg-orange-50/50 border-orange-100" : "bg-slate-50 border-slate-100"}`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`px-3 py-1.5 rounded-md border-2 flex items-center gap-2 shadow-sm ${isCancelled ? "bg-white border-red-200 text-red-500" : isCompleted ? "bg-white border-green-200 text-green-600" : isPickup ? "bg-white border-orange-200 text-[#FF6600]" : "bg-white border-slate-200 text-[#008080]"}`}
                      >
                        {isCancelled ? (
                          <Ban size={14} />
                        ) : isCompleted ? (
                          <CheckCircle2 size={14} />
                        ) : isPickup ? (
                          <ShoppingBag size={14} />
                        ) : (
                          <Truck size={14} />
                        )}
                        <span className="text-[11px] font-black uppercase tracking-widest">
                          {isCancelled
                            ? "DIBATALKAN"
                            : isCompleted
                              ? "TRANSAKSI SELESAI"
                              : isPickup
                                ? "AMBIL SENDIRI"
                                : "KURIR PASAR"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Clock size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          {new Date(order.created_at).toLocaleTimeString(
                            "id-ID",
                            { hour: "2-digit", minute: "2-digit" },
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto justify-between">
                      {isNew && !isCancelled && !isCompleted && (
                        <div
                          className={`text-[9px] px-3 py-1.5 rounded-md flex items-center gap-1 shadow-sm ${isLate ? "bg-red-600 text-white animate-pulse" : "bg-orange-100 text-orange-700"}`}
                        >
                          <Clock size={10} />{" "}
                          {isLate
                            ? "TERLAMBAT MERESPON!"
                            : `SISA WAKTU: ${remainingTime} MNT`}
                        </div>
                      )}
                      <span
                        className={`px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest shadow-sm ${isCancelled ? "bg-red-500 text-white" : isCompleted ? "bg-green-600 text-white" : isNew ? "bg-[#008080] text-white" : "bg-slate-200 text-slate-500"}`}
                      >
                        {order.status === "PROCESSING"
                          ? "COD - BARU"
                          : isCompleted
                            ? "SELESAI"
                            : order.status}
                      </span>
                    </div>
                  </div>

                  {/* ITEMS LIST */}
                  <div className="p-5 space-y-3">
                    {order.my_items?.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100 hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white border border-slate-200 rounded-md flex items-center justify-center text-slate-400 shrink-0 shadow-sm">
                            <Package size={20} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[12px] font-black text-slate-800 uppercase leading-none mb-1.5">
                              {item.product_details?.name}
                            </p>
                            <p className="text-[10px] font-black text-[#FF6600] uppercase tracking-widest">
                              {item.quantity} {item.product_details?.unit} x RP{" "}
                              {item.price_at_purchase?.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <p className="text-[14px] font-black text-slate-900 tracking-tighter">
                          RP{" "}
                          {(
                            item.quantity * item.price_at_purchase
                          ).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* BOTTOM INFO & ACTION */}
                  <div className="px-5 py-5 bg-white border-t-2 border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-start gap-3 w-full md:w-auto">
                      <div
                        className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 border ${isCancelled ? "bg-red-50 border-red-200 text-red-500" : isCompleted ? "bg-green-50 border-green-200 text-green-600" : isPickup ? "bg-orange-50 border-orange-200 text-[#FF6600]" : "bg-teal-50 border-teal-200 text-[#008080]"}`}
                      >
                        <MapPin size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-[12px] font-black text-slate-900 uppercase">
                            {order.customer?.full_name}
                          </p>
                          <span className="text-slate-300">•</span>
                          <p className="text-[10px] font-black text-[#008080]">
                            {order.customer?.phone_number ||
                              order.customer?.phone}
                          </p>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase leading-tight line-clamp-1 max-w-[250px]">
                          {order.address}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap md:flex-nowrap items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0 border-slate-50">
                      <div className="text-left md:text-right w-full md:w-auto mb-2 md:mb-0">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          TOTAL BAYAR
                        </p>
                        <p
                          className={`text-2xl font-black ${isCancelled ? "text-slate-400 line-through" : "text-[#FF6600]"} tracking-tighter leading-none`}
                        >
                          RP {order.total_price?.toLocaleString()}
                        </p>
                      </div>

                      <div className="flex gap-2 w-full md:w-auto">
                        {!isCancelled && (
                          <button
                            onClick={() =>
                              window.open(
                                `https://wa.me/${order.customer?.phone_number?.replace(/^0/, "62") || ""}`,
                                "_blank",
                              )
                            }
                            className="p-3 bg-green-50 text-green-600 border border-green-200 rounded-xl hover:bg-green-600 hover:text-white transition-all shadow-sm"
                            title="Chat Pembeli"
                          >
                            <MessageCircle size={18} />
                          </button>
                        )}
                        {!isCancelled && (
                          <button
                            onClick={() => handlePrintLabel(order)}
                            className="p-3 bg-slate-50 text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                            title="Cetak Resi"
                          >
                            <Printer size={18} />
                          </button>
                        )}

                        {(isCancelled || isCompleted) && (
                          <button
                            onClick={() => handleHideOrder(order.id)}
                            className="p-3 bg-red-50 text-red-500 border border-red-200 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                            title="Sembunyikan Pesanan"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}

                        {isNew && !isCancelled && !isCompleted ? (
                          <>
                            <button
                              disabled={isUpdating === order.id}
                              onClick={() => handleRejectOrder(order)}
                              className="px-4 py-3 bg-white border-2 border-red-200 text-red-500 hover:bg-red-50 font-black text-[11px] uppercase tracking-widest rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm"
                            >
                              {isUpdating === order.id ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <Ban size={16} />
                              )}{" "}
                              <span className="hidden md:inline">TOLAK</span>
                            </button>
                            <button
                              disabled={isUpdating === order.id}
                              onClick={() => handleProcessOrder(order)}
                              className={`flex-1 md:flex-none px-6 py-3 text-white font-black text-[11px] uppercase tracking-widest rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg ${isPickup ? "bg-[#FF6600] hover:bg-orange-700" : "bg-[#008080] hover:bg-teal-800"}`}
                            >
                              {isUpdating === order.id ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : isPickup ? (
                                <Package size={16} />
                              ) : (
                                <Send size={16} />
                              )}{" "}
                              {isPickup ? "SIAPKAN" : "TERIMA"}
                            </button>
                          </>
                        ) : order.status === "PACKING" && isPickup ? (
                          <button
                            onClick={() => setPinModalOrder(order)}
                            className="flex-1 md:flex-none px-6 py-3 bg-slate-900 text-white font-black text-[11px] uppercase tracking-widest rounded-xl hover:bg-[#FF6600] transition-colors flex items-center justify-center gap-2 shadow-xl"
                          >
                            <KeyRound size={16} className="animate-pulse" />{" "}
                            INPUT PIN
                          </button>
                        ) : isCompleted ? (
                          <div className="flex-1 md:flex-none px-6 py-3 font-black text-[11px] uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 bg-green-100 text-green-700">
                            <CheckCircle2 size={16} /> SELESAI
                          </div>
                        ) : (
                          <div
                            className={`flex-1 md:flex-none px-6 py-3 font-black text-[11px] uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 ${isCancelled ? "bg-red-100 text-red-500" : "bg-slate-100 text-slate-500"}`}
                          >
                            {!isCancelled && (
                              <Loader2 size={14} className="animate-spin" />
                            )}
                            {isCancelled
                              ? "BATAL"
                              : isPickup
                                ? "TUNGGU DIAMBIL"
                                : "TUNGGU KURIR"}
                          </div>
                        )}
                      </div>
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

const TabButton = ({ active, label, onClick, count }: any) => (
  <button
    onClick={onClick}
    className={`flex-1 px-4 py-3 text-[11px] font-black uppercase tracking-widest transition-all rounded-lg flex items-center justify-center gap-2 ${active ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:bg-slate-200"}`}
  >
    {label}
    {count !== undefined && count > 0 && (
      <span
        className={`px-2 py-0.5 rounded-md text-[9px] ${active ? "bg-[#FF6600] text-white" : "bg-red-100 text-red-600"}`}
      >
        {count}
      </span>
    )}
  </button>
);

export default MerchantOrders;
