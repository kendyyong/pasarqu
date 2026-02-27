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
} from "lucide-react";
import QRCode from "react-qr-code";

import { MobileLayout } from "../../components/layout/MobileLayout";
import { OrderChatRoom } from "../../features/chat/OrderChatRoom";
import { ComplaintForm } from "../../components/shared/ComplaintForm";

// 🚀 IMPORT HASIL REFACTORING KITA
import { useOrderTracking } from "../../hooks/useOrderTracking";
import { TrackingMap, ProgressSteps } from "./components/TrackingSections";

const ICONS = {
  courier: "https://cdn-icons-png.flaticon.com/512/713/713438.png",
  home: "https://cdn-icons-png.flaticon.com/512/1946/1946488.png",
  store: "https://cdn-icons-png.flaticon.com/512/1055/1055672.png",
};

export const OrderTrackingPage = () => {
  const { user, profile } = useAuth() as any;
  const { showToast } = useToast();
  const { orderId } = useParams();
  const navigate = useNavigate();

  // 🧠 PAKAI HOOK LOGIKA
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

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries: ["places", "routes"],
  });

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
  ]);

  // 🚀 FIX TOTAL ERROR FOREIGN KEY (SALAH ID)
  const handleSubmitReview = async () => {
    if (rating === 0) return showToast("PILIH JUMLAH BINTANG!", "error");

    // 🛡️ AMBIL ID TOKO DARI ORDER ITEMS (Sumber paling akurat, tidak mungkin salah)
    const validMerchantId =
      orderItems?.[0]?.merchant_id || orderItems?.[0]?.merchant?.id;

    if (!validMerchantId) {
      console.error("ID Toko tidak ditemukan di rincian produk!");
      return showToast(
        "GAGAL: Sistem tidak dapat memverifikasi ID Toko.",
        "error",
      );
    }

    setIsSubmittingReview(true);
    try {
      const { error } = await supabase.from("reviews").insert({
        order_id: order.id,
        merchant_id: validMerchantId, // 👈 KUNCI PERBAIKAN: Menggunakan ID Toko asli!
        customer_id: user?.id,
        rating,
        comment: reviewComment.toUpperCase(),
      });

      if (error) throw error;

      showToast("ULASAN BERHASIL TERKIRIM!", "success");
      setHasReviewed(true);
      setShowReviewModal(false);
    } catch (err: any) {
      console.error("Review Insert Error:", err);
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

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center font-black">
        MEMUAT SISTEM...
      </div>
    );

  const isPickup = order?.shipping_method === "pickup";
  const isFinished =
    order?.status === "COMPLETED" || order?.status === "CANCELLED";

  const currentStep =
    order?.status === "CANCELLED"
      ? -1
      : order?.shipping_status === "COMPLETED"
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
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-black text-left uppercase tracking-tighter text-[12px]">
        {/* HEADER */}
        <header
          className={`sticky top-0 z-50 h-16 flex items-center px-4 shadow-md text-white ${order?.status === "CANCELLED" ? "bg-red-600" : "bg-[#008080]"}`}
        >
          <button
            onClick={() => navigate("/order-history")}
            className="p-2 mr-2"
          >
            <ArrowLeft size={24} strokeWidth={3} />
          </button>
          <div className="flex-1">
            <span className="text-[10px] opacity-70 block mb-1">
              STATUS PESANAN
            </span>
            <span className="text-[14px]">#{order?.id?.slice(0, 8)}</span>
          </div>
          <div className="bg-white/20 px-3 py-1.5 rounded-md text-[10px] shadow-sm">
            {order?.status}
          </div>
        </header>

        <main className="flex-1 w-full max-w-[1200px] mx-auto p-4 pb-32 space-y-6">
          {/* MAP & PICKUP KLAIM */}
          {order?.status !== "CANCELLED" && !isPickup && (
            <div className="h-[300px] bg-slate-200 rounded-xl border-4 border-white shadow-xl overflow-hidden relative">
              <TrackingMap
                isLoaded={isLoaded}
                loadError={loadError}
                center={{
                  lat: order?.delivery_lat || 0,
                  lng: order?.delivery_lng || 0,
                }}
                directions={directions}
                order={order}
                courier={courier}
                ICONS={ICONS}
              />
            </div>
          )}

          {isPickup && !isFinished && (
            <section className="bg-white p-6 rounded-xl border-4 border-[#FF6600] shadow-xl text-center flex flex-col items-center">
              <QrCode size={24} className="text-[#FF6600] mb-2" />
              <h2 className="text-[14px]">KLAIM PENGAMBILAN</h2>
              <div className="bg-white p-4 rounded-xl border-4 border-slate-900 my-4">
                <QRCode value={order?.id || "PNDG"} size={140} />
              </div>
              <p className="text-[11px] text-slate-500">
                TUNJUKKAN KODE INI KE PEDAGANG
              </p>
            </section>
          )}

          {/* PROGRESS */}
          {order?.status !== "CANCELLED" && (
            <section className="bg-white p-6 rounded-xl border-2 border-slate-100 shadow-sm">
              <ProgressSteps currentStep={currentStep} />
            </section>
          )}

          {/* PRODUK & INFO */}
          <section className="bg-white p-5 rounded-xl border-2 border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 border-b pb-3 mb-4">
              <ReceiptText size={18} className="text-[#008080]" /> RINCIAN
              PRODUK
            </div>
            <div className="space-y-4">
              {orderItems.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="flex justify-between items-center text-[12px] text-slate-700"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                      <img
                        src={item.product?.image_url}
                        className="w-full h-full object-cover"
                        alt="img"
                      />
                    </div>
                    <span className="truncate">
                      {item.product?.name} x{item.quantity}
                    </span>
                  </div>
                  <span className="font-sans text-slate-900">
                    {(item.quantity * item.price_at_purchase).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* TOMBOL RATING */}
          {order?.shipping_status === "COMPLETED" && !hasReviewed && (
            <button
              onClick={() => setShowReviewModal(true)}
              className="w-full bg-[#FF6600] text-white py-4 rounded-xl shadow-lg animate-bounce flex justify-center gap-2"
            >
              <Star fill="currentColor" size={18} /> BERI ULASAN SEKARANG
            </button>
          )}

          {/* ACTION BUTTONS */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setShowSupportModal(true)}
              className="bg-slate-100 py-3 rounded-xl flex justify-center gap-2"
            >
              <HeadphonesIcon size={16} /> BANTUAN
            </button>
            {isFinished ? (
              <button
                onClick={() => window.open(`/invoice/${orderId}`, "_blank")}
                className="bg-white border-2 border-slate-900 py-3 rounded-xl flex justify-center gap-2"
              >
                <Download size={16} /> NOTA PDF
              </button>
            ) : (
              order?.courier_id && (
                <button
                  onClick={() => setShowChat(true)}
                  className="bg-slate-900 text-white py-3 rounded-xl flex justify-center gap-2"
                >
                  <MessageCircle size={16} className="text-[#FF6600]" /> CHAT
                  KURIR
                </button>
              )
            )}
          </div>

          {["PAID", "PROCESSING", "PENDING"].includes(order?.status) && (
            <button
              onClick={handleCancelOrder}
              disabled={isCancelling}
              className="w-full mt-2 bg-white border-2 border-red-200 text-red-500 py-3.5 rounded-xl flex justify-center gap-2"
            >
              {isCancelling ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <Ban size={16} />
              )}{" "}
              BATALKAN PESANAN
            </button>
          )}
        </main>

        {/* MODALS */}
        {showReviewModal && (
          <div className="fixed inset-0 z-[1000] bg-black/80 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-3xl p-8 relative border-4 border-[#008080]">
              <button
                onClick={() => setShowReviewModal(false)}
                className="absolute top-4 right-4"
              >
                <X size={24} />
              </button>
              <h2 className="text-center font-black mb-6">PENILAIAN TOKO</h2>
              <div className="flex justify-center gap-2 mb-8">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={40}
                    onClick={() => setRating(s)}
                    onMouseEnter={() => setHoverRating(s)}
                    onMouseLeave={() => setHoverRating(0)}
                    fill={rating >= s || hoverRating >= s ? "#FF6600" : "none"}
                    className={
                      rating >= s || hoverRating >= s
                        ? "text-[#FF6600]"
                        : "text-slate-200"
                    }
                  />
                ))}
              </div>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value.toUpperCase())}
                placeholder="TULIS ULASAN..."
                className="w-full h-32 p-4 bg-slate-50 border-2 border-slate-200 rounded-xl mb-6 font-black outline-none"
              />
              <button
                onClick={handleSubmitReview}
                disabled={isSubmittingReview || rating === 0}
                className="w-full py-4 bg-[#008080] text-white rounded-xl font-black shadow-xl"
              >
                {isSubmittingReview ? "MENGIRIM..." : "KIRIM ULASAN"}
              </button>
            </div>
          </div>
        )}

        {/* MODAL CHAT & COMPLAINT (Disederhanakan) */}
        {showSupportModal && (
          <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="relative w-full max-w-lg bg-white rounded-2xl p-4 animate-in zoom-in">
              <button
                onClick={() => setShowSupportModal(false)}
                className="absolute -top-12 right-0 flex items-center gap-2 text-white font-black text-[11px] uppercase"
              >
                <X size={20} /> TUTUP
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

        {showChat && (
          <div className="fixed inset-0 z-[1000] bg-black/80 flex items-center justify-center p-2">
            <div className="w-full max-w-md h-[85vh] bg-white rounded-xl flex flex-col overflow-hidden">
              <div className="p-4 bg-[#008080] text-white flex justify-between">
                <span className="text-[14px]">CHAT KURIR</span>
                <button onClick={() => setShowChat(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1">
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
