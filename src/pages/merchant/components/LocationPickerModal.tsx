import React, { useState } from "react";
import { X, MapPin, Loader2, Save } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import { useToast } from "../../../contexts/ToastContext";
import { LocationPicker } from "../../../components/LocationPicker";

interface Props {
  merchantProfile: any;
  onClose: () => void;
  onUpdate: (lat: number, lng: number, address: string) => void;
}

export const LocationPickerModal: React.FC<Props> = ({
  merchantProfile,
  onClose,
  onUpdate,
}) => {
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [tempLocation, setTempLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(null);

  const handleSave = async () => {
    if (!tempLocation) {
      showToast("Silakan pilih titik lokasi pada peta", "error");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          latitude: tempLocation.lat,
          longitude: tempLocation.lng,
          address: tempLocation.address,
        })
        .eq("id", merchantProfile.id);

      if (error) throw error;

      showToast("Lokasi jualan berhasil diperbarui!", "success");
      onUpdate(tempLocation.lat, tempLocation.lng, tempLocation.address);
      onClose();
    } catch (err: any) {
      showToast("Gagal simpan lokasi: " + err.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* MODAL HEADER */}
        <div className="p-8 border-b border-slate-50 flex justify-between items-center text-left">
          <div>
            <h2 className="text-xl font-black uppercase text-slate-800 tracking-tight leading-none">
              Atur Titik Toko
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-2 tracking-widest">
              Geser pin ke titik tepat lokasi jualan Anda
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="text-slate-400" size={24} />
          </button>
        </div>

        {/* MAP AREA */}
        <div className="h-[400px] bg-slate-100 relative z-0">
          <LocationPicker
            onLocationSelected={(lat, lng, addr) =>
              setTempLocation({ lat, lng, address: addr })
            }
            initialPos={
              merchantProfile?.latitude
                ? [merchantProfile.latitude, merchantProfile.longitude]
                : undefined
            }
          />
        </div>

        {/* MODAL FOOTER */}
        <div className="p-8 bg-slate-50/50 flex flex-col md:flex-row items-center justify-between gap-4 text-left">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600 shrink-0">
              <MapPin size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Alamat Terdeteksi
              </p>
              <p className="text-xs font-bold text-slate-700 truncate w-full md:max-w-[300px]">
                {tempLocation?.address ||
                  merchantProfile?.address ||
                  "Belum memilih titik..."}
              </p>
            </div>
          </div>

          <button
            disabled={isSaving}
            onClick={handleSave}
            className="w-full md:w-auto px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:bg-teal-600 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Save size={16} />
            )}
            Simpan Lokasi
          </button>
        </div>
      </div>
    </div>
  );
};
