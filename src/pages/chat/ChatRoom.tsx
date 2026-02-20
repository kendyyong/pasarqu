import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import { Send, ArrowLeft, User, Loader2, ShieldCheck } from "lucide-react";

export const ChatRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!roomId) return;

    const fetchMessages = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true });
      setMessages(data || []);
      setLoading(false);
    };

    fetchMessages();

    // Kabel Instant (Realtime)
    const channel = supabase
      .channel(`room-${roomId}`)
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
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !roomId) return;

    const content = newMessage.trim();
    setNewMessage("");

    const { error } = await supabase.from("chat_messages").insert([
      {
        room_id: roomId,
        sender_id: user.id,
        content: content,
      },
    ]);

    if (!error) {
      await supabase
        .from("chat_rooms")
        .update({ updated_at: new Date() })
        .eq("id", roomId);
    }
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-teal-600" size={32} />
      </div>
    );

  return (
    <div className="h-screen flex flex-col bg-slate-50 font-black uppercase tracking-tighter text-left overflow-hidden">
      {/* --- HEADER: RAPI & SINKRON --- */}
      <header className="bg-white border-b-2 border-slate-100 p-4 flex items-center justify-between shrink-0 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/chat")}
            className="p-2 hover:bg-slate-50 rounded-2xl transition-all"
          >
            <ArrowLeft size={24} className="text-slate-600" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-100">
              <User size={24} />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-800 leading-none">
                RUANG OBROLAN
              </h2>
              <p className="text-[9px] text-teal-600 mt-1 flex items-center gap-1 uppercase tracking-widest">
                <ShieldCheck size={10} /> TERVERIFIKASI
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* --- PESAN-PESAN: LUAS & TENGAH --- */}
      <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-6 scrollbar-hide">
        <div className="max-w-[900px] mx-auto w-full space-y-6">
          {messages.map((msg) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] md:max-w-[70%] p-5 rounded-[2.5rem] text-[13px] font-black shadow-sm transition-all border-2 ${
                    isMe
                      ? "bg-teal-600 border-teal-500 text-white rounded-tr-none shadow-teal-100"
                      : "bg-white border-white text-slate-800 rounded-tl-none"
                  }`}
                >
                  {msg.content}
                  <div
                    className={`text-[8px] mt-2 font-bold opacity-50 font-sans ${isMe ? "text-right" : "text-left"}`}
                  >
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>
      </div>

      {/* --- INPUT BOX: MELAYANG (FLOATING) --- */}
      <div className="p-4 md:p-8 bg-transparent shrink-0">
        <form
          onSubmit={handleSendMessage}
          className="max-w-[900px] mx-auto bg-white p-2 rounded-[2.5rem] shadow-2xl border-2 border-slate-100 flex gap-2"
        >
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="KETIK PESAN JURAGAN..."
            className="flex-1 bg-transparent px-6 py-4 text-[12px] font-black outline-none"
          />
          <button
            type="submit"
            className="w-14 h-14 bg-teal-600 rounded-full flex items-center justify-center text-white shadow-xl hover:bg-slate-900 transition-all active:scale-90"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};
