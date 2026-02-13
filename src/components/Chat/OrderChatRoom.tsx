import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import { Send, User, Bike, Loader2 } from "lucide-react";

interface Props {
  orderId: string;
  receiverName: string;
}

export const OrderChatRoom: React.FC<Props> = ({ orderId, receiverName }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Ambil Riwayat Chat
  const fetchChatHistory = async () => {
    const { data } = await supabase
      .from("order_chats")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true });

    setMessages(data || []);
    setLoading(false);
    scrollToBottom();
  };

  // 2. Real-time Subscription (Dengar pesan masuk)
  useEffect(() => {
    fetchChatHistory();

    const channel = supabase
      .channel(`chat_${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "order_chats",
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
          scrollToBottom();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // 3. Kirim Pesan
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const msg = newMessage;
    setNewMessage(""); // Clear input langsung biar berasa cepat

    const { error } = await supabase.from("order_chats").insert({
      order_id: orderId,
      sender_id: user?.id,
      message: msg,
    });

    if (error) console.error("Gagal kirim pesan:", error);
  };

  if (loading)
    return (
      <div className="p-10 text-center">
        <Loader2 className="animate-spin mx-auto text-teal-600" />
      </div>
    );

  return (
    <div className="flex flex-col h-[500px] bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
      {/* Header Chat */}
      <div className="p-5 border-b border-slate-50 bg-slate-50/50 flex items-center gap-3">
        <div className="w-10 h-10 bg-teal-600 text-white rounded-full flex items-center justify-center font-black">
          {receiverName.charAt(0)}
        </div>
        <div>
          <h4 className="text-xs font-black uppercase tracking-tight text-slate-800">
            {receiverName}
          </h4>
          <p className="text-[8px] font-bold text-teal-600 uppercase tracking-widest flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>{" "}
            Terhubung
          </p>
        </div>
      </div>

      {/* Pesan Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#F8FAFC]">
        {messages.length === 0 && (
          <div className="text-center py-10">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
              Mulai percakapan...
            </p>
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.sender_id === user?.id;
          return (
            <div
              key={msg.id}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] p-4 rounded-3xl text-sm font-medium shadow-sm ${
                  isMe
                    ? "bg-slate-900 text-white rounded-tr-none"
                    : "bg-white text-slate-700 rounded-tl-none border border-slate-100"
                }`}
              >
                {msg.message}
                <p
                  className={`text-[8px] mt-1 opacity-50 font-bold ${isMe ? "text-right" : "text-left"}`}
                >
                  {new Date(msg.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Input Chat */}
      <form
        onSubmit={sendMessage}
        className="p-4 bg-white border-t border-slate-50 flex gap-2"
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Ketik pesan untuk kurir..."
          className="flex-1 bg-slate-50 border-none rounded-2xl px-5 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
        />
        <button
          type="submit"
          className="w-12 h-12 bg-teal-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-teal-200 active:scale-90 transition-all"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};
