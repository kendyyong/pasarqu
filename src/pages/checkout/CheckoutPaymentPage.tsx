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

// 🚀 MESIN PENGHITUNG JARAK (INLINE AGAR 100% TIDAK ERROR)
const getDistanceKM = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) => {
  const R = 6371; // Radius bumi dalam KM
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Hasil dalam KM
};

export const CheckoutPaymentPage = () => {
  const { user, profile } = useAuth() as any;
  const { cart, clearCart, selectedMarket } = useMarket();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [shippingDetails, setShippingDetails] = useState<any>(null);
  const [manualAddress, setManualAddress] = useState("");
  const [deliveryCoords, setDeliveryCoords] = useState({
    lat: -6.2,
    lng: 106.8,
  });

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

  const calculateMysteryCashback = (subtotal: number) => {
    const percentages = [0.03, 0.04, 0.05];
    return Math.round(
      subtotal * percentages[Math.floor(Math.random() * percentages.length)],
    );
  };

  // 🚀 ENGINE LOGISTIK PRO (SUDAH DISAMBUNGKAN DENGAN ATURAN SUPER ADMIN)
  const updateLogistics = useCallback(
    async (lat: number, lng: number) => {
      if (!selectedMarket || cart.length === 0) return;
      try {
        const mLat = Number(selectedMarket.latitude) || 0;
        const mLng = Number(selectedMarket.longitude) || 0;

        // 1. Hitung Jarak
        let distance = 0;
        if (mLat !== 0 && mLng !== 0) {
          distance = getDistanceKM(lat, lng, mLat, mLng);
        }

        // 2. Tarik Aturan Super Admin
        let { data: r } = await supabase
          .from("shipping_rates")
          .select("*")
          .eq("district_name", selectedMarket.district || "")
          .maybeSingle();

        // 🚀 FALLBACK: Jika Distrik tidak ketemu, ambil aturan pertama yang ada di database!
        if (!r) {
          const { data: defaultR } = await supabase
            .from("shipping_rates")
            .select("*")
            .limit(1)
            .maybeSingle();
          r = defaultR;
        }

        // 🚀 HARD FALLBACK: Jika database kosong melompong
        if (!r) {
          r = {
            base_fare: 8000,
            base_distance_km: 3,
            price_per_km: 2000,
            app_fee_percent: 20,
            buyer_service_fee: 2000,
          };
        }

        const uniqueMerchants = [
          ...new Set(cart.map((item) => item.merchant_id)),
        ];
        const extraCount =
          uniqueMerchants.length > 1 ? uniqueMerchants.length - 1 : 0;
        const isPickup = shippingMethod === "pickup";

        // 🚀 3. PERHITUNGAN ONGKIR BERDASARKAN JARAK (INI YANG BOS TUNGGU!)
        let baseFare = isPickup ? 0 : Number(r.base_fare || 0);

        // Cek jika jarak lebih dari jarak dasar (misal > 3KM)
        if (!isPickup && distance > Number(r.base_distance_km || 3)) {
          const extraKm = Math.ceil(distance - Number(r.base_distance_km || 3)); // Bulatkan ke atas
          baseFare += extraKm * Number(r.price_per_km || 0);
        }

        const totalExtraFeeKurir = isPickup
          ? 0
          : extraCount * Number(r.multi_stop_fee || 0);
        const surgeCost = isPickup ? 0 : extraCount * Number(r.surge_fee || 0);

        const realShippingCost = baseFare + totalExtraFeeKurir + surgeCost;

        // 🚀 4. LOGIKA GRATIS ONGKIR
        let userPayShipping = realShippingCost;
        let appSubsidy = 0;
        const minOrderForFreeShipping = Number(r.free_shipping_min_order || 0);
        if (
          !isPickup &&
          minOrderForFreeShipping > 0 &&
          subtotalCart >= minOrderForFreeShipping
        ) {
          userPayShipping = 0;
          appSubsidy = realShippingCost;
        }

        // 🚀 5. BIAYA LAYANAN
        const totalLayanan = Math.round(
          Number(r.buyer_service_fee || 0) +
            Number(r.handling_fee || 0) +
            (isPickup ? 0 : extraCount * Number(r.surge_fee || 0)),
        );

        const appCutFromBase =
          baseFare * (Number(r.app_fee_percent || 0) / 100);
        const courierNet = baseFare - appCutFromBase + totalExtraFeeKurir;
        const totalExtraAppShare = isPickup
          ? 0
          : extraCount * Number(r.multi_stop_app_share || 0);
        const systemFee =
          appCutFromBase +
          Number(r.buyer_service_fee || 0) +
          Number(r.handling_fee || 0) +
          totalExtraAppShare +
          surgeCost;

        setShippingDetails({
          base_fare: Math.round(userPayShipping),
          real_shipping_cost: Math.round(realShippingCost),
          app_subsidy: Math.round(appSubsidy),
          distance_km: distance.toFixed(1), // Pastikan KM terkirim ke Ringkasan!
          combined_service_fee: totalLayanan,
          grand_total: Math.round(userPayShipping + totalLayanan),
          seller_admin_percent: Number(r.seller_admin_fee_percent || 0),
          system_fee: Math.round(systemFee),
          courier_earning_total: Math.round(courierNet),
        });
      } catch (err) {
        console.error("Gagal update ongkir", err);
      }
    },
    [selectedMarket, cart, shippingMethod, subtotalCart],
  );

  useEffect(() => {
    if (selectedMarket && profile) {
      const lat = Number(profile?.latitude) || Number(selectedMarket.latitude);
      const lng =
        Number(profile?.longitude) || Number(selectedMarket.longitude);
      setDeliveryCoords({ lat, lng });
      setManualAddress(
        (profile.address_street || profile.address || "").toUpperCase(),
      );
      updateLogistics(lat, lng);
    }
  }, [selectedMarket, profile, updateLogistics]);

  // HITUNG TOTAL AKHIR
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
      showToast("Data belum lengkap, mohon tunggu...", "error");
      return;
    }

    setLoading(true);
    const mysteryBonus =
      shippingMethod === "pickup" ? calculateMysteryCashback(subtotalCart) : 0;
    const pickupPIN =
      shippingMethod === "pickup"
        ? Math.floor(1000 + Math.random() * 9000).toString()
        : null;
    const pickupExpired =
      shippingMethod === "pickup"
        ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        : null;

    try {
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
          pickup_expired_at: pickupExpired,
        })
        .select()
        .single();

      if (orderErr)
        throw new Error(`Gagal simpan pesanan: ${orderErr.message}`);

      const { error: itemsErr } = await supabase.from("order_items").insert(
        cart.map((i) => ({
          order_id: newOrder.id,
          product_id: i.id,
          quantity: i.quantity,
          price_at_purchase: Math.round(i.price),
          merchant_id: i.merchant_id,
        })),
      );
      if (itemsErr) throw new Error("Gagal simpan rincian item");

      if (usedBalanceAmount > 0) {
        await supabase.rpc("deduct_user_balance", {
          u_id: user.id,
          amount: usedBalanceAmount,
        });
      }

      if (paymentMethod === "cod") {
        clearCart();
        showToast("PESANAN COD BERHASIL DIBUAT!", "success");
        setLoading(false);
        navigate(`/track-order/${newOrder.id}`);
      } else {
        const { data: payData } = await supabase.functions.invoke(
          "create-midtrans-token",
          {
            body: {
              order_id: newOrder.id,
              amount: grandTotalAkhir,
              customer_name: profile?.full_name || user.email,
              customer_email: user.email,
            },
          },
        );

        if (payData?.token && (window as any).snap) {
          (window as any).snap.pay(payData.token, {
            onSuccess: () => {
              clearCart();
              if (shippingMethod === "pickup") {
                setCashbackAmount(mysteryBonus);
                setCreatedOrderId(newOrder.id);
                setShowSurprise(true);
              } else {
                navigate(`/track-order/${newOrder.id}`);
              }
            },
            onPending: () => {
              clearCart();
              navigate(`/track-order/${newOrder.id}`);
            },
            onClose: () => setLoading(false),
          });
        }
      }
    } catch (err: any) {
      showToast(err.message, "error");
      setLoading(false);
    }
  };

  return (
    <MobileLayout
      activeTab="orders"
      onTabChange={(tab: string) => {
        if (tab === "home") navigate("/");
        if (tab === "account") navigate("/customer-dashboard");
      }}
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
            <CheckoutMethods
              shippingMethod={shippingMethod}
              setShippingMethod={setShippingMethod}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
            />
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
