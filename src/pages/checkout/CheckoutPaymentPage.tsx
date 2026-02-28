import React, { useState, useEffect, useCallback } from "react";
import { useJsApiLoader } from "@react-google-maps/api";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import { useMarket } from "../../contexts/MarketContext";
import { useToast } from "../../contexts/ToastContext";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { MobileLayout } from "../../components/layout/MobileLayout";

import { CheckoutMethods } from "./components/CheckoutMethods";
import { CheckoutSummary } from "./components/CheckoutSummary";
import { CashbackModal } from "./components/CashbackModal";
import { CheckoutAddress } from "./components/CheckoutAddress";

const GOOGLE_MAPS_LIBRARIES: ("places" | "routes" | "geometry" | "drawing")[] =
  ["places", "routes", "geometry", "drawing"];

// RUMUS HAVERSINE UNTUK JARAK PRESISI
const getDistanceKM = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const CheckoutPaymentPage = () => {
  const { user, profile } = useAuth() as any;
  const { cart, clearCart, selectedMarket } = useMarket();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [shippingDetails, setShippingDetails] = useState<any>(null);
  const [manualAddress, setManualAddress] = useState("");
  const [deliveryCoords, setDeliveryCoords] = useState({ lat: 0, lng: 0 });

  const [shippingMethod, setShippingMethod] = useState<"courier" | "pickup">(
    "courier",
  );
  const [paymentMethod, setPaymentMethod] = useState<"midtrans" | "cod">(
    "midtrans",
  );

  const [useBalance, setUseBalance] = useState(false);
  const [showSurprise, setShowSurprise] = useState(false);
  const [cashbackAmount, setCashbackAmount] = useState(0);
  const [createdOrderId, setCreatedOrderId] = useState("");

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const subtotalCart = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  // 🚀 UPDATE LOGISTIK: PERHITUNGAN FINAL
  const updateLogistics = useCallback(
    async (currentLat: number, currentLng: number) => {
      if (!selectedMarket || !currentLat || !currentLng) return;

      try {
        const marketLat = Number(selectedMarket.latitude);
        const marketLng = Number(selectedMarket.longitude);

        // 1. Hitung Jarak
        const distance = getDistanceKM(
          currentLat,
          currentLng,
          marketLat,
          marketLng,
        );

        // 2. Ambil Aturan Tarif dari DB
        let { data: r } = await supabase
          .from("shipping_rates")
          .select("*")
          .eq("district_name", selectedMarket.district || "")
          .maybeSingle();

        // Fallback jika tidak ada data di DB
        if (!r) {
          const { data: firstRate } = await supabase
            .from("shipping_rates")
            .select("*")
            .limit(1)
            .maybeSingle();
          r = firstRate || {
            base_fare: 8000,
            base_distance_km: 3,
            price_per_km: 2000,
            app_fee_percent: 20,
            buyer_service_fee: 2000,
            multi_stop_fee: 5000,
            multi_stop_app_share: 1000,
            handling_fee: 0,
            surge_fee: 0,
          };
        }

        const uniqueMerchants = [
          ...new Set(cart.map((item) => item.merchant_id)),
        ];
        const extraCount =
          uniqueMerchants.length > 1 ? uniqueMerchants.length - 1 : 0;
        const isPickup = shippingMethod === "pickup";

        // 3. Kalkulasi Ongkir Pokok
        let tripCost = isPickup ? 0 : Number(r.base_fare || 0);
        const baseDist = Number(r.base_distance_km || 3);

        if (!isPickup && distance > baseDist) {
          const extraKm = Math.ceil(distance - baseDist);
          tripCost += extraKm * Number(r.price_per_km || 0);
        }

        // 4. Biaya Multi-Stop & Surge
        const multiStopFee = isPickup
          ? 0
          : extraCount * Number(r.multi_stop_fee || 0);
        const surgeFeeTotal = isPickup
          ? 0
          : extraCount * Number(r.surge_fee || 0);

        const realShippingCost = tripCost + multiStopFee + surgeFeeTotal;

        // 5. Cek Subsidi Gratis Ongkir
        let userPayShipping = realShippingCost;
        let appSubsidy = 0;
        const minOrderFS = Number(r.free_shipping_min_order || 0);
        if (!isPickup && minOrderFS > 0 && subtotalCart >= minOrderFS) {
          userPayShipping = 0;
          appSubsidy = realShippingCost;
        }

        // 6. Biaya Layanan & Penanganan
        const totalLayanan = Math.round(
          Number(r.buyer_service_fee || 0) +
            Number(r.handling_fee || 0) +
            (isPickup ? 0 : extraCount * Number(r.surge_fee || 0)),
        );

        // 7. Pembagian Hasil (Revenue Share untuk Admin & Kurir)
        const appCutOngkir = tripCost * (Number(r.app_fee_percent || 0) / 100);
        const appShareExtra = isPickup
          ? 0
          : extraCount * Number(r.multi_stop_app_share || 0);

        const courierNet =
          tripCost - appCutOngkir + (multiStopFee - appShareExtra);

        const systemFee =
          appCutOngkir +
          appShareExtra +
          Number(r.buyer_service_fee || 0) +
          Number(r.handling_fee || 0) +
          surgeFeeTotal;

        setShippingDetails({
          base_fare: Math.round(userPayShipping),
          real_shipping_cost: Math.round(realShippingCost),
          app_subsidy: Math.round(appSubsidy),
          distance_km: distance.toFixed(1),
          combined_service_fee: totalLayanan,
          grand_total: Math.round(userPayShipping + totalLayanan),
          system_fee: Math.round(systemFee),
          courier_earning_total: Math.round(courierNet),
        });
      } catch (err) {
        console.error("Logistic Error:", err);
      }
    },
    [selectedMarket, cart, shippingMethod, subtotalCart],
  );

  // 🔥 EFEK 1: Inisialisasi Kordinat Pertama Kali
  useEffect(() => {
    if (selectedMarket && profile && deliveryCoords.lat === 0) {
      const initialLat =
        Number(profile.latitude) || Number(selectedMarket.latitude);
      const initialLng =
        Number(profile.longitude) || Number(selectedMarket.longitude);

      setDeliveryCoords({ lat: initialLat, lng: initialLng });
      setManualAddress(
        (profile.address_street || profile.address || "").toUpperCase(),
      );

      // Hitung logistik segera setelah kordinat siap
      updateLogistics(initialLat, initialLng);
    }
  }, [selectedMarket, profile?.id, updateLogistics]);

  // 🔥 EFEK 2: Pantau Perubahan Kordinat (Debounce 500ms agar hemat API)
  useEffect(() => {
    if (deliveryCoords.lat !== 0 && deliveryCoords.lng !== 0) {
      const timer = setTimeout(() => {
        updateLogistics(deliveryCoords.lat, deliveryCoords.lng);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [deliveryCoords.lat, deliveryCoords.lng, updateLogistics]);

  const totalSebelumSaldo = Math.max(
    0,
    subtotalCart + (shippingDetails?.grand_total || 0),
  );
  const usedBalanceAmount = useBalance
    ? Math.min(profile?.balance || 0, totalSebelumSaldo)
    : 0;
  const grandTotalAkhir = totalSebelumSaldo - usedBalanceAmount;

  const handlePayment = async () => {
    if (!user || !selectedMarket || !shippingDetails) {
      showToast("Sedang menghitung ongkir...", "error");
      return;
    }

    setLoading(true);

    // Mystery Bonus khusus Pickup
    const mysteryBonus =
      shippingMethod === "pickup" ? Math.round(subtotalCart * 0.05) : 0;

    // Kode PIN untuk ambil pesanan sendiri
    const pickupPIN =
      shippingMethod === "pickup"
        ? Math.floor(1000 + Math.random() * 9000).toString()
        : null;

    try {
      // 1. Insert ke tabel Orders
      const { data: newOrder, error: orderErr } = await supabase
        .from("orders")
        .insert({
          customer_id: user.id,
          market_id: selectedMarket.id,
          total_price: grandTotalAkhir,
          shipping_cost: Math.round(shippingDetails.base_fare),
          service_fee: Math.round(shippingDetails.combined_service_fee),
          status: paymentMethod === "cod" ? "PROCESSING" : "UNPAID",
          address:
            shippingMethod === "pickup"
              ? "AMBIL SENDIRI DI LAPAK"
              : manualAddress.trim(),
          shipping_method: shippingMethod,
          payment_method: paymentMethod,
          cashback_amount: mysteryBonus,
          used_balance: usedBalanceAmount,
          shipping_status:
            shippingMethod === "pickup" ? "READY_TO_PICKUP" : "PENDING",
          system_fee:
            shippingMethod === "pickup" ? 0 : shippingDetails.system_fee,
          courier_earning_total:
            shippingMethod === "pickup"
              ? 0
              : shippingDetails.courier_earning_total,
          pickup_code: pickupPIN,
          latitude: deliveryCoords.lat,
          longitude: deliveryCoords.lng,
        })
        .select()
        .single();

      if (orderErr) throw orderErr;

      // 2. Insert Item Pesanan
      await supabase.from("order_items").insert(
        cart.map((i) => ({
          order_id: newOrder.id,
          product_id: i.id,
          quantity: i.quantity,
          price_at_purchase: Math.round(i.price),
          merchant_id: i.merchant_id,
        })),
      );

      // 3. Potong Saldo jika digunakan
      if (usedBalanceAmount > 0) {
        await supabase.rpc("deduct_user_balance", {
          u_id: user.id,
          amount: usedBalanceAmount,
        });
      }

      // 4. Logika Pembayaran (COD vs Midtrans)
      if (paymentMethod === "cod") {
        clearCart();
        setCreatedOrderId(newOrder.id);

        if (mysteryBonus > 0) {
          setCashbackAmount(mysteryBonus);
          setShowSurprise(true);
        } else {
          showToast("PESANAN BERHASIL DIBUAT!", "success");
          navigate(`/track-order/${newOrder.id}`);
        }
      } else {
        // Panggil Edge Function Midtrans
        const { data: payData, error: payErr } =
          await supabase.functions.invoke("create-midtrans-token", {
            body: {
              order_id: newOrder.id,
              amount: grandTotalAkhir,
              customer_name: profile?.full_name || user.email,
            },
          });

        if (payErr) throw payErr;

        if (payData?.token && (window as any).snap) {
          (window as any).snap.pay(payData.token, {
            onSuccess: () => {
              clearCart();
              navigate(`/track-order/${newOrder.id}`);
            },
            onPending: () => {
              clearCart();
              navigate(`/track-order/${newOrder.id}`);
            },
            onClose: () => {
              setLoading(false);
              showToast("Selesaikan pembayaran Anda segera!", "info");
              navigate(`/track-order/${newOrder.id}`);
            },
          });
        }
      }
    } catch (err: any) {
      showToast(err.message || "Gagal memproses pesanan", "error");
      setLoading(false);
    }
  };

  return (
    <MobileLayout
      activeTab="orders"
      onTabChange={(t) => navigate(t === "home" ? "/" : "/customer-dashboard")}
      onSearch={() => {}}
      onCartClick={() => {}}
      cartCount={0}
    >
      <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-black uppercase tracking-tighter pb-32 text-left not-italic">
        <header className="bg-[#008080] h-16 flex items-center px-4 justify-between sticky top-0 z-[100] shadow-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-white bg-white/10 rounded-md active:scale-90 transition-all"
            >
              <ArrowLeft size={24} strokeWidth={3} />
            </button>
            <div className="text-[14px] font-[1000] text-white tracking-[0.1em]">
              RINCIAN PEMBAYARAN
            </div>
          </div>
          <div className="bg-[#FF6600] text-white px-3 py-1.5 rounded-md text-[12px] font-black shadow-sm">
            {selectedMarket?.name}
          </div>
        </header>

        <main className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-5 p-4 mt-2">
          <div className="md:col-span-2 space-y-5">
            {/* Pilih Kurir vs Ambil Sendiri & Midtrans vs COD */}
            <CheckoutMethods
              shippingMethod={shippingMethod}
              setShippingMethod={setShippingMethod}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
            />

            {/* Peta & Alamat (Hanya muncul jika pakai kurir) */}
            {shippingMethod === "courier" && (
              <CheckoutAddress
                isLoaded={isLoaded}
                deliveryCoords={deliveryCoords}
                setDeliveryCoords={setDeliveryCoords}
                manualAddress={manualAddress}
                setManualAddress={setManualAddress}
                updateLogistics={updateLogistics}
              />
            )}
          </div>

          <div className="md:col-span-1">
            {/* Kartu Ringkasan Harga & Tombol Proses */}
            <CheckoutSummary
              profile={profile}
              useBalance={useBalance}
              setUseBalance={setUseBalance}
              subtotalCart={subtotalCart}
              shippingDetails={shippingDetails}
              usedBalanceAmount={usedBalanceAmount}
              grandTotalAkhir={grandTotalAkhir}
              loading={loading}
              onProcessPayment={handlePayment}
              onTermsClick={() => navigate("/terms-cashback")}
            />
          </div>
        </main>

        {/* Modal Surprise jika dapat Cashback */}
        <CashbackModal
          show={showSurprise}
          amount={cashbackAmount}
          onClaim={() => {
            setShowSurprise(false);
            navigate(`/track-order/${createdOrderId}`);
          }}
        />
      </div>
    </MobileLayout>
  );
};

export default CheckoutPaymentPage;
