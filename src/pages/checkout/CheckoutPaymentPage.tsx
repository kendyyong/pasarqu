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
  AlertTriangle,
  Navigation,
  ReceiptText,
  ShoppingBag,
  Heart,
  MessageSquare, // Icon tambahan untuk alamat
} from "lucide-react";

const mapContainerStyle = {
  width: "100%",
  height: "220px",
  borderRadius: "16px",
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

  // --- FITUR TAMBAHAN YANG DIMINTA ---
  const [manualAddress, setManualAddress] = useState("");
  const [orderNotes, setOrderNotes] = useState("");

  const [deliveryCoords, setDeliveryCoords] = useState({
    lat: Number(profile?.latitude) || Number(selectedMarket?.latitude) || -6.2,
    lng:
      Number(profile?.longitude) || Number(selectedMarket?.longitude) || 106.81,
  });

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
  });

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
          showToast("GPS Berhasil Dikunci!", "success");
        },
        () => showToast("Gagal akses GPS.", "error"),
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
        console.error(err);
      } finally {
        setIsCalculating(false);
      }
    },
    [selectedMarket, cart, configContext],
  );

  useEffect(() => {
    if (isOpen && selectedMarket) {
      const lat =
        Number(profile?.latitude) || Number(selectedMarket?.latitude) || -6.2;
      const lng =
        Number(profile?.longitude) ||
        Number(selectedMarket?.longitude) ||
        106.8;
      setDeliveryCoords({ lat, lng });
      updateLogistics(lat, lng);
      // Sinkronkan alamat awal dari profil
      setManualAddress(profile?.address || "");
    }
  }, [isOpen, profile, selectedMarket, updateLogistics]);

  if (!isOpen || !selectedMarket) return null;

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const totalTagihanValue = subtotal + (shippingDetails?.total_to_buyer || 0);

  const handlePayment = async () => {
    if (isOutOfRange) return showToast("Jarak terlalu jauh!", "error");
    if (!manualAddress.trim())
      return showToast("Alamat lengkap wajib diisi!", "error");
    if (cart.length === 0) return;

    setLoading(true);
    try {
      const { data: newOrder, error: orderErr } = await supabase
        .from("orders")
        .insert({
          customer_id: user?.id,
          market_id: selectedMarket.id,
          total_price: totalTagihanValue,
          shipping_cost: shippingDetails?.total_ongkir || 0,
          service_fee: shippingDetails?.buyer_service_fee || 0,
          delivery_lat: deliveryCoords.lat,
          delivery_lng: deliveryCoords.lng,
          status: "PAID",
          shipping_status: "SEARCHING_COURIER",
          address: manualAddress.trim(), // Mengirim alamat yang diketik manual
          notes: orderNotes.trim(),
        })
        .select()
        .single();

      if (orderErr) throw orderErr;

      const orderItemsData = cart.map((i) => ({
        order_id: newOrder.id,
        product_id: i.id,
        quantity: i.quantity,
        price_at_purchase: i.price,
        merchant_id: i.merchant_id,
      }));

      const { error: itemsErr } = await supabase
        .from("order_items")
        .insert(orderItemsData);

      if (itemsErr) throw itemsErr;

      for (const item of cart) {
        await supabase.rpc("decrement_stock", {
          p_id: item.id,
          qty: item.quantity,
        });
      }

      await findNearestCourier(
        selectedMarket.latitude,
        selectedMarket.longitude,
      );

      showToast("Pesanan Berhasil Dibayar!", "success");
      clearCart();
      onClose();
      navigate(`/track-order/${newOrder.id}`);
    } catch (err: any) {
      console.error(err);
      showToast("Gagal memproses pembayaran: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] bg-white md:bg-slate-900/60 md:backdrop-blur-md flex flex-col items-center justify-center overflow-hidden">
      <div className="w-full h-full md:h-[85vh] md:mt-16 md:max-w-[1100px] bg-slate-50 md:rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* KOLOM KIRI */}
        <div className="hidden md:flex md:w-5/12 bg-teal-600 p-10 flex-col justify-between text-white relative overflow-hidden text-left">
          <div className="absolute -top-10 -right-10 opacity-10">
            <ShoppingBag size={300} />
          </div>
          <div className="relative z-10 space-y-6">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center border border-white/30">
              <Heart size={24} fill="white" />
            </div>
            <h2 className="text-4xl font-black leading-none uppercase tracking-tighter">
              Senang Belanja Di Pasarqu.
            </h2>
            <p className="text-sm font-medium leading-relaxed opacity-90">
              Setiap pesanan Anda membantu menghidupkan ekonomi pedagang pasar
              tradisional lokal.
            </p>
          </div>
        </div>

        {/* KOLOM KANAN */}
        <div className="flex-1 flex flex-col bg-white overflow-y-auto no-scrollbar">
          <div className="sticky top-0 bg-white p-4 md:p-6 border-b-2 border-teal-600 flex justify-between items-center z-50">
            <div className="text-left">
              <h3 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tighter leading-none">
                Konfirmasi Bayar
              </h3>
              <p className="text-[9px] md:text-[10px] font-black text-teal-600 uppercase tracking-widest mt-1">
                Pasar: {selectedMarket.name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-slate-100 rounded-xl text-slate-500 hover:text-red-500 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-2 md:p-8 space-y-4 pb-40">
            {/* RINCIAN BELANJA */}
            <div className="bg-slate-50 rounded-[2rem] border-2 border-slate-100 overflow-hidden shadow-sm">
              <div className="p-5 border-b border-slate-200 space-y-4 text-left">
                <div className="flex items-center gap-2">
                  <ShoppingBag size={18} className="text-teal-600" />
                  <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">
                    Daftar Belanjaan
                  </h4>
                </div>
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-start text-[11px]"
                    >
                      <div className="flex-1">
                        <p className="font-black text-slate-800 uppercase leading-tight">
                          {item.name}
                        </p>
                        <p className="font-bold text-slate-400 mt-0.5">
                          {item.quantity} x Rp {item.price.toLocaleString()}
                        </p>
                      </div>
                      <span className="font-black text-slate-900 ml-4">
                        Rp {(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5 bg-white space-y-3 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <ReceiptText size={18} className="text-teal-600" />
                  <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">
                    Rincian Pembayaran
                  </h4>
                </div>
                <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase">
                  <span>Subtotal Belanja</span>
                  <span className="text-slate-900 font-black">
                    Rp {subtotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase">
                  <span>
                    Biaya Kurir ({shippingDetails?.distance?.toFixed(1) || 0}{" "}
                    KM)
                  </span>
                  <span className="text-slate-900 font-black">
                    Rp {shippingDetails?.total_ongkir?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase">
                  <span>Biaya Pelayanan</span>
                  <span className="text-teal-600 font-black">
                    Rp{" "}
                    {shippingDetails?.buyer_service_fee?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="pt-3 border-t-2 border-dashed border-slate-100 flex justify-between items-end">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Total Tagihan
                    </span>
                    <h3
                      className={`text-2xl font-black tracking-tighter leading-none mt-1 ${isOutOfRange ? "text-red-500" : "text-orange-600"}`}
                    >
                      Rp {totalTagihanValue.toLocaleString()}
                    </h3>
                  </div>
                </div>
              </div>
            </div>

            {/* MAPS & INPUT ALAMAT TAMBAHAN */}
            <div className="bg-slate-50 p-4 rounded-[2rem] border-2 border-slate-100 space-y-4">
              <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-2">
                  <MapPin size={18} className="text-red-600" />
                  <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest">
                    Titik Antar
                  </span>
                </div>
                <button
                  onClick={handleAutoDetect}
                  className="bg-teal-600 text-white px-3 py-1.5 rounded-full text-[9px] font-black uppercase shadow-md active:scale-95 transition-all"
                >
                  <Navigation size={10} className="inline mr-1" /> Auto GPS
                </button>
              </div>
              <div className="relative rounded-2xl overflow-hidden border-2 border-white shadow-md">
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
                      onDragEnd={(e) => {
                        const newLat = e.latLng?.lat() || 0;
                        const newLng = e.latLng?.lng() || 0;
                        setDeliveryCoords({ lat: newLat, lng: newLng });
                        updateLogistics(newLat, newLng);
                      }}
                    />
                  </GoogleMap>
                ) : (
                  <div className="h-[220px] bg-slate-200 animate-pulse" />
                )}
              </div>

              {/* ✅ KOLOM PENGETIKAN ALAMAT LENGKAP (FITUR BARU) */}
              <div className="space-y-2 text-left px-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <MessageSquare size={12} /> Alamat Lengkap & Patokan
                </label>
                <textarea
                  rows={3}
                  placeholder="Ketik alamat detail (Contoh: Jl. Mawar No. 12, Pagar Hitam, Samping Toko Sinar)"
                  className="w-full bg-white border-2 border-slate-100 p-4 rounded-2xl text-sm font-bold focus:border-teal-600 outline-none resize-none transition-all placeholder:text-slate-300"
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                disabled={
                  loading || isCalculating || isOutOfRange || cart.length === 0
                }
                onClick={handlePayment}
                className={`w-full py-5 rounded-[2rem] font-black uppercase text-sm tracking-[0.3em] shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-95 ${
                  isOutOfRange
                    ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                    : "bg-slate-900 text-white hover:bg-teal-600"
                }`}
              >
                {loading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>
                    {isOutOfRange ? "JARAK TERLALU JAUH" : "KONFIRMASI BAYAR"}
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </div>

            {isOutOfRange && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 border border-red-100 text-left">
                <AlertTriangle size={20} />
                <p className="text-[10px] font-black uppercase">
                  Mohon geser pin lokasi lebih dekat ke area pasar.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
