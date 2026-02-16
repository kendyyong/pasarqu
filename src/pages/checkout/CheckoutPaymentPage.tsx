import React, { useState, useEffect } from "react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
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
  Truck,
  Loader2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Info,
  AlertTriangle,
} from "lucide-react"; // ✅ FIXED: Kembali ke lucide-react

const mapContainerStyle = {
  width: "100%",
  height: "160px",
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
  // ✅ FIXED: Menggunakan destructuring yang lebih aman sesuai ConfigContext
  const configContext = useConfig();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [shippingDetails, setShippingDetails] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isOutOfRange, setIsOutOfRange] = useState(false);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
  });

  useEffect(() => {
    const getFinalShipping = async () => {
      // ✅ FIXED: Null check untuk selectedMarket
      if (isOpen && user && profile?.latitude && selectedMarket?.latitude) {
        setIsCalculating(true);
        try {
          const distance = calculateDistance(
            profile.latitude,
            profile.longitude,
            selectedMarket.latitude,
            selectedMarket.longitude,
          );

          // ✅ FIXED: Penyesuaian pemanggilan variabel max_distance_km
          // Jika di context Anda menggunakan 'settings', ganti configContext.settings
          const maxAllowed = (configContext as any).max_distance_km || 50;

          if (distance > maxAllowed) {
            setIsOutOfRange(true);
          } else {
            setIsOutOfRange(false);
          }

          const merchantIds = Array.from(
            new Set(cart.map((item) => item.merchant_id)),
          );
          const isMultiStop = merchantIds.length > 1;

          const result = await calculateShippingFee(
            selectedMarket.district || "Default",
            distance,
            isMultiStop,
          );

          setShippingDetails({
            ...result,
            distance,
            merchantCount: merchantIds.length,
          });
        } catch (err) {
          console.error("Shipping Calc Error:", err);
        } finally {
          setIsCalculating(false);
        }
      }
    };
    getFinalShipping();
  }, [isOpen, user, profile, selectedMarket, cart, configContext]);

  if (!isOpen || !selectedMarket) return null; // ✅ FIXED: Cegah render jika market null

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const totalToPay = subtotal + (shippingDetails?.total_to_buyer || 0);

  const handlePayment = async () => {
    if (isOutOfRange) {
      showToast("Alamat di luar jangkauan pengiriman.", "error");
      return;
    }

    if (!user) {
      showToast("Daftar dulu yuk!", "info");
      navigate("/register?redirect=checkout");
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
          seller_admin_fee_percent:
            shippingDetails?.seller_admin_fee_percent || 0,
          extra_pickup_fee: shippingDetails?.breakdown?.multi_stop_fee || 0,
          merchant_count: shippingDetails?.merchantCount || 1,
          courier_earning_total: shippingDetails?.courier_net || 0,
          app_earning_total:
            (shippingDetails?.app_fee_from_ongkir || 0) +
            (shippingDetails?.buyer_service_fee || 0),
          address: profile?.address || "",
          status: "PAID",
          shipping_status: "SEARCHING_COURIER",
        })
        .select()
        .single();

      if (orderErr) throw orderErr;

      const orderItems = cart.map((item) => ({
        order_id: newOrder.id,
        product_id: item.id,
        quantity: item.quantity,
        price_at_purchase: item.price,
        merchant_id: item.merchant_id,
      }));
      await supabase.from("order_items").insert(orderItems);

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
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-end justify-center">
      <div className="bg-[#f8fafc] w-full max-w-lg rounded-t-[3rem] shadow-2xl animate-in slide-in-from-bottom-full duration-500 max-h-[95vh] overflow-y-auto no-scrollbar pb-10">
        <div className="sticky top-0 bg-white p-6 border-b border-slate-100 flex justify-between items-center z-20">
          <div className="text-left">
            <h2 className="text-xl font-black text-slate-800 uppercase italic leading-none tracking-tighter">
              Konfirmasi Bayar
            </h2>
            <p className="text-[10px] font-bold text-teal-600 uppercase mt-1">
              {selectedMarket.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-red-500 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 text-left">
          {isOutOfRange && (
            <div className="bg-red-50 border-2 border-red-100 p-5 rounded-[1.5rem] flex items-start gap-4 animate-bounce">
              <div className="bg-red-500 p-2 rounded-xl text-white shadow-lg">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h4 className="text-xs font-black text-red-600 uppercase tracking-widest">
                  Jarak Terlalu Jauh
                </h4>
                <p className="text-[10px] font-bold text-red-400 leading-tight mt-1">
                  Maaf, alamat Anda di luar radius operasional pasar ini.
                </p>
              </div>
            </div>
          )}

          <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-slate-800">
              <MapPin size={16} className="text-red-500" />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Titik Pengantaran
              </span>
            </div>
            <div className="h-40 bg-slate-100 rounded-[1.5rem] overflow-hidden border border-slate-200">
              {isLoaded && profile?.latitude ? (
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={{ lat: profile.latitude, lng: profile.longitude }}
                  zoom={15}
                  options={{ disableDefaultUI: true, gestureHandling: "none" }}
                >
                  <Marker
                    position={{ lat: profile.latitude, lng: profile.longitude }}
                  />
                </GoogleMap>
              ) : (
                <div className="h-full flex items-center justify-center text-[10px] font-bold text-slate-400">
                  Peta tidak tersedia
                </div>
              )}
            </div>
            <p className="text-xs font-bold text-slate-500 px-2 line-clamp-2 uppercase italic">
              {profile?.address || "Alamat belum diatur"}
            </p>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-5">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 pb-4">
              Rincian Pembayaran
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-bold text-slate-400 uppercase">
                <span>Subtotal Produk</span>
                <span className="text-slate-800">
                  Rp {subtotal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-xs font-bold text-slate-400 uppercase italic">
                <span>
                  Ongkir ({shippingDetails?.distance?.toFixed(1) || 0} km)
                </span>
                <span className="text-slate-800">
                  {isCalculating
                    ? "..."
                    : `Rp ${shippingDetails?.total_ongkir?.toLocaleString() || 0}`}
                </span>
              </div>
              <div className="flex justify-between text-xs font-bold text-teal-600 uppercase italic">
                <span>
                  Biaya Layanan <Info size={10} className="inline ml-1" />
                </span>
                <span className="text-teal-600">
                  {isCalculating
                    ? "..."
                    : `Rp ${shippingDetails?.buyer_service_fee?.toLocaleString() || 0}`}
                </span>
              </div>
            </div>

            <div className="pt-5 border-t-2 border-dashed border-slate-100 flex justify-between items-end">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase">
                  Total Bayar
                </span>
                <span
                  className={`text-3xl font-black tracking-tighter leading-none italic ${isOutOfRange ? "text-slate-300" : "text-teal-600"}`}
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

          <button
            disabled={
              loading || isCalculating || cart.length === 0 || isOutOfRange
            }
            onClick={handlePayment}
            className={`w-full py-6 rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all ${
              isOutOfRange
                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                : "bg-slate-900 text-white hover:bg-teal-600 shadow-slate-200"
            }`}
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                {isOutOfRange ? "JARAK TERLALU JAUH" : "KONFIRMASI BAYAR"}
                {!isOutOfRange && <ArrowRight size={18} />}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
