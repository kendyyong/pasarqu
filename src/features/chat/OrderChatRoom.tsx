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
  // ✅ TAMBAHAN: merchantId untuk isolasi chat antar toko
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
      // ✅ QUERY: Tambahkan filter merchant_id
      let query = supabase
        .from("order_chats")
        .select("*")
        .eq("order_id", orderId)
        .eq("chat_type", chatType);

      // Jika ada merchantId, filter berdasarkan merchant tersebut
      if (merchantId) {
        query = query.eq("merchant_id", merchantId);
      } else {
        // Jika null, cari yang merchant_id-nya kosong (Admin Pusat)
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

    // ✅ REALTIME: Langganan dengan filter yang sama
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
          // Validasi apakah pesan ini milik chat_type dan merchant_id yang sedang dibuka
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

    // ✅ INSERT: Sertakan merchant_id
    await supabase.from("order_chats").insert({
      order_id: orderId,
      merchant_id: merchantId || null, // Jika null berarti chat ke Admin
      sender_id: user?.id,
      message: content,
      chat_type: chatType,
    });
  };

  if (loading)
    return (
      <div className="p-10 text-center flex flex-col items-center justify-center h-full">
        <Loader2 className="animate-spin text-teal-600" size={32} />
        <p className="text-[10px] font-black text-slate-400 mt-4 tracking-widest uppercase">
          Membuka Jalur Aman...
        </p>
      </div>
    );

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden text-left font-black uppercase tracking-tighter">
      {/* HEADER INFO */}
      <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-xl text-white shadow-md ${chatType.includes("courier") ? "bg-orange-500" : merchantId ? "bg-teal-600" : "bg-slate-900"}`}
          >
            {chatType === "courier_customer" ? (
              <Bike size={18} />
            ) : merchantId ? (
              <Store size={18} />
            ) : (
              <Headset size={18} />
            )}
          </div>
          <div>
            <h4 className="text-[11px] leading-none text-slate-800">
              {receiverName}
            </h4>
            <p className="text-[8px] text-slate-400 mt-1 tracking-widest">
              {merchantId ? "OBROLAN TOKO" : chatType.replace("_", " ")}
            </p>
          </div>
        </div>
        <ShieldCheck size={16} className="text-teal-500 opacity-50" />
      </div>

      {/* MESSAGES AREA */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#fcfdfe] no-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-30 grayscale">
            <MessageSquareOff size={32} className="mb-3 text-slate-300" />
            <p className="text-[9px] text-center max-w-[150px] leading-relaxed">
              Belum ada percakapan. Mulai tanya ke pedagang?
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
                  className={`max-w-[85%] p-4 rounded-[2rem] text-[12px] shadow-sm transition-all border ${
                    isMe
                      ? "bg-slate-900 border-slate-800 text-white rounded-tr-none"
                      : "bg-white border-slate-100 text-slate-700 rounded-tl-none"
                  }`}
                >
                  {msg.message}
                  <div
                    className={`text-[8px] mt-2 opacity-40 font-sans ${isMe ? "text-right" : "text-left"}`}
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

      {/* INPUT FIELD */}
      <div className="p-4 bg-white border-t border-slate-50">
        {!isChatLocked ? (
          <form
            onSubmit={sendMessage}
            className="flex gap-2 bg-slate-50 p-1.5 rounded-[1.5rem] border border-slate-100 shadow-inner"
          >
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="TULIS PESAN JURAGAN..."
              className="flex-1 bg-transparent px-4 py-2 text-[11px] font-black outline-none placeholder:text-slate-300"
            />
            <button
              type="submit"
              className="w-10 h-10 bg-teal-600 text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all"
            >
              <Send size={16} />
            </button>
          </form>
        ) : (
          <div className="bg-red-50 p-3 rounded-xl flex items-center justify-center gap-2 text-red-400 border border-red-100">
            <Lock size={14} />
            <p className="text-[9px] font-black">Sesi ditutup otomatis</p>
          </div>
        )}
      </div>
    </div>
  );
};
