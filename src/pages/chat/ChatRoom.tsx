import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
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
  ShoppingCart,
} from "lucide-react";

interface ChatRoomProps {
  embeddedRoomId?: string;
  initialMessage?: string;
  attachedProduct?: any;
  onClose?: () => void;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({
  embeddedRoomId,
  initialMessage,
  attachedProduct,
  onClose,
}) => {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const roomId = embeddedRoomId || params.roomId;
  const isEmbedded = !!embeddedRoomId;

  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [partner, setPartner] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeAttachment, setActiveAttachment] = useState<any>(
    attachedProduct || null,
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. PROTEKSI DESKTOP: Jika dibuka via URL langsung di layar lebar, lempar ke Home
  useEffect(() => {
    if (!isEmbedded && window.innerWidth >= 1024) {
      navigate("/");
    }
  }, [isEmbedded, navigate]);

  // 2. TANGKAP PESAN & PRODUK DARI URL ATAU PROPS
  useEffect(() => {
    if (initialMessage) setNewMessage(initialMessage);
    if (attachedProduct) setActiveAttachment(attachedProduct);

    const searchParams = new URLSearchParams(location.search);
    const autoText = searchParams.get("text");
    const productParam = searchParams.get("p");

    if (autoText) setNewMessage(autoText);
    if (productParam) {
      try {
        const decodedProd = JSON.parse(atob(productParam));
        setActiveAttachment(decodedProd);
      } catch (e) {
        console.error("Gagal decode data produk");
      }
    }
  }, [location, initialMessage, attachedProduct]);

  // 3. AMBIL DATA PESAN & PROFIL
  useEffect(() => {
    if (!roomId || !user) return;

    const fetchChatData = async () => {
      setLoading(true);
      try {
        const { data: roomData } = await supabase
          .from("chat_rooms")
          .select("*")
          .eq("id", roomId)
          .maybeSingle();
        if (!roomData) return;

        const partnerId =
          roomData.participant_1_id === user.id
            ? roomData.participant_2_id
            : roomData.participant_1_id;
        const { data: partnerProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", partnerId)
          .maybeSingle();

        setPartner({
          name:
            partnerProfile?.name ||
            partnerProfile?.full_name ||
            "Pengguna PasarQu",
          avatar_url: partnerProfile?.avatar_url || null,
        });

        const { data: msgData } = await supabase
          .from("chat_messages")
          .select("*")
          .eq("room_id", roomId)
          .order("created_at", { ascending: true });

        setMessages(msgData || []);
      } catch (err: any) {
        setErrorMsg(err.message);
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
          product_data: activeAttachment,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;
      setNewMessage("");
      setActiveAttachment(null);
    } catch (err) {
      alert("Gagal mengirim pesan");
    } finally {
      setSending(false);
    }
  };

  if (loading)
    return (
      <div className="h-full w-full flex items-center justify-center bg-[#e5ddd5]">
        <Loader2 className="animate-spin text-[#008080]" size={40} />
      </div>
    );

  return (
    <div className="flex flex-col h-[100dvh] md:h-full w-full bg-[#e5ddd5] font-sans relative overflow-hidden text-left">
      <header className="bg-[#008080] text-white h-[60px] flex items-center px-3 shadow-md z-10 shrink-0 sticky top-0">
        <button
          onClick={() => (onClose ? onClose() : navigate(-1))}
          className="p-2 -ml-1 mr-1 active:scale-90 hover:bg-white/10 rounded-full transition-all"
        >
          {onClose ? <X size={22} /> : <ArrowLeft size={22} />}
        </button>
        <div className="flex items-center gap-3 flex-1 overflow-hidden ml-1">
          <div className="w-9 h-9 bg-white rounded-full overflow-hidden flex items-center justify-center shrink-0 border border-teal-600">
            {partner?.avatar_url ? (
              <img
                src={partner.avatar_url}
                className="w-full h-full object-cover"
              />
            ) : (
              <Store size={18} className="text-[#008080]" />
            )}
          </div>
          <div className="flex flex-col truncate">
            <span className="font-bold text-[15px] leading-tight truncate">
              {partner?.name}
            </span>
            <span className="text-[11px] font-medium text-teal-100 uppercase tracking-wider">
              Online
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-3 space-y-3 relative">
        <div className="text-center my-4 flex justify-center">
          <div className="bg-[#FFF5C4] text-slate-600 text-[11px] px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5 max-w-[90%]">
            <Lock size={10} className="shrink-0" />{" "}
            <span className="font-medium">
              Pesan dilindungi enkripsi end-to-end.
            </span>
          </div>
        </div>

        {messages.map((msg) => {
          const isMe = msg.sender_id === user?.id;
          return (
            <div
              key={msg.id}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`flex flex-col max-w-[85%] p-2 px-3 rounded-xl shadow-sm relative ${isMe ? "bg-[#dcf8c6] rounded-tr-sm" : "bg-white rounded-tl-sm"}`}
              >
                {msg.product_data && (
                  <Link
                    to={`/product/${msg.product_data.id}`}
                    className="block mb-2 bg-black/5 border border-black/10 rounded-lg p-2 hover:bg-black/10 transition-all"
                  >
                    <div className="flex gap-2 items-center">
                      <img
                        src={msg.product_data.image}
                        className="w-10 h-10 object-cover rounded-md"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-slate-800 truncate uppercase">
                          {msg.product_data.name}
                        </p>
                        <p className="text-[10px] font-black text-[#FF6600]">
                          Rp {msg.product_data.price.toLocaleString()}
                        </p>
                      </div>
                      <ShoppingCart
                        size={14}
                        className="text-[#008080] shrink-0"
                      />
                    </div>
                  </Link>
                )}
                <p className="text-[14px] text-slate-800 leading-relaxed font-normal break-words">
                  {msg.message}
                </p>
                <span className="text-[9px] text-slate-400 font-medium self-end mt-0.5 tracking-tight">
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

      {activeAttachment && (
        <div className="mx-2 mb-1 bg-white border border-[#008080]/20 rounded-xl p-2 flex items-center gap-3 relative animate-in slide-in-from-bottom-2 shadow-md">
          <button
            onClick={() => setActiveAttachment(null)}
            className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full text-[10px] shadow-lg flex items-center justify-center font-bold"
          >
            X
          </button>
          <img
            src={activeAttachment.image}
            className="w-10 h-10 object-cover rounded-lg"
          />
          <div className="flex-1 overflow-hidden">
            <p className="text-[10px] font-bold truncate uppercase">
              {activeAttachment.name}
            </p>
            <p className="text-[9px] text-[#FF6600] font-black">
              Rp {activeAttachment.price.toLocaleString()}
            </p>
          </div>
        </div>
      )}

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
            rows={1}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="w-[44px] h-[44px] bg-[#008080] text-white rounded-full flex items-center justify-center shadow-md active:scale-95 disabled:bg-slate-400 transition-all"
          >
            {sending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} className="ml-0.5" />
            )}
          </button>
        </form>
      </footer>
    </div>
  );
};
