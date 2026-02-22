import React, { useState, useEffect, useCallback } from "react";
import { GoogleMap, useJsApiLoader, MarkerF } from "@react-google-maps/api";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import { useMarket } from "../../contexts/MarketContext";
import { useToast } from "../../contexts/ToastContext";
import { useNavigate } from "react-router-dom";
import { calculateDistance } from "../../utils/courierLogic";
import {
  ArrowLeft,
  MapPin,
  Loader2,
  ReceiptText,
  ShoppingBag,
  Store,
  ShieldCheck,
  CheckCircle2,
  Truck,
  CreditCard,
  Banknote,
  Gift,
  Coins,
} from "lucide-react";
import { MobileLayout } from "../../components/layout/MobileLayout";

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

        setShippingDetails({
          base_fare: Math.round(baseFare),
          combined_service_fee: totalLayanan,
          grand_total: Math.round(
            baseFare +
              (isPickup ? 0 : extraCount * Number(r.multi_stop_fee || 0)) +
              totalLayanan,
          ),
          seller_admin_percent: Number(r.seller_admin_fee_percent),
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

    try {
      // 1. Simpan Pesanan ke Database
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
        })
        .select()
        .single();

      if (orderErr)
        throw new Error(`Gagal simpan pesanan: ${orderErr.message}`);

      // 2. Simpan Item
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

      // 3. Potong Saldo jika dipakai
      if (usedBalanceAmount > 0) {
        await supabase.rpc("deduct_user_balance", {
          u_id: user.id,
          amount: usedBalanceAmount,
        });
      }

      // 4. Jalur Navigasi
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
            onClose: () => {
              setLoading(false);
            },
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
        {/* HEADER */}
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
            {/* CARA AMBIL */}
            <section className="bg-white p-5 rounded-md border border-slate-200 shadow-sm">
              <h2 className="text-[12px] text-slate-400 mb-4 tracking-widest font-black">
                1. PILIH CARA AMBIL
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setShippingMethod("courier")}
                  className={`flex flex-col items-center justify-center gap-3 py-6 rounded-md border-2 transition-all ${shippingMethod === "courier" ? "border-[#008080] bg-teal-50 text-[#008080]" : "border-slate-100 bg-slate-50 text-slate-400"}`}
                >
                  <Truck size={32} />{" "}
                  <span className="text-[12px] font-black">KURIR PASAR</span>
                </button>
                <button
                  onClick={() => {
                    setShippingMethod("pickup");
                    setPaymentMethod("midtrans");
                  }}
                  className={`flex flex-col items-center justify-center gap-3 py-6 rounded-md border-2 transition-all ${shippingMethod === "pickup" ? "border-[#008080] bg-teal-50 text-[#008080]" : "border-slate-100 bg-slate-50 text-slate-400"}`}
                >
                  <ShoppingBag size={32} />{" "}
                  <span className="text-[12px] font-black">AMBIL SENDIRI</span>
                </button>
              </div>
            </section>

            {/* CARA BAYAR */}
            <section className="bg-white p-5 rounded-md border border-slate-200 shadow-sm">
              <h2 className="text-[12px] text-slate-400 mb-4 tracking-widest font-black">
                2. CARA BAYAR
              </h2>
              <div className="space-y-3">
                <button
                  onClick={() => setPaymentMethod("midtrans")}
                  className={`w-full flex items-center justify-between p-5 rounded-md border-2 transition-all ${paymentMethod === "midtrans" ? "border-[#008080] bg-teal-50" : "border-slate-100 bg-slate-50"}`}
                >
                  <div className="flex items-center gap-4">
                    <CreditCard
                      className={
                        paymentMethod === "midtrans"
                          ? "text-[#008080]"
                          : "text-slate-400"
                      }
                      size={24}
                    />
                    <span className="text-[13px] font-black uppercase">
                      BAYAR ONLINE (QRIS/E-WALLET)
                    </span>
                  </div>
                  {paymentMethod === "midtrans" && (
                    <CheckCircle2 size={24} className="text-[#008080]" />
                  )}
                </button>

                {shippingMethod === "courier" ? (
                  <button
                    onClick={() => setPaymentMethod("cod")}
                    className={`w-full flex items-center justify-between p-5 rounded-md border-2 transition-all ${paymentMethod === "cod" ? "border-[#008080] bg-teal-50" : "border-slate-100 bg-slate-50"}`}
                  >
                    <div className="flex items-center gap-4">
                      <Banknote
                        className={
                          paymentMethod === "cod"
                            ? "text-[#008080]"
                            : "text-slate-400"
                        }
                        size={24}
                      />
                      <span className="text-[13px] font-black uppercase">
                        BAYAR TUNAI (COD)
                      </span>
                    </div>
                    {paymentMethod === "cod" && (
                      <CheckCircle2 size={24} className="text-[#008080]" />
                    )}
                  </button>
                ) : (
                  <div className="p-4 bg-orange-50 border-l-4 border-[#FF6600] rounded-md flex gap-4">
                    <Gift size={24} className="text-[#FF6600] shrink-0" />
                    <div>
                      <p className="text-[12px] font-black text-[#FF6600] uppercase">
                        BONUS AMBIL SENDIRI
                      </p>
                      <p className="text-[12px] font-bold text-slate-600 mt-1 uppercase leading-tight">
                        WAJIB BAYAR ONLINE UNTUK DAPAT CASHBACK 3-5%.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="space-y-5">
            {/* SALDO PASARQU */}
            <section className="bg-white p-5 rounded-md border border-slate-200 shadow-sm border-t-8 border-[#008080]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-[#008080]">
                  <Coins size={20} />
                  <h2 className="text-[12px] font-black uppercase">
                    DOMPET SAYA
                  </h2>
                </div>
                <span className="text-[14px] font-sans font-black text-slate-900">
                  RP {(profile?.balance || 0).toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => setUseBalance(!useBalance)}
                disabled={(profile?.balance || 0) === 0}
                className={`w-full flex items-center justify-between p-4 rounded-md border-2 transition-all ${useBalance ? "border-[#008080] bg-teal-50 text-[#008080]" : "border-slate-100 bg-slate-50 text-slate-400"}`}
              >
                <span className="text-[12px] font-black uppercase">
                  PAKAI SALDO
                </span>
                <div
                  className={`w-10 h-5 rounded-full relative transition-colors ${useBalance ? "bg-[#008080]" : "bg-slate-300"}`}
                >
                  <div
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${useBalance ? "right-0.5" : "left-0.5"}`}
                  />
                </div>
              </button>
            </section>

            {/* RINGKASAN TAGIHAN */}
            <section className="bg-white p-6 rounded-md border border-slate-200 shadow-xl border-b-[8px] border-[#008080]">
              <h2 className="text-[13px] font-[1000] mb-5 flex items-center gap-2 uppercase tracking-widest">
                <ReceiptText size={22} className="text-[#FF6600]" /> RINGKASAN
                HARGA
              </h2>
              <div className="space-y-4 text-[12px] font-black uppercase">
                <div className="flex justify-between text-slate-500">
                  <span>PRODUK</span>
                  <span className="font-sans text-slate-900">
                    {subtotalCart.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>ONGKIR</span>
                  <span className="font-sans text-slate-900">
                    {shippingDetails?.base_fare?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="flex justify-between text-[#008080]">
                  <span>LAYANAN</span>
                  <span className="font-sans">
                    +
                    {shippingDetails?.combined_service_fee?.toLocaleString() ||
                      0}
                  </span>
                </div>
                {useBalance && (
                  <div className="flex justify-between text-[#FF6600]">
                    <span>SALDO TERPAKAI</span>
                    <span className="font-sans">
                      -{usedBalanceAmount.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="pt-5 border-t-2 border-slate-100 mt-5 leading-none">
                  <p className="text-[12px] text-slate-400 mb-2 font-black text-center">
                    TOTAL BAYAR
                  </p>
                  <p className="text-[42px] font-[1000] text-[#FF6600] font-sans text-center leading-none">
                    RP {grandTotalAkhir.toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                disabled={loading}
                onClick={handlePayment}
                className="w-full mt-8 py-5 bg-[#FF6600] text-white rounded-md font-black text-[14px] uppercase active:scale-95 disabled:bg-slate-200 flex justify-center items-center gap-2 shadow-lg shadow-orange-200"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={24} />
                ) : (
                  "PROSES PESANAN"
                )}
              </button>
              <p className="mt-5 text-[12px] text-slate-400 text-center px-2 uppercase font-black leading-tight">
                Klik Proses berarti setuju{" "}
                <button
                  onClick={() => navigate("/terms-cashback")}
                  className="text-[#008080] underline underline-offset-4"
                >
                  S&K Cashback
                </button>
              </p>
            </section>
          </div>
        </main>

        {/* MODAL HADIAH */}
        {showSurprise && (
          <div className="fixed inset-0 z-[1000] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
            <div className="bg-white w-full max-w-sm rounded-md overflow-hidden shadow-2xl border-t-[12px] border-[#FF6600]">
              <div className="bg-orange-50 p-8 flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-[#FF6600] rounded-md flex items-center justify-center text-white mb-6 rotate-3 shadow-lg">
                  <Gift size={52} />
                </div>
                <h2 className="text-[18px] font-[1000] text-slate-800 uppercase tracking-widest leading-none">
                  BONUS TUNAI!
                </h2>
                <p className="text-[12px] text-slate-400 font-black uppercase mt-3">
                  HADIAH KHUSUS AMBIL SENDIRI
                </p>
              </div>
              <div className="p-8 text-center">
                <span className="text-[12px] font-black text-[#008080] uppercase">
                  SALDO DITERIMA
                </span>
                <h3 className="text-[48px] font-[1000] text-[#008080] font-sans leading-none mt-2 mb-4">
                  RP {cashbackAmount.toLocaleString()}
                </h3>
                <p className="text-[12px] font-black text-slate-400 uppercase leading-tight mb-8">
                  SALDO MASUK OTOMATIS SETELAH BARANG DIAMBIL DI LAPAK.
                </p>
                <button
                  onClick={() => {
                    setShowSurprise(false);
                    navigate(`/track-order/${createdOrderId}`);
                  }}
                  className="w-full py-5 bg-slate-900 text-white rounded-md font-[1000] text-[14px] uppercase active:scale-95 shadow-xl"
                >
                  KLAIM & LANJUT
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default CheckoutPaymentPage;
