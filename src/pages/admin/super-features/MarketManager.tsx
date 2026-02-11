import React, { useState, useRef } from "react";
import { GoogleMap, Marker, Autocomplete } from "@react-google-maps/api";
import { MapPin, SearchCode } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import { useToast } from "../../../contexts/ToastContext";
import { Input } from "../../../components/super-admin/SharedUI";

interface Props {
  markets: any[];
  theme: any;
  darkMode: boolean;
  isLoaded: boolean; // Penting untuk Google Autocomplete
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
  const [marketForm, setMarketForm] = useState({
    name: "",
    city: "",
    district: "",
    village: "",
    lat: -6.2,
    lng: 106.8,
  });

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  // Logic Create Market
  const handleCreateMarket = async () => {
    try {
      await supabase
        .from("markets")
        .insert([{ ...marketForm, is_active: true }]);
      showToast("Pasar Dibuat", "success");
      setIsModalOpen(false);
      refreshData();
    } catch (e: any) {
      showToast(e.message, "error");
    }
  };

  // Google Maps Logic inside Modal
  const onPlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry?.location) {
        setMarketForm((p) => ({
          ...p,
          lat: place.geometry!.location!.lat(),
          lng: place.geometry!.location!.lng(),
          // Simple formatting, can be improved
          city:
            place.address_components?.find((c) =>
              c.types.includes("administrative_area_level_2"),
            )?.long_name || "",
        }));
      }
    }
  };

  return (
    <div className="animate-in fade-in">
      <header className="mb-10 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black uppercase">Master Pasar</h1>
          <p
            className={`text-xs font-bold uppercase tracking-widest ${theme.subText}`}
          >
            Kelola Database Wilayah
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs flex items-center gap-2 shadow-lg hover:bg-indigo-700 transition-all"
        >
          <MapPin size={18} /> Tambah Pasar
        </button>
      </header>

      {/* LIST PASAR */}
      <div
        className={`rounded-[2.5rem] border overflow-hidden shadow-sm ${theme.card}`}
      >
        <table className="w-full text-left">
          <thead
            className={`border-b text-[10px] uppercase font-black ${darkMode ? "bg-slate-900/50" : "bg-slate-50"}`}
          >
            <tr>
              <th className="p-6">Pasar</th>
              <th className="p-6">Wilayah</th>
              <th className="p-6 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {markets.map((m) => (
              <tr
                key={m.id}
                className="border-b last:border-0 hover:bg-indigo-500/5 transition-all"
              >
                <td className="p-6 font-black text-sm uppercase">{m.name}</td>
                <td className={`p-6 text-xs font-bold ${theme.subText}`}>
                  {m.city}
                </td>
                <td className="p-6 text-right">
                  <button
                    onClick={() => setAuditMarket(m)}
                    className="px-6 py-3 bg-teal-600 text-white rounded-xl font-black text-[10px] uppercase inline-flex items-center gap-2 hover:scale-105 transition-all"
                  >
                    <SearchCode size={14} /> Audit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL TAMBAH PASAR */}
      {isModalOpen && isLoaded && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div
            className={`w-full max-w-6xl h-[80vh] rounded-[3rem] overflow-hidden flex flex-col md:flex-row shadow-2xl relative border ${theme.card}`}
          >
            {/* Kiri: Peta */}
            <div className="w-full md:w-2/3 relative h-1/2 md:h-full">
              <GoogleMap
                mapContainerStyle={{ width: "100%", height: "100%" }}
                center={{ lat: marketForm.lat, lng: marketForm.lng }}
                zoom={12}
                onLoad={(map) => {
                  mapRef.current = map;
                }}
                options={{
                  styles: darkMode
                    ? [
                        {
                          elementType: "geometry",
                          stylers: [{ color: "#242f3e" }],
                        },
                      ]
                    : [],
                  disableDefaultUI: true,
                }}
              >
                <Marker
                  position={{ lat: marketForm.lat, lng: marketForm.lng }}
                />
              </GoogleMap>
              <div className="absolute top-4 left-4 w-3/4 max-w-sm">
                <Autocomplete
                  onLoad={(ref) => {
                    autocompleteRef.current = ref;
                  }}
                  onPlaceChanged={onPlaceChanged}
                >
                  <input
                    className="w-full p-4 rounded-xl shadow-lg font-bold text-sm text-black"
                    placeholder="Cari lokasi pasar..."
                  />
                </Autocomplete>
              </div>
            </div>

            {/* Kanan: Form */}
            <div className="w-full md:w-1/3 p-8 bg-white overflow-y-auto h-1/2 md:h-full text-slate-900">
              <h2 className="text-2xl font-black mb-6">Tambah Pasar Baru</h2>
              <Input
                label="Nama Pasar"
                val={marketForm.name}
                set={(v: string) => setMarketForm({ ...marketForm, name: v })}
                theme={{
                  ...theme,
                  subText: "text-slate-500",
                  input: "bg-slate-50 border-slate-200 text-slate-900",
                }}
              />
              <div className="mt-4 space-y-2">
                <Input
                  label="Kota (Otomatis)"
                  val={marketForm.city}
                  set={() => {}}
                  readOnly
                  theme={{
                    ...theme,
                    subText: "text-slate-500",
                    input: "bg-slate-100 border-slate-200 text-slate-500",
                  }}
                />
              </div>
              <button
                onClick={handleCreateMarket}
                className="w-full mt-6 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700"
              >
                Simpan Lokasi
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-full mt-2 py-4 text-slate-400 font-bold hover:text-slate-600"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
