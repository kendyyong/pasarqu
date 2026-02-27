import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  GoogleMap,
  useJsApiLoader,
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
  ShoppingBag,
  Package,
  CheckCircle2,
  Wallet,
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
import { OrderChatRoom } from "../../features/chat/OrderChatRoom";
import { ComplaintForm } from "../../components/shared/ComplaintForm";
import { MobileLayout } from "../../components/layout/MobileLayout";

const mapContainerStyle = { width: "100%", height: "100%" };

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

  const [order, setOrder] = useState<any>(null);
  const [courier, setCourier] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [chatType, setChatType] = useState<
    "merchant_customer" | "courier_customer"
  >("merchant_customer");
  const [orderItems, setOrderItems] = useState<any[]>([]);

  const [directions, setDirections] = useState<any>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);

  const [hasReviewed, setHasReviewed] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries: ["places", "routes"],
  });

  const steps = [
    { label: "DIBAYAR", key: "PAID", icon: Wallet },
    { label: "DIKEMAS", key: "PACKING", icon: Package },
    { label: "DIKIRIM", key: "SHIPPING", icon: Bike },
    { label: "SELESAI", key: "COMPLETED", icon: CheckCircle2 },
  ];

  const statusMap: any = {
    UNPAID: "MENUNGGU PEMBAYARAN",
    PROCESSING: "SEDANG DISIAPKAN",
    READY_TO_PICKUP: "SIAP DIAMBIL",
    SHIPPING: "DALAM PENGIRIMAN",
    DELIVERING: "KURIR MENUJU LOKASI",
    DELIVERED: "SUDAH TIBA",
    COMPLETED: "PESANAN SELESAI",
    CANCELLED: "DIBATALKAN",
  };

  const getCurrentStep = () => {
    if (!order) return -1;
    if (order.status === "CANCELLED") return -1;
    if (order.shipping_status === "COMPLETED") return 3;
    if (
      order.shipping_status === "SHIPPING" ||
      order.shipping_status === "DELIVERING"
    )
      return 2;
    if (
      order.shipping_status === "PACKING" ||
      order.shipping_status === "READY_TO_PICKUP" ||
      order.status === "PACKING"
    )
      return 1;
    if (order.status === "PAID" || order.status === "PROCESSING") return 0;
    return -1;
  };

  const fetchFullData = useCallback(async () => {
    if (!orderId) return;
    try {
      setLoading(true);

      // 🚀 FIX 400 BAD REQUEST:
      // Kita panggil markets(*) saja, dan TIDAK memanggil merchants dari orders
      const { data: orderData, error: orderErr } = await supabase
        .from("orders")
        .select("*, market:markets(*)")
        .eq("id", orderId)
        .maybeSingle();

      if (orderErr) throw orderErr;
      if (!orderData) {
        setOrder(null);
        return;
      }

      // 🚀 SOLUSI AMAN: Kita tarik data Toko (Merchant) dari order_items
      const { data: rawItems } = await supabase
        .from("order_items")
        .select(
          "*, product:products(name, image_url), merchant:merchants(latitude, longitude)",
        )
        .eq("order_id", orderId);

      if (rawItems) {
        setOrderItems(rawItems);
        // Selipkan koordinat merchant ke dalam orderData untuk dipakai oleh Radar
        if (rawItems[0]?.merchant) {
          orderData.merchant = rawItems[0].merchant;
        }
      }

      setOrder(orderData);

      if (orderData.courier_id) {
        const { data: cData } = await supabase
          .from("couriers")
          .select("*")
          .eq("id", orderData.courier_id)
          .maybeSingle();
        setCourier(cData);
      }

      const { data: reviewData } = await supabase
        .from("reviews")
        .select("id")
        .eq("order_id", orderId)
        .maybeSingle();
      if (reviewData) setHasReviewed(true);
    } catch (err: any) {
      console.error("Fetch Tracking Error:", err);
      showToast("GAGAL MEMUAT DATA PESANAN", "error");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchFullData();
  }, [fetchFullData]);

  useEffect(() => {
    if (!orderId) return;
    const orderChannel = supabase
      .channel(`live-order-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => setOrder((prev: any) => ({ ...prev, ...payload.new })),
      )
      .subscribe();

    let courierChannel: any = null;
    if (order?.courier_id) {
      courierChannel = supabase
        .channel(`live-courier-${order.courier_id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "couriers",
            filter: `id=eq.${order.courier_id}`,
          },
          (payload) => setCourier(payload.new),
        )
        .subscribe();
    }

    return () => {
      supabase.removeChannel(orderChannel);
      if (courierChannel) supabase.removeChannel(courierChannel);
    };
  }, [orderId, order?.courier_id]);

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
          (result, status) => {
            if (status === window.google.maps.DirectionsStatus.OK)
              setDirections(result);
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

  const handleSubmitReview = async () => {
    if (rating === 0) return showToast("PILIH JUMLAH BINTANG!", "error");
    setIsSubmittingReview(true);
    try {
      const { error } = await supabase.from("reviews").insert({
        order_id: order.id,
        merchant_id: order.market_id,
        customer_id: user?.id,
        rating,
        comment: reviewComment,
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
    if (!window.confirm("Apakah Anda yakin ingin membatalkan pesanan ini?"))
      return;
    setIsCancelling(true);
    try {
      const { error } = await supabase.rpc("cancel_order_and_refund", {
        p_order_id: order.id,
        p_user_id: user.id,
      });
      if (error) throw error;
      showToast("Pesanan berhasil dibatalkan!", "success");
      setOrder((prev: any) => ({ ...prev, status: "CANCELLED" }));
    } catch (err: any) {
      showToast(err.message || "Gagal membatalkan pesanan.", "error");
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
    showToast("Pesanan telah dihapus dari riwayat.", "success");
    navigate("/order-history");
  };

  if (loading)
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-[100] gap-4 font-black">
        <Loader2 className="animate-spin text-[#008080]" size={32} />
        <p className="text-[12px] tracking-widest uppercase text-slate-400">
          MEMUAT RADAR...
        </p>
      </div>
    );

  const isPickup = order?.shipping_method === "pickup";
  const canCancel =
    order?.status === "PAID" ||
    order?.status === "PROCESSING" ||
    order?.status === "PENDING";
  const isFinished =
    order?.status === "COMPLETED" || order?.status === "CANCELLED";

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

  const currentCenter = getMapCenter();

  return (
    <MobileLayout
      activeTab="orders"
      onTabChange={(tab: string) => {
        if (tab === "home") navigate("/");
        if (tab === "account") navigate("/customer-dashboard");
        if (tab === "orders") navigate("/order-history");
      }}
      onSearch={() => {}}
      onCartClick={() => {}}
      cartCount={0}
    >
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-black text-left uppercase tracking-tighter not-italic text-[12px]">
        <header
          className={`sticky top-0 z-50 h-16 flex items-center px-4 shadow-md w-full transition-colors ${order?.status === "CANCELLED" ? "bg-red-600" : "bg-[#008080]"}`}
        >
          <div className="w-full max-w-[1200px] mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/order-history")}
                className="p-2 hover:bg-white/10 rounded-md text-white transition-all"
              >
                <ArrowLeft size={24} strokeWidth={3} />
              </button>
              <div className="flex flex-col text-left">
                <span className="text-[10px] text-white/70 leading-none mb-1 tracking-wider">
                  STATUS PESANAN
                </span>
                <span className="text-[14px] font-[1000] text-white leading-none">
                  #{order?.id?.slice(0, 8)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`px-3 py-1.5 rounded-md text-[10px] font-black shadow-sm ${order?.status === "COMPLETED" ? "bg-green-500 text-white" : order?.status === "CANCELLED" ? "bg-white text-red-600" : "bg-[#FF6600] text-white animate-pulse"}`}
              >
                {statusMap[order?.shipping_status || order?.status] ||
                  "MEMPROSES"}
              </div>
              {isFinished && (
                <button
                  onClick={handleHideOrderFromDetail}
                  className="p-2 bg-white/20 text-white hover:bg-red-500 rounded-md transition-all shadow-sm"
                >
                  <Trash2 size={18} strokeWidth={3} />
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 w-full max-w-[1200px] mx-auto p-4 pb-32 grid grid-cols-1 md:grid-cols-12 gap-5">
          <div className="md:col-span-7 space-y-5">
            {order?.status !== "CANCELLED" && !isPickup && (
              <div className="h-[350px] md:h-[450px] bg-slate-200 rounded-md border border-slate-200 shadow-sm overflow-hidden relative">
                {loadError ? (
                  <div className="w-full h-full flex flex-col items-center justify-center text-red-500">
                    <MapPin size={32} />
                    <p>GAGAL MEMUAT PETA</p>
                  </div>
                ) : !isLoaded ? (
                  <div className="w-full h-full flex items-center justify-center bg-slate-100 animate-pulse text-[#008080]">
                    MEMANASKAN RADAR...
                  </div>
                ) : (
                  <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={currentCenter}
                    zoom={15}
                    options={{
                      disableDefaultUI: true,
                      gestureHandling: "greedy",
                      mapId: "PASARQU_MAP",
                    }}
                    onLoad={(map) => setMapInstance(map)}
                  >
                    {directions && (
                      <DirectionsRenderer
                        directions={directions}
                        options={{
                          suppressMarkers: true,
                          polylineOptions: {
                            strokeColor: "#008080",
                            strokeWeight: 5,
                          },
                        }}
                      />
                    )}

                    {!courier?.current_lat &&
                      (order?.merchant?.latitude ? (
                        <MarkerF
                          position={{
                            lat: order.merchant.latitude,
                            lng: order.merchant.longitude,
                          }}
                          icon={{
                            url: ICONS.store,
                            scaledSize: new window.google.maps.Size(40, 40),
                          }}
                        />
                      ) : order?.market?.latitude ? (
                        <MarkerF
                          position={{
                            lat: order.market.latitude,
                            lng: order.market.longitude,
                          }}
                          icon={{
                            url: ICONS.store,
                            scaledSize: new window.google.maps.Size(40, 40),
                          }}
                        />
                      ) : null)}

                    {order?.delivery_lat && (
                      <MarkerF
                        position={{
                          lat: order.delivery_lat,
                          lng: order.delivery_lng,
                        }}
                        icon={{
                          url: ICONS.home,
                          scaledSize: new window.google.maps.Size(40, 40),
                        }}
                      />
                    )}

                    {courier?.current_lat && (
                      <MarkerF
                        position={{
                          lat: courier.current_lat,
                          lng: courier.current_lng,
                        }}
                        icon={{
                          url: ICONS.courier,
                          scaledSize: new window.google.maps.Size(50, 50),
                        }}
                        zIndex={999}
                      />
                    )}
                  </GoogleMap>
                )}
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-2 rounded-md shadow-md flex items-center gap-2 border border-slate-200">
                  <div
                    className={`w-2.5 h-2.5 rounded-full animate-pulse ${courier?.current_lat ? "bg-green-500" : "bg-orange-500"}`}
                  ></div>
                  <span className="text-[10px] tracking-widest">
                    {courier?.current_lat
                      ? "KURIR TERDETEKSI"
                      : "MENUNGGU KURIR"}
                  </span>
                </div>
              </div>
            )}

            {order?.status === "CANCELLED" && (
              <section className="bg-red-50 p-8 rounded-md border-2 border-red-500 shadow-sm flex flex-col items-center text-center">
                <Ban size={48} className="text-red-500 mb-4" />
                <h2 className="text-[16px] font-[1000] text-red-600 tracking-widest uppercase mb-2">
                  PESANAN TELAH DIBATALKAN
                </h2>
                <p className="text-[11px] font-bold text-red-500/80 max-w-sm leading-tight mb-6 uppercase">
                  Pesanan ini telah dibatalkan. Dana (jika ada) telah
                  dikembalikan 100% ke dompet PasarQu Pay Anda.
                </p>
                <button
                  onClick={handleHideOrderFromDetail}
                  className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-md font-black text-[12px] uppercase shadow-lg active:scale-95 transition-all"
                >
                  <Trash2 size={18} /> HAPUS DARI DAFTAR BELANJA
                </button>
              </section>
            )}

            {isPickup &&
              order?.status !== "COMPLETED" &&
              order?.status !== "CANCELLED" && (
                <section className="bg-white p-8 rounded-md border-2 border-[#FF6600] shadow-lg flex flex-col items-center text-center">
                  <div className="flex items-center gap-2 text-[#FF6600] mb-5">
                    <QrCode size={22} />
                    <h2 className="text-[14px] font-[1000] tracking-widest uppercase">
                      KLAIM PENGAMBILAN
                    </h2>
                  </div>
                  <div className="bg-white p-4 rounded-md border-4 border-slate-900 mb-5 shadow-inner">
                    <QRCode value={order?.id || "PNDG"} size={180} />
                  </div>
                  <p className="text-[12px] font-black text-slate-800 mb-4 leading-tight uppercase px-4">
                    TUNJUKKAN KODE INI KE PEDAGANG UNTUK VERIFIKASI PENGAMBILAN
                    BARANG.
                  </p>
                  <div className="flex items-center gap-2 bg-orange-50 text-[#FF6600] px-4 py-2 rounded-md border border-orange-100">
                    <Gift size={18} />
                    <span className="text-[11px] font-black uppercase">
                      BONUS RP {order?.cashback_amount?.toLocaleString()} CAIR
                      SETELAH SCAN
                    </span>
                  </div>
                </section>
              )}

            {order?.status !== "CANCELLED" && (
              <section className="bg-white p-6 rounded-md border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center relative">
                  <div className="absolute top-[18px] left-8 right-8 h-[2px] bg-slate-100 -z-0" />
                  {steps.map((step, idx) => {
                    const isActive = idx <= getCurrentStep();
                    return (
                      <div
                        key={idx}
                        className="relative z-10 flex flex-col items-center w-1/4"
                      >
                        <div
                          className={`w-10 h-10 rounded-md flex items-center justify-center border-2 transition-all ${isActive ? "bg-[#008080] border-[#008080] text-white shadow-md scale-110" : "bg-white border-slate-100 text-slate-200"}`}
                        >
                          <step.icon size={18} />
                        </div>
                        <span
                          className={`text-[9px] mt-2 font-black leading-none text-center transition-colors ${isActive ? "text-[#008080]" : "text-slate-300"}`}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>

          <div className="md:col-span-5 space-y-5 text-left">
            <section className="bg-white p-5 rounded-md border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                <ReceiptText size={20} className="text-[#008080]" />
                <h4 className="text-[12px] font-[1000] tracking-widest uppercase">
                  RINCIAN PRODUK
                </h4>
              </div>
              <div className="space-y-4">
                {orderItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center text-[12px] font-black text-slate-700"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-slate-100 rounded-md overflow-hidden shrink-0 border border-slate-200">
                        <img
                          src={item.product?.image_url}
                          className="w-full h-full object-cover"
                          alt="Product"
                        />
                      </div>
                      <span className="truncate uppercase">
                        {item.product?.name}{" "}
                        <span className="text-slate-400 font-bold ml-1">
                          X{item.quantity}
                        </span>
                      </span>
                    </div>
                    <span className="font-sans ml-4 uppercase">
                      {(
                        item.quantity * item.price_at_purchase
                      ).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white p-5 rounded-md border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4 text-left">
                <MapPin
                  size={20}
                  className={isPickup ? "text-[#008080]" : "text-[#FF6600]"}
                />
                <h4 className="text-[12px] font-[1000] uppercase">
                  {isPickup ? "TITIK PENGAMBILAN" : "ALAMAT ANTAR"}
                </h4>
              </div>
              <div className="flex items-start gap-3 text-left">
                <div className="p-2 bg-slate-50 rounded-md text-slate-500">
                  {isPickup ? <Store size={22} /> : <Bike size={22} />}
                </div>
                <div>
                  <p className="text-[13px] font-[1000] text-slate-800 leading-tight mb-1 uppercase">
                    {isPickup ? order?.market?.name : profile?.full_name}
                  </p>
                  <p className="text-[12px] font-bold text-slate-500 leading-snug uppercase">
                    {order?.address}
                  </p>
                </div>
              </div>
            </section>

            <section className="bg-white p-6 rounded-md border border-slate-200 shadow-lg border-b-[8px] border-[#008080]">
              <div className="space-y-4 font-black uppercase text-[12px]">
                <div className="flex justify-between text-slate-500">
                  <span>METODE BAYAR</span>
                  <span className="text-slate-900">
                    {order?.payment_method}
                  </span>
                </div>
                <div className="flex justify-between text-[#008080]">
                  <span>BIAYA LAYANAN</span>
                  <span className="font-sans">
                    +{order?.service_fee?.toLocaleString()}
                  </span>
                </div>
                {order?.used_balance > 0 && (
                  <div className="flex justify-between text-[#FF6600]">
                    <span>SALDO TERPAKAI</span>
                    <span className="font-sans">
                      -{order?.used_balance?.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="pt-5 border-t-2 border-slate-100 mt-5 flex justify-between items-end">
                  <span className="text-[11px] text-slate-400 font-[1000] mb-1 uppercase">
                    TOTAL DIBAYAR
                  </span>
                  <span
                    className={`text-[28px] ${order?.status === "CANCELLED" ? "text-slate-300 line-through decoration-red-500" : "text-[#FF6600]"} font-[1000] font-sans tracking-tighter leading-none`}
                  >
                    RP {order?.total_price?.toLocaleString()}
                  </span>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 gap-3">
              {order?.shipping_status === "COMPLETED" && !hasReviewed && (
                <button
                  onClick={() => setShowReviewModal(true)}
                  className="w-full bg-[#FF6600] text-white py-4 rounded-md flex items-center justify-center gap-2 font-black text-[12px] uppercase shadow-md active:scale-95"
                >
                  <Star fill="currentColor" size={18} /> NILAI PESANAN SEKARANG
                </button>
              )}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowSupportModal(true)}
                  className="bg-slate-100 text-slate-600 py-3 rounded-md flex items-center justify-center gap-2 font-black text-[11px] uppercase active:scale-95"
                >
                  <HeadphonesIcon size={16} /> BANTUAN
                </button>
                {order?.shipping_status === "COMPLETED" ? (
                  <button
                    onClick={() => window.open(`/invoice/${orderId}`, "_blank")}
                    className="bg-white border-2 border-slate-900 text-slate-900 py-3 rounded-md flex items-center justify-center gap-2 font-black text-[11px] uppercase active:scale-95"
                  >
                    <Download size={16} /> NOTA PDF
                  </button>
                ) : (
                  order?.courier_id &&
                  order?.status !== "CANCELLED" && (
                    <button
                      onClick={() => {
                        setChatType("courier_customer");
                        setShowChat(true);
                      }}
                      className="bg-slate-900 text-white py-3 rounded-md flex items-center justify-center gap-2 font-black text-[11px] uppercase active:scale-95"
                    >
                      <MessageCircle size={16} className="text-[#FF6600]" />{" "}
                      CHAT KURIR
                    </button>
                  )
                )}
              </div>
              {canCancel && (
                <button
                  onClick={handleCancelOrder}
                  disabled={isCancelling}
                  className="w-full mt-2 bg-white border-2 border-red-200 text-red-500 hover:bg-red-50 py-3.5 rounded-md flex items-center justify-center gap-2 font-black text-[11px] uppercase active:scale-95 transition-all shadow-sm"
                >
                  {isCancelling ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Ban size={16} />
                  )}{" "}
                  BATALKAN PESANAN
                </button>
              )}
            </div>
          </div>
        </main>

        {showReviewModal && (
          <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-md p-6 shadow-2xl relative animate-in zoom-in-95">
              <button
                onClick={() => setShowReviewModal(false)}
                className="absolute top-4 right-4 text-slate-400"
              >
                <X size={20} />
              </button>
              <h2 className="text-[14px] font-black text-slate-800 uppercase mb-6 text-center tracking-widest">
                PENILAIAN PESANAN
              </h2>
              <div className="flex justify-center gap-2 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition-all"
                  >
                    <Star
                      size={32}
                      fill={
                        (hoverRating || rating) >= star ? "#FF6600" : "none"
                      }
                      className={
                        (hoverRating || rating) >= star
                          ? "text-[#FF6600]"
                          : "text-slate-200"
                      }
                      strokeWidth={2}
                    />
                  </button>
                ))}
              </div>
              <textarea
                placeholder="TULIS ULASAN ANDA..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value.toUpperCase())}
                className="w-full h-24 bg-slate-50 border border-slate-200 rounded-md p-3 text-[12px] font-black outline-none focus:border-[#008080] mb-4 uppercase"
              />
              <button
                onClick={handleSubmitReview}
                disabled={rating === 0 || isSubmittingReview}
                className="w-full py-4 bg-[#008080] text-white rounded-md font-black text-[12px] uppercase flex justify-center items-center gap-2 shadow-lg"
              >
                {isSubmittingReview ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  "KIRIM ULASAN SEKARANG"
                )}
              </button>
            </div>
          </div>
        )}

        {showChat && (
          <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-2">
            <div className="w-full max-w-md h-[85vh] bg-white rounded-md flex flex-col shadow-2xl overflow-hidden">
              <div className="p-4 flex justify-between items-center bg-[#008080] text-white">
                <div className="text-left">
                  <p className="text-[14px] font-black uppercase tracking-widest">
                    CHAT KURIR
                  </p>
                </div>
                <button
                  onClick={() => setShowChat(false)}
                  className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-md"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 bg-slate-50">
                <OrderChatRoom
                  orderId={orderId!}
                  chatType={chatType}
                  receiverName={"KURIR PASARQU"}
                />
              </div>
            </div>
          </div>
        )}

        {showSupportModal && (
          <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="relative w-full max-w-lg bg-white rounded-md p-4 animate-in zoom-in">
              <button
                onClick={() => setShowSupportModal(false)}
                className="absolute -top-10 right-0 flex items-center gap-2 text-white font-black text-[11px] uppercase"
              >
                <X size={18} /> TUTUP
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
      </div>
    </MobileLayout>
  );
};

export default OrderTrackingPage;
