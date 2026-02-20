import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  GoogleMap,
  useJsApiLoader,
  MarkerF,
  Autocomplete,
} from "@react-google-maps/api";
import { supabase } from "../../../lib/supabaseClient";
import { useAuth } from "../../../contexts/AuthContext";
import { useToast } from "../../../contexts/ToastContext";
import {
  ArrowLeft,
  MapPin,
  Loader2,
  Save,
  Target,
  Phone,
  User,
  Building2,
  Map as MapIcon,
} from "lucide-react";

const mapContainerStyle = { width: "100%", height: "100%" };
const libraries: "places"[] = ["places"];

export const AddressSettingsPage = () => {
  const { user, profile } = useAuth() as any;
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    street: "",
    rt_rw: "",
    village: "",
    district: "",
    city: "",
    extra: "",
  });
  const [coords, setCoords] = useState({ lat: -6.2, lng: 106.8 });

  const streetRef = useRef<google.maps.places.Autocomplete | null>(null);
  const villageRef = useRef<google.maps.places.Autocomplete | null>(null);
  const districtRef = useRef<google.maps.places.Autocomplete | null>(null);
  const cityRef = useRef<google.maps.places.Autocomplete | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries,
    language: "id", // ✅ Bahasa Indonesia
    region: "ID", // ✅ Wilayah Indonesia
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        phone: profile.phone || "",
        street: profile.address_street || "",
        rt_rw: profile.address_rt_rw || "",
        village: profile.address_village || "",
        district: profile.address_district || "",
        city: profile.address_city || "",
        extra: profile.address_extra || "",
      });
      if (profile.latitude && profile.longitude) {
        setCoords({
          lat: Number(profile.latitude),
          lng: Number(profile.longitude),
        });
      }
    }
  }, [profile]);

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
      setCoords({
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

  const handleMapMove = (e: google.maps.MapMouseEvent) => {
    const lat = e.latLng?.lat() || 0;
    const lng = e.latLng?.lng() || 0;
    setCoords({ lat, lng });
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results?.[0]) fillAddressForm(results[0]);
    });
  };

  const handleSave = async () => {
    if (!user?.id) return showToast("SESI BERAKHIR, LOGIN ULANG", "error");
    if (!formData.name || !formData.phone || !formData.street) {
      return showToast("NAMA, NO HP, & JALAN WAJIB DIISI", "error");
    }

    setLoading(true);
    try {
      // Menyiapkan data untuk update
      const updateData: any = {
        name: formData.name,
        phone: formData.phone,
        address_street: formData.street,
        address_rt_rw: formData.rt_rw,
        address_village: formData.village,
        address_district: formData.district,
        address_city: formData.city,
        address_extra: formData.extra,
        latitude: coords.lat,
        longitude: coords.lng,
      };

      // ✅ Pastikan updated_at dikirim hanya jika kolomnya ada di database
      updateData.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", user.id);

      if (error) throw error;

      showToast("ALAMAT BERHASIL DISIMPAN", "success");
      navigate("/customer-dashboard");
    } catch (err: any) {
      console.error("Error Simpan:", err);
      showToast(`GAGAL: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-left tracking-tighter pb-10">
      <header className="bg-white border-b border-slate-100 h-12 flex items-center px-3 sticky top-0 z-50">
        <div className="w-full max-w-5xl mx-auto flex items-center gap-3 font-black uppercase">
          <button
            onClick={() => navigate(-1)}
            className="p-1 hover:bg-slate-50 rounded-lg"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-[12px] flex-1">DETAIL ALAMAT LENGKAP</h1>
        </div>
      </header>

      <main className="max-w-xl mx-auto w-full p-2 space-y-2 uppercase">
        <section className="h-60 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden relative">
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={coords}
              zoom={16}
              options={{ disableDefaultUI: true, gestureHandling: "greedy" }}
            >
              <MarkerF
                position={coords}
                draggable={true}
                onDragEnd={handleMapMove}
              />
            </GoogleMap>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Loader2 className="animate-spin text-teal-600" />
            </div>
          )}
          <button
            onClick={() =>
              navigator.geolocation.getCurrentPosition((p) => {
                const lat = p.coords.latitude;
                const lng = p.coords.longitude;
                setCoords({ lat, lng });
                handleMapMove({
                  latLng: { lat: () => lat, lng: () => lng },
                } as any);
              })
            }
            className="absolute bottom-3 right-3 p-2.5 bg-white text-teal-600 rounded-full shadow-lg border border-slate-100"
          >
            <Target size={18} />
          </button>
        </section>

        <section className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm space-y-3 font-black">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 flex items-center gap-1 uppercase">
                <User size={12} /> NAMA
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-[12px] outline-none focus:border-teal-600 font-black"
                placeholder="NAMA PENERIMA"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 flex items-center gap-1 uppercase">
                <Phone size={12} /> NO. PONSEL
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-[12px] outline-none focus:border-teal-600 font-black"
                placeholder="0812..."
              />
            </div>
          </div>

          <hr className="border-slate-50" />

          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 flex items-center gap-1 uppercase">
              <MapPin size={12} className="text-red-500" /> NAMA JALAN
            </label>
            {isLoaded && (
              <Autocomplete
                onLoad={(r) => (streetRef.current = r)}
                onPlaceChanged={() =>
                  fillAddressForm(streetRef.current!.getPlace())
                }
              >
                <input
                  type="text"
                  value={formData.street}
                  onChange={(e) =>
                    setFormData({ ...formData, street: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-[12px] outline-none focus:border-teal-600 font-black uppercase"
                  placeholder="KETIK NAMA JALAN..."
                />
              </Autocomplete>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 uppercase">
                RT / RW
              </label>
              <input
                type="text"
                value={formData.rt_rw}
                onChange={(e) =>
                  setFormData({ ...formData, rt_rw: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-[12px] outline-none focus:border-teal-600 font-black"
                placeholder="001/002"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 uppercase">
                DESA / KELURAHAN
              </label>
              {isLoaded && (
                <Autocomplete
                  onLoad={(r) => (villageRef.current = r)}
                  onPlaceChanged={() =>
                    fillAddressForm(villageRef.current!.getPlace())
                  }
                >
                  <input
                    type="text"
                    value={formData.village}
                    onChange={(e) =>
                      setFormData({ ...formData, village: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-[12px] outline-none focus:border-teal-600 font-black uppercase"
                    placeholder="CARI DESA..."
                  />
                </Autocomplete>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 flex items-center gap-1 uppercase">
                <Building2 size={12} /> KECAMATAN
              </label>
              {isLoaded && (
                <Autocomplete
                  onLoad={(r) => (districtRef.current = r)}
                  onPlaceChanged={() =>
                    fillAddressForm(districtRef.current!.getPlace())
                  }
                >
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) =>
                      setFormData({ ...formData, district: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-[12px] outline-none focus:border-teal-600 font-black uppercase"
                    placeholder="CARI KECAMATAN..."
                  />
                </Autocomplete>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 flex items-center gap-1 uppercase">
                <MapIcon size={12} /> KOTA / KABUPATEN
              </label>
              {isLoaded && (
                <Autocomplete
                  onLoad={(r) => (cityRef.current = r)}
                  onPlaceChanged={() =>
                    fillAddressForm(cityRef.current!.getPlace())
                  }
                >
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-[12px] outline-none focus:border-teal-600 font-black uppercase"
                    placeholder="CARI KOTA..."
                  />
                </Autocomplete>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 italic uppercase font-black">
              PATOKAN (PAGAR HITAM / WARUNG)
            </label>
            <input
              type="text"
              value={formData.extra}
              onChange={(e) =>
                setFormData({ ...formData, extra: e.target.value })
              }
              className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-[12px] outline-none focus:border-teal-600 font-black uppercase"
              placeholder="CONTOH: PAGAR HITAM..."
            />
          </div>

          <button
            disabled={loading}
            onClick={handleSave}
            className="w-full py-3.5 bg-teal-600 text-white rounded-xl font-black text-[12px] tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg uppercase"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <>
                <Save size={18} /> SIMPAN ALAMAT LENGKAP
              </>
            )}
          </button>
        </section>
      </main>
    </div>
  );
};
