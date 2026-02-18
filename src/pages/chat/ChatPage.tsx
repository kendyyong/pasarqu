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
    <div className="min-h-screen bg-slate-100 font-sans text-left">
      {/* Container Utama dengan Max-Width agar tidak terlalu lebar di Desktop */}
      <div className="max-w-[1200px] mx-auto h-screen bg-white flex overflow-hidden shadow-2xl border-x border-slate-200">
        {/* --- KOLOM KIRI: DAFTAR CHAT --- */}
        <div
          className={`w-full md:w-[350px] border-r border-slate-100 flex flex-col ${isMobileChatOpen ? "hidden md:flex" : "flex"}`}
        >
          <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/")}
                className="p-1 hover:text-teal-600 transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">
                PESAN <span className="text-teal-600">MASUK</span>
              </h2>
            </div>
            <button className="w-10 h-10 bg-slate-50 flex items-center justify-center text-teal-600 hover:bg-teal-600 hover:text-white transition-all">
              <Plus size={20} />
            </button>
          </div>

          <div className="p-4 border-b border-slate-50">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Cari percakapan..."
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none text-xs font-bold focus:ring-1 ring-teal-500 transition-all outline-none"
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
                  className={`p-4 flex items-center gap-4 cursor-pointer transition-all border-b border-slate-50 ${activeRoomId === room.id ? "bg-teal-50" : "hover:bg-slate-50"}`}
                >
                  <div className="w-12 h-12 bg-slate-200 overflow-hidden shrink-0 border border-slate-100">
                    {opponent?.avatar_url ? (
                      <img
                        src={opponent.avatar_url}
                        className="w-full h-full object-cover"
                        alt="avatar"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 font-black uppercase text-sm">
                        {opponent?.full_name?.substring(0, 2) || "U"}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden text-left">
                    <h4 className="font-black text-slate-800 uppercase tracking-tighter truncate">
                      {opponent?.full_name || "User Pasarqu"}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">
                      Lihat pesan terakhir
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* --- KOLOM KANAN: RUANG CHAT --- */}
        <div
          className={`flex-1 flex flex-col bg-slate-50 ${isMobileChatOpen ? "flex" : "hidden md:flex"}`}
        >
          {activeRoomId ? (
            <>
              {/* Header Chat */}
              <div className="p-4 bg-white border-b border-slate-100 flex items-center gap-4 sticky top-0 z-10">
                <button
                  onClick={() => setIsMobileChatOpen(false)}
                  className="md:hidden p-2 text-slate-500"
                >
                  <X size={20} />
                </button>
                <div className="w-10 h-10 bg-teal-50 flex items-center justify-center text-teal-600 font-black uppercase text-xs">
                  ID
                </div>
                <h3 className="font-black text-slate-800 uppercase tracking-tighter">
                  PERCAKAPAN AKTIF
                </h3>
              </div>

              {/* Chat Content */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                <div className="flex justify-start">
                  <div className="bg-white p-4 border border-slate-200 shadow-sm max-w-[85%] text-sm font-bold text-slate-700 leading-relaxed">
                    Halo Juragan, ada yang bisa kami bantu mengenai pesanan ini?
                  </div>
                </div>
              </div>

              {/* Input Box */}
              <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
                <input
                  type="text"
                  placeholder="Ketik pesan di sini..."
                  className="flex-1 bg-slate-50 border border-slate-200 px-5 py-3 text-sm font-bold focus:border-teal-500 outline-none"
                />
                <button className="w-14 h-14 bg-teal-600 text-white flex items-center justify-center hover:bg-teal-700 transition-all shadow-md">
                  <Send size={20} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-10 bg-slate-50">
              <div className="w-20 h-20 bg-white flex items-center justify-center text-slate-200 shadow-sm mb-4 border border-slate-100">
                <MessageSquareText size={40} />
              </div>
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">
                Pilih Percakapan
              </h3>
              <p className="text-[10px] text-slate-300 font-bold uppercase mt-2 tracking-widest">
                Silakan klik salah satu daftar chat di samping
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
