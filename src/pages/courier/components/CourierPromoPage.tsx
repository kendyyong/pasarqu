import React, { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useToast } from "../../../contexts/ToastContext";
import { useNavigate } from "react-router-dom";
import {
  Bike,
  ArrowRight,
  Loader2,
  Zap,
  MapPin,
  Smartphone,
  Mail,
  Lock,
  User,
  ChevronLeft,
  Map as MapIcon,
  Camera,
  CreditCard,
  UploadCloud,
  ShieldCheck,
  Clock,
  Wallet,
} from "lucide-react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// 🔑 GOOGLE MAPS API KEY PAK KENDY
const GOOGLE_MAPS_API_KEY = "AIzaSyBQqWHps2WJ3YWfS16rir-uqeMCezb6lso";

// Fix Icon Marker Industrial
const customMarker = new L.Icon({
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export const CourierPromoPage: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [markets, setMarkets] = useState<any[]>([]);
  const [detectedMarketName, setDetectedMarketName] = useState<string>("");

  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: -0.5021,
    lng: 117.1536,
  });
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
    vehicle: "Motor",
    plat: "",
    market_id: "",
    address: "",
  });

  const [files, setFiles] = useState<{ [key: string]: File | null }>({
    ktp: null,
    sim: null,
    selfie: null,
  });

  useEffect(() => {
    const initPage = async () => {
      const savedMarketId = localStorage.getItem("selected_market_id");
      if (savedMarketId) {
        const { data } = await supabase
          .from("markets")
          .select("name")
          .eq("id", savedMarketId)
          .single();
        if (data) {
          setDetectedMarketName(data.name);
          setFormData((prev) => ({ ...prev, market_id: savedMarketId }));
        }
      } else {
        const { data } = await supabase.from("markets").select("id, name");
        if (data) setMarkets(data);
      }
    };
    initPage();
  }, []);

  // 🌍 GOOGLE GEOCODING SEARCH
  const handleAddressSearch = async (query: string) => {
    setFormData({ ...formData, address: query });
    if (query.length > 3) {
      try {
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_API_KEY}&region=id`,
        );
        const data = await res.json();
        if (data.status === "OK") {
          setSuggestions(data.results);
          setShowSuggestions(true);
        }
      } catch (err) {
        console.error("Google Geocoding Error:", err);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  const selectLocation = (result: any) => {
    const { lat, lng } = result.geometry.location;
    setCoords({ lat, lng });
    setFormData({ ...formData, address: result.formatted_address });
    setShowSuggestions(false);
  };

  // 🗺️ MAP INTERACTION COMPONENTS
  const MapEvents = () => {
    useMapEvents({
      click(e) {
        setCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
      },
    });
    return null;
  };

  const ChangeView = ({ center }: { center: { lat: number; lng: number } }) => {
    const map = useMap();
    useEffect(() => {
      map.flyTo(center, 16);
    }, [center]);
    return null;
  };

  const uploadImage = async (userId: string, file: File, prefix: string) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}/${prefix}_${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from("courier-docs")
      .upload(fileName, file);
    if (uploadError) throw uploadError;
    const { data } = supabase.storage
      .from("courier-docs")
      .getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    if (!formData.market_id)
      return showToast("PILIH AREA OPERASIONAL!", "error");
    if (!files.ktp || !files.sim || !files.selfie)
      return showToast("LENGKAPI BERKAS!", "error");

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });
      if (error) throw error;
      const userId = data.user!.id;

      const [ktpUrl, simUrl, selfieUrl] = await Promise.all([
        uploadImage(userId, files.ktp!, "ktp"),
        uploadImage(userId, files.sim!, "sim"),
        uploadImage(userId, files.selfie!, "selfie"),
      ]);

      const { error: profileError } = await supabase.from("profiles").upsert({
        id: userId,
        email: formData.email,
        name: formData.name,
        phone_number: formData.phone,
        address: formData.address,
        latitude: coords.lat,
        longitude: coords.lng,
        role: "COURIER",
        vehicle_type: formData.vehicle,
        plat_number: formData.plat,
        ktp_url: ktpUrl,
        sim_url: simUrl,
        selfie_url: selfieUrl,
        is_verified: false,
        market_id: formData.market_id,
      });

      if (profileError) throw profileError;
      showToast("PENDAFTARAN BERHASIL! MENUNGGU VERIFIKASI.", "success");
      setTimeout(() => navigate("/waiting-approval"), 1500);
    } catch (err: any) {
      showToast(err.message.toUpperCase(), "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-black uppercase tracking-tighter text-left">
      <nav className="border-b sticky top-0 bg-white z-[1001] shadow-sm">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          <div
            onClick={() => navigate("/")}
            className="cursor-pointer flex items-center gap-2"
          >
            <div className="text-2xl text-orange-500 flex items-center gap-1">
              <span className="bg-orange-500 text-white px-1.5 rounded">P</span>{" "}
              PASARQU
            </div>
          </div>
          <button
            onClick={() => navigate("/portal")}
            className="text-slate-500 flex items-center gap-1 text-[12px]"
          >
            <ChevronLeft size={18} /> KEMBALI
          </button>
        </div>
      </nav>

      <main className="flex-1 flex flex-col lg:flex-row max-w-[1200px] mx-auto w-full p-6 md:p-12 gap-12 lg:gap-20">
        <div className="flex-1 space-y-10 hidden lg:block">
          <h1 className="text-5xl font-black text-slate-900 leading-[1.1]">
            ANTAR PESANAN, <br />{" "}
            <span className="text-orange-500">JEMPUT PENGHASILAN.</span>
          </h1>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border-2 border-slate-100">
              <Wallet className="text-[#008080] mb-2" size={32} />
              <h3 className="text-[12px]">CAIR TIAP HARI</h3>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border-2 border-slate-100">
              <MapPin className="text-[#FF6600] mb-2" size={32} />
              <h3 className="text-[12px]">RUTE DEKAT</h3>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-[480px] shrink-0">
          <div className="bg-white rounded-xl shadow-2xl border-2 border-slate-100 p-8">
            <h2 className="text-2xl text-slate-800 text-center mb-6">
              REGISTRASI DRIVER
            </h2>

            <form onSubmit={handleRegister} className="space-y-4">
              <InputGroup
                placeholder="NAMA LENGKAP (KTP)"
                icon={<User size={16} />}
                value={formData.name}
                onChange={(v: string) => setFormData({ ...formData, name: v })}
              />
              <InputGroup
                placeholder="WHATSAPP AKTIF"
                icon={<Smartphone size={16} />}
                value={formData.phone}
                onChange={(v: string) => setFormData({ ...formData, phone: v })}
              />

              <div className="space-y-2 relative">
                <label className="text-[10px] text-slate-400 ml-1">
                  ALAMAT DOMISILI (GOOGLE MAPS)
                </label>
                <div className="relative">
                  <MapPin
                    className="absolute left-3 top-3.5 text-orange-500 z-10"
                    size={16}
                  />
                  <input
                    type="text"
                    placeholder="KETIK ALAMAT LENGKAP..."
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-[12px] font-black focus:border-orange-500 outline-none"
                    value={formData.address}
                    onChange={(e) => handleAddressSearch(e.target.value)}
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-[2000] w-full bg-white border border-slate-200 rounded-xl mt-1 shadow-2xl max-h-40 overflow-y-auto">
                      {suggestions.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => selectLocation(item)}
                          className="p-3 hover:bg-orange-50 cursor-pointer text-[10px] border-b border-slate-50 font-black"
                        >
                          {item.formatted_address.toUpperCase()}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="h-60 w-full rounded-xl border-2 border-slate-900 overflow-hidden z-0 shadow-lg relative">
                  <div className="absolute top-2 right-2 z-[1002] bg-slate-900 text-white text-[8px] px-2 py-1 rounded font-black border border-[#008080]">
                    KLIK ATAU GESER PIN UNTUK AKURASI
                  </div>
                  <MapContainer
                    center={[coords.lat, coords.lng]}
                    zoom={16}
                    attributionControl={false}
                    style={{ height: "100%", width: "100%" }}
                  >
                    <ChangeView center={coords} />
                    <MapEvents />
                    <TileLayer
                      url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                      subdomains={["mt0", "mt1", "mt2", "mt3"]}
                    />
                    <Marker
                      position={[coords.lat, coords.lng]}
                      icon={customMarker}
                      draggable={true}
                      eventHandlers={{
                        dragend: (e) => {
                          const position = e.target.getLatLng();
                          setCoords({ lat: position.lat, lng: position.lng });
                        },
                      }}
                    />
                  </MapContainer>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <InputGroup
                  placeholder="EMAIL"
                  icon={<Mail size={16} />}
                  value={formData.email}
                  onChange={(v: string) =>
                    setFormData({ ...formData, email: v })
                  }
                />
                <InputGroup
                  placeholder="PASSWORD"
                  type="password"
                  icon={<Lock size={16} />}
                  value={formData.password}
                  onChange={(v: string) =>
                    setFormData({ ...formData, password: v })
                  }
                />
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2">
                <FileBox
                  label="KTP"
                  icon={<CreditCard size={18} />}
                  file={files.ktp}
                  onSelect={(f: File) => setFiles({ ...files, ktp: f })}
                />
                <FileBox
                  label="SIM"
                  icon={<UploadCloud size={18} />}
                  file={files.sim}
                  onSelect={(f: File) => setFiles({ ...files, sim: f })}
                />
                <FileBox
                  label="SELFIE"
                  icon={<Camera size={18} />}
                  file={files.selfie}
                  onSelect={(f: File) => setFiles({ ...files, selfie: f })}
                />
              </div>

              <button
                disabled={isLoading}
                className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-[12px] tracking-widest hover:bg-orange-600 shadow-xl mt-4 active:scale-95"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "KIRIM PENDAFTARAN"
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

// --- SUB-COMPONENTS DENGAN TYPE SAFETY ---
const InputGroup = ({
  icon,
  type = "text",
  placeholder,
  value,
  onChange,
}: {
  icon: any;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) => (
  <div className="relative group flex-1">
    <div className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-orange-500">
      {icon}
    </div>
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full pl-10 pr-3 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-orange-500 outline-none text-[12px] font-black"
      required
    />
  </div>
);

const FileBox = ({
  label,
  icon,
  onSelect,
  file,
}: {
  label: string;
  icon: any;
  onSelect: (f: File) => void;
  file: File | null;
}) => (
  <label
    className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 border-dashed cursor-pointer transition-all h-20 ${file ? "bg-teal-50 border-teal-400 text-teal-700" : "bg-white border-slate-200 text-slate-400 hover:border-orange-400"}`}
  >
    {icon}
    <span className="text-[8px] font-black uppercase mt-1">
      {file ? "BERKAS OK" : label}
    </span>
    <input
      type="file"
      className="hidden"
      accept="image/*"
      onChange={(e) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) onSelect(selectedFile);
      }}
    />
  </label>
);
