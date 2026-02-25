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
  CheckCircle,
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

// 🔑 GOOGLE MAPS API KEY
const GOOGLE_MAPS_API_KEY = "AIzaSyBQqWHps2WJ3YWfS16rir-uqeMCezb6lso";

// Fix Icon Marker Leaflet
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

  const savedMarketName =
    localStorage.getItem("selected_market_name") ||
    localStorage.getItem("market_name") ||
    "";
  const savedMarketId = localStorage.getItem("selected_market_id") || "";

  const [detectedMarketName, setDetectedMarketName] =
    useState<string>(savedMarketName);
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
    market_id: savedMarketId,
    address: "",
  });

  const [files, setFiles] = useState<{ [key: string]: File | null }>({
    ktp: null,
    sim: null,
    selfie: null,
  });

  // 🚀 FIX: Logika Sinkronisasi Pasar Anti-Error 400
  useEffect(() => {
    const syncMarketDetails = async () => {
      if (savedMarketId && savedMarketId.length === 36) {
        try {
          const { data, error } = await supabase
            .from("markets")
            .select("name, latitude, longitude")
            .eq("id", savedMarketId)
            .maybeSingle();

          if (data && !error) {
            setDetectedMarketName(data.name);
            setCoords({
              lat: Number(data.latitude) || -0.5021,
              lng: Number(data.longitude) || 117.1536,
            });
          }
        } catch (err) {
          console.warn("Sinkronisasi pasar dilewati.");
        }
      }
    };
    syncMarketDetails();
  }, [savedMarketId]);

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
    }, [center, map]);
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
    if (!formData.market_id || formData.market_id.length !== 36)
      return showToast("AREA OPERASIONAL TIDAK VALID!", "error");
    if (!files.ktp || !files.sim || !files.selfie)
      return showToast("HARAP LENGKAPI SEMUA BERKAS FOTO!", "error");

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
        created_at: new Date().toISOString(),
      });

      if (profileError) throw profileError;
      showToast("PENDAFTARAN BERHASIL! MENUNGGU VERIFIKASI ADMIN.", "success");
      setTimeout(() => navigate("/waiting-approval"), 1500);
    } catch (err: any) {
      showToast(err.message.toUpperCase(), "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // 🚀 FIX: Background Oranye Elegan (Deep Orange to Dark Orange)
    <div className="min-h-screen bg-gradient-to-br from-[#8A3800] via-[#CC5200] to-[#4D1F00] flex flex-col font-sans text-left relative overflow-x-hidden">
      {/* DEKORASI LATAR BELAKANG */}
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.8) 1px, transparent 0)`,
          backgroundSize: "24px 24px",
        }}
      ></div>
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#FF6600]/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-yellow-500/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>

      {/* 🚀 FIX: TOP BAR LOGO IMAGE */}
      <nav className="border-b border-white/10 sticky top-0 bg-[#4D1F00]/80 backdrop-blur-lg z-[1001] shadow-sm">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div
            onClick={() => navigate("/")}
            className="cursor-pointer flex items-center"
          >
            <img
              src="/logo-text.png"
              alt="PasarQu"
              className="h-8 md:h-10 w-auto object-contain"
              style={{
                filter:
                  "drop-shadow(1px 1px 0px white) drop-shadow(-1px -1px 0px white) drop-shadow(1px -1px 0px white) drop-shadow(-1px 1px 0px white)",
              }}
            />
          </div>
          <button
            onClick={() => navigate("/login")}
            className="text-white/70 hover:text-white flex items-center gap-1 font-black uppercase tracking-widest text-[10px] md:text-[12px] bg-white/5 px-3 py-1.5 rounded-full border border-white/10 transition-all active:scale-95"
          >
            <ChevronLeft size={16} />{" "}
            <span className="hidden md:block">KEMBALI KE LOGIN</span>
            <span className="md:hidden">KEMBALI</span>
          </button>
        </div>
      </nav>

      {/* 🚀 FIX: TAMPILAN LEBAR & LUAS PADA MOBILE (Padding 0 di HP) */}
      <main className="flex-1 flex flex-col lg:flex-row max-w-[1200px] mx-auto w-full p-0 md:p-12 gap-6 lg:gap-20 justify-center relative z-10 mt-6 md:mt-0">
        {/* INFO KIRI (Desktop & Tablet Saja) */}
        <div className="hidden lg:block flex-1 space-y-10 text-left pt-4">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-1.5 rounded-full border border-white/20 shadow-inner backdrop-blur-md">
              <Zap size={14} className="text-yellow-400 fill-yellow-400" />
              <span className="text-xs font-black uppercase tracking-widest">
                Mitra Penggerak Ekonomi
              </span>
            </div>
            <h1 className="text-5xl font-black text-white leading-[1.1] uppercase tracking-tighter">
              Antar Pesanan, <br />
              <span className="text-yellow-400">Jemput Penghasilan.</span>
            </h1>
            <p className="text-lg text-orange-100/80 leading-relaxed max-w-md font-bold tracking-wide">
              Bergabung menjadi pahlawan pengiriman lokal. Rute dekat, pencairan
              cepat, dan kebebasan penuh dalam mengatur waktu kerja.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="p-5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
              <Wallet className="text-yellow-400 mb-3" size={32} />
              <h3 className="text-white font-black text-sm uppercase tracking-widest mb-1">
                Cair Tiap Hari
              </h3>
              <p className="text-[11px] text-white/50 font-bold tracking-wider">
                Tarik saldo tanpa ditahan.
              </p>
            </div>
            <div className="p-5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
              <MapPin className="text-yellow-400 mb-3" size={32} />
              <h3 className="text-white font-black text-sm uppercase tracking-widest mb-1">
                Rute Lokal
              </h3>
              <p className="text-[11px] text-white/50 font-bold tracking-wider">
                Hanya mengantar di area pasar Anda.
              </p>
            </div>
          </div>
        </div>

        {/* FORMULIR KANAN (Tampilan Bottom Sheet untuk HP) */}
        <div className="w-full lg:w-[500px] shrink-0 mt-4 md:mt-0">
          <div className="bg-white/95 backdrop-blur-xl rounded-t-[2.5rem] md:rounded-[2rem] shadow-[0_-10px_40px_rgba(204,82,0,0.15)] md:shadow-2xl md:shadow-orange-900/40 border-t md:border border-white/50 p-6 md:p-10 sticky top-24 min-h-[80vh] md:min-h-0">
            <div className="text-center mb-8 pt-2 md:pt-0">
              <div className="inline-flex p-4 bg-orange-50 rounded-2xl mb-4 text-[#FF6600] border border-orange-100 shadow-sm">
                <Bike size={32} />
              </div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">
                Registrasi Driver
              </h2>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">
                Lengkapi Identitas & Dokumen
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              {/* AREA TERKUNCI (Sinkron dengan Pasar Pilihan) */}
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">
                  Area Penugasan
                </label>
                <div className="w-full px-4 py-3 bg-orange-50 border border-orange-200 rounded-xl text-sm font-black text-[#FF6600] flex justify-between items-center shadow-inner">
                  <span className="flex items-center gap-2 uppercase">
                    <MapIcon size={16} className="text-[#FF6600]" />
                    {detectedMarketName || "LOKASI PASAR"}
                  </span>
                  <div className="flex items-center gap-1 bg-orange-200/50 text-[#FF6600] px-2 py-1 rounded text-[9px] font-black tracking-widest uppercase border border-orange-300">
                    <Lock size={10} /> TERKUNCI
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <InputGroup
                  placeholder="Nama (Sesuai KTP)"
                  icon={<User size={18} />}
                  value={formData.name}
                  onChange={(v: string) =>
                    setFormData({ ...formData, name: v })
                  }
                />
                <InputGroup
                  placeholder="WhatsApp Aktif"
                  icon={<Smartphone size={18} />}
                  value={formData.phone}
                  onChange={(v: string) =>
                    setFormData({ ...formData, phone: v })
                  }
                />
              </div>

              {/* AREA GOOGLE MAPS */}
              <div className="space-y-2 relative pt-2">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">
                  Alamat Domisili (Pencarian Peta)
                </label>
                <div className="relative">
                  <MapPin
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 z-10"
                    size={18}
                  />
                  <input
                    type="text"
                    placeholder="Ketik nama jalan atau daerah..."
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-bold focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/20 focus:bg-white outline-none transition-all shadow-inner text-slate-800"
                    value={formData.address}
                    onChange={(e) => handleAddressSearch(e.target.value)}
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-[2000] w-full bg-white border border-slate-200 rounded-xl mt-1 shadow-2xl max-h-48 overflow-y-auto">
                      {suggestions.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => selectLocation(item)}
                          className="p-3 hover:bg-orange-50 cursor-pointer text-[10px] md:text-[11px] border-b border-slate-50 font-black text-slate-700"
                        >
                          {item.formatted_address.toUpperCase()}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="h-48 md:h-60 w-full rounded-2xl border-2 border-slate-200 overflow-hidden z-0 shadow-inner relative bg-slate-100">
                  <div className="absolute top-2 right-2 z-[1000] bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg text-[10px] font-black text-slate-700 border shadow-sm pointer-events-none uppercase tracking-widest">
                    Geser Pin ke Rumah Anda
                  </div>
                  <MapContainer
                    center={[coords.lat, coords.lng]}
                    zoom={16}
                    attributionControl={false}
                    style={{ height: "100%", width: "100%", zIndex: 0 }}
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

              {/* 🚀 FIX: DOKUMEN UPLOAD - Diperjelas dan Dibuat Berbaris Kebawah (List) */}
              <div className="space-y-2 pt-2">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">
                  Dokumen Pendukung
                </label>
                <div className="flex flex-col gap-3">
                  <FileBoxRow
                    label="Upload Foto KTP"
                    icon={<CreditCard size={20} />}
                    file={files.ktp}
                    onSelect={(f: File) => setFiles({ ...files, ktp: f })}
                  />
                  <FileBoxRow
                    label="Upload Foto SIM"
                    icon={<UploadCloud size={20} />}
                    file={files.sim}
                    onSelect={(f: File) => setFiles({ ...files, sim: f })}
                  />
                  <FileBoxRow
                    label="Upload Foto Selfi Sambil Memegang KTP"
                    icon={<Camera size={20} />}
                    file={files.selfie}
                    onSelect={(f: File) => setFiles({ ...files, selfie: f })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <InputGroup
                  placeholder="Email"
                  icon={<Mail size={18} />}
                  value={formData.email}
                  onChange={(v: string) =>
                    setFormData({ ...formData, email: v })
                  }
                />
                <InputGroup
                  placeholder="Password"
                  type="password"
                  icon={<Lock size={18} />}
                  value={formData.password}
                  onChange={(v: string) =>
                    setFormData({ ...formData, password: v })
                  }
                />
              </div>

              <button
                disabled={isLoading}
                className="w-full py-4 bg-[#FF6600] text-white rounded-2xl font-[1000] text-[12px] uppercase tracking-[0.2em] shadow-lg shadow-orange-500/20 hover:bg-orange-600 mt-6 active:scale-95 transition-all flex justify-center items-center gap-2 border border-orange-400"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    KIRIM PENDAFTARAN <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      <footer className="py-6 border-t border-white/10 text-center relative z-10 mt-0 md:mt-10">
        <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.3em] leading-none">
          © 2026 PASARQU - Ekosistem Pasar Digital
        </p>
      </footer>
    </div>
  );
};

// --- SUB-COMPONENTS ---
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
    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#FF6600] transition-colors pointer-events-none">
      {icon}
    </div>
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/20 focus:bg-white outline-none text-[12px] font-bold uppercase tracking-widest transition-all placeholder:text-slate-400 placeholder:tracking-widest shadow-inner text-slate-800"
      required
    />
  </div>
);

// 🚀 FIX: Komponen FileBox Baru (Baris Horizontal agar teks panjang tidak terpotong)
const FileBoxRow = ({
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
    className={`flex items-center gap-4 px-4 py-3.5 rounded-xl border border-dashed cursor-pointer transition-all shadow-sm ${file ? "bg-orange-50 border-orange-400 text-[#FF6600]" : "bg-slate-50 border-slate-300 text-slate-500 hover:border-[#FF6600] hover:bg-white"}`}
  >
    <div
      className={`shrink-0 p-2 rounded-lg ${file ? "bg-orange-100" : "bg-white border border-slate-200 shadow-sm"}`}
    >
      {file ? <CheckCircle size={20} className="text-[#FF6600]" /> : icon}
    </div>
    <div className="flex-1 overflow-hidden">
      <p
        className={`text-[11px] font-black uppercase tracking-wider leading-snug truncate ${file ? "text-[#FF6600]" : "text-slate-600"}`}
      >
        {file ? file.name : label}
      </p>
      <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">
        {file ? "BERKAS SIAP" : "Ketuk untuk memilih foto"}
      </p>
    </div>
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

export default CourierPromoPage;
