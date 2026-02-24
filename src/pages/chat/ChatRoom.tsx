import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import {
  ArrowLeft,
  Send,
  Loader2,
  Store,
  AlertCircle,
  X,
  Lock,
} from "lucide-react";

interface ChatRoomProps {
  embeddedRoomId?: string;
  initialMessage?: string;
  onClose?: () => void;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({
  embeddedRoomId,
  initialMessage,
  onClose,
}) => {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const roomId = embeddedRoomId || params.roomId;

  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [partner, setPartner] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialMessage) {
      setNewMessage(initialMessage);
    } else {
      const searchParams = new URLSearchParams(location.search);
      const autoText = searchParams.get("text");
      if (autoText) setNewMessage(autoText);
    }
  }, [initialMessage, location]);

  useEffect(() => {
    if (!roomId || !user) return;

    const fetchChatData = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const { data: roomData, error: roomError } = await supabase
          .from("chat_rooms")
          .select("*")
          .eq("id", roomId)
          .maybeSingle();

        if (roomError || !roomData)
          throw new Error("Ruang obrolan tidak ditemukan");

        const partnerId =
          roomData.participant_1_id === user.id
            ? roomData.participant_2_id
            : roomData.participant_1_id;

        const { data: partnerProfile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", partnerId)
          .maybeSingle();

        if (profileError) {
          console.error("Gagal mengambil profil partner:", profileError);
        }

        setPartner({
          name:
            partnerProfile?.name ||
            partnerProfile?.full_name ||
            partnerProfile?.username ||
            "Pengguna PasarQu",
          avatar_url: partnerProfile?.avatar_url || null,
        });

        const { data: msgData, error: msgError } = await supabase
          .from("chat_messages")
          .select("*")
          .eq("room_id", roomId)
          .order("created_at", { ascending: true });

        if (msgError) throw msgError;

        setMessages(msgData || []);
      } catch (err: any) {
        console.error("Fetch chat error:", err);
        setErrorMsg(err.message || "Gagal memuat pesan");
      } finally {
        setLoading(false);
      }
    };

    fetchChatData();

    const subscription = supabase
      .channel(`chat_room_${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [roomId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !roomId) return;

    setSending(true);
    try {
      const { error } = await supabase.from("chat_messages").insert([
        {
          room_id: roomId,
          sender_id: user.id,
          message: newMessage.trim(),
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;
      setNewMessage("");
    } catch (err) {
      console.error("Gagal mengirim pesan:", err);
      alert("Pesan gagal terkirim. Periksa koneksi Anda.");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[100dvh] md:h-full w-full flex items-center justify-center bg-[#e5ddd5]">
        <Loader2 className="animate-spin text-[#008080]" size={40} />
      </div>
    );
  }

  return (
    // Menggunakan h-[100dvh] untuk mencegah bug ruang putih di bagian bawah browser HP
    <div className="flex flex-col h-[100dvh] md:h-full w-full bg-[#e5ddd5] font-sans relative">
      {/* HEADER */}
      <header className="bg-[#008080] text-white h-[60px] flex items-center px-3 shadow-md z-10 shrink-0 sticky top-0">
        <button
          onClick={() => (onClose ? onClose() : navigate(-1))}
          className="p-2 -ml-1 mr-1 active:scale-90 transition-transform hover:bg-white/10 rounded-full"
        >
          {onClose ? <X size={22} /> : <ArrowLeft size={22} />}
        </button>

        <div className="flex items-center gap-3 flex-1 overflow-hidden">
          <div className="w-9 h-9 bg-white rounded-full overflow-hidden flex items-center justify-center shrink-0 shadow-sm border border-teal-600">
            {partner?.avatar_url ? (
              <img
                src={partner.avatar_url}
                alt="avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <Store size={18} className="text-[#008080]" />
            )}
          </div>
          <div className="flex flex-col truncate">
            <span className="font-bold text-[15px] leading-tight truncate tracking-wide">
              {partner?.name}
            </span>
            <span className="text-[11px] font-medium text-teal-100 tracking-wider">
              Online
            </span>
          </div>
        </div>
      </header>

      {/* AREA PESAN */}
      <main className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 relative">
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-md flex items-start gap-2 text-[12px] font-medium shadow-sm">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <p>{errorMsg}</p>
          </div>
        )}

        {/* Notifikasi Enkripsi */}
        <div className="text-center my-4 flex justify-center">
          <div className="bg-[#FFF5C4] text-slate-600 text-[11px] px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5 max-w-[90%] md:max-w-[70%]">
            <Lock size={10} className="shrink-0 text-slate-500" />
            <span className="font-medium leading-relaxed">
              Pesan dilindungi enkripsi end-to-end. Tidak ada yang dapat
              membacanya selain Anda dan penjual.
            </span>
          </div>
        </div>

        {/* Bubble Chat */}
        {messages.map((msg) => {
          const isMe = msg.sender_id === user?.id;
          return (
            <div
              key={msg.id}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`flex flex-col max-w-[85%] md:max-w-[75%] p-2 px-3 rounded-xl shadow-sm relative ${isMe ? "bg-[#dcf8c6] rounded-tr-sm" : "bg-white rounded-tl-sm"}`}
              >
                {/* Isi Pesan (Hapus font-bold, gunakan text-slate-800 agar nyaman dibaca) */}
                <p className="text-[14px] text-slate-800 whitespace-pre-wrap leading-relaxed break-words font-normal">
                  {msg.message}
                </p>

                {/* Waktu Pesan (Merapatkan jarak dengan teks) */}
                <span className="text-[10px] text-slate-400 font-medium self-end mt-0.5 select-none tracking-tight">
                  {new Date(msg.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} className="h-1" />
      </main>

      {/* INPUT AREA */}
      <footer className="bg-[#f0f0f0] p-2 shrink-0">
        <form
          onSubmit={handleSendMessage}
          className="max-w-[1200px] mx-auto flex items-end gap-2"
        >
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Ketik pesan..."
            className="flex-1 bg-white border-none rounded-2xl py-2.5 px-4 outline-none text-[14px] text-slate-800 resize-none max-h-[100px] min-h-[44px] shadow-sm leading-relaxed"
            rows={newMessage.split("\n").length > 2 ? 3 : 1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
          />

          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="w-[44px] h-[44px] bg-[#008080] text-white rounded-full flex items-center justify-center shrink-0 shadow-sm active:scale-95 transition-all disabled:opacity-50 disabled:bg-slate-400 disabled:active:scale-100"
          >
            {sending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} className="ml-0.5 mt-0.5" />
            )}
          </button>
        </form>
      </footer>
    </div>
  );
};
