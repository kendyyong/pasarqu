import React, { useState, useRef } from "react";
import { GoogleMap, Marker, Autocomplete } from "@react-google-maps/api";
import { MapPin, SearchCode, Edit3, Trash2, Save, X } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import { useToast } from "../../../contexts/ToastContext";
import { Input } from "../../../components/super-admin/SharedUI";

interface Props {
  markets: any[];
  theme: any;
  darkMode: boolean;
  isLoaded: boolean;
  refreshData: () => void;
  setAuditMarket: (market: any) => void;
}

export const MarketManager: React.FC<Props> = ({
  markets,
  theme,
  darkMode,
  isLoaded,
  refreshData,
  setAuditMarket,
}) => {
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // State Form Utama
  const [marketForm, setMarketForm] = useState({
    name: "",
    region_name: "",
    city: "",
    lat: -0.4948, // Default Koordinat (bisa disesuaikan)
    lng: 117.1436,
  });

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  // --- FUNGSI: RESET FORM ---
  const resetForm = () => {
    setEditingId(null);
    setMarketForm({
      name: "",
      region_name: "",
      city: "",
      lat: -0.4948,
      lng: 117.1436,
    });
  };

  // --- FUNGSI: BUKA EDIT ---
  const handleEditClick = (market: any) => {
    setEditingId(market.id);
    setMarketForm({
      name: market.name,
      region_name: market.region_name || "",
      city: market.city || "",
      lat: parseFloat(market.lat) || -0.4948,
      lng: parseFloat(market.lng) || 117.1436,
    });
    setIsModalOpen(true);
  };

  // --- FUNGSI: SIMPAN (CREATE / UPDATE) ---
  const handleSaveMarket = async () => {
    if (!marketForm.name || !marketForm.region_name) {
      return showToast("Nama Pasar & Nama Area wajib diisi!", "error");
    }

    setLoading(true);
    try {
      if (editingId) {
        // UPDATE
        const { error } = await supabase
          .from("markets")
          .update({
            name: marketForm.name,
            region_name: marketForm.region_name,
            city: marketForm.city,
            lat: marketForm.lat,
            lng: marketForm.lng,
          })
          .eq("id", editingId);

        if (error) throw error;
        showToast("Pasar berhasil diperbarui!", "success");
      } else {
        // INSERT
        const { error } = await supabase
          .from("markets")
          .insert([{ ...marketForm, is_active: true }]);

        if (error) throw error;
        showToast("Pasar baru berhasil ditambahkan!", "success");
      }

      setIsModalOpen(false);
      resetForm();
      refreshData();
    } catch (e: any) {
      showToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // --- FUNGSI: HAPUS ---
  const handleDeleteMarket = async (id: string, name: string) => {
    if (window.confirm(`Hapus pasar "${name}"? Tindakan ini permanen!`)) {
      try {
        const { error } = await supabase.from("markets").delete().eq("id", id);
        if (error) throw error;
        showToast("Pasar telah dihapus", "success");
        refreshData();
      } catch (e: any) {
        showToast(e.message, "error");
      }
    }
  };

  // --- GOOGLE MAPS LOGIC ---
  const onPlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry?.location) {
        const newLat = place.geometry.location.lat();
        const newLng = place.geometry.location.lng();

        setMarketForm((p) => ({
          ...p,
          lat: newLat,
          lng: newLng,
          city:
            place.address_components?.find((c) =>
              c.types.includes("administrative_area_level_2"),
            )?.long_name || p.city,
        }));

        if (mapRef.current) {
          mapRef.current.panTo({ lat: newLat, lng: newLng });
          mapRef.current.setZoom(15);
        }
      }
    }
  };

  return (
    <div className="animate-in fade-in text-left">
      <header className="mb-10 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-800">
            Master Pasar
          </h1>
          <p
            className={`text-xs font-bold uppercase tracking-widest ${theme.subText}`}
          >
            Kelola Database Wilayah & Kearifan Lokal
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs flex items-center gap-2 shadow-lg hover:bg-indigo-700 transition-all active:scale-95"
        >
          <MapPin size={18} /> Tambah Pasar
        </button>
      </header>

      {/* TABEL LIST PASAR */}
      <div
        className={`rounded-[2.5rem] border overflow-hidden shadow-sm ${theme.card} bg-white`}
      >
        <table className="w-full text-left">
          <thead
            className={`border-b text-[10px] uppercase font-black ${darkMode ? "bg-slate-900/50" : "bg-slate-50"}`}
          >
            <tr>
              <th className="p-6">Identitas Pasar</th>
              <th className="p-6">Lokasi / Kota</th>
              <th className="p-6 text-right">Aksi Manajemen</th>
            </tr>
          </thead>
          <tbody>
            {markets.map((m) => (
              <tr
                key={m.id}
                className="border-b last:border-0 hover:bg-indigo-500/5 transition-all"
              >
                <td className="p-6 text-left">
                  <div className="flex flex-col">
                    <span className="font-black text-sm uppercase text-slate-800">
                      {m.name}
                    </span>
                    <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">
                      Area: {m.region_name || "Umum"}
                    </span>
                  </div>
                </td>
                <td
                  className={`p-6 text-xs font-bold ${theme.subText} text-left`}
                >
                  {m.city || "Lokasi belum set"}
                </td>
                <td className="p-6 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setAuditMarket(m)}
                      className="p-3 bg-teal-600 text-white rounded-xl hover:scale-110 transition-all"
                    >
                      <SearchCode size={16} />
                    </button>
                    <button
                      onClick={() => handleEditClick(m)}
                      className="p-3 bg-indigo-500 text-white rounded-xl hover:scale-110 transition-all"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteMarket(m.id, m.name)}
                      className="p-3 bg-red-500 text-white rounded-xl hover:scale-110 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL (ADD & EDIT) */}
      {isModalOpen && isLoaded && (
        <div className="fixed inset-0 bg-black/80 z-[2000] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div
            className={`w-full max-w-6xl h-[85vh] rounded-[3rem] overflow-hidden flex flex-col md:flex-row shadow-2xl relative border ${theme.card} bg-white`}
          >
            {/* Kiri: Peta */}
            <div className="w-full md:w-2/3 relative h-[40%] md:h-full bg-slate-100">
              <GoogleMap
                mapContainerStyle={{ width: "100%", height: "100%" }}
                center={{ lat: marketForm.lat, lng: marketForm.lng }}
                zoom={13}
                onLoad={(map) => {
                  mapRef.current = map;
                }}
                options={{ disableDefaultUI: true }}
              >
                <Marker
                  position={{ lat: marketForm.lat, lng: marketForm.lng }}
                  draggable={false}
                />
              </GoogleMap>

              <div className="absolute top-6 left-6 w-full max-w-sm">
                <Autocomplete
                  onLoad={(ref) => {
                    autocompleteRef.current = ref;
                  }}
                  onPlaceChanged={onPlaceChanged}
                >
                  <input
                    className="w-full p-4 rounded-2xl shadow-2xl font-bold text-sm text-slate-800 outline-none border-none focus:ring-4 focus:ring-indigo-500/20"
                    placeholder="Ketik alamat atau nama lokasi..."
                  />
                </Autocomplete>
              </div>
            </div>

            {/* Kanan: Form Data */}
            <div className="w-full md:w-1/3 p-10 overflow-y-auto h-[60%] md:h-full text-left">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900">
                    {editingId ? "Perbarui" : "Buat"} Pasar
                  </h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    Identitas Kearifan Lokal
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <Input
                  label="Nama Pasar Utama"
                  val={marketForm.name}
                  set={(v: string) => setMarketForm({ ...marketForm, name: v })}
                  theme={{
                    ...theme,
                    subText: "text-slate-400 font-bold uppercase text-[9px]",
                    input:
                      "bg-slate-50 border-slate-200 text-slate-900 rounded-xl",
                  }}
                />

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-orange-500 uppercase tracking-widest ml-1">
                    Nama Area (Muncul di Logo)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Muara Jawa"
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

                <Input
                  label="Kota / Kabupaten"
                  val={marketForm.city}
                  set={() => {}}
                  readOnly
                  theme={{
                    ...theme,
                    subText: "text-slate-400 font-bold uppercase text-[9px]",
                    input:
                      "bg-slate-100 border-none text-slate-400 rounded-xl italic",
                  }}
                />
              </div>

              <div className="mt-12 space-y-3">
                <button
                  onClick={handleSaveMarket}
                  disabled={loading}
                  className={`w-full py-4 ${editingId ? "bg-orange-500 hover:bg-orange-600" : "bg-indigo-600 hover:bg-indigo-700"} text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2`}
                >
                  {loading ? (
                    "Menyimpan..."
                  ) : (
                    <>
                      <Save size={18} />{" "}
                      {editingId ? "Update Data Pasar" : "Publikasikan Pasar"}
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="w-full py-4 text-slate-400 font-black text-[10px] uppercase hover:text-slate-900 transition-colors"
                >
                  Batalkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
