import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  MessageSquareText,
  Plus,
  Loader2,
  X,
  Send,
  ArrowLeft,
  User,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabaseClient";

export const ChatPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchRooms = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("chat_rooms")
        .select(
          `
          *,
          participant_1:participant_1_id(id, full_name, avatar_url),
          participant_2:participant_2_id(id, full_name, avatar_url)
        `,
        )
        .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`)
        .order("updated_at", { ascending: false });

      if (!error) setConversations(data || []);
      setLoading(false);
    };
    fetchRooms();
  }, [user]);

  const handleSelect = (id: string) => {
    setActiveRoomId(id);
    setIsMobileChatOpen(true);
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-teal-600" size={32} />
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 font-black uppercase tracking-tighter text-left">
      <div className="max-w-[1400px] mx-auto h-screen bg-white flex overflow-hidden shadow-2xl">
        {/* --- KOLOM KIRI: DAFTAR CHAT --- */}
        <div
          className={`w-full md:w-[380px] border-r border-slate-100 flex flex-col ${isMobileChatOpen ? "hidden md:flex" : "flex"}`}
        >
          <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/")}
                className="p-2 hover:bg-slate-50 rounded-full transition-all"
              >
                <ArrowLeft size={24} />
              </button>
              <h2 className="text-xl font-black">
                PESAN <span className="text-teal-600">MASUK</span>
              </h2>
            </div>
          </div>

          <div className="p-4 border-b border-slate-50">
            <div className="relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="text"
                placeholder="CARI KONTAK..."
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none text-[11px] font-black focus:ring-2 ring-teal-500 transition-all outline-none rounded-2xl"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {conversations.map((room) => {
              const opponent =
                room.participant_1_id === user?.id
                  ? room.participant_2
                  : room.participant_1;
              return (
                <div
                  key={room.id}
                  onClick={() => handleSelect(room.id)}
                  className={`p-5 flex items-center gap-4 cursor-pointer transition-all border-b border-slate-50 ${activeRoomId === room.id ? "bg-teal-50 border-l-4 border-l-teal-600" : "hover:bg-slate-50"}`}
                >
                  <div className="w-14 h-14 bg-slate-100 rounded-2xl overflow-hidden shrink-0 border border-slate-200 shadow-sm">
                    {opponent?.avatar_url ? (
                      <img
                        src={opponent.avatar_url}
                        className="w-full h-full object-cover"
                        alt="avatar"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <User size={24} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h4 className="font-black text-slate-800 text-sm truncate">
                      {opponent?.full_name || "USER PASARQU"}
                    </h4>
                    <p className="text-[9px] text-slate-400 font-bold truncate mt-1">
                      LIHAT DETAIL PERCAKAPAN
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* --- KOLOM KANAN: RUANG CHAT (POSISI TENGAH & LUAS) --- */}
        <div
          className={`flex-1 flex flex-col bg-slate-50 relative ${isMobileChatOpen ? "flex" : "hidden md:flex"}`}
        >
          {activeRoomId ? (
            <>
              {/* Header Chat Aktif */}
              <div className="p-4 md:p-6 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setIsMobileChatOpen(false)}
                    className="md:hidden p-2"
                  >
                    <X size={24} />
                  </button>
                  <div className="w-12 h-12 bg-teal-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-teal-100">
                    <MessageSquareText size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 text-base leading-none">
                      ADMIN SUPPORT
                    </h3>
                    <p className="text-[9px] text-teal-600 mt-1 tracking-widest">
                      ONLINE SEKARANG
                    </p>
                  </div>
                </div>
              </div>

              {/* Chat Content: Dibuat di Tengah & Luas */}
              <div className="flex-1 p-4 md:p-10 overflow-y-auto space-y-6 flex flex-col items-center">
                <div className="w-full max-w-[800px] flex flex-col gap-4">
                  {/* BUBBLE CHAT TERIMA */}
                  <div className="flex justify-start">
                    <div className="bg-white p-5 rounded-[2rem] rounded-tl-none shadow-sm border border-slate-100 text-xs md:text-sm font-bold text-slate-700 leading-relaxed max-w-[90%] md:max-w-[70%]">
                      HALO JURAGAN, ADA YANG BISA KAMI BANTU MENGENAI PESANAN
                      ANDA? KAMI SIAP MELAYANI.
                    </div>
                  </div>
                  {/* BUBBLE CHAT KIRIM */}
                  <div className="flex justify-end">
                    <div className="bg-teal-600 p-5 rounded-[2rem] rounded-tr-none shadow-xl text-white text-xs md:text-sm font-bold leading-relaxed max-w-[90%] md:max-w-[70%]">
                      SAYA MAU TANYA STATUS BARANG SAYA, APAKAH SUDAH SELESAI
                      DIKEMAS?
                    </div>
                  </div>
                </div>
              </div>

              {/* Input Box: Melayang di Bawah */}
              <div className="p-4 md:p-8 bg-transparent shrink-0">
                <div className="max-w-[800px] mx-auto bg-white p-2 rounded-[2.5rem] shadow-2xl border border-slate-100 flex gap-2">
                  <input
                    type="text"
                    placeholder="KETIK PESAN JURAGAN..."
                    className="flex-1 bg-transparent px-6 py-4 text-xs font-black outline-none"
                  />
                  <button className="w-14 h-14 bg-teal-600 text-white rounded-full flex items-center justify-center hover:bg-slate-900 transition-all shadow-lg active:scale-90">
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* TAMPILAN KOSONG - POSISI TENGAH */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-10 bg-slate-50">
              <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center text-slate-200 shadow-xl mb-6 border border-slate-100">
                <MessageSquareText size={48} />
              </div>
              <h3 className="text-sm font-black text-slate-400 tracking-[0.3em]">
                PILIH PERCAKAPAN
              </h3>
              <p className="text-[10px] text-slate-300 font-bold mt-3 tracking-widest max-w-[200px] leading-loose">
                KLIK SALAH SATU DAFTAR CHAT UNTUK MEMULAI KONSULTASI
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
