import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import {
  Send,
  Loader2,
  CheckCheck,
  ShieldCheck,
  Lock,
  MessageSquareOff,
  Headset,
  Store,
  User,
  Bike,
} from "lucide-react";

interface Props {
  orderId: string;
  receiverName: string;
  // merchant_customer (CS), courier_merchant (Jemput), courier_customer (Antar)
  chatType: "merchant_customer" | "courier_merchant" | "courier_customer";
}

export const OrderChatRoom: React.FC<Props> = ({
  orderId,
  receiverName,
  chatType,
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [isChatLocked, setIsChatLocked] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchChatAndStatus = async () => {
    try {
      const { data: chatData, error: chatError } = await supabase
        .from("order_chats")
        .select("*")
        .eq("order_id", orderId)
        .eq("chat_type", chatType)
        .order("created_at", { ascending: true });

      if (chatError) throw chatError;
      setMessages(chatData || []);

      const { data: orderData } = await supabase
        .from("orders")
        .select("status")
        .eq("id", orderId)
        .single();

      // Logika Kunci Chat
      if (chatType.startsWith("courier")) {
        if (
          orderData?.status === "COMPLETED" ||
          orderData?.status === "CANCELLED"
        ) {
          setIsChatLocked(true);
        }
      } else if (chatType === "merchant_customer") {
        if (orderData?.status === "CANCELLED") {
          setIsChatLocked(true);
        }
      }
    } catch (err) {
      console.error("Gagal sinkronisasi chat:", err);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  useEffect(() => {
    fetchChatAndStatus();
    const channel = supabase
      .channel(`chat_${orderId}_${chatType}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "order_chats",
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          if (payload.new.chat_type === chatType) {
            setMessages((prev) => [...prev, payload.new]);
            scrollToBottom();
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, chatType]);

  const scrollToBottom = () => {
    setTimeout(
      () => scrollRef.current?.scrollIntoView({ behavior: "smooth" }),
      100,
    );
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isChatLocked) return;
    const content = newMessage;
    setNewMessage("");
    await supabase.from("order_chats").insert({
      order_id: orderId,
      sender_id: user?.id,
      message: content,
      chat_type: chatType,
    });
  };

  if (loading)
    return (
      <div className="p-10 text-center">
        <Loader2 className="animate-spin mx-auto text-teal-600" />
      </div>
    );

  return (
    <div className="flex flex-col h-full bg-white rounded-[2.5rem] overflow-hidden text-left border border-slate-100 shadow-xl">
      <div className="p-5 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg ${chatType.includes("courier") ? "bg-orange-500" : "bg-slate-900"}`}
          >
            {chatType === "merchant_customer" ? (
              <Headset size={20} />
            ) : chatType === "courier_merchant" ? (
              <Store size={20} />
            ) : (
              <User size={20} />
            )}
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-tight text-slate-800">
              {receiverName}
            </h4>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
              {chatType.replace("_", " ")}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#fcfdfe]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-30 grayscale">
            <MessageSquareOff size={32} className="mb-3 text-slate-300" />
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Belum ada pesan
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <div
                key={idx}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] p-3.5 rounded-[1.5rem] text-[12px] font-bold shadow-sm ${isMe ? "bg-slate-900 text-white rounded-tr-none" : "bg-white text-slate-700 rounded-tl-none border border-slate-100"}`}
                >
                  {msg.message}
                </div>
              </div>
            );
          })
        )}
        <div ref={scrollRef} />
      </div>

      <div className="p-4 bg-white border-t border-slate-50">
        {!isChatLocked ? (
          <form
            onSubmit={sendMessage}
            className="flex gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100"
          >
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Tulis pesan..."
              className="flex-1 bg-transparent border-none px-3 text-xs font-bold outline-none"
            />
            <button
              type="submit"
              className="w-10 h-10 bg-teal-600 text-white rounded-xl flex items-center justify-center shadow-lg"
            >
              <Send size={16} />
            </button>
          </form>
        ) : (
          <div className="bg-slate-100 p-3 rounded-xl flex items-center justify-center gap-2 text-slate-400">
            <Lock size={14} />{" "}
            <p className="text-[9px] font-black uppercase">Sesi chat ditutup</p>
          </div>
        )}
      </div>
    </div>
  );
};
