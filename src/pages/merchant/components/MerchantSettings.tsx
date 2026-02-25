import React, { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useToast } from "../../../contexts/ToastContext";
import {
  MessageSquare,
  Save,
  ToggleLeft,
  ToggleRight,
  Bot,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface MerchantSettingsProps {
  merchantProfile: any;
  onUpdate: () => void;
}

export const MerchantSettings: React.FC<MerchantSettingsProps> = ({
  merchantProfile,
  onUpdate,
}) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  // State untuk Fitur Auto Reply
  const [autoReply, setAutoReply] = useState({
    enabled: merchantProfile?.is_auto_reply_enabled || false,
    message:
      merchantProfile?.auto_reply_message ||
      "Halo Kak! Mohon maaf toko kami sedang tutup atau sibuk. Silakan tinggalkan pesan, kami akan membalas segera setelah kembali online. Terima kasih!",
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("merchants")
        .update({
          is_auto_reply_enabled: autoReply.enabled,
          auto_reply_message: autoReply.message,
        })
        .eq("user_id", merchantProfile.user_id);

      if (error) throw error;

      showToast("PENGATURAN BERHASIL DISIMPAN", "success");
      onUpdate(); // Refresh data di Dashboard utama
    } catch (error: any) {
      showToast("GAGAL MENYIMPAN PENGATURAN", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* HEADER SECTION */}
      <div className="flex flex-col text-left mb-8">
        <h2 className="text-2xl font-[1000] text-slate-800 dark:text-white uppercase tracking-tighter">
          Pengaturan Toko
        </h2>
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">
          Kelola fitur otomatisasi dan layanan pelanggan
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* KARTU AUTO REPLY */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 md:p-8 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <Bot size={120} className="text-[#008080]" />
          </div>

          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-teal-50 dark:bg-teal-900/20 text-[#008080] rounded-2xl">
              <MessageSquare size={24} />
            </div>
            <div>
              <h3 className="text-[16px] font-black uppercase tracking-tight text-slate-800 dark:text-white">
                Balas Otomatis (Auto-Reply)
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase">
                Fitur asisten chat saat Anda sibuk/offline
              </p>
            </div>
          </div>

          <div className="space-y-6 relative z-10">
            {/* TOGGLE SWITCH */}
            <div
              onClick={() =>
                setAutoReply({ ...autoReply, enabled: !autoReply.enabled })
              }
              className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all ${
                autoReply.enabled
                  ? "bg-teal-50 dark:bg-teal-900/10 border border-teal-100 dark:border-teal-900/30"
                  : "bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
              }`}
            >
              <span className="text-[12px] font-black text-slate-700 dark:text-slate-300 uppercase">
                Status Fitur
              </span>
              {autoReply.enabled ? (
                <div className="flex items-center gap-2 text-[#008080]">
                  <span className="text-[10px] font-black uppercase">
                    Aktif
                  </span>
                  <ToggleRight size={32} />
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-400">
                  <span className="text-[10px] font-black uppercase">
                    Nonaktif
                  </span>
                  <ToggleLeft size={32} />
                </div>
              )}
            </div>

            {/* TEXTAREA PESAN */}
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Isi Pesan Balasan Otomatis
              </label>
              <textarea
                value={autoReply.message}
                onChange={(e) =>
                  setAutoReply({ ...autoReply, message: e.target.value })
                }
                disabled={!autoReply.enabled}
                rows={5}
                className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-[13px] font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-[#008080]/20 focus:border-[#008080] transition-all disabled:opacity-50 disabled:grayscale"
                placeholder="Tulis pesan ramah untuk pelanggan..."
              />
              <div className="flex items-center gap-2 mt-2 px-2 text-orange-500/80">
                <AlertCircle size={12} />
                <p className="text-[9px] font-bold uppercase italic">
                  Pesan ini akan terkirim jika ada chat masuk dan fitur aktif.
                </p>
              </div>
            </div>

            {/* TOMBOL SIMPAN */}
            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-[#008080] hover:bg-teal-600 disabled:bg-slate-400 text-white py-4 rounded-2xl font-[1000] uppercase text-[12px] tracking-[0.2em] shadow-lg shadow-teal-900/10 active:scale-95 transition-all flex justify-center items-center gap-2 border border-teal-400/30"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  SIMPAN PENGATURAN <Save size={18} />
                </>
              )}
            </button>
          </div>
        </div>

        {/* TIPS SECTION */}
        <div className="hidden lg:flex flex-col gap-4">
          <div className="p-6 bg-[#FF6600]/10 border border-[#FF6600]/20 rounded-[2rem] text-left">
            <h4 className="text-[#FF6600] font-black text-[14px] uppercase mb-2">
              Tips Berjualan
            </h4>
            <p className="text-slate-600 dark:text-slate-400 text-[12px] font-bold leading-relaxed">
              Gunakan kalimat yang ramah di Balasan Otomatis agar pelanggan
              tetap merasa dihargai meskipun Anda sedang tidak ditempat.
              Misalnya: "Halo Kak! Mohon tunggu sebentar ya, Admin sedang
              menyiapkan pesanan di dapur..."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
