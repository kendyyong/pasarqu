import React, { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useAuth } from "../../../contexts/AuthContext";
import { useToast } from "../../../contexts/ToastContext";
import {
  ChevronLeft,
  MapPin,
  Navigation,
  CheckCircle2,
  Loader2,
  Map as MapIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AddressAutocomplete } from "../../../components/maps/AddressAutocomplete";

export const CustomerAddressSettings: React.FC = () => {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [addressData, setAddressData] = useState({
    address: profile?.address || "",
    lat: profile?.latitude || 0,
    lng: profile?.longitude || 0,
  });

  // Sinkronisasi jika profile berubah (misal saat baru login)
  useEffect(() => {
    if (profile) {
      setAddressData({
        address: profile.address || "",
        lat: profile.latitude || 0,
        lng: profile.longitude || 0,
      });
    }
  }, [profile]);

  const handleAddressSelect = (address: string, lat: number, lng: number) => {
    setAddressData({ address, lat, lng });
  };

  const handleSave = async () => {
    if (!addressData.address || !addressData.lat) {
      showToast("Pilih alamat valid dari saran Google", "error");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          address: addressData.address,
          latitude: addressData.lat,
          longitude: addressData.lng,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile?.id);

      if (error) throw error;

      showToast("Alamat pengiriman berhasil diperbarui!", "success");
      setTimeout(() => navigate(-1), 1500);
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24 text-left font-sans">
      {/* HEADER */}
      <div className="bg-white px-6 py-6 sticky top-0 z-50 flex items-center gap-4 border-b border-slate-100 shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-slate-400 hover:text-teal-600 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="text-xl font-black text-slate-800 uppercase tracking-tighter leading-none">
            Lokasi Pengiriman
          </h1>
          <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest mt-1">
            Atur Titik Antar Presisi
          </p>
        </div>
      </div>

      <main className="p-6 max-w-2xl mx-auto space-y-8">
        {/* CARI ALAMAT SECTION */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">
            Cari Alamat Rumah / Kantor
          </label>
          <AddressAutocomplete
            onAddressSelect={handleAddressSelect}
            defaultValue={addressData.address}
          />
        </div>

        {/* PREVIEW CARD */}
        {addressData.lat !== 0 && (
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 animate-in zoom-in-95 duration-500">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                <MapPin size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  Alamat Terpilih:
                </p>
                <p className="text-sm font-bold text-slate-700 leading-relaxed uppercase italic">
                  {addressData.address}
                </p>
              </div>
            </div>

            {/* KOORDINAT INFO */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[8px] font-black text-slate-400 uppercase mb-1 leading-none">
                  Latitude
                </p>
                <p className="text-xs font-mono font-bold text-slate-600">
                  {addressData.lat.toFixed(6)}
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[8px] font-black text-slate-400 uppercase mb-1 leading-none">
                  Longitude
                </p>
                <p className="text-xs font-mono font-bold text-slate-600">
                  {addressData.lng.toFixed(6)}
                </p>
              </div>
            </div>

            <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex items-center gap-3">
              <Navigation className="text-orange-500" size={18} />
              <p className="text-[9px] font-bold text-orange-600 uppercase leading-none">
                Kurir akan diarahkan ke titik ini
              </p>
            </div>
          </div>
        )}

        {/* INSTRUKSI TAMBAHAN */}
        <div className="p-8 text-center opacity-40">
          <MapIcon size={40} className="mx-auto text-slate-300 mb-4" />
          <p className="text-[10px] font-bold text-slate-500 uppercase leading-loose tracking-[0.2em]">
            Gunakan fitur pencarian di atas untuk
            <br />
            menemukan alamat yang akurat di Google Maps.
          </p>
        </div>
      </main>

      {/* BUTTON SIMPAN FIX DI BAWAH */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-lg border-t border-slate-100 z-50">
        <div className="max-w-2xl mx-auto">
          <button
            disabled={loading || !addressData.lat}
            onClick={handleSave}
            className={`w-full py-5 rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 ${
              addressData.lat
                ? "bg-slate-900 text-white shadow-slate-900/20"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <CheckCircle2 size={18} /> Simpan Alamat Utama
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
