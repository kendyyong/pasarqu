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
  Ticket,
  CheckCircle2,
} from "lucide-react";

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

  // 🚀 STATE UNTUK PROMO
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [isCheckingPromo, setIsCheckingPromo] = useState(false);
  const [promoError, setPromoError] = useState("");

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
  });

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

        let baseFare = Number(r.base_fare);
        if (distance > Number(r.base_distance_km)) {
          baseFare +=
            (distance - Number(r.base_distance_km)) * Number(r.price_per_km);
        }

        const totalLayanan = Math.round(
          Number(r.buyer_service_fee || 0) +
            extraCount * Number(r.surge_fee || 0),
        );
        const appCutBase = Math.round(
          baseFare * (Number(r.app_fee_percent) / 100),
        );

        setShippingDetails({
          merchantCount: uniqueMerchants.length,
          extraCount,
          base_fare: Math.round(baseFare),
          total_extra_fee: Math.round(
            extraCount * Number(r.multi_stop_fee || 0),
          ),
          combined_service_fee: totalLayanan,
          courier_pure: Math.round(baseFare - appCutBase),
          app_profit: Math.round(appCutBase + totalLayanan),
          seller_admin_percent: Number(r.seller_admin_fee_percent),
          grand_total: Math.round(
            baseFare +
              extraCount * Number(r.multi_stop_fee || 0) +
              totalLayanan,
          ),
        });
      } catch (err) {
        console.error(err);
      }
    },
    [selectedMarket, cart],
  );

  useEffect(() => {
    if (selectedMarket && profile) {
      const lat = Number(profile?.latitude) || Number(selectedMarket.latitude);
      const lng =
        Number(profile?.longitude) || Number(selectedMarket.longitude);
      setDeliveryCoords({ lat, lng });
      const fullAddress =
        `${profile.address_street || ""} RT/RW: ${profile.address_rt_rw || ""} DESA ${profile.address_village || ""} KEC. ${profile.address_district || ""}`
          .trim()
          .toUpperCase();
      setManualAddress(fullAddress || profile.address || "");
      updateLogistics(lat, lng);
    }
  }, [selectedMarket, profile, updateLogistics]);

  // 🚀 LOGIKA CEK KODE PROMO
  const handleApplyPromo = async () => {
    if (!promoCode) return;
    setIsCheckingPromo(true);
    setPromoError("");

    try {
      const { data, error } = await supabase
        .from("promos")
        .select("*")
        .eq("code", promoCode.toUpperCase())
        .eq("is_active", true)
        .maybeSingle();

      if (error || !data)
        throw new Error("Kode voucher tidak ditemukan atau tidak aktif.");

      const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);

      // Validasi Syarat Promo
      if (data.min_purchase && subtotal < data.min_purchase) {
        throw new Error(
          `Minimal belanja Rp ${data.min_purchase.toLocaleString()} untuk promo ini.`,
        );
      }
      if (data.usage_limit && data.used_count >= data.usage_limit) {
        throw new Error("Kuota voucher sudah habis digunakan.");
      }
      if (data.valid_until && new Date(data.valid_until) < new Date()) {
        throw new Error("Masa berlaku kode voucher sudah habis.");
      }

      setAppliedPromo(data);
      showToast("Voucher berhasil digunakan!", "success");
    } catch (err: any) {
      setPromoError(err.message);
      setAppliedPromo(null);
    } finally {
      setIsCheckingPromo(false);
    }
  };

  // 🚀 LOGIKA HITUNG DISKON
  const subtotalCart = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  let discountAmount = 0;

  if (appliedPromo) {
    if (appliedPromo.type === "DISCOUNT_NOMINAL") {
      discountAmount = appliedPromo.value;
    } else if (appliedPromo.type === "DISCOUNT_PERCENT") {
      discountAmount = (subtotalCart * appliedPromo.value) / 100;
      if (
        appliedPromo.max_discount &&
        discountAmount > appliedPromo.max_discount
      ) {
        discountAmount = appliedPromo.max_discount;
      }
    } else if (appliedPromo.type === "FREE_SHIPPING") {
      discountAmount = shippingDetails?.base_fare || 0;
      if (
        appliedPromo.max_discount &&
        discountAmount > appliedPromo.max_discount
      ) {
        discountAmount = appliedPromo.max_discount;
      }
    }
  }

  // Mencegah total menjadi minus jika diskon lebih besar dari harga
  const grandTotalAkhir = Math.max(
    0,
    subtotalCart + (shippingDetails?.grand_total || 0) - discountAmount,
  );

  const handlePayment = async () => {
    if (!user || !selectedMarket || !shippingDetails) return;
    setLoading(true);

    try {
      const adminFee = Math.round(
        subtotalCart * (shippingDetails.seller_admin_percent / 100),
      );

      // 1. Simpan Pesanan (Dengan data promo)
      const { data: newOrder, error: orderErr } = await supabase
        .from("orders")
        .insert({
          customer_id: user.id,
          market_id: selectedMarket.id,
          total_price: grandTotalAkhir,
          shipping_cost: Math.round(shippingDetails.base_fare),
          service_fee: Math.round(shippingDetails.combined_service_fee),
          status: "UNPAID",
          address: manualAddress.trim(),
          extra_store_fee: Math.round(shippingDetails.total_extra_fee),
          merchant_earning_total: Math.round(subtotalCart - adminFee),
          courier_earning_total: Math.round(
            shippingDetails.courier_pure + shippingDetails.total_extra_fee,
          ),
          app_earning_total: Math.round(shippingDetails.app_profit + adminFee),
          shipping_status: "PENDING",
          promo_code: appliedPromo ? appliedPromo.code : null,
          discount_amount: Math.round(discountAmount),
        })
        .select()
        .single();

      if (orderErr) throw orderErr;

      // 2. Simpan Item
      await supabase.from("order_items").insert(
        cart.map((i) => ({
          order_id: newOrder.id,
          product_id: i.id,
          quantity: i.quantity,
          price_at_purchase: Math.round(i.price),
          merchant_id: i.merchant_id,
        })),
      );

      // 3. Tambah count penggunaan promo jika ada (DIPERBAIKI)
      if (appliedPromo) {
        const { error: promoErr } = await supabase.rpc(
          "increment_promo_usage",
          { p_code: appliedPromo.code },
        );
        if (promoErr) {
          console.error("Gagal update kuota promo:", promoErr);
        }
      }

      // 4. PANGGIL EDGE FUNCTION MIDTRANS (Kirim harga yg sudah didiskon)
      const { data: payData, error: payError } =
        await supabase.functions.invoke("create-midtrans-token", {
          body: {
            order_id: newOrder.id,
            amount: grandTotalAkhir,
            customer_name: profile?.full_name || user.email,
            customer_email: user.email,
          },
        });

      if (payError || !payData?.token) {
        throw new Error(
          payData?.error || "Gagal mendapatkan token pembayaran dari server.",
        );
      }

      // 5. Jalankan Snap Midtrans
      if ((window as any).snap) {
        (window as any).snap.pay(payData.token, {
          onSuccess: function () {
            clearCart();
            showToast("PEMBAYARAN BERHASIL!", "success");
            navigate(`/track-order/${newOrder.id}`);
          },
          onPending: function () {
            clearCart();
            showToast("SILAKAN SELESAIKAN PEMBAYARAN", "info");
            navigate(`/track-order/${newOrder.id}`);
          },
          onError: function () {
            showToast("PEMBAYARAN GAGAL ATAU DITOLAK", "error");
            setLoading(false);
          },
          onClose: function () {
            showToast("PEMBAYARAN DITUNDA / DIBATALKAN", "info");
            setLoading(false);
          },
        });
      } else {
        throw new Error("Sistem pembayaran (Snap.js) tidak termuat.");
      }
    } catch (err: any) {
      console.error("CHECKOUT ERROR:", err);
      showToast(`GAGAL: ${err.message}`, "error");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-black uppercase tracking-tighter pb-10 text-left">
      <header className="bg-white border-b h-12 flex items-center px-4 justify-between sticky top-0 z-[100] font-black">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="p-1 text-slate-400">
            <ArrowLeft size={22} />
          </button>
          <div className="text-xl font-black">
            <span className="text-teal-600">PASAR</span>
            <span className="text-[#FF6600]">QU</span>
          </div>
        </div>
        <div className="bg-teal-50 text-teal-600 px-3 py-1 rounded-lg border text-[10px]">
          <Store size={12} className="inline mr-1" /> {selectedMarket?.name}
        </div>
      </header>

      <main className="max-w-6xl mx-auto flex flex-col md:flex-row gap-2 p-2 mt-2 font-black uppercase">
        <div className="flex-1 space-y-2">
          {/* LOKASI */}
          <section className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4 font-black">
              <MapPin size={18} className="text-red-500" />
              <h2>LOKASI ANTAR</h2>
            </div>
            <div className="h-[250px] rounded-2xl overflow-hidden border border-slate-100 mb-4 shadow-inner">
              {isLoaded && (
                <GoogleMap
                  mapContainerStyle={{ width: "100%", height: "100%" }}
                  center={deliveryCoords}
                  zoom={16}
                  options={{
                    disableDefaultUI: true,
                    gestureHandling: "greedy",
                  }}
                >
                  <MarkerF
                    position={deliveryCoords}
                    draggable
                    onDragEnd={(e) => {
                      const lat = e.latLng?.lat() || 0;
                      const lng = e.latLng?.lng() || 0;
                      setDeliveryCoords({ lat, lng });
                      updateLogistics(lat, lng);
                    }}
                  />
                </GoogleMap>
              )}
            </div>
            <textarea
              rows={2}
              className="w-full bg-slate-50 border-none p-3 rounded-2xl text-[12px] font-black outline-none focus:bg-teal-50"
              value={manualAddress}
              onChange={(e) => setManualAddress(e.target.value)}
            />
          </section>

          {/* KERANJANG */}
          <section className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm font-black">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-50 pb-2">
              <ShoppingBag size={18} className="text-teal-600" />
              <h2>KERANJANG BELANJA</h2>
            </div>
            {cart.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center text-[12px] py-2 border-b border-slate-50 last:border-0"
              >
                <p className="flex-1 truncate pr-4 text-slate-700">
                  {item.name} x{item.quantity}
                </p>
                <span className="font-sans font-black">
                  {(item.price * item.quantity).toLocaleString()}
                </span>
              </div>
            ))}
          </section>
        </div>

        {/* SIDEBAR PEMBAYARAN & PROMO */}
        <div className="w-full md:w-[360px]">
          <div className="space-y-2 sticky top-16">
            {/* 🚀 KOTAK PROMO */}
            <section className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm font-black">
              <div className="flex items-center gap-2 mb-3">
                <Ticket size={18} className="text-teal-600" />
                <h2 className="text-[12px] text-slate-800">PAKAI VOUCHER</h2>
              </div>
              <div className="flex gap-2 relative">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="KODE PROMO"
                  className="flex-1 bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs font-black outline-none focus:border-teal-500 uppercase transition-all"
                  disabled={!!appliedPromo}
                />
                {!appliedPromo ? (
                  <button
                    onClick={handleApplyPromo}
                    disabled={!promoCode || isCheckingPromo}
                    className="bg-slate-900 text-white px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50 active:scale-95 transition-all"
                  >
                    {isCheckingPromo ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      "PAKAI"
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setAppliedPromo(null);
                      setPromoCode("");
                    }}
                    className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                  >
                    BATAL
                  </button>
                )}
              </div>
              {promoError && (
                <p className="text-[9px] text-red-500 font-bold mt-2 ml-1">
                  {promoError}
                </p>
              )}
              {appliedPromo && (
                <div className="flex items-center gap-1.5 text-[9px] text-teal-600 font-black mt-2 ml-1 bg-teal-50 px-2 py-1.5 rounded-lg border border-teal-100">
                  <CheckCircle2 size={12} /> VOUCHER BERHASIL DITERAPKAN!
                </div>
              )}
            </section>

            {/* RINCIAN HARGA */}
            <section className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl border-b-[8px] border-teal-600 font-black">
              <div className="flex items-center gap-2 mb-6 font-black">
                <ReceiptText size={20} className="text-[#FF6600]" />
                <h2>RINCIAN PEMBAYARAN</h2>
              </div>
              <div className="space-y-3 mb-8">
                <div className="flex justify-between text-[12px] text-slate-500 uppercase">
                  <span>PRODUK</span>
                  <span className="font-sans text-slate-900 font-black">
                    {subtotalCart.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-[12px] text-slate-500 uppercase">
                  <span>ONGKIR UTAMA</span>
                  <span className="font-sans text-slate-900 font-black">
                    {shippingDetails?.base_fare?.toLocaleString() || 0}
                  </span>
                </div>
                {shippingDetails?.extraCount > 0 && (
                  <div className="flex justify-between text-[11px] text-orange-600 font-black italic bg-orange-50 px-2 py-1 rounded-lg border border-orange-100">
                    <span>EXTRA TOKO ({shippingDetails.extraCount})</span>
                    <span className="font-sans font-black">
                      +{shippingDetails.total_extra_fee.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-[12px] text-teal-600 uppercase">
                  <span>
                    <ShieldCheck size={14} className="inline mr-1" /> Layanan
                  </span>
                  <span className="font-sans font-black">
                    +
                    {shippingDetails?.combined_service_fee?.toLocaleString() ||
                      0}
                  </span>
                </div>

                {/* 🚀 BARIS DISKON (MUNCUL JIKA ADA PROMO) */}
                {appliedPromo && (
                  <div className="flex justify-between text-[12px] text-red-500 font-black border-t border-dashed pt-2 mt-2">
                    <span>DISKON PROMO</span>
                    <span className="font-sans font-black">
                      - {Math.round(discountAmount).toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="pt-4 border-t-2 border-slate-100 mt-4 font-black uppercase">
                  <p className="text-[10px] text-slate-400 mb-1 tracking-widest uppercase font-black">
                    TOTAL PEMBAYARAN
                  </p>
                  <p className="text-4xl font-black text-[#FF6600] font-sans tracking-tighter leading-none italic">
                    RP {grandTotalAkhir.toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                disabled={loading}
                onClick={handlePayment}
                className="w-full py-4 bg-teal-600 text-white rounded-2xl font-black text-[14px] shadow-lg hover:bg-slate-900 transition-all active:scale-95 disabled:bg-slate-200"
              >
                {loading ? (
                  <Loader2 className="animate-spin mx-auto" />
                ) : (
                  "BAYAR SEKARANG"
                )}
              </button>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CheckoutPaymentPage;
