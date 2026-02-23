import React, { useState, useEffect, useCallback } from "react";
import { useJsApiLoader } from "@react-google-maps/api";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import { useMarket } from "../../contexts/MarketContext";
import { useToast } from "../../contexts/ToastContext";
import { useNavigate } from "react-router-dom";
import { calculateDistance } from "../../utils/courierLogic";
import { ArrowLeft } from "lucide-react";
import { MobileLayout } from "../../components/layout/MobileLayout";

// IMPORT 4 KOMPONEN BARU KITA
import { CheckoutMethods } from "./components/CheckoutMethods";
import { CheckoutSummary } from "./components/CheckoutSummary";
import { CashbackModal } from "./components/CashbackModal";
import { CheckoutAddress } from "./components/CheckoutAddress";

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
  });

  const calculateMysteryCashback = (subtotal: number) => {
    const percentages = [0.03, 0.04, 0.05];
    return Math.round(
      subtotal * percentages[Math.floor(Math.random() * percentages.length)],
    );
  };

  const updateLogistics = useCallback(
    async (lat: number, lng: number) => {
      if (!selectedMarket || cart.length === 0) return;
      try {
        const distance = calculateDistance(
          lat,
          lng,
          Number(selectedMarket.latitude),
          Number(selectedMarket.longitude),
        );
        const { data: r } = await supabase
          .from("shipping_rates")
          .select("*")
          .eq("district_name", selectedMarket.district)
          .single();
        if (!r) return;

        const uniqueMerchants = [
          ...new Set(cart.map((item) => item.merchant_id)),
        ];
        const extraCount =
          uniqueMerchants.length > 1 ? uniqueMerchants.length - 1 : 0;
        const isPickup = shippingMethod === "pickup";

        let baseFare = isPickup ? 0 : Number(r.base_fare);
        if (!isPickup && distance > Number(r.base_distance_km)) {
          baseFare +=
            (distance - Number(r.base_distance_km)) * Number(r.price_per_km);
        }

        const totalLayanan = Math.round(
          Number(r.buyer_service_fee || 0) +
            (isPickup ? 0 : extraCount * Number(r.surge_fee || 0)),
        );

        // KALKULASI LOGISTICS ENGINE (Hak App & Hak Kurir)
        const appCutFromBase =
          baseFare * (Number(r.app_fee_percent || 0) / 100);
        const totalExtraFeeKurir = isPickup
          ? 0
          : extraCount * Number(r.multi_stop_fee || 0);
        const totalExtraAppShare = isPickup
          ? 0
          : extraCount * Number(r.multi_stop_app_share || 0);
        const surgeCost = isPickup ? 0 : extraCount * Number(r.surge_fee || 0);

        const systemFee =
          appCutFromBase +
          Number(r.buyer_service_fee || 0) +
          totalExtraAppShare +
          surgeCost;
        const courierNet = baseFare - appCutFromBase + totalExtraFeeKurir;

        setShippingDetails({
          base_fare: Math.round(baseFare),
          combined_service_fee: totalLayanan,
          grand_total: Math.round(
            baseFare +
              (isPickup ? 0 : extraCount * Number(r.multi_stop_fee || 0)) +
              totalLayanan,
          ),
          seller_admin_percent: Number(r.seller_admin_fee_percent),
          system_fee: Math.round(systemFee),
          courier_earning_total: Math.round(courierNet),
        });
      } catch (err) {
        console.error("Logistics Error:", err);
      }
    },
    [selectedMarket, cart, shippingMethod],
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

  const subtotalCart = cart.reduce((s, i) => s + i.price * i.quantity, 0);
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

    // 🚀 GENERATE KODE 4 ANGKA & WAKTU KEDALUWARSA JIKA AMBIL SENDIRI
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

          // 🚀 SIMPAN KE DATABASE
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
        showToast("PESANAN COD BERHASIL!", "success");
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
      console.error("Error Transaksi:", err);
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
          {/* BAGIAN KIRI: METODE & PETA */}
          <div className="md:col-span-2 space-y-5">
            <CheckoutMethods
              shippingMethod={shippingMethod}
              setShippingMethod={setShippingMethod}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
            />

            {/* PETA GOOGLE MAPS HANYA MUNCUL KALAU PILIH KURIR */}
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

          {/* BAGIAN KANAN: RINGKASAN & DOMPET */}
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

        {/* MODAL CASHBACK */}
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
