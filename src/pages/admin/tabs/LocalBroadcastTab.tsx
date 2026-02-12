import React, { useState } from "react";
import {
  Megaphone,
  Send,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Smartphone,
} from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import { useToast } from "../../../contexts/ToastContext";

interface Props {
  marketId: string;
  marketName: string;
  customerCount: number;
}

export const LocalBroadcastTab: React.FC<Props> = ({
  marketId,
  marketName,
  customerCount,
}) => {
  const { showToast } = useToast();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [history, setHistory] = useState<any[]>([]); // Bisa dihubungkan ke tabel notifications

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message)
      return showToast("Judul dan pesan harus diisi!", "error");

    setIsSending(true);
    try {
      // LOGIKA: Menyimpan notifikasi ke tabel notifications untuk semua user di market_id ini
      // Dalam sistem pro, ini biasanya memicu push notification (Firebase/OneSignal)
      const { error } = await supabase.from("notifications").insert([
        {
          market_id: marketId,
          title: title,
          content: message,
          type: "BROADCAST",
          sender_role: "LOCAL_ADMIN",
        },
      ]);

      if (error) throw error;

      showToast(
        `Berhasil mengirim broadcast ke ${customerCount} pelanggan!`,
        "success",
      );
      setTitle("");
      setMessage("");
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 text-left">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">
            Broadcast Wilayah
          </h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Kirim pesan ke seluruh pembeli di {marketName}
          </p>
        </div>
        <div className="bg-teal-50 px-4 py-2 rounded-2xl border border-teal-100 flex items-center gap-2">
          <Users size={16} className="text-teal-600" />
          <span className="text-[10px] font-black text-teal-700 uppercase">
            {customerCount} Penerima Aktif
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* FORM INPUT */}
        <div className="lg:col-span-2">
          <form
            onSubmit={handleBroadcast}
            className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6"
          >
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">
                Judul Pesan
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Promo Spesial Hari Jumat!"
                className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold text-slate-700 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">
                Isi Pengumuman
              </label>
              <textarea
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tuliskan detail promo atau informasi pasar di sini..."
                className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold text-slate-700 focus:ring-2 focus:ring-teal-500 outline-none transition-all resize-none"
              />
            </div>

            <button
              disabled={isSending}
              className="w-full py-5 bg-teal-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-teal-600/20 hover:bg-teal-700 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              {isSending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  <Send size={18} /> Kirim Sekarang
                </>
              )}
            </button>
          </form>
        </div>

        {/* PREVIEW HANDPHONE */}
        <div className="hidden lg:block space-y-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
            Preview di HP Pembeli
          </p>
          <div className="bg-slate-900 w-full aspect-[9/16] rounded-[3rem] border-[6px] border-slate-800 p-4 relative overflow-hidden shadow-2xl">
            <div className="w-20 h-5 bg-slate-800 mx-auto rounded-b-2xl mb-8"></div>

            {/* Mock Notification */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 animate-bounce">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 bg-teal-500 rounded-md flex items-center justify-center text-[8px] font-black text-white">
                  P
                </div>
                <span className="text-[8px] font-black text-white uppercase tracking-tighter">
                  Pasarqu • {marketName}
                </span>
              </div>
              <p className="text-[10px] font-black text-white truncate">
                {title || "Judul Pesan..."}
              </p>
              <p className="text-[9px] text-slate-300 line-clamp-2 mt-1">
                {message || "Isi pesan akan muncul di sini..."}
              </p>
            </div>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-10 h-10 bg-white/5 rounded-full border border-white/10 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border border-white/20"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 bg-blue-50 rounded-[2rem] border border-blue-100 flex items-start gap-4">
        <AlertCircle className="text-blue-500 shrink-0 mt-1" />
        <div>
          <h4 className="text-xs font-black text-blue-800 uppercase tracking-widest mb-1">
            Tips Penjualan
          </h4>
          <p className="text-[11px] text-blue-600 font-medium leading-relaxed">
            Gunakan fitur ini secara bijak. Broadcast yang berisi promo harga
            murah di pagi hari terbukti meningkatkan transaksi hingga 40% di
            wilayah tertentu.
          </p>
        </div>
      </div>
    </div>
  );
};
