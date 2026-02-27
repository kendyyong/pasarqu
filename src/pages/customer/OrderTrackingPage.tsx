import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useJsApiLoader } from "@react-google-maps/api";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import {
  ArrowLeft,
  Loader2,
  Bike,
  MapPin,
  Download,
  HeadphonesIcon,
  X,
  Star,
  MessageCircle,
  QrCode,
  Store,
  ReceiptText,
  Gift,
  Ban,
  Trash2,
  CheckCircle2,
  Navigation,
  Wallet,
} from "lucide-react";
import QRCode from "react-qr-code";

import { MobileLayout } from "../../components/layout/MobileLayout";
import { OrderChatRoom } from "../../features/chat/OrderChatRoom";
import { ComplaintForm } from "../../components/shared/ComplaintForm";

// IMPORT HOOK & KOMPONEN
import { useOrderTracking } from "../../hooks/useOrderTracking";
import { TrackingMap, ProgressSteps } from "./components/TrackingSections";

const ICONS = {
  courier: "https://cdn-icons-png.flaticon.com/512/713/713438.png",
  home: "https://cdn-icons-png.flaticon.com/512/1946/1946488.png",
  store: "https://cdn-icons-png.flaticon.com/512/1055/1055672.png",
};

// 🚀 FIX FATAL ERROR BLANK PUTIH: Deklarasi statis untuk semua halaman
const GOOGLE_MAPS_LIBRARIES: ("places" | "routes" | "geometry" | "drawing")[] =
  ["places", "routes", "geometry", "drawing"];

export const OrderTrackingPage = () => {
  const { user, profile } = useAuth() as any;
  const { showToast } = useToast();
  const { orderId } = useParams();
  const navigate = useNavigate();

  // 🧠 HOOK LOGIKA DATA
  const {
    order,
    setOrder,
    courier,
    orderItems,
    loading,
    hasReviewed,
    setHasReviewed,
  } = useOrderTracking(orderId, user);

  const [directions, setDirections] = useState<any>(null);
  const [showChat, setShowChat] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // 🚀 FIX: Memasukkan variabel GOOGLE_MAPS_LIBRARIES agar konsisten
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries: GOOGLE_MAPS_LIBRARIES, // 👈 SUDAH DIPASANG!
  });

  // 🧭 KOMPAS PINTAR
  const getMapCenter = () => {
    if (courier?.current_lat && courier?.current_lng)
      return { lat: courier.current_lat, lng: courier.current_lng };
    if (order?.delivery_lat && order?.delivery_lng)
      return { lat: order.delivery_lat, lng: order.delivery_lng };
    if (order?.merchant?.latitude && order?.merchant?.longitude)
      return { lat: order.merchant.latitude, lng: order.merchant.longitude };
    if (order?.market?.latitude && order?.market?.longitude)
      return { lat: order.market.latitude, lng: order.market.longitude };
    return { lat: -0.8327, lng: 117.2476 };
  };

  useEffect(() => {
    if (!isLoaded || !order?.delivery_lat) return;
    const calculateRoute = () => {
      const directionsService = new window.google.maps.DirectionsService();
      let origin: google.maps.LatLng | null = null;
      let destination = new window.google.maps.LatLng(
        order.delivery_lat,
        order.delivery_lng,
      );

      if (courier?.current_lat && courier?.current_lng) {
        origin = new window.google.maps.LatLng(
          courier.current_lat,
          courier.current_lng,
        );
      } else if (order?.merchant?.latitude && order?.merchant?.longitude) {
        origin = new window.google.maps.LatLng(
          order.merchant.latitude,
          order.merchant.longitude,
        );
      } else if (order?.market?.latitude && order?.market?.longitude) {
        origin = new window.google.maps.LatLng(
          order.market.latitude,
          order.market.longitude,
        );
      }

      if (origin) {
        directionsService.route(
          {
            origin,
            destination,
            travelMode: window.google.maps.TravelMode.DRIVING,
          },
          (res, status) => {
            if (status === window.google.maps.DirectionsStatus.OK)
              setDirections(res);
          },
        );
      }
    };
    calculateRoute();
  }, [
    isLoaded,
    courier?.current_lat,
    order?.delivery_lat,
    order?.merchant?.latitude,
    order?.market?.latitude,
  ]);

  const handleSubmitReview = async () => {
    if (rating === 0) return showToast("PILIH JUMLAH BINTANG!", "error");

    const validMerchantId =
      orderItems?.[0]?.merchant_id || orderItems?.[0]?.merchant?.id;
    if (!validMerchantId)
      return showToast(
        "GAGAL: Sistem tidak dapat memverifikasi ID Toko.",
        "error",
      );

    setIsSubmittingReview(true);
    try {
      const { error } = await supabase.from("reviews").insert({
        order_id: order.id,
        merchant_id: validMerchantId,
        customer_id: user?.id,
        rating,
        comment: reviewComment.toUpperCase(),
      });
      if (error) throw error;
      showToast("ULASAN BERHASIL TERKIRIM!", "success");
      setHasReviewed(true);
      setShowReviewModal(false);
    } catch (err: any) {
      showToast("Database menolak: " + err.message, "error");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm("Yakin ingin membatalkan?")) return;
    setIsCancelling(true);
    try {
      const { error } = await supabase.rpc("cancel_order_and_refund", {
        p_order_id: order.id,
        p_user_id: user.id,
      });
      if (error) throw error;
      showToast("Pesanan dibatalkan!", "success");
      setOrder({ ...order, status: "CANCELLED" });
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleHideOrderFromDetail = () => {
    if (!window.confirm("Hapus pesanan ini dari riwayat belanja Anda?")) return;
    const currentHidden = JSON.parse(
      localStorage.getItem("hidden_orders") || "[]",
    );
    localStorage.setItem(
      "hidden_orders",
      JSON.stringify([...currentHidden, orderId]),
    );
    showToast("Pesanan dihapus dari riwayat.", "success");
    navigate("/order-history");
  };

  if (loading)
    return (
      <div className="h-screen flex flex-col items-center justify-center font-black bg-slate-50">
        <Loader2 className="animate-spin text-[#008080] mb-4" size={40} />
        <p className="tracking-widest text-slate-400">MEMUAT DATA...</p>
      </div>
    );

  const isPickup = order?.shipping_method === "pickup";
  const isFinished =
    order?.status === "COMPLETED" || order?.status === "CANCELLED";

  const currentStep =
    order?.status === "CANCELLED"
      ? -1
      : order?.shipping_status === "COMPLETED" || order?.status === "COMPLETED"
        ? 3
        : ["SHIPPING", "DELIVERING"].includes(order?.shipping_status)
          ? 2
          : ["PACKING", "READY_TO_PICKUP"].includes(order?.shipping_status) ||
              order?.status === "PACKING"
            ? 1
            : 0;

  return (
    <MobileLayout
      activeTab="orders"
      onTabChange={(t) =>
        navigate(
          t === "home"
            ? "/"
            : t === "account"
              ? "/customer-dashboard"
              : "/order-history",
        )
      }
      onSearch={() => {}}
      onCartClick={() => {}}
      cartCount={0}
    >
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-left uppercase tracking-tighter">
        {/* HEADER */}
        <header
          className={`sticky top-0 z-50 h-[70px] flex items-center px-4 shadow-md text-white transition-all ${order?.status === "CANCELLED" ? "bg-red-600" : "bg-[#008080]"}`}
        >
          <div className="w-full max-w-[1200px] mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/order-history")}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all active:scale-95"
              >
                <ArrowLeft size={20} strokeWidth={3} />
              </button>
              <div>
                <p className="text-[9px] opacity-80 font-black tracking-widest mb-0.5">
                  DETAIL PESANAN
                </p>
                <h1 className="text-[16px] font-[1000] leading-none">
                  ORD#{order?.id?.slice(0, 8)}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div
                className={`px-4 py-2 rounded-xl text-[10px] font-black shadow-inner border flex items-center gap-2 ${order?.status === "COMPLETED" ? "bg-teal-700 border-teal-500" : order?.status === "CANCELLED" ? "bg-red-800 border-red-500" : "bg-[#FF6600] border-orange-400 animate-pulse"}`}
              >
                {order?.status === "COMPLETED"
                  ? "PESANAN SELESAI"
                  : order?.status}
                {isFinished && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleHideOrderFromDetail();
                    }}
                    className="ml-2 hover:text-red-300 transition-colors"
                  >
                    <Trash2 size={14} strokeWidth={2.5} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* MAIN LAYOUT */}
        <main className="flex-1 w-full max-w-[1200px] mx-auto p-4 md:p-6 pb-32">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* KIRI */}
            <div className="lg:col-span-7 space-y-6">
              {/* MAP SECTION */}
              {!isPickup && (
                <div className="h-[400px] md:h-[450px] bg-slate-200 rounded-2xl border-4 border-white shadow-xl overflow-hidden relative">
                  <TrackingMap
                    isLoaded={isLoaded}
                    loadError={loadError}
                    center={getMapCenter()}
                    directions={directions}
                    order={order}
                    courier={courier}
                    ICONS={ICONS}
                  />

                  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-xl shadow-lg border border-slate-200 flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${isFinished ? "bg-green-500" : courier?.current_lat ? "bg-orange-500 animate-pulse" : "bg-blue-500 animate-pulse"}`}
                    ></div>
                    <span className="text-[11px] font-[1000] tracking-widest text-slate-700">
                      {isFinished
                        ? "RUTE SELESAI"
                        : courier?.current_lat
                          ? "KURIR TERDETEKSI"
                          : "MENUNGGU KURIR"}
                    </span>
                  </div>

                  {order?.status === "COMPLETED" ? (
                    <div className="absolute bottom-4 left-4 right-4 bg-gradient-to-r from-teal-600 to-[#008080] p-5 rounded-2xl shadow-2xl border border-teal-400 flex items-center gap-4 text-white animate-in slide-in-from-bottom-6">
                      <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                        <CheckCircle2 size={32} strokeWidth={2.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[16px] font-[1000] truncate tracking-tight">
                          KURIR TELAH SAMPAI
                        </p>
                        <p className="text-[10px] font-bold mt-1 tracking-widest text-teal-100">
                          PAKET TELAH DITERIMA DENGAN SELAMAT.
                        </p>
                      </div>
                    </div>
                  ) : (
                    courier?.current_lat && (
                      <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-lg border border-slate-200 flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-[#FF6600]">
                          <Bike size={24} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-[1000] text-slate-800 truncate">
                            {courier.name}
                          </p>
                          <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1 mt-0.5 tracking-widest">
                            <Navigation size={12} className="text-[#008080]" />{" "}
                            KURIR DALAM PERJALANAN
                          </p>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}

              {/* KLAIM PENGAMBILAN */}
              {isPickup && !isFinished && (
                <section className="bg-white p-8 rounded-2xl border-4 border-[#FF6600] shadow-xl text-center flex flex-col items-center">
                  <QrCode size={32} className="text-[#FF6600] mb-3" />
                  <h2 className="text-[16px] font-black tracking-widest">
                    KLAIM PENGAMBILAN
                  </h2>
                  <div className="bg-white p-4 rounded-2xl border-4 border-slate-900 my-5">
                    <QRCode value={order?.id || "PNDG"} size={160} />
                  </div>
                  <p className="text-[12px] font-bold text-slate-500">
                    TUNJUKKAN KODE INI KE PEDAGANG SAAT MENGAMBIL BARANG
                  </p>
                </section>
              )}

              {/* PROGRESS STEPS */}
              {order?.status !== "CANCELLED" && (
                <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                  <ProgressSteps currentStep={currentStep} />
                </section>
              )}
            </div>

            {/* KANAN */}
            <div className="lg:col-span-5 space-y-6">
              {/* RINCIAN PRODUK */}
              <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-5">
                  <ReceiptText size={20} className="text-[#008080]" />
                  <h4 className="text-[14px] font-black tracking-widest text-slate-800">
                    DAFTAR BELANJA
                  </h4>
                </div>
                <div className="space-y-5">
                  {orderItems.map((item: any, idx: number) => (
                    <div key={idx} className="flex gap-4 items-center">
                      <div className="w-16 h-16 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-200">
                        <img
                          src={item.product?.image_url}
                          className="w-full h-full object-cover"
                          alt="img"
                        />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <h5 className="text-[12px] font-black text-slate-900 leading-tight mb-1 truncate">
                          {item.product?.name}
                        </h5>
                        <p className="text-[10px] font-bold text-slate-400">
                          JUMLAH: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[14px] font-black text-slate-800 font-sans tracking-tight">
                          {(
                            item.quantity * item.price_at_purchase
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* ALAMAT ANTAR */}
              <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-4">
                  <MapPin size={20} className="text-[#FF6600]" />
                  <h4 className="text-[14px] font-black tracking-widest text-slate-800">
                    ALAMAT ANTAR
                  </h4>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center shrink-0 text-slate-400 border border-slate-100">
                    <Bike size={20} />
                  </div>
                  <div className="flex-1 mt-1">
                    <p className="text-[11px] font-bold text-slate-500 leading-relaxed normal-case tracking-normal">
                      {order?.address || "Alamat tidak ditemukan"}
                    </p>
                  </div>
                </div>
              </section>

              {/* PAYMENT SUMMARY */}
              <section className="bg-slate-900 p-8 rounded-2xl shadow-xl text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-bl-full pointer-events-none"></div>
                <h4 className="text-[12px] font-black tracking-widest text-teal-400 mb-6 flex items-center gap-2">
                  <Wallet size={16} /> RINGKASAN PEMBAYARAN
                </h4>

                <div className="space-y-4 font-bold text-[12px] opacity-90 border-b border-white/20 pb-6 mb-6">
                  <div className="flex justify-between">
                    <span>METODE PEMBAYARAN</span>
                    <span className="text-white">{order?.payment_method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>BIAYA LAYANAN</span>
                    <span className="font-sans">
                      +{order?.service_fee?.toLocaleString()}
                    </span>
                  </div>
                  {order?.used_balance > 0 && (
                    <div className="flex justify-between text-orange-400">
                      <span>POTONGAN SALDO</span>
                      <span className="font-sans">
                        -{order?.used_balance?.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-end">
                  <span className="text-[13px] font-black tracking-widest opacity-80">
                    TOTAL TAGIHAN
                  </span>
                  <span
                    className={`text-[32px] font-[1000] font-sans tracking-tighter leading-none ${order?.status === "CANCELLED" ? "line-through text-slate-500" : "text-[#FF6600]"}`}
                  >
                    RP {order?.total_price?.toLocaleString()}
                  </span>
                </div>
              </section>

              {/* ACTION BUTTONS */}
              <div className="space-y-4">
                {/* TOMBOL RATING */}
                {(order?.status === "COMPLETED" ||
                  order?.shipping_status === "COMPLETED") &&
                  (hasReviewed ? (
                    <div className="w-full bg-teal-50 border-2 border-[#008080] text-[#008080] py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-[13px] tracking-widest shadow-sm">
                      <CheckCircle2 size={20} strokeWidth={3} /> ULASAN TELAH
                      DIBERIKAN
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowReviewModal(true)}
                      className="w-full bg-gradient-to-r from-[#FF6600] to-orange-500 text-white py-4 rounded-2xl shadow-lg shadow-orange-500/30 flex items-center justify-center gap-3 font-black text-[13px] tracking-widest active:scale-95 transition-all"
                    >
                      <Star fill="white" size={20} className="animate-pulse" />{" "}
                      BERI PENILAIAN SEKARANG
                    </button>
                  ))}

                <div className="flex gap-4">
                  <button
                    onClick={() => setShowSupportModal(true)}
                    className="flex-1 bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-600 py-3.5 rounded-xl flex items-center justify-center gap-2 font-black text-[12px] tracking-widest active:scale-95 transition-all shadow-sm"
                  >
                    <HeadphonesIcon size={18} /> CS BANTUAN
                  </button>
                  {isFinished ? (
                    <button
                      onClick={() =>
                        window.open(`/invoice/${orderId}`, "_blank")
                      }
                      className="flex-1 bg-white border-2 border-slate-900 hover:bg-slate-900 hover:text-white text-slate-900 py-3.5 rounded-xl flex items-center justify-center gap-2 font-black text-[12px] tracking-widest active:scale-95 transition-all shadow-sm"
                    >
                      <Download size={18} /> UNDUH NOTA
                    </button>
                  ) : (
                    order?.courier_id && (
                      <button
                        onClick={() => setShowChat(true)}
                        className="flex-1 bg-teal-50 border-2 border-[#008080] text-[#008080] hover:bg-[#008080] hover:text-white py-3.5 rounded-xl flex items-center justify-center gap-2 font-black text-[12px] tracking-widest active:scale-95 transition-all shadow-sm"
                      >
                        <MessageCircle size={18} fill="currentColor" /> CHAT
                        KURIR
                      </button>
                    )
                  )}
                </div>

                {/* CANCEL BUTTON */}
                {["PAID", "PROCESSING", "PENDING"].includes(order?.status) && (
                  <button
                    onClick={handleCancelOrder}
                    disabled={isCancelling}
                    className="w-full mt-2 bg-red-50 text-red-600 py-4 rounded-xl flex items-center justify-center gap-2 font-black tracking-widest text-[12px] active:scale-95 transition-all shadow-sm"
                  >
                    {isCancelling ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <Ban size={18} strokeWidth={2.5} />
                    )}{" "}
                    BATALKAN PESANAN INI
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* MODAL REVIEW */}
        {showReviewModal && (
          <div className="fixed inset-0 z-[1000] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 relative shadow-2xl animate-in zoom-in-95 border-4 border-[#008080]">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#FF6600] w-12 h-12 rounded-full flex items-center justify-center border-4 border-white shadow-md">
                <Star fill="white" size={24} className="text-white" />
              </div>
              <button
                onClick={() => setShowReviewModal(false)}
                className="absolute top-6 right-6 text-slate-300 hover:text-red-500 transition-colors"
              >
                <X size={24} />
              </button>

              <div className="text-center mt-6 mb-8">
                <h2 className="text-[18px] font-black text-slate-800 tracking-tight">
                  BAGAIMANA PESANANMU?
                </h2>
                <p className="text-[10px] text-slate-400 font-bold tracking-widest mt-1">
                  BANTU KAMI MENJADI LEBIH BAIK
                </p>
              </div>

              <div className="flex justify-center gap-2 mb-8">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    onClick={() => setRating(s)}
                    onMouseEnter={() => setHoverRating(s)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition-transform active:scale-75"
                  >
                    <Star
                      size={44}
                      fill={
                        rating >= s || hoverRating >= s ? "#FF6600" : "none"
                      }
                      className={
                        rating >= s || hoverRating >= s
                          ? "text-[#FF6600]"
                          : "text-slate-200"
                      }
                      strokeWidth={1.5}
                    />
                  </button>
                ))}
              </div>

              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value.toUpperCase())}
                placeholder="CERITAKAN PENGALAMANMU..."
                className="w-full h-28 bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-[12px] font-bold outline-none focus:border-[#008080] mb-6 no-scrollbar placeholder:text-slate-300"
              />

              <button
                onClick={handleSubmitReview}
                disabled={rating === 0 || isSubmittingReview}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[12px] tracking-widest shadow-lg active:scale-95 transition-all disabled:bg-slate-200 disabled:text-slate-400 flex justify-center items-center gap-2"
              >
                {isSubmittingReview ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  "KIRIM PENILAIAN"
                )}
              </button>
            </div>
          </div>
        )}

        {/* MODAL COMPLAINT */}
        {showSupportModal && (
          <div className="fixed inset-0 z-[1000] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="relative w-full max-w-lg bg-white rounded-3xl p-2 animate-in zoom-in-95">
              <button
                onClick={() => setShowSupportModal(false)}
                className="absolute -top-12 right-0 flex items-center gap-2 text-white font-black text-[11px] tracking-widest bg-white/20 px-4 py-2 rounded-full"
              >
                <X size={16} /> TUTUP CS
              </button>
              <ComplaintForm
                orderId={orderId}
                onSuccess={() =>
                  setTimeout(() => setShowSupportModal(false), 2000)
                }
              />
            </div>
          </div>
        )}

        {/* MODAL CHAT */}
        {showChat && (
          <div className="fixed inset-0 z-[1000] bg-slate-900/80 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4">
            <div className="w-full max-w-md h-[90vh] md:h-[600px] bg-white rounded-t-3xl md:rounded-3xl flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom-full md:zoom-in-95">
              <div className="p-5 bg-[#008080] text-white flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Bike size={20} />
                  </div>
                  <div>
                    <p className="text-[14px] font-black tracking-widest leading-none">
                      CHAT KURIR
                    </p>
                    <p className="text-[9px] text-teal-200 mt-1 tracking-widest">
                      DRIVER PASARQU
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowChat(false)}
                  className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 bg-slate-50 relative">
                <OrderChatRoom
                  orderId={orderId!}
                  chatType="courier_customer"
                  receiverName="KURIR PASARQU"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default OrderTrackingPage;
