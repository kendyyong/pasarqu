import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useJsApiLoader,
  GoogleMap,
  MarkerF,
  DirectionsRenderer,
} from "@react-google-maps/api";
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
  Ban,
  Trash2,
  CheckCircle2,
  Navigation,
  Crosshair,
  Phone,
  Wallet,
} from "lucide-react";
import QRCode from "react-qr-code";

import { MobileLayout } from "../../components/layout/MobileLayout";
import { OrderChatRoom } from "../../features/chat/OrderChatRoom";
import { ComplaintForm } from "../../components/shared/ComplaintForm";

// IMPORT HOOK
import { useOrderTracking } from "../../hooks/useOrderTracking";
import { ProgressSteps } from "./components/TrackingSections";

// 🚀 IKON CUSTOM LOKAL (Standar PasarQu)
const ICONS = {
  courier: "/kurir.png",
  buyer: "/buyer.png",
  store: "/toko.png",
};

// 🚀 KOORDINAT CADANGAN
const DEFAULT_CENTER = { lat: -0.8327, lng: 117.2476 };

const GOOGLE_MAPS_LIBRARIES: ("places" | "routes" | "geometry" | "drawing")[] =
  ["places", "routes", "geometry", "drawing"];

export const OrderTrackingPage = () => {
  const { user } = useAuth() as any;
  const { showToast } = useToast();
  const { orderId } = useParams();
  const navigate = useNavigate();

  const {
    order,
    setOrder,
    courier,
    orderItems,
    loading,
    hasReviewed,
    setHasReviewed,
  } = useOrderTracking(orderId, user);

  // 🚀 STATE PETA & LIVE TRACKING
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [directions, setDirections] = useState<any>(null);
  const [etaInfo, setEtaInfo] = useState({ distance: "", duration: "" });
  const [liveCourierPos, setLiveCourierPos] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [autoCenter, setAutoCenter] = useState(true);

  // STATE MODALS
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
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  // 🚀 ENGINE 1: SINKRONISASI POSISI AWAL KURIR
  useEffect(() => {
    if (courier?.current_lat && courier?.current_lng && !liveCourierPos) {
      setLiveCourierPos({ lat: courier.current_lat, lng: courier.current_lng });
    }
  }, [courier]);

  // 🚀 ENGINE 2: RADAR STATUS PESANAN (FIX ANTI-REFRESH)
  // Engine ini menyadap jika status berubah dari PACKING -> PICKING_UP -> SHIPPING
  useEffect(() => {
    if (!orderId) return;

    const orderChannel = supabase
      .channel(`sync_order_status_${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          const updatedOrder = payload.new;
          setOrder((prev: any) => ({ ...prev, ...updatedOrder }));

          // Notifikasi Pintar Real-time
          if (updatedOrder.status === "PACKING")
            showToast("Toko sedang menyiapkan pesananmu!", "success");
          if (updatedOrder.status === "PICKING_UP")
            showToast("Kurir sedang menuju toko!", "success");
          if (updatedOrder.status === "SHIPPING")
            showToast("Kurir sedang menuju lokasimu!", "success");
          if (updatedOrder.status === "COMPLETED")
            showToast("Pesanan Selesai!", "success");
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(orderChannel);
    };
  }, [orderId, setOrder, showToast]);

  // 🚀 ENGINE 3: RADAR GPS KURIR (Bergerak Live)
  useEffect(() => {
    if (
      !order?.courier_id ||
      order?.status === "COMPLETED" ||
      order?.status === "CANCELLED"
    )
      return;

    const gpsChannel = supabase
      .channel(`track_courier_gps_${order.courier_id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${order.courier_id}`,
        },
        (payload) => {
          if (payload.new.latitude && payload.new.longitude) {
            const newPos = {
              lat: payload.new.latitude,
              lng: payload.new.longitude,
            };
            setLiveCourierPos(newPos);

            // Kamera mengikuti kurir
            if (autoCenter && mapInstance) {
              mapInstance.panTo(newPos);
            }
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(gpsChannel);
    };
  }, [order?.courier_id, order?.status, autoCenter, mapInstance]);

  // 🚀 ENGINE 4: PENCARI RUTE (Statis dari Toko ke Pembeli)
  useEffect(() => {
    if (
      !isLoaded ||
      !order?.delivery_lat ||
      !order?.merchant?.latitude ||
      directions
    )
      return;

    const directionsService = new window.google.maps.DirectionsService();
    const origin = new window.google.maps.LatLng(
      order.merchant.latitude,
      order.merchant.longitude,
    );
    const destination = new window.google.maps.LatLng(
      order.delivery_lat,
      order.delivery_lng,
    );

    directionsService.route(
      {
        origin,
        destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (res, status) => {
        if (status === window.google.maps.DirectionsStatus.OK && res) {
          setDirections(res);
          const leg = res.routes[0].legs[0];
          if (leg) {
            setEtaInfo({
              distance: leg.distance?.text || "",
              duration: leg.duration?.text || "",
            });
          }
        }
      },
    );
  }, [isLoaded, order, directions]);

  // --- HANDLERS ---
  const handleSubmitReview = async () => {
    if (rating === 0) return showToast("PILIH JUMLAH BINTANG!", "error");
    const validMerchantId =
      orderItems?.[0]?.merchant_id || orderItems?.[0]?.merchant?.id;
    if (!validMerchantId)
      return showToast("GAGAL: ID Toko tidak valid.", "error");

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
      showToast(err.message, "error");
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
      <div className="h-screen flex flex-col items-center justify-center font-black bg-[#F8FAFC]">
        <Loader2 className="animate-spin text-[#008080] mb-4" size={48} />
        <p className="tracking-widest text-slate-400 uppercase">
          Mencari Data Pesanan...
        </p>
      </div>
    );

  // 🚀 FIX LOGIKA STATUS & PROGRESS BAR
  const isPickup = order?.shipping_method === "pickup";
  const isFinished =
    order?.status === "COMPLETED" || order?.status === "CANCELLED";

  // Motor muncul di peta saat PICKING_UP, SHIPPING, atau DELIVERING
  const isCourierVisible = ["PICKING_UP", "SHIPPING", "DELIVERING"].includes(
    order?.status,
  );

  // Logika Progress Bar yang benar dan konsisten
  let currentStep = 0;
  if (order?.status === "CANCELLED") currentStep = -1;
  else if (order?.status === "COMPLETED") currentStep = 3;
  else if (["SHIPPING", "DELIVERING"].includes(order?.status)) currentStep = 2;
  else if (["PACKING", "READY_TO_PICKUP", "PICKING_UP"].includes(order?.status))
    currentStep = 1;
  else currentStep = 0; // PAID / PENDING / UNPAID

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
        {/* 🚀 HEADER */}
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
                  : order?.status?.replace(/_/g, " ")}
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

        <main className="flex-1 w-full max-w-[1200px] mx-auto p-4 md:p-6 pb-32">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* KIRI: PETA & PROGRESS */}
            <div className="lg:col-span-7 space-y-6">
              {/* 🗺️ MAP SECTION (LIVE TRACKING) */}
              {!isPickup && (
                <div className="h-[450px] md:h-[500px] bg-slate-200 rounded-[2rem] border-4 border-white shadow-xl overflow-hidden relative">
                  {isLoaded ? (
                    <GoogleMap
                      mapContainerStyle={{ width: "100%", height: "100%" }}
                      center={
                        liveCourierPos || {
                          lat:
                            Number(order?.delivery_lat) || DEFAULT_CENTER.lat,
                          lng:
                            Number(order?.delivery_lng) || DEFAULT_CENTER.lng,
                        }
                      }
                      zoom={16}
                      onLoad={(map) => setMapInstance(map)}
                      onDragStart={() => setAutoCenter(false)} // User geser peta = matikan auto follow
                      options={{
                        disableDefaultUI: true,
                        gestureHandling: "greedy",
                        styles: [
                          {
                            featureType: "poi",
                            elementType: "labels",
                            stylers: [{ visibility: "off" }],
                          },
                        ],
                      }}
                    >
                      {/* Rute Statis: Toko -> Pembeli */}
                      {directions && (
                        <DirectionsRenderer
                          directions={directions}
                          options={{
                            suppressMarkers: true,
                            polylineOptions: {
                              strokeColor: "#008080",
                              strokeWeight: 6,
                              strokeOpacity: 0.8,
                            },
                          }}
                        />
                      )}

                      {/* Marker Toko */}
                      {order?.merchant?.latitude && (
                        <MarkerF
                          position={{
                            lat: order.merchant.latitude,
                            lng: order.merchant.longitude,
                          }}
                          icon={{
                            url: ICONS.store,
                            scaledSize: new window.google.maps.Size(35, 35),
                          }}
                        />
                      )}

                      {/* Marker Rumah Pembeli */}
                      {order?.delivery_lat && (
                        <MarkerF
                          position={{
                            lat: order.delivery_lat,
                            lng: order.delivery_lng,
                          }}
                          icon={{
                            url: ICONS.buyer,
                            scaledSize: new window.google.maps.Size(40, 40),
                          }}
                        />
                      )}

                      {/* 🛵 Marker Motor Kurir (Bergeser Live - Aktif Sejak Pickup) */}
                      {liveCourierPos && isCourierVisible && (
                        <MarkerF
                          position={liveCourierPos}
                          icon={{
                            url: ICONS.courier,
                            scaledSize: new window.google.maps.Size(54, 54),
                            anchor: new window.google.maps.Point(27, 27),
                          }}
                          zIndex={999}
                        />
                      )}
                    </GoogleMap>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100">
                      <Loader2
                        className="animate-spin text-[#008080] mb-2"
                        size={32}
                      />
                      <span className="text-[10px] text-slate-400 font-black tracking-widest">
                        MEMUAT RADAR...
                      </span>
                    </div>
                  )}

                  {/* ETA BADGE */}
                  {!isFinished && etaInfo.duration && (
                    <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-md px-4 py-3 rounded-2xl shadow-xl border border-white/10 flex flex-col gap-1 z-10">
                      <h3 className="text-[#008080] text-[10px] font-black tracking-widest flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-teal-500 rounded-full animate-ping"></div>{" "}
                        ESTIMASI TIBA
                      </h3>
                      <p className="text-white text-[16px] font-[1000] tracking-tight leading-none">
                        {etaInfo.duration}{" "}
                        <span className="text-slate-400 text-[11px] font-bold">
                          ({etaInfo.distance})
                        </span>
                      </p>
                    </div>
                  )}

                  {/* TOMBOL PUSATKAN PETA */}
                  {!autoCenter &&
                    !isFinished &&
                    liveCourierPos &&
                    isCourierVisible && (
                      <button
                        onClick={() => {
                          setAutoCenter(true);
                          mapInstance?.panTo(liveCourierPos);
                        }}
                        className="absolute top-4 right-4 bg-white text-slate-800 p-3 rounded-xl shadow-xl border border-slate-200 active:scale-90 z-10"
                      >
                        <Crosshair size={24} className="text-[#FF6600]" />
                      </button>
                    )}

                  {/* INFO KURIR (Bottom Sheet Peta) */}
                  {order?.status === "COMPLETED" ? (
                    <div className="absolute bottom-4 left-4 right-4 bg-gradient-to-r from-teal-600 to-[#008080] p-5 rounded-2xl shadow-2xl border border-teal-400 flex items-center gap-4 text-white z-10">
                      <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                        <CheckCircle2 size={32} strokeWidth={2.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[16px] font-[1000] truncate tracking-tight">
                          PESANAN SELESAI
                        </p>
                        <p className="text-[10px] font-bold mt-1 tracking-widest text-teal-100">
                          TERIMA KASIH TELAH BERBELANJA.
                        </p>
                      </div>
                    </div>
                  ) : (
                    courier?.id &&
                    isCourierVisible && (
                      <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-xl p-4 rounded-[1.5rem] shadow-2xl border border-slate-200 flex flex-col gap-3 z-10">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-[#FF6600] border border-orange-100 shrink-0">
                            <Bike size={28} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-[1000] text-slate-800 truncate leading-tight">
                              {courier.name || "KURIR PASARQU"}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-1 rounded-md font-bold border border-slate-200 tracking-widest">
                                {courier.vehicle_plate || "PLAT DIRAHASIAKAN"}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowChat(true)}
                            className="flex-1 bg-[#008080] hover:bg-teal-700 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-black text-[11px] tracking-widest active:scale-95 transition-all shadow-md"
                          >
                            <MessageCircle size={16} /> CHAT
                          </button>
                          <a
                            href={`tel:${courier.phone_number}`}
                            className="flex-1 bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 py-3 rounded-xl flex items-center justify-center gap-2 font-black text-[11px] tracking-widest active:scale-95 transition-all shadow-sm"
                          >
                            <Phone size={16} /> TELPON
                          </a>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}

              {/* KLAIM PICKUP */}
              {isPickup && !isFinished && (
                <section className="bg-white p-8 rounded-3xl border-4 border-[#FF6600] shadow-xl text-center flex flex-col items-center">
                  <QrCode size={36} className="text-[#FF6600] mb-3" />
                  <h2 className="text-[18px] font-black tracking-widest">
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

              {/* PROGRESS STEPS - FIXED LOGIC */}
              {order?.status !== "CANCELLED" && (
                <section className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                  <ProgressSteps currentStep={currentStep} />
                </section>
              )}
            </div>

            {/* KANAN: DETAIL BELANJA */}
            <div className="lg:col-span-5 space-y-6">
              <section className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
                  <div className="p-2 bg-teal-50 rounded-xl text-[#008080]">
                    <ReceiptText size={20} />
                  </div>
                  <h4 className="text-[14px] font-black tracking-widest text-slate-800">
                    DAFTAR BELANJA
                  </h4>
                </div>
                <div className="space-y-4">
                  {orderItems.map((item: any, idx: number) => (
                    <div key={idx} className="flex gap-4 items-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-xl overflow-hidden shrink-0 border border-slate-100">
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
                        <p className="text-[10px] font-bold text-slate-400 tracking-widest">
                          JUMLAH: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[14px] font-[1000] text-slate-800 font-sans tracking-tight">
                          Rp{" "}
                          {(
                            item.quantity * item.price_at_purchase
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
                  <div className="p-2 bg-orange-50 rounded-xl text-[#FF6600]">
                    <MapPin size={20} />
                  </div>
                  <h4 className="text-[14px] font-black tracking-widest text-slate-800">
                    ALAMAT ANTAR
                  </h4>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center shrink-0 text-slate-400 border border-slate-100">
                    <Bike size={20} />
                  </div>
                  <div className="flex-1 mt-1">
                    <p className="text-[12px] font-bold text-slate-600 leading-relaxed normal-case tracking-normal">
                      {order?.address || "Alamat tidak ditemukan"}
                    </p>
                  </div>
                </div>
              </section>

              {/* PAYMENT SUMMARY */}
              <section className="bg-slate-900 p-8 rounded-[2rem] shadow-xl text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-bl-full pointer-events-none"></div>
                <h4 className="text-[12px] font-black tracking-widest text-teal-400 mb-6 flex items-center gap-2">
                  <Wallet size={16} /> RINGKASAN PEMBAYARAN
                </h4>
                <div className="space-y-4 font-bold text-[12px] opacity-90 border-b border-white/20 pb-6 mb-6">
                  <div className="flex justify-between">
                    <span>METODE PEMBAYARAN</span>
                    <span className="text-white bg-white/10 px-2 py-0.5 rounded">
                      {order?.payment_method}
                    </span>
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
              <div className="space-y-3 pb-6">
                {(order?.status === "COMPLETED" ||
                  order?.shipping_status === "COMPLETED") &&
                  (hasReviewed ? (
                    <div className="w-full bg-teal-50 border border-[#008080] text-[#008080] py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-[12px] tracking-widest shadow-sm">
                      <CheckCircle2 size={20} strokeWidth={3} /> ULASAN
                      DIBERIKAN
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowReviewModal(true)}
                      className="w-full bg-gradient-to-r from-[#FF6600] to-orange-500 text-white py-4 rounded-2xl shadow-lg shadow-orange-500/30 flex items-center justify-center gap-3 font-black text-[13px] tracking-widest active:scale-95 transition-all"
                    >
                      <Star fill="white" size={20} className="animate-pulse" />{" "}
                      BERI PENILAIAN
                    </button>
                  ))}

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowSupportModal(true)}
                    className="flex-1 bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-600 py-3.5 rounded-2xl flex items-center justify-center gap-2 font-black text-[11px] tracking-widest active:scale-95 transition-all shadow-sm"
                  >
                    <HeadphonesIcon size={18} /> CS BANTUAN
                  </button>
                  {isFinished && (
                    <button
                      onClick={() =>
                        window.open(`/invoice/${orderId}`, "_blank")
                      }
                      className="flex-1 bg-slate-900 hover:bg-black text-white py-3.5 rounded-2xl flex items-center justify-center gap-2 font-black text-[11px] tracking-widest active:scale-95 transition-all shadow-md"
                    >
                      <Download size={18} /> UNDUH NOTA
                    </button>
                  )}
                </div>

                {["PAID", "PROCESSING", "PENDING"].includes(order?.status) && (
                  <button
                    onClick={handleCancelOrder}
                    disabled={isCancelling}
                    className="w-full mt-2 bg-red-50 text-red-600 py-4 rounded-2xl flex items-center justify-center gap-2 font-black tracking-widest text-[12px] active:scale-95 transition-all shadow-sm"
                  >
                    {isCancelling ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <Ban size={18} strokeWidth={2.5} />
                    )}{" "}
                    BATALKAN PESANAN
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* MODALS */}
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

        {showSupportModal && (
          <div className="fixed inset-0 z-[1000] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="relative w-full max-w-lg bg-white rounded-3xl p-2 animate-in zoom-in-95">
              <button
                onClick={() => setShowSupportModal(false)}
                className="absolute -top-12 right-0 flex items-center gap-2 text-white font-black text-[11px] tracking-widest bg-white/20 px-4 py-2 rounded-full hover:bg-white/30"
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

        {showChat && (
          <div className="fixed inset-0 z-[1000] bg-slate-900/80 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4">
            <div className="w-full max-w-md h-[90vh] md:h-[600px] bg-white rounded-t-3xl md:rounded-[2rem] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom-full md:zoom-in-95">
              <div className="p-5 bg-[#008080] text-white flex justify-between items-center shrink-0 shadow-md z-10">
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
