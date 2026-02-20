import React from "react";
import { GoogleMap, Autocomplete } from "@react-google-maps/api";
import {
  MapPin,
  Search,
  Save,
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  Navigation,
} from "lucide-react";

interface Props {
  isLoaded: boolean;
  editingId: string | null;
  marketForm: any;
  setMarketForm: (v: any) => void;
  mapCenter: any;
  onMapIdle: () => void;
  onDragStart: () => void;
  onPlaceChanged: () => void;
  onSave: () => void;
  onBack: () => void;
  loading: boolean;
  autocompleteRef: React.MutableRefObject<google.maps.places.Autocomplete | null>;
  mapRef: React.MutableRefObject<google.maps.Map | null>;
  isDragging: boolean;
}

const mapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  gestureHandling: "greedy",
};

export const MarketEditor: React.FC<Props> = (p) => {
  return (
    <div className="flex flex-col lg:flex-row h-[750px] lg:h-[600px] rounded-lg md:rounded-xl overflow-hidden shadow-xl bg-white animate-in fade-in duration-500 font-black uppercase tracking-tighter text-left border border-slate-100">
      {/* LEFT: MAP AREA (Sudut Tajam & Tampilan Luas di HP) */}
      <div className="w-full lg:w-2/3 relative h-[400px] lg:h-full bg-slate-50">
        <div className="absolute top-3 left-3 right-3 z-10">
          <Autocomplete
            onLoad={(ref) => {
              p.autocompleteRef.current = ref;
            }}
            onPlaceChanged={p.onPlaceChanged}
          >
            <div className="relative shadow-lg">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#008080]"
                size={16}
              />
              <input
                type="text"
                placeholder="CARI LOKASI PASAR..."
                className="w-full pl-10 pr-4 py-3 rounded-md border-none bg-white font-black text-[12px] text-slate-800 outline-none focus:ring-2 focus:ring-[#008080] transition-all"
              />
            </div>
          </Autocomplete>
        </div>

        {p.isLoaded && (
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "100%" }}
            center={p.mapCenter}
            zoom={15}
            onLoad={(map) => {
              p.mapRef.current = map;
            }}
            onDragStart={p.onDragStart}
            onIdle={p.onMapIdle}
            options={mapOptions}
          />
        )}

        {/* FIXED CENTER PIN */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none pb-8">
          <MapPin
            size={42}
            className={`text-red-500 fill-red-500 transition-transform duration-200 ${p.isDragging ? "-translate-y-4 scale-110" : "translate-y-0"}`}
          />
          <div className="w-2 h-2 bg-black/20 rounded-full mx-auto mt-[-4px] blur-[1px]"></div>
        </div>

        <div className="absolute bottom-3 left-3 bg-white/90 px-2 py-1 rounded-md text-[10px] font-black text-slate-500 border border-slate-200 flex items-center gap-1 shadow-sm">
          <Navigation size={10} className="text-[#008080]" /> GPS:{" "}
          {p.marketForm.lat.toFixed(6)}, {p.marketForm.lng.toFixed(6)}
        </div>
      </div>

      {/* RIGHT: FORM AREA (Padding Rapat, Sudut Tegas, Warna Tosca & Orange) */}
      <div className="w-full lg:w-1/3 p-3 md:p-4 flex flex-col bg-white border-t lg:border-t-0 lg:border-l border-slate-100 overflow-y-auto no-scrollbar">
        <div className="space-y-3 flex-1">
          <button
            onClick={p.onBack}
            className="flex items-center gap-2 text-[10px] text-slate-400 hover:text-[#008080] transition-colors mb-1"
          >
            <ArrowLeft size={14} /> KEMBALI KE DAFTAR
          </button>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Nama Pasar
            </label>
            <input
              type="text"
              value={p.marketForm.name}
              onChange={(e) =>
                p.setMarketForm({ ...p.marketForm, name: e.target.value })
              }
              className="w-full bg-slate-50 p-3 rounded-md text-[12px] font-black outline-none border border-slate-100 focus:border-[#008080] focus:bg-white transition-all"
              placeholder="INPUT NAMA PASAR..."
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-[#008080] uppercase tracking-widest ml-1">
              Kecamatan
            </label>
            <input
              type="text"
              value={p.marketForm.district}
              onChange={(e) =>
                p.setMarketForm({ ...p.marketForm, district: e.target.value })
              }
              className="w-full bg-teal-50/30 p-3 rounded-md text-[12px] font-black outline-none border border-teal-100 focus:border-[#008080] focus:bg-white transition-all"
              placeholder="INPUT KECAMATAN..."
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-[#FF6600] uppercase tracking-widest ml-1">
              Branding Area
            </label>
            <input
              type="text"
              value={p.marketForm.region_name}
              onChange={(e) =>
                p.setMarketForm({
                  ...p.marketForm,
                  region_name: e.target.value,
                })
              }
              className="w-full bg-orange-50/30 p-3 rounded-md text-[12px] font-black outline-none border border-orange-100 focus:border-[#FF6600] focus:bg-white transition-all"
              placeholder="INPUT BRANDING AREA..."
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Alamat Google Maps
            </label>
            <textarea
              rows={3}
              value={p.marketForm.address}
              onChange={(e) =>
                p.setMarketForm({ ...p.marketForm, address: e.target.value })
              }
              className="w-full bg-slate-50 p-3 rounded-md text-[12px] font-black outline-none border border-slate-100 resize-none font-sans"
              placeholder="ALAMAT OTOMATIS..."
            />
          </div>
        </div>

        {/* ACTION SECTION */}
        <div className="mt-4 pt-3 border-t border-dashed border-slate-100 bg-white sticky bottom-0">
          <div className="flex items-center gap-2 mb-3 bg-teal-50/50 p-2 rounded-md">
            <CheckCircle size={14} className="text-[#008080]" />
            <span className="text-[9px] text-[#008080] font-black tracking-widest">
              KOORDINAT GPS TERKUNCI
            </span>
          </div>

          <button
            onClick={p.onSave}
            disabled={p.loading}
            className="w-full bg-[#008080] text-white py-4 rounded-md font-black text-[12px] flex items-center justify-center gap-2 shadow-lg shadow-teal-900/20 active:scale-95 transition-all uppercase"
          >
            {p.loading ? (
              <RefreshCw className="animate-spin" size={16} />
            ) : (
              <Save size={18} />
            )}
            {p.editingId ? "UPDATE DATA PASAR" : "SIMPAN PASAR BARU"}
          </button>
        </div>
      </div>
    </div>
  );
};
