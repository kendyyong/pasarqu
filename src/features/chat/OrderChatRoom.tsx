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
  chatType: "merchant_customer" | "courier_merchant" | "courier_customer";
  merchantId?: string | null;
}

export const OrderChatRoom: React.FC<Props> = ({
  orderId,
  receiverName,
  chatType,
  merchantId,
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [isChatLocked, setIsChatLocked] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchChatAndStatus = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("order_chats")
        .select("*")
        .eq("order_id", orderId)
        .eq("chat_type", chatType);

      if (merchantId) {
        query = query.eq("merchant_id", merchantId);
      } else {
        query = query.is("merchant_id", null);
      }

      const { data: chatData, error: chatError } = await query.order(
        "created_at",
        { ascending: true },
      );

      if (chatError) throw chatError;
      setMessages(chatData || []);

      const { data: orderData } = await supabase
        .from("orders")
        .select("status")
        .eq("id", orderId)
        .single();

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
      .channel(`chat_${orderId}_${chatType}_${merchantId || "admin"}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "order_chats",
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          const newMsg = payload.new;
          const isSameType = newMsg.chat_type === chatType;
          const isSameMerchant = merchantId
            ? newMsg.merchant_id === merchantId
            : !newMsg.merchant_id;

          if (isSameType && isSameMerchant) {
            setMessages((prev) => [...prev, newMsg]);
            scrollToBottom();
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, chatType, merchantId]);

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
      merchant_id: merchantId || null,
      sender_id: user?.id,
      message: content,
      chat_type: chatType,
    });
  };

  if (loading)
    return (
      <div className="p-10 text-center flex flex-col items-center justify-center h-full">
        <Loader2 className="animate-spin text-[#008080]" size={36} />
        <p className="text-[10px] font-[1000] text-slate-400 mt-4 tracking-widest uppercase">
          MEMUAT JALUR AMAN...
        </p>
      </div>
    );

  return (
    // 🚀 MASTER WRAPPER CHAT: Memakai h-full absolut agar menempati 100% sisa tinggi box
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden text-left font-black uppercase tracking-tighter">
      {/* 🚀 AREA CHAT: Menggunakan flex-1 dan overflow-y-auto agar bisa digulir */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center">
            <MessageSquareOff size={40} className="mb-3 text-slate-300" />
            <p className="text-[10px] text-slate-400 text-center max-w-[200px] leading-relaxed tracking-widest">
              BELUM ADA PERCAKAPAN. SILAKAN MEMULAI OBROLAN.
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <div
                key={idx}
                className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] p-3 md:p-4 rounded-md text-[12px] shadow-sm font-bold normal-case tracking-normal border ${
                    isMe
                      ? "bg-[#008080] border-[#008080] text-white"
                      : "bg-white border-slate-200 text-slate-800"
                  }`}
                >
                  {msg.message}
                  <div
                    className={`text-[9px] mt-2 opacity-60 font-sans tracking-widest ${isMe ? "text-right" : "text-left"}`}
                  >
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={scrollRef} />
      </div>

      {/* 🚀 KOTAK INPUT BAWAH: Dikunci di bawah (shrink-0) */}
      <div className="shrink-0 p-3 md:p-4 bg-white border-t border-slate-200 pb-safe">
        {!isChatLocked ? (
          <form
            onSubmit={sendMessage}
            className="flex gap-2 bg-slate-50 p-1.5 rounded-md border border-slate-200 shadow-inner"
          >
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="TULIS PESAN JURAGAN..."
              className="flex-1 bg-transparent px-3 py-2 text-[12px] md:text-[14px] font-black outline-none placeholder:text-slate-300"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="w-12 h-12 shrink-0 bg-[#008080] text-white rounded-md flex items-center justify-center shadow-md active:scale-90 transition-all disabled:opacity-50 disabled:bg-slate-300"
            >
              <Send size={18} />
            </button>
          </form>
        ) : (
          <div className="bg-red-50 p-4 rounded-md flex items-center justify-center gap-2 text-red-500 border border-red-200 shadow-inner">
            <Lock size={16} />
            <p className="text-[10px] tracking-widest font-[1000]">
              SESI PERCAKAPAN TELAH DITUTUP
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
