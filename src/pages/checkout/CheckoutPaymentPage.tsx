import React, { useState, useEffect } from "react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { useMarket } from "../../contexts/MarketContext";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { supabase } from "../../lib/supabaseClient";
import { useRegionalFinance } from "../../hooks/useRegionalFinance";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  MapPin,
  Bike,
  Store,
  Wallet,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  UserPlus,
  Lock,
  CreditCard,
  ArrowRight,
} from "lucide-react";

// Style & Config Maps
const mapContainerStyle = {
  width: "100%",
  height: "160px",
  borderRadius: "12px",
};
const defaultCenter = { lat: -1.242, lng: 116.852 };

interface CheckoutPaymentPageProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CheckoutPaymentPage = ({
  isOpen,
  onClose,
}: CheckoutPaymentPageProps) => {
  const { cart, clearCart } = useMarket();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [shippingMethod, setShippingMethod] = useState<"COURIER" | "PICKUP">(
    "COURIER",
  );
  const [marketInfo, setMarketInfo] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
  });

  useEffect(() => {
    const fetchData = async () => {
      if (cart.length > 0 && isOpen) {
        if (user?.id) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();
          if (profileData) setUserProfile(profileData);
        }

        const { data: market } = await supabase
          .from("markets")
          .select("*")
          .eq("id", cart[0].market_id)
          .maybeSingle();
        if (market) setMarketInfo(market);
      }
    };
    fetchData();
  }, [isOpen, cart, user?.id]);

  const { regionalSettings, loading: loadingFee } = useRegionalFinance(
    marketInfo?.kecamatan,
  );

  if (!isOpen) return null;

  // Logika Kalkulasi
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const buyerServiceFee = regionalSettings?.buyer_service_fee ?? 2000;
  const deliveryFee = shippingMethod === "COURIER" ? 5000 : 0;
  const totalToPay = subtotal + deliveryFee + buyerServiceFee;

  // --- LOGIKA UTAMA: REDIRECT KE REGISTER ---
  const handleProcessOrder = async () => {
    // 1. Cek apakah user sudah login?
    if (!user) {
      showToast("Silakan isi data diri untuk melanjutkan pesanan", "info");

      // PERBAIKAN DI SINI: Arahkan langsung ke /register
      navigate("/register?redirect=checkout");
      return;
    }

    // 2. Cek apakah alamat sudah diisi?
    if (!userProfile?.address) {
      showToast("Lengkapi alamat pengiriman di profil", "error");
      navigate("/settings/address"); // Atau /profile?tab=address
      return;
    }

    setIsSubmitting(true);

    // Proses Simpan Order (Simulasi/Real)
    try {
      // ... (Kode insert ke supabase di sini) ...
      // Simulasi sukses:
      setTimeout(() => {
        setIsSuccess(true);
        clearCart();
        setIsSubmitting(false);
      }, 2000);
    } catch (error) {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] bg-[#f5f5f5] flex flex-col animate-in slide-in-from-right duration-300 overflow-y-auto text-left font-sans">
      {/* HEADER */}
      <header className="bg-white border-b border-teal-600 sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto px-4 h-[60px] md:h-[80px] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-50 rounded-full text-teal-600"
            >
              <ChevronLeft size={28} />
            </button>
            <h2 className="text-xl font-black text-teal-600 uppercase italic tracking-tighter">
              Checkout
            </h2>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1200px] mx-auto pb-32 md:pb-10 md:py-8 px-4 md:px-0">
        {isSuccess ? (
          <div className="bg-white p-12 rounded-[2rem] text-center shadow-xl animate-in zoom-in-95 mt-10">
            <CheckCircle2 size={60} className="mx-auto text-teal-500 mb-6" />
            <h3 className="text-2xl font-black text-slate-800 uppercase italic">
              Pesanan Berhasil!
            </h3>
            <button
              onClick={onClose}
              className="mt-8 px-12 py-4 bg-teal-600 text-white font-black rounded-xl uppercase text-xs shadow-lg"
            >
              Mantap!
            </button>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-6">
            {/* KIRI: ALAMAT & PRODUK */}
            <div className="flex-1 space-y-4">
              {/* STATUS USER CHECK (Tampilan Tamu) */}
              {!user && (
                <div className="bg-orange-50 border-2 border-orange-200 p-6 rounded-2xl flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-500 text-white rounded-xl shadow-lg">
                      <UserPlus size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-orange-800 uppercase">
                        Belum Punya Akun?
                      </p>
                      <p className="text-xs font-bold text-orange-600 italic">
                        Isi data pengiriman untuk lanjut bayar.
                      </p>
                    </div>
                  </div>
                  {/* Tombol Register Langsung */}
                  <button
                    onClick={() => navigate("/register?redirect=checkout")}
                    className="bg-orange-500 text-white px-6 py-2 rounded-lg font-black text-[10px] uppercase shadow-md hover:bg-orange-600"
                  >
                    Daftar Sekarang
                  </button>
                </div>
              )}

              {/* SECTION ALAMAT */}
              <section className="bg-white p-6 shadow-sm border-t-2 border-teal-600 relative overflow-hidden rounded-sm">
                <div className="absolute top-0 left-0 w-full h-[3px] bg-[repeating-linear-gradient(45deg,#0d9488,#0d9488_10px,#ffffff_10px,#ffffff_20px,#f59e0b_20px,#f59e0b_30px,#ffffff_30px,#ffffff_40px)]" />
                <div className="flex items-center gap-2 text-teal-600 mb-4">
                  <MapPin size={18} strokeWidth={3} />
                  <h3 className="text-xs font-black uppercase tracking-widest">
                    Alamat Pengiriman
                  </h3>
                </div>

                {user ? (
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 space-y-2">
                      <p className="font-black text-slate-800 text-sm uppercase">
                        {userProfile?.full_name || "Nama Pengguna"}
                      </p>
                      <p className="text-slate-500 text-xs font-bold leading-relaxed italic uppercase">
                        {userProfile?.address || "Alamat belum diatur."}
                      </p>
                    </div>
                    <div className="w-full md:w-64 h-32 bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                      {isLoaded && userProfile?.latitude && (
                        <GoogleMap
                          mapContainerStyle={mapContainerStyle}
                          center={{
                            lat: userProfile.latitude,
                            lng: userProfile.longitude,
                          }}
                          zoom={15}
                          options={{
                            disableDefaultUI: true,
                            gestureHandling: "none",
                          }}
                        >
                          <Marker
                            position={{
                              lat: userProfile.latitude,
                              lng: userProfile.longitude,
                            }}
                          />
                        </GoogleMap>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="py-10 text-center border-2 border-dashed border-slate-100 rounded-xl bg-slate-50">
                    <Lock size={32} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Alamat Terkunci (Login Diperlukan)
                    </p>
                  </div>
                )}
              </section>

              {/* LIST PRODUK */}
              <section className="bg-white shadow-sm rounded-sm overflow-hidden">
                <div className="p-4 border-b border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2 font-black uppercase text-xs text-slate-700">
                    <Store size={16} /> Etalase Belanja
                  </div>
                </div>
                <div className="divide-y divide-slate-50">
                  {cart.map((item) => (
                    <div key={item.id} className="p-4 flex gap-4 items-center">
                      <img
                        src={item.image_url}
                        className="w-16 h-16 object-cover rounded-lg border border-slate-100"
                      />
                      <div className="flex-1">
                        <h4 className="text-xs font-black text-slate-800 uppercase italic">
                          {item.name}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                          Rp{item.price.toLocaleString()} x {item.quantity}
                        </p>
                      </div>
                      <p className="text-sm font-black text-teal-600 italic">
                        Rp{(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* KANAN: RINGKASAN TAGIHAN */}
            <div className="w-full md:w-[380px]">
              <section className="bg-white md:sticky md:top-24 p-8 shadow-xl border-b-4 border-teal-600 rounded-sm">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 border-b border-slate-50 pb-4 italic mb-6">
                  Ringkasan Tagihan
                </h3>
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-xs font-bold text-slate-500 uppercase italic">
                    <span>Subtotal Produk</span>
                    <span>Rp{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-slate-500 uppercase italic">
                    <span>Ongkos Kirim</span>
                    <span>Rp{deliveryFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-slate-500 uppercase italic">
                    <span>Biaya Layanan</span>
                    <span>Rp{buyerServiceFee.toLocaleString()}</span>
                  </div>
                  <div className="pt-6 border-t border-dashed border-slate-200 flex justify-between items-end">
                    <span className="text-[10px] font-black text-slate-800 uppercase italic">
                      Total Bayar
                    </span>
                    <span className="text-3xl font-black text-teal-600 tracking-tighter italic leading-none">
                      Rp{totalToPay.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* TOMBOL UTAMA */}
                <button
                  disabled={isSubmitting || cart.length === 0}
                  onClick={handleProcessOrder}
                  className="w-full py-5 bg-teal-600 text-white font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-teal-700 active:scale-95 transition-all flex justify-center items-center gap-3 rounded-xl"
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" />
                  ) : user ? (
                    <>
                      <CreditCard size={18} /> "Buat Pesanan Sekarang"
                    </>
                  ) : (
                    <>
                      <UserPlus size={18} /> "Daftar & Pesan"
                    </>
                  )}
                </button>
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
