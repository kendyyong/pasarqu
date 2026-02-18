import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import { Send, ArrowLeft, User, Loader2 } from "lucide-react";

export const ChatRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!roomId) return;

    // 1. Ambil pesan lama
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true });
      setMessages(data || []);
    };

    fetchMessages();

    // 2. Langganan Realtime (Kabel Instant)
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

  // Auto scroll ke bawah saat ada pesan baru
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !roomId) return;

    const messageObj = {
      room_id: roomId,
      sender_id: user.id,
      content: newMessage.trim(),
    };

    setNewMessage("");
    await supabase.from("chat_messages").insert([messageObj]);
    // Update last_message di room
    await supabase
      .from("chat_rooms")
      .update({ updated_at: new Date() })
      .eq("id", roomId);
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 font-sans text-left overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 p-4 flex items-center gap-4 shrink-0">
        <button
          onClick={() => navigate("/chat")}
          className="p-2 hover:bg-slate-50 rounded-xl"
        >
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
            <User size={20} />
          </div>
          <h2 className="font-black text-slate-800 uppercase italic tracking-tighter">
            Ruang Obrolan
          </h2>
        </div>
      </div>

      {/* Pesan-pesan */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender_id === user?.id ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] p-4 rounded-[2rem] text-sm font-medium shadow-sm ${
                msg.sender_id === user?.id
                  ? "bg-teal-600 text-white rounded-tr-none"
                  : "bg-white text-slate-800 rounded-tl-none border border-slate-100"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      {/* Input Box */}
      <form
        onSubmit={handleSendMessage}
        className="p-4 bg-white border-t border-slate-100 flex gap-2"
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Tulis pesan..."
          className="flex-1 bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:ring-2 ring-teal-500"
        />
        <button
          type="submit"
          className="w-12 h-12 bg-teal-600 rounded-2xl flex items-center justify-center text-white shadow-lg active:scale-95 transition-all"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};
