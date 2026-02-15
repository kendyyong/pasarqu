import React, { useState, useEffect } from "react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import { useMarket } from "../../contexts/MarketContext";
import { useToast } from "../../contexts/ToastContext";
import { useNavigate } from "react-router-dom";
// IMPORT LOGIKA LOGISTIK & MATCHING
import {
  calculateDistance,
  calculateShippingFee,
  findNearestCourier,
} from "../../utils/courierLogic";
import {
  X,
  MapPin,
  CreditCard,
  Truck,
  Loader2,
  AlertCircle,
  Store,
  ArrowRight,
  ShieldCheck,
  UserPlus,
  Bike,
  ChevronLeft,
  Info,
} from "lucide-react";

// Style Maps
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
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [shippingDetails, setShippingDetails] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Load Google Maps API
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
  });

  // --- 1. LOGIKA HITUNG ONGKIR & LAYANAN BERDASARKAN JARAK REAL ---
  useEffect(() => {
    const getFinalShipping = async () => {
      if (isOpen && user && profile?.latitude && selectedMarket?.latitude) {
        setIsCalculating(true);
        try {
          // A. Hitung Jarak Real-Time
          const distance = calculateDistance(
            profile.latitude,
            profile.longitude,
            selectedMarket.latitude,
            selectedMarket.longitude,
          );

          // B. Cek apakah ada lebih dari 1 toko (Multi-Stop)
          const merchantIds = Array.from(
            new Set(cart.map((item) => item.merchant_id)),
          );
          const isMultiStop = merchantIds.length > 1;

          // C. Panggil Otak Logistik (Sesuai Kecamatan di Logistics Engine)
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
  }, [isOpen, user, profile, selectedMarket, cart]);

  if (!isOpen) return null;

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  // ✅ TOTAL BAYAR = Subtotal + Total to Buyer (Ongkir + Biaya Layanan)
  const totalToPay = subtotal + (shippingDetails?.total_to_buyer || 0);

  // --- 2. FUNGSI PEMBAYARAN & PEMBAGIAN DANA ---
  const handlePayment = async () => {
    if (!user) {
      showToast("Daftar dulu yuk, agar pesanan tersimpan!", "info");
      navigate("/register?redirect=checkout");
      return;
    }

    if (!selectedMarket) {
      showToast("Data pasar tidak ditemukan. Mohon ulangi pesanan.", "error");
      return;
    }

    if (!profile?.address) {
      showToast("Lengkapi alamat pengiriman di profil", "error");
      navigate("/customer-dashboard");
      return;
    }

    setLoading(true);
    try {
      // A. SIMPAN DATA PESANAN (ORDER)
      const { data: newOrder, error: orderErr } = await supabase
        .from("orders")
        .insert({
          customer_id: user?.id,
          market_id: selectedMarket.id,
          total_price: totalToPay,
          // Jurnal Keuangan Platform
          shipping_cost: shippingDetails?.total_ongkir || 0, // Ongkir Murni
          service_fee: shippingDetails?.buyer_service_fee || 0, // Biaya Layanan (Buyer)
          seller_admin_fee_percent:
            shippingDetails?.seller_admin_fee_percent || 0, // Potongan Seller (%)
          extra_pickup_fee: shippingDetails?.breakdown?.multi_stop_fee || 0,
          merchant_count: shippingDetails?.merchantCount || 1,
          courier_earning_total: shippingDetails?.courier_net || 0,
          app_earning_total:
            (shippingDetails?.app_fee_from_ongkir || 0) +
            (shippingDetails?.buyer_service_fee || 0),
          address: profile.address,
          status: "PAID",
          shipping_status: "SEARCHING_COURIER",
        })
        .select()
        .single();

      if (orderErr) throw orderErr;

      // B. SIMPAN ITEM PESANAN
      const orderItems = cart.map((item) => ({
        order_id: newOrder.id,
        product_id: item.id,
        quantity: item.quantity,
        price_at_purchase: item.price,
        merchant_id: item.merchant_id,
      }));
      await supabase.from("order_items").insert(orderItems);

      // C. 💸 LOGIKA SINKRONISASI KAS JURAGAN (TRANSAKSI LAYANAN)
      await supabase.from("transactions").insert([
        {
          type: "INCOME_SERVICE_FEE",
          debit: shippingDetails?.buyer_service_fee || 0,
          credit: 0,
          account_code: "1001-KAS",
          description: `Service Fee Order #${newOrder.id.slice(0, 8)}`,
        },
      ]);

      // D. CARI KURIR TERDEKAT
      const nearest = await findNearestCourier(
        selectedMarket.latitude,
        selectedMarket.longitude,
      );

      if (nearest) {
        console.log("Kurir Ditemukan:", nearest.name);
      }

      showToast("Pembayaran Berhasil! Mencari Kurir...", "success");
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
        {/* HEADER */}
        <div className="sticky top-0 bg-white p-6 border-b border-slate-100 flex justify-between items-center z-20">
          <div className="text-left">
            <h2 className="text-xl font-black text-slate-800 uppercase italic leading-none tracking-tighter">
              Konfirmasi Bayar
            </h2>
            <p className="text-[10px] font-bold text-teal-600 uppercase mt-1">
              {selectedMarket?.name || "Pasar Terpilih"}
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
          {/* MAPS PREVIEW */}
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
              {profile?.address || "Alamat belum diatur."}
            </p>
          </div>

          {/* RINGKASAN TAGIHAN */}
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

              {/* ✅ RINCIAN BIAYA LAYANAN BARU */}
              <div className="flex justify-between text-xs font-bold text-teal-600 uppercase italic">
                <span className="flex items-center gap-1">
                  Biaya Layanan <Info size={10} />
                </span>
                <span className="text-teal-600">
                  {isCalculating
                    ? "..."
                    : `Rp ${shippingDetails?.buyer_service_fee?.toLocaleString() || 0}`}
                </span>
              </div>

              {shippingDetails?.breakdown?.multi_stop_fee > 0 && (
                <div className="flex justify-between text-[10px] font-black text-orange-600 uppercase">
                  <span>Tambahan {shippingDetails.merchantCount - 1} Toko</span>
                  <span>
                    + Rp{" "}
                    {shippingDetails.breakdown.multi_stop_fee.toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-5 border-t-2 border-dashed border-slate-100 flex justify-between items-end">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase">
                  Total Bayar
                </span>
                <span className="text-3xl font-black text-teal-600 tracking-tighter leading-none italic">
                  Rp {totalToPay.toLocaleString()}
                </span>
              </div>
              <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl">
                <ShieldCheck size={24} />
              </div>
            </div>
          </div>

          {/* BUTTON AKSI */}
          <button
            disabled={loading || isCalculating || cart.length === 0}
            onClick={handlePayment}
            className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-30"
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                {user ? "KONFIRMASI BAYAR" : "DAFTAR & BAYAR"}{" "}
                <ArrowRight size={18} />
              </>
            )}
          </button>

          <p className="text-center text-[9px] font-black text-slate-300 uppercase tracking-widest italic leading-relaxed px-4">
            Pesanan Anda dilindungi oleh jaminan kesegaran Pasarqu. Biaya
            layanan & admin wilayah {selectedMarket?.district} berlaku.
          </p>
        </div>
      </div>
    </div>
  );
};
