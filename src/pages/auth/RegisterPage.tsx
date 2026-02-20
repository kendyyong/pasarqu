import React, { useState, useRef } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import {
  GoogleMap,
  useJsApiLoader,
  MarkerF,
  Autocomplete,
} from "@react-google-maps/api";
import { supabase } from "../../lib/supabaseClient";
import { useToast } from "../../contexts/ToastContext";
import { useMarket } from "../../contexts/MarketContext"; // Import ini penting
import { GoogleLoginButton } from "../../components/ui/GoogleLoginButton";
import {
  Eye,
  EyeOff,
  MapPin,
  Phone,
  Lock,
  Loader2,
  ChevronLeft,
  User,
  ShoppingBag,
  Zap,
  ShieldCheck,
  Building2,
  Map as MapIcon,
  Target,
  Mail,
} from "lucide-react";

const mapContainerStyle = {
  width: "100%",
  height: "170px",
  borderRadius: "12px",
};

const defaultCenter = { lat: -6.2, lng: 106.816666 };
const libraries: "places"[] = ["places"];

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { cart, selectedMarket } = useMarket(); // Ambil data belanjaan
  const [searchParams] = useSearchParams();
  const redirectTarget = searchParams.get("redirect");

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [coordinates, setCoordinates] = useState(defaultCenter);

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    street: "",
    rt_rw: "",
    village: "",
    district: "",
    city: "",
    extra: "",
  });

  const streetRef = useRef<google.maps.places.Autocomplete | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries,
    language: "id",
    region: "ID",
  });

  const fillAddressForm = (place: google.maps.places.PlaceResult) => {
    if (!place.address_components) return;
    let street = "",
      village = "",
      district = "",
      city = "";
    place.address_components.forEach((c) => {
      if (c.types.includes("route")) street = c.long_name;
      if (c.types.includes("administrative_area_level_4"))
        village = c.long_name;
      if (c.types.includes("administrative_area_level_3"))
        district = c.long_name;
      if (c.types.includes("administrative_area_level_2")) city = c.long_name;
    });

    if (place.geometry?.location) {
      setCoordinates({
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      });
    }

    setFormData((prev) => ({
      ...prev,
      street: street || prev.street,
      village: village || prev.village,
      district: district || prev.district,
      city: city || prev.city,
    }));
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCoordinates(newPos);
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({ location: newPos }, (results, status) => {
            if (status === "OK" && results?.[0]) fillAddressForm(results[0]);
          });
          showToast("LOKASI DITEMUKAN!", "success");
        },
        () => showToast("GAGAL AKSES GPS.", "error"),
      );
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 💡 SOLUSI: Simpan data belanja ke localStorage sebelum redirect
    if (cart.length > 0) {
      localStorage.setItem("pasarqu_temp_cart", JSON.stringify(cart));
    }
    if (selectedMarket) {
      localStorage.setItem(
        "pasarqu_temp_market",
        JSON.stringify(selectedMarket),
      );
    }

    try {
      if (formData.password.length < 6)
        throw new Error("PASSWORD MINIMAL 6 KARAKTER");

      const finalEmail =
        formData.email.trim() !== ""
          ? formData.email
          : `${formData.phone.replace(/\D/g, "")}@pasarqu.user`;

      const { data, error } = await supabase.auth.signUp({
        email: finalEmail,
        password: formData.password,
        options: { data: { full_name: formData.fullName } },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          showToast("AKUN SUDAH ADA. SILAKAN LOGIN.", "info");
          navigate(`/login?redirect=${redirectTarget || ""}`);
          return;
        }
        throw error;
      }

      if (data.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            name: formData.fullName,
            phone: formData.phone,
            address_street: formData.street,
            address_rt_rw: formData.rt_rw,
            address_village: formData.village,
            address_district: formData.district,
            address_city: formData.city,
            address_extra: formData.extra,
            latitude: coordinates.lat,
            longitude: coordinates.lng,
            role: "CUSTOMER",
            is_verified: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", data.user.id);

        if (profileError) throw profileError;

        showToast("DAFTAR BERHASIL!", "success");

        // Arahkan ke halaman asal jika ada redirect target
        const path =
          redirectTarget === "checkout" ? "/checkout" : "/customer-dashboard";
        setTimeout(() => navigate(path), 1500);
      }
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white md:bg-slate-50 font-sans antialiased text-left tracking-tighter uppercase">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto px-4 h-12 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1 text-slate-400 hover:bg-slate-50 rounded-lg"
          >
            <ChevronLeft size={22} />
          </button>
          <div
            onClick={() => navigate("/")}
            className="text-xl font-black cursor-pointer tracking-tighter leading-none"
          >
            <span className="text-teal-600">PASAR</span>
            <span className="text-[#FF6600]">QU</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center p-0 md:p-6 lg:bg-teal-950 overflow-y-auto">
        <div className="w-full max-w-[1100px] flex flex-col md:flex-row items-stretch justify-center bg-white md:rounded-[3rem] md:shadow-2xl overflow-hidden md:border-4 md:border-white">
          <div className="hidden md:flex md:w-5/12 bg-teal-600 p-10 flex-col justify-center text-white space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-10">
              <ShoppingBag size={300} />
            </div>
            <div className="relative z-10">
              <h2 className="text-4xl font-black leading-none mb-4 uppercase">
                KENAPA HARUS <br /> JADI MEMBER?
              </h2>
              <div className="space-y-6 mt-10 font-black">
                <FeatureItem
                  icon={<Zap size={20} />}
                  title="BELANJA KILAT"
                  desc="DATA ALAMAT TERSEDIA, CHECKOUT LEBIH CEPAT."
                />
                <FeatureItem
                  icon={<ShieldCheck size={20} />}
                  title="TRANSAKSI AMAN"
                  desc="SISTEM TERVERIFIKASI DAN SALDO AMAN."
                />
                <FeatureItem
                  icon={<MapPin size={20} />}
                  title="TITIK PRESISI"
                  desc="KURIR PASTI SAMPAI TANPA TANYA-TANYA."
                />
              </div>
            </div>
          </div>

          <div className="w-full md:w-7/12 p-5 md:p-10 flex flex-col h-full overflow-y-auto">
            <div className="space-y-4 font-black">
              <div className="border-l-4 border-teal-600 pl-3">
                <h3 className="text-2xl font-black text-slate-900 leading-none">
                  PENDAFTARAN
                </h3>
                <p className="text-[10px] font-black text-teal-600 mt-1 tracking-widest uppercase">
                  LENGKAPI DATA PENGIRIMAN ANDA
                </p>
              </div>

              <GoogleLoginButton />
              <div className="relative py-1 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100"></div>
                </div>
                <span className="relative bg-white px-3 text-[8px] font-black text-slate-400">
                  ATAU ISI MANUAL
                </span>
              </div>

              <form onSubmit={handleRegister} className="space-y-3 pb-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="relative">
                    <User
                      className="absolute left-4 top-3 text-teal-600"
                      size={16}
                    />
                    <input
                      required
                      placeholder="NAMA LENGKAP"
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData({ ...formData, fullName: e.target.value })
                      }
                      className="w-full bg-slate-50 rounded-xl py-3 pl-12 pr-4 text-[12px] font-black outline-none focus:bg-teal-50 transition-all uppercase"
                    />
                  </div>
                  <div className="relative">
                    <Phone
                      className="absolute left-4 top-3 text-teal-600"
                      size={16}
                    />
                    <input
                      required
                      type="tel"
                      placeholder="NOMOR WHATSAPP"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full bg-slate-50 rounded-xl py-3 pl-12 pr-4 text-[12px] font-black outline-none focus:bg-teal-50 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="relative">
                    <Mail
                      className="absolute left-4 top-3 text-teal-600"
                      size={16}
                    />
                    <input
                      type="email"
                      placeholder="EMAIL (OPSIONAL)"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full bg-slate-50 rounded-xl py-3 pl-12 pr-4 text-[12px] font-black outline-none lowercase focus:bg-teal-50"
                    />
                  </div>
                  <div className="relative">
                    <Lock
                      className="absolute left-4 top-3 text-teal-600"
                      size={16}
                    />
                    <input
                      required
                      type={showPassword ? "text" : "password"}
                      placeholder="PASSWORD"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="w-full bg-slate-50 rounded-xl py-3 pl-12 pr-12 text-[12px] font-black outline-none focus:bg-teal-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-3 text-teal-600"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 p-2 rounded-xl">
                  <div className="flex justify-between items-center px-1 mb-2">
                    <label className="text-[9px] font-black text-teal-600 flex items-center gap-1 uppercase">
                      <MapPin size={12} className="text-red-600" /> TITIK RUMAH
                    </label>
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      className="text-[8px] font-black text-white bg-teal-600 px-3 py-1 rounded-full flex items-center gap-1"
                    >
                      <Target size={10} /> AUTO GPS
                    </button>
                  </div>
                  {isLoaded ? (
                    <div className="rounded-lg overflow-hidden border border-slate-100 shadow-inner">
                      <GoogleMap
                        mapContainerStyle={mapContainerStyle}
                        center={coordinates}
                        zoom={16}
                        options={{
                          disableDefaultUI: true,
                          gestureHandling: "greedy",
                        }}
                      >
                        <MarkerF
                          position={coordinates}
                          draggable={true}
                          onDragEnd={(e) => {
                            const lat = e.latLng?.lat() || 0;
                            const lng = e.latLng?.lng() || 0;
                            setCoordinates({ lat, lng });
                            const geocoder = new google.maps.Geocoder();
                            geocoder.geocode(
                              { location: { lat, lng } },
                              (r, s) => {
                                if (s === "OK" && r?.[0]) fillAddressForm(r[0]);
                              },
                            );
                          }}
                        />
                      </GoogleMap>
                    </div>
                  ) : (
                    <div className="h-[100px] bg-white rounded-xl flex items-center justify-center text-[9px] font-black text-teal-600">
                      LOADING MAP...
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="relative">
                    <MapPin
                      className="absolute left-4 top-3 text-teal-600"
                      size={16}
                    />
                    {isLoaded && (
                      <Autocomplete
                        onLoad={(r) => (streetRef.current = r)}
                        onPlaceChanged={() =>
                          fillAddressForm(streetRef.current!.getPlace())
                        }
                      >
                        <input
                          required
                          placeholder="NAMA JALAN / PERUMAHAN"
                          value={formData.street}
                          onChange={(e) =>
                            setFormData({ ...formData, street: e.target.value })
                          }
                          className="w-full bg-slate-50 rounded-xl py-3 pl-12 pr-4 text-[12px] font-black outline-none focus:bg-teal-50 transition-all uppercase"
                        />
                      </Autocomplete>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      placeholder="RT / RW"
                      value={formData.rt_rw}
                      onChange={(e) =>
                        setFormData({ ...formData, rt_rw: e.target.value })
                      }
                      className="bg-slate-50 rounded-xl py-2.5 px-4 text-[12px] font-black outline-none focus:bg-teal-50 transition-all uppercase"
                    />
                    <input
                      placeholder="DESA"
                      value={formData.village}
                      onChange={(e) =>
                        setFormData({ ...formData, village: e.target.value })
                      }
                      className="bg-slate-50 rounded-xl py-2.5 px-4 text-[12px] font-black outline-none focus:bg-teal-50 transition-all uppercase"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <Building2
                        className="absolute left-3 top-2.5 text-teal-600"
                        size={14}
                      />
                      <input
                        placeholder="KECAMATAN"
                        value={formData.district}
                        onChange={(e) =>
                          setFormData({ ...formData, district: e.target.value })
                        }
                        className="w-full bg-slate-50 rounded-xl py-2.5 pl-9 pr-4 text-[12px] font-black outline-none focus:bg-teal-50 transition-all uppercase"
                      />
                    </div>
                    <div className="relative">
                      <MapIcon
                        className="absolute left-3 top-2.5 text-teal-600"
                        size={14}
                      />
                      <input
                        placeholder="KOTA"
                        value={formData.city}
                        onChange={(e) =>
                          setFormData({ ...formData, city: e.target.value })
                        }
                        className="w-full bg-slate-50 rounded-xl py-2.5 pl-9 pr-4 text-[12px] font-black outline-none focus:bg-teal-50 transition-all uppercase"
                      />
                    </div>
                  </div>
                  <input
                    placeholder="PATOKAN (PAGAR HITAM / WARUNG)"
                    value={formData.extra}
                    onChange={(e) =>
                      setFormData({ ...formData, extra: e.target.value })
                    }
                    className="w-full bg-slate-50 rounded-xl py-2.5 px-4 text-[12px] font-black outline-none focus:bg-teal-50 transition-all uppercase italic"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-teal-600 active:scale-95 transition-all text-xs tracking-[0.2em] flex items-center justify-center gap-2 mt-4 uppercase"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    "DAFTAR SEKARANG"
                  )}
                </button>
              </form>

              <div className="text-center pt-2 border-t border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  SUDAH MEMBER?{" "}
                  <Link
                    to={`/login?redirect=${redirectTarget || ""}`}
                    className="text-teal-600 underline ml-1"
                  >
                    LOGIN SEKARANG
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const FeatureItem = ({
  icon,
  title,
  desc,
}: {
  icon: any;
  title: string;
  desc: string;
}) => (
  <div className="flex gap-4 items-start">
    <div className="bg-white/20 p-3 rounded-xl border border-white/30 text-white shadow-lg">
      {icon}
    </div>
    <div>
      <h4 className="font-black uppercase tracking-widest text-sm leading-none mb-1">
        {title}
      </h4>
      <p className="text-teal-50 text-[11px] font-bold opacity-80 leading-relaxed uppercase">
        {desc}
      </p>
    </div>
  </div>
);
