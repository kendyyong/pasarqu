import React, { useState, useEffect, useRef, useCallback } from "react";
import { GoogleMap, Autocomplete } from "@react-google-maps/api";
import {
  MapPin,
  SearchCode,
  Edit3,
  Trash2,
  Save,
  ArrowLeft,
  Building2,
  Search,
  Info,
  Truck,
  Crosshair,
} from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";
import { useToast } from "../../../../contexts/ToastContext";
import { Input } from "./SharedUI";

interface Props {
  markets: any[];
  theme: any;
  darkMode: boolean;
  isLoaded: boolean;
  refreshData: () => void;
  setAuditMarket: (market: any) => void;
}

// Default Koordinat (Malang)
const DEFAULT_CENTER = {
  lat: -7.96662,
  lng: 112.63266,
};

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: true, // Hilangkan tombol-tombol bawaan Google yang mengganggu
  zoomControl: true, // Tetap tampilkan tombol +/- zoom
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  gestureHandling: "greedy", // Agar peta langsung merespon sentuhan/mouse
};

export const MarketManager: React.FC<Props> = ({
  markets,
  theme,
  darkMode,
  isLoaded,
  refreshData,
  setAuditMarket,
}) => {
  const { showToast } = useToast();

  const [viewMode, setViewMode] = useState<"list" | "editor">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [existingDistricts, setExistingDistricts] = useState<string[]>([]);

  // State Form
  const [marketForm, setMarketForm] = useState({
    name: "",
    region_name: "",
    district: "",
    city: "",
    address: "",
    lat: DEFAULT_CENTER.lat,
    lng: DEFAULT_CENTER.lng,
  });

  // State Kamera Peta
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  // State untuk deteksi apakah peta sedang digeser user
  const [isDragging, setIsDragging] = useState(false);

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  // Ref untuk Geocoder (Konversi koordinat ke alamat)
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  useEffect(() => {
    const unique = Array.from(
      new Set(markets.map((m) => m.district).filter(Boolean)),
    );
    setExistingDistricts(unique);
    if (isLoaded && !geocoderRef.current) {
      geocoderRef.current = new google.maps.Geocoder();
    }
  }, [markets, isLoaded]);

  // --- LOGIKA GEOCODING (KOORDINAT -> ALAMAT) ---
  const reverseGeocode = (lat: number, lng: number) => {
    if (!geocoderRef.current) return;

    geocoderRef.current.geocode(
      { location: { lat, lng } },
      (results, status) => {
        if (status === "OK" && results && results[0]) {
          const place = results[0];
          let cityFound = "";
          let districtFound = "";

          place.address_components.forEach((component) => {
            if (component.types.includes("administrative_area_level_2"))
              cityFound = component.long_name;
            if (component.types.includes("administrative_area_level_3"))
              districtFound = component.long_name;
          });

          setMarketForm((prev) => ({
            ...prev,
            city: cityFound || prev.city,
            district:
              !prev.district && districtFound
                ? `Kec. ${districtFound}`
                : prev.district,
            address: place.formatted_address || prev.address,
          }));
        }
      },
    );
  };

  // --- NAVIGASI ---
  const switchToEditor = (isEdit = false, data: any = null) => {
    if (isEdit && data) {
      setEditingId(data.id);
      const loc = {
        lat: parseFloat(data.lat) || DEFAULT_CENTER.lat,
        lng: parseFloat(data.lng) || DEFAULT_CENTER.lng,
      };
      setMarketForm({
        name: data.name,
        region_name: data.region_name || "",
        district: data.district || "",
        city: data.city || "",
        address: data.address || "",
        ...loc,
      });
      setMapCenter(loc);
    } else {
      setEditingId(null);
      setMarketForm({
        name: "",
        region_name: "",
        district: "",
        city: "",
        address: "",
        ...DEFAULT_CENTER,
      });
      setMapCenter(DEFAULT_CENTER);
    }
    setViewMode("editor");
  };

  const switchToList = () => {
    setViewMode("list");
    setEditingId(null);
  };

  // --- MAP HANDLERS (KONSEP: PIN TENGAH DIAM) ---

  // 1. Saat peta berhenti digeser (Idle)
  const onMapIdle = () => {
    if (mapRef.current) {
      const newCenter = mapRef.current.getCenter();
      if (newCenter) {
        const lat = newCenter.lat();
        const lng = newCenter.lng();

        setMarketForm((prev) => ({ ...prev, lat, lng }));
        setIsDragging(false);

        // Panggil geocoder untuk update alamat otomatis
        // reverseGeocode(lat, lng); // Opsional: Aktifkan jika ingin alamat berubah terus saat geser
      }
    }
  };

  // 2. Saat peta mulai digeser
  const onMapDragStart = () => {
    setIsDragging(true);
  };

  // 3. Saat Search Lokasi
  const onPlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry?.location) {
        const newLat = place.geometry.location.lat();
        const newLng = place.geometry.location.lng();

        // Pindah kamera peta -> onMapIdle akan menangani update form
        setMapCenter({ lat: newLat, lng: newLng });
        mapRef.current?.setZoom(17);

        // Update data text langsung dari hasil search (lebih akurat dari reverse geocode)
        let cityFound = "";
        let districtFound = "";
        place.address_components?.forEach((component) => {
          if (component.types.includes("administrative_area_level_2"))
            cityFound = component.long_name;
          if (component.types.includes("administrative_area_level_3"))
            districtFound = component.long_name;
        });

        setMarketForm((p) => ({
          ...p,
          city: cityFound || p.city,
          address: place.formatted_address || p.address,
          district:
            !p.district && districtFound ? `Kec. ${districtFound}` : p.district,
        }));
      }
    }
  };

  // --- DATABASE ---
  const handleSaveMarket = async () => {
    if (!marketForm.name || !marketForm.district) {
      return showToast("Nama Pasar & Kecamatan wajib diisi!", "error");
    }

    setLoading(true);
    try {
      const payload = {
        name: marketForm.name,
        region_name: marketForm.region_name,
        district: marketForm.district,
        city: marketForm.city,
        address: marketForm.address,
        lat: marketForm.lat,
        lng: marketForm.lng,
      };

      if (editingId) {
        const { error } = await supabase
          .from("markets")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
        showToast("Data pasar diperbarui!", "success");
      } else {
        const { error } = await supabase
          .from("markets")
          .insert([{ ...payload, is_active: true }]);
        if (error) throw error;
        showToast("Pasar baru berhasil dibuat!", "success");
      }

      refreshData();
      switchToList();
    } catch (e: any) {
      showToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMarket = async (id: string, name: string) => {
    if (window.confirm(`Hapus pasar "${name}"?`)) {
      try {
        const { error } = await supabase.from("markets").delete().eq("id", id);
        if (error) throw error;
        showToast("Pasar dihapus", "success");
        refreshData();
      } catch (e: any) {
        showToast(e.message, "error");
      }
    }
  };

  return (
    <div className="animate-in fade-in text-left pb-20 h-full">
      {/* HEADER */}
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-800 flex items-center gap-3">
            {viewMode === "editor" && (
              <button
                onClick={switchToList}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-all mr-2"
              >
                <ArrowLeft size={20} className="text-slate-600" />
              </button>
            )}
            {viewMode === "list"
              ? "Master Pasar"
              : editingId
                ? "Edit Data Pasar"
                : "Buat Pasar Baru"}
          </h1>
          <p
            className={`text-xs font-bold uppercase tracking-widest ${theme.subText} mt-1 ml-1`}
          >
            {viewMode === "list"
              ? "Pusat Data Wilayah & Titik Operasional"
              : "Geser Peta untuk Menentukan Titik"}
          </p>
        </div>

        {viewMode === "list" && (
          <button
            onClick={() => switchToEditor(false)}
            className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs flex items-center gap-2 shadow-lg hover:bg-indigo-700 transition-all active:scale-95"
          >
            <MapPin size={18} /> Tambah Pasar Baru
          </button>
        )}
      </header>

      {/* VIEW: LIST */}
      {viewMode === "list" && (
        <div
          className={`rounded-[2.5rem] border overflow-hidden shadow-sm ${theme.card} bg-white`}
        >
          <table className="w-full text-left">
            <thead
              className={`border-b text-[10px] uppercase font-black ${darkMode ? "bg-slate-900/50" : "bg-slate-50"}`}
            >
              <tr>
                <th className="p-6">Nama Pasar</th>
                <th className="p-6">Wilayah</th>
                <th className="p-6 text-right">Kontrol</th>
              </tr>
            </thead>
            <tbody>
              {markets.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="p-10 text-center text-slate-400 font-bold uppercase text-xs"
                  >
                    Belum ada data pasar.
                  </td>
                </tr>
              ) : (
                markets.map((m) => (
                  <tr
                    key={m.id}
                    className="border-b last:border-0 hover:bg-indigo-500/5 transition-all"
                  >
                    <td className="p-6">
                      <span className="font-black text-sm uppercase text-slate-800 block">
                        {m.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">
                        {m.city || "Kota belum set"}
                      </span>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        <Truck size={14} className="text-teal-500" />
                        <span className="text-xs font-black uppercase text-teal-700 bg-teal-50 px-2 py-1 rounded-lg border border-teal-100">
                          {m.district || "NO DISTRICT"}
                        </span>
                      </div>
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setAuditMarket(m)}
                          className="p-3 bg-teal-600 text-white rounded-xl hover:scale-110 transition-all shadow-md"
                        >
                          <SearchCode size={16} />
                        </button>
                        <button
                          onClick={() => switchToEditor(true, m)}
                          className="p-3 bg-indigo-500 text-white rounded-xl hover:scale-110 transition-all shadow-md"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteMarket(m.id, m.name)}
                          className="p-3 bg-red-500 text-white rounded-xl hover:scale-110 transition-all shadow-md"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW: EDITOR (FIXED CENTER PIN) */}
      {viewMode === "editor" && isLoaded && (
        <div className="flex flex-col lg:flex-row h-[700px] rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-200 bg-white">
          {/* KOLOM KIRI: PETA */}
          <div className="w-full lg:w-2/3 relative h-full bg-slate-100 group">
            {/* 1. SEARCH BOX (FLOATING) */}
            <div className="absolute top-6 left-6 right-6 z-10 max-w-md">
              <Autocomplete
                onLoad={(ref) => {
                  autocompleteRef.current = ref;
                }}
                onPlaceChanged={onPlaceChanged}
              >
                <div className="relative group shadow-xl">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-indigo-500" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-white bg-white font-bold text-sm text-slate-800 placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all"
                    placeholder="Cari lokasi (Misal: Pasar Besar Malang)"
                  />
                </div>
              </Autocomplete>
            </div>

            {/* 2. GOOGLE MAPS */}
            <GoogleMap
              mapContainerStyle={{ width: "100%", height: "100%" }}
              center={mapCenter}
              zoom={15}
              onLoad={(map) => {
                mapRef.current = map;
              }}
              onDragStart={onMapDragStart}
              onIdle={onMapIdle} // Saat berhenti geser, update koordinat
              options={mapOptions}
            >
              {/* MARKER DIHAPUS, DIGANTI PIN TENGAH STATIS */}
            </GoogleMap>

            {/* 3. PIN TENGAH (STATIS) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none pb-8">
              <div
                className={`transition-transform duration-200 ${isDragging ? "-translate-y-4 scale-110" : "translate-y-0 scale-100"}`}
              >
                <MapPin
                  size={48}
                  className="text-red-500 fill-red-500 drop-shadow-2xl"
                />
              </div>
              <div className="w-2 h-2 bg-black/50 rounded-full mx-auto mt-[-6px] blur-[1px]"></div>
            </div>

            {/* 4. TOMBOL "AMBIL LOKASI INI" (FEEDBACK) */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
              <div
                className={`px-6 py-3 rounded-full shadow-xl flex items-center gap-2 transition-all ${isDragging ? "bg-slate-800 text-white scale-95 opacity-80" : "bg-indigo-600 text-white scale-100 opacity-100"}`}
              >
                {isDragging ? (
                  <>
                    <Crosshair className="animate-spin" size={16} />{" "}
                    Mengarahkan...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon /> Lokasi Terpilih
                  </>
                )}
              </div>
            </div>

            {/* INFO KOORDINAT */}
            <div className="absolute top-6 right-6 bg-white/90 backdrop-blur px-3 py-2 rounded-xl shadow-sm border border-slate-200 text-[10px] font-mono font-black text-slate-500 hidden md:block">
              {marketForm.lat.toFixed(5)}, {marketForm.lng.toFixed(5)}
            </div>
          </div>

          {/* KOLOM KANAN: FORM */}
          <div className="w-full lg:w-1/3 p-8 overflow-y-auto bg-white border-l border-slate-100 flex flex-col">
            <h3 className="text-xl font-black uppercase text-slate-800 mb-6 flex items-center gap-2">
              <Building2 className="text-indigo-500" /> Detail Pasar
            </h3>

            <div className="space-y-5 flex-1">
              <Input
                label="Nama Pasar"
                val={marketForm.name}
                set={(v: string) => setMarketForm({ ...marketForm, name: v })}
                theme={{
                  ...theme,
                  subText: "text-slate-400 font-bold uppercase text-[9px]",
                  input:
                    "bg-slate-50 border-slate-200 text-slate-900 rounded-xl",
                }}
              />

              <div className="space-y-1">
                <label className="text-[9px] font-black text-indigo-500 uppercase tracking-widest ml-1">
                  Kecamatan (Wajib)
                </label>
                <input
                  list="districts-list"
                  type="text"
                  className="w-full bg-indigo-50 border-none rounded-xl p-4 text-sm font-black text-indigo-900 placeholder:text-indigo-300 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                  placeholder="Ketik Kecamatan..."
                  value={marketForm.district}
                  onChange={(e) =>
                    setMarketForm({ ...marketForm, district: e.target.value })
                  }
                />
                <datalist id="districts-list">
                  {existingDistricts.map((d, i) => (
                    <option key={i} value={d} />
                  ))}
                </datalist>
              </div>

              {/* KOTA (BISA DIEDIT) */}
              <Input
                label="Kota / Kabupaten"
                val={marketForm.city}
                set={(v: string) => setMarketForm({ ...marketForm, city: v })}
                theme={{
                  ...theme,
                  subText: "text-slate-400 font-bold uppercase text-[9px]",
                  input: "bg-slate-100 border-none text-slate-600 rounded-xl",
                }}
              />

              <div className="space-y-1">
                <label className="text-[9px] font-black text-orange-500 uppercase tracking-widest ml-1">
                  Branding Area (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Area Dinoyo"
                  className="w-full bg-orange-50 border-none rounded-xl p-4 text-sm font-black text-orange-700 placeholder:text-orange-300 focus:ring-2 focus:ring-orange-500 transition-all outline-none"
                  value={marketForm.region_name}
                  onChange={(e) =>
                    setMarketForm({
                      ...marketForm,
                      region_name: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Alamat Lengkap
                </label>
                <textarea
                  rows={3}
                  className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-bold text-slate-700 outline-none resize-none focus:ring-2 focus:ring-slate-200"
                  value={marketForm.address}
                  onChange={(e) =>
                    setMarketForm({ ...marketForm, address: e.target.value })
                  }
                  placeholder="Jalan, No, RT/RW..."
                />
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-dashed border-slate-200 flex gap-3 sticky bottom-0 bg-white">
              <button
                onClick={switchToList}
                className="flex-1 py-4 text-slate-400 font-black text-[10px] uppercase hover:text-slate-900 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSaveMarket}
                disabled={loading}
                className={`flex-[2] py-4 ${editingId ? "bg-orange-500 hover:bg-orange-600" : "bg-indigo-600 hover:bg-indigo-700"} text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2`}
              >
                {loading ? (
                  "Menyimpan..."
                ) : (
                  <>
                    <Save size={18} /> {editingId ? "Update" : "Simpan"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Ikon Checklist kecil
const CheckCircleIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);
