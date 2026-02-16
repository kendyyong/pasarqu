import React, { useState, useEffect, useCallback } from "react";
import { GoogleMap, useJsApiLoader, MarkerF } from "@react-google-maps/api";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import { useMarket } from "../../contexts/MarketContext";
import { useToast } from "../../contexts/ToastContext";
import { useNavigate } from "react-router-dom";
import { useConfig } from "../../contexts/ConfigContext";
import {
  calculateDistance,
  calculateShippingFee,
  findNearestCourier,
} from "../../utils/courierLogic";
import {
  X,
  MapPin,
  Loader2,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Navigation,
  ReceiptText,
} from "lucide-react";

const mapContainerStyle = {
  width: "100%",
  height: "220px",
  borderRadius: "24px",
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const CheckoutPaymentPage: React.FC<Props> = ({ isOpen, onClose }) => {
  const { user, profile } = useAuth();
  const { cart, clearCart, selectedMarket } = useMarket();
  const { showToast } = useToast();
  const configContext = useConfig();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [shippingDetails, setShippingDetails] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isOutOfRange, setIsOutOfRange] = useState(false);

  // State koordinat dengan proteksi angka (Number)
  const [deliveryCoords, setDeliveryCoords] = useState({
    lat: Number(profile?.latitude) || Number(selectedMarket?.latitude) || -6.2,
    lng:
      Number(profile?.longitude) || Number(selectedMarket?.longitude) || 106.81,
  });

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
  });

  // ✅ FITUR BARU: AUTO DETEKSI LOKASI GPS
  const handleAutoDetect = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setDeliveryCoords(newPos);
          updateLogistics(newPos.lat, newPos.lng);
          showToast("Lokasi GPS ditemukan!", "success");
        },
        () => showToast("Gagal akses GPS. Silakan geser pin manual.", "error"),
      );
    }
  };

  const updateLogistics = useCallback(
    async (lat: number, lng: number) => {
      if (!selectedMarket || isNaN(lat) || isNaN(lng)) return;
      setIsCalculating(true);
      try {
        const distance = calculateDistance(
          lat,
          lng,
          Number(selectedMarket.latitude),
          Number(selectedMarket.longitude),
        );

        // Proteksi Jarak NAN
        const safeDistance = isNaN(distance) ? 0 : distance;

        const maxAllowed = (configContext as any).max_distance_km || 50;
        setIsOutOfRange(safeDistance > maxAllowed);

        const merchantIds = Array.from(
          new Set(cart.map((item) => item.merchant_id)),
        );

        const result = await calculateShippingFee(
          selectedMarket.district || "Default",
          safeDistance,
          merchantIds.length > 1,
        );

        setShippingDetails({
          ...result,
          distance: safeDistance,
          merchantCount: merchantIds.length,
        });
      } catch (err) {
        console.error("Logistics Error:", err);
      } finally {
        setIsCalculating(false);
      }
    },
    [selectedMarket, cart, configContext],
  );

  useEffect(() => {
    if (isOpen && selectedMarket) {
      const lat =
        Number(profile?.latitude) || Number(selectedMarket.latitude) || -6.2;
      const lng =
        Number(profile?.longitude) || Number(selectedMarket.longitude) || 106.8;
      setDeliveryCoords({ lat, lng });
      updateLogistics(lat, lng);
    }
  }, [isOpen, profile, selectedMarket, updateLogistics]);

  const onMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const newLat = e.latLng.lat();
      const newLng = e.latLng.lng();
      setDeliveryCoords({ lat: newLat, lng: newLng });
      updateLogistics(newLat, newLng);
    }
  };

  if (!isOpen || !selectedMarket) return null;

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const totalToPay = subtotal + (shippingDetails?.total_to_buyer || 0);

  const handlePayment = async () => {
    if (isOutOfRange) {
      showToast("Jarak pengantaran diluar batas!", "error");
      return;
    }

    setLoading(true);
    try {
      const { data: newOrder, error: orderErr } = await supabase
        .from("orders")
        .insert({
          customer_id: user?.id,
          market_id: selectedMarket.id,
          total_price: totalToPay,
          shipping_cost: shippingDetails?.total_ongkir || 0,
          service_fee: shippingDetails?.buyer_service_fee || 0,
          delivery_lat: deliveryCoords.lat,
          delivery_lng: deliveryCoords.lng,
          status: "PAID",
          shipping_status: "SEARCHING_COURIER",
          address: profile?.address || "Alamat tidak terbaca",
        })
        .select()
        .single();

      if (orderErr) throw orderErr;

      await supabase.from("order_items").insert(
        cart.map((i) => ({
          order_id: newOrder.id,
          product_id: i.id,
          quantity: i.quantity,
          price_at_purchase: i.price,
          merchant_id: i.merchant_id,
        })),
      );

      await findNearestCourier(
        selectedMarket.latitude,
        selectedMarket.longitude,
      );
      showToast("Pembayaran Berhasil!", "success");
      clearCart();
      onClose();
      navigate(`/track-order/${newOrder.id}`);
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex items-end justify-center">
      <div className="bg-slate-100 w-full max-w-lg rounded-t-[3rem] shadow-2xl animate-in slide-in-from-bottom-full duration-500 max-h-[95vh] overflow-y-auto no-scrollbar pb-10 text-left">
        {/* HEADER */}
        <div className="sticky top-0 bg-white p-6 border-b-2 border-teal-600 flex justify-between items-center z-20">
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
              Konfirmasi Bayar
            </h2>
            <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest mt-1">
              Pasar: {selectedMarket.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-3 bg-slate-100 rounded-2xl text-slate-400 hover:text-red-500 transition-all active:scale-90"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* SEKSI LOKASI */}
          <div className="bg-white p-5 rounded-[2rem] border-2 border-white shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-red-600" />
                <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest">
                  Titik Antar
                </span>
              </div>
              <button
                onClick={handleAutoDetect}
                className="flex items-center gap-1 bg-teal-600 text-white px-3 py-1.5 rounded-full text-[9px] font-black uppercase shadow-lg active:scale-90"
              >
                <Navigation size={10} /> Auto GPS
              </button>
            </div>

            <div className="relative h-[220px] bg-slate-50 rounded-[1.8rem] overflow-hidden border-2 border-slate-100 shadow-inner">
              {isLoaded ? (
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={deliveryCoords}
                  zoom={16}
                  options={{
                    disableDefaultUI: true,
                    gestureHandling: "greedy",
                  }}
                >
                  <MarkerF
                    position={deliveryCoords}
                    draggable={true}
                    onDragEnd={onMarkerDragEnd}
                  />
                </GoogleMap>
              ) : (
                <div className="h-full flex items-center justify-center text-xs font-bold text-slate-400">
                  Radar Loading...
                </div>
              )}

              {isCalculating && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
                  <div className="bg-slate-900 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase flex items-center gap-2 shadow-2xl">
                    <Loader2 size={14} className="animate-spin" /> Hitung
                    Ongkir...
                  </div>
                </div>
              )}
            </div>
            <p className="text-[10px] font-bold text-slate-500 px-2 uppercase leading-relaxed">
              Alamat: {profile?.address || "Belum ditentukan"}
            </p>
          </div>

          {/* RINCIAN PEMBAYARAN */}
          <div className="bg-white p-6 rounded-[2rem] border-2 border-white shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
              <ReceiptText size={18} className="text-teal-600" />
              <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest text-left">
                Rincian Pembayaran
              </h3>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-xs font-bold text-slate-500 uppercase">
                <span>Belanjaan</span>
                <span className="text-slate-800">
                  Rp {subtotal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-xs font-bold text-slate-500 uppercase">
                <span>
                  Ongkir ({shippingDetails?.distance?.toFixed(1) || 0} KM)
                </span>
                <span className="text-slate-800">
                  Rp {shippingDetails?.total_ongkir?.toLocaleString() || 0}
                </span>
              </div>
              {/* ✅ BIAYA PELAYANAN DIMUNCULKAN */}
              <div className="flex justify-between text-xs font-bold text-slate-500 uppercase">
                <span>Biaya Pelayanan</span>
                <span className="text-teal-600 font-black">
                  Rp {shippingDetails?.buyer_service_fee?.toLocaleString() || 0}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t-2 border-dashed border-slate-100 flex justify-between items-end">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Total Bayar
                </span>
                <h3
                  className={`text-3xl font-black tracking-tighter leading-none mt-1 ${isOutOfRange ? "text-red-500" : "text-teal-600"}`}
                >
                  Rp {totalToPay.toLocaleString()}
                </h3>
              </div>
              {isOutOfRange && (
                <div className="flex items-center gap-1 text-red-500 animate-pulse">
                  <AlertTriangle size={18} />
                  <span className="text-[9px] font-black uppercase">
                    Jarak Kejauhan
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* TOMBOL BAYAR */}
          <button
            disabled={
              loading || isCalculating || isOutOfRange || cart.length === 0
            }
            onClick={handlePayment}
            className={`w-full py-6 rounded-[2.2rem] font-black uppercase text-sm tracking-[0.4em] shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-95 ${
              isOutOfRange
                ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                : "bg-slate-900 text-white hover:bg-teal-600 shadow-slate-200"
            }`}
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                {isOutOfRange ? "JARAK TIDAK TERJANGKAU" : "BAYAR SEKARANG"}
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
