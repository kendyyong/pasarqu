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

// ✅ EXPORT NAMED: Agar App.tsx tidak error saat import { CheckoutPaymentPage }
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

  // State koordinat pengantaran (Default ke profil user atau pasar)
  const [deliveryCoords, setDeliveryCoords] = useState({
    lat: profile?.latitude || selectedMarket?.latitude || -6.2,
    lng: profile?.longitude || selectedMarket?.longitude || 106.81,
  });

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
  });

  const updateLogistics = useCallback(
    async (lat: number, lng: number) => {
      if (!selectedMarket) return;
      setIsCalculating(true);
      try {
        const distance = calculateDistance(
          lat,
          lng,
          selectedMarket.latitude,
          selectedMarket.longitude,
        );

        const maxAllowed = (configContext as any).max_distance_km || 50;
        setIsOutOfRange(distance > maxAllowed);

        const merchantIds = Array.from(
          new Set(cart.map((item) => item.merchant_id)),
        );

        const result = await calculateShippingFee(
          selectedMarket.district || "Default",
          distance,
          merchantIds.length > 1,
        );

        setShippingDetails({
          ...result,
          distance,
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

  // Sinkronisasi koordinat saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      const lat = profile?.latitude || selectedMarket?.latitude || -6.2;
      const lng = profile?.longitude || selectedMarket?.longitude || 106.8;
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
      showToast("Jarak pengantaran terlalu jauh!", "error");
      return;
    }

    setLoading(true);
    try {
      // 1. Catat Order Utama (Data Keuangan Lengkap untuk Audit)
      const { data: newOrder, error: orderErr } = await supabase
        .from("orders")
        .insert({
          customer_id: user?.id,
          market_id: selectedMarket.id,
          total_price: totalToPay,
          shipping_cost: shippingDetails?.total_ongkir || 0,
          service_fee: shippingDetails?.buyer_service_fee || 0,
          seller_admin_fee_percent:
            shippingDetails?.seller_admin_fee_percent || 0,
          extra_pickup_fee: shippingDetails?.breakdown?.multi_stop_fee || 0,
          merchant_count: shippingDetails?.merchantCount || 1,
          courier_earning_total: shippingDetails?.courier_net || 0,
          app_earning_total:
            (shippingDetails?.app_fee_from_ongkir || 0) +
            (shippingDetails?.buyer_service_fee || 0),
          address: profile?.address || "Alamat belum ditentukan",
          delivery_lat: deliveryCoords.lat,
          delivery_lng: deliveryCoords.lng,
          status: "PAID", // Simulasi langsung bayar, ubah ke 'PENDING' jika pakai Midtrans
          shipping_status: "SEARCHING_COURIER",
        })
        .select()
        .single();

      if (orderErr) throw orderErr;

      // 2. Catat Detail Barang (Order Items)
      const { error: itemsErr } = await supabase.from("order_items").insert(
        cart.map((i) => ({
          order_id: newOrder.id,
          product_id: i.id,
          quantity: i.quantity,
          price_at_purchase: i.price,
          merchant_id: i.merchant_id,
        })),
      );

      if (itemsErr) throw itemsErr;

      // 3. Trigger Pencarian Kurir (Logistics Engine)
      await findNearestCourier(
        selectedMarket.latitude,
        selectedMarket.longitude,
      );

      showToast("Pesanan Berhasil Dibayar!", "success");
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
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-end justify-center">
      <div className="bg-[#f8fafc] w-full max-w-lg rounded-t-[3rem] shadow-2xl animate-in slide-in-from-bottom-full duration-500 max-h-[95vh] overflow-y-auto no-scrollbar pb-10 text-left">
        {/* HEADER KASIR */}
        <div className="sticky top-0 bg-white p-6 border-b border-slate-100 flex justify-between items-center z-20">
          <div>
            <h2 className="text-xl font-black text-slate-800 uppercase italic tracking-tighter leading-none">
              Konfirmasi Bayar
            </h2>
            <p className="text-[10px] font-bold text-teal-600 uppercase mt-1 tracking-widest">
              Pasar: {selectedMarket.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-red-500 transition-all active:scale-90"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* MAPS PENGANTARAN */}
          <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2 text-slate-800">
                <MapPin size={16} className="text-red-500" />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  Titik Antar Presisi
                </span>
              </div>
              <span className="text-[9px] font-bold text-red-500 animate-pulse bg-red-50 px-2 py-1 rounded-lg uppercase italic">
                Geser Pin Jika Belum Pas
              </span>
            </div>

            <div className="relative h-[220px] bg-slate-100 rounded-[1.8rem] overflow-hidden border border-slate-200 shadow-inner">
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
                    zIndex={9999}
                  />
                </GoogleMap>
              ) : (
                <div className="h-full flex items-center justify-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Mengaktifkan Radar...
                </div>
              )}

              {isCalculating && (
                <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center z-10">
                  <div className="bg-white px-4 py-2 rounded-full shadow-xl flex items-center gap-2 border border-slate-100">
                    <Loader2 size={14} className="animate-spin text-teal-600" />
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                      Update Ongkir...
                    </span>
                  </div>
                </div>
              )}
            </div>
            <p className="text-[10px] font-bold text-slate-500 px-3 uppercase italic leading-tight">
              {profile?.address || "Detail alamat belum diatur"}
            </p>
          </div>

          {/* WARNING JARAK */}
          {isOutOfRange && (
            <div className="bg-red-50 border-2 border-red-100 p-5 rounded-[2rem] flex items-start gap-4 animate-in zoom-in-95">
              <div className="bg-red-500 p-2 rounded-xl text-white shadow-lg">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h4 className="text-xs font-black text-red-600 uppercase tracking-widest leading-none">
                  Lokasi Diluar Jangkauan
                </h4>
                <p className="text-[10px] font-bold text-red-400 mt-1 uppercase italic">
                  Radius Maks: {(configContext as any).max_distance_km} KM.
                  Mohon geser pin lebih dekat.
                </p>
              </div>
            </div>
          )}

          {/* RINCIAN BIAYA */}
          <div className="bg-white p-8 rounded-[2.8rem] border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 pb-4 italic">
              Audit Rincian Bayar
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-bold text-slate-400 uppercase">
                <span>Total Belanja</span>
                <span className="text-slate-800">
                  Rp {subtotal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-xs font-bold text-slate-400 uppercase italic">
                <span>
                  Biaya Kurir ({shippingDetails?.distance?.toFixed(1) || 0} km)
                </span>
                <span className="text-slate-800">
                  {isCalculating
                    ? "..."
                    : `Rp ${shippingDetails?.total_ongkir?.toLocaleString() || 0}`}
                </span>
              </div>
            </div>

            <div className="pt-5 border-t-2 border-dashed border-slate-100 flex justify-between items-end">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  Tagihan Akhir
                </span>
                <span
                  className={`text-3xl font-black italic tracking-tighter leading-none ${isOutOfRange ? "text-slate-300" : "text-teal-600"}`}
                >
                  Rp {totalToPay.toLocaleString()}
                </span>
              </div>
              <div
                className={`p-3 rounded-2xl ${isOutOfRange ? "bg-slate-100 text-slate-300" : "bg-teal-50 text-teal-600"}`}
              >
                <ShieldCheck size={24} />
              </div>
            </div>
          </div>

          {/* TOMBOL BAYAR FIX */}
          <button
            disabled={
              loading || isCalculating || cart.length === 0 || isOutOfRange
            }
            onClick={handlePayment}
            className={`w-full py-6 rounded-[2.2rem] font-black uppercase text-xs tracking-[0.3em] shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all ${
              isOutOfRange
                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                : "bg-slate-900 text-white hover:bg-teal-600 shadow-slate-200"
            }`}
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                {isOutOfRange ? "TITIK TERLALU JAUH" : "BAYAR SEKARANG"}{" "}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
