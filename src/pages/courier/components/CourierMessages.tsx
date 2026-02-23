import React, { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useAuth } from "../../../contexts/AuthContext";
import {
  MessageSquare,
  User,
  Loader2,
  ChevronRight,
  Store,
  ArrowLeft,
} from "lucide-react";
import { OrderChatRoom } from "../../../features/chat/OrderChatRoom";

export const CourierMessages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState<any>(null);

  useEffect(() => {
    fetchConversations();
  }, [user]);

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          id, 
          status,
          profiles:customer_id (full_name),
          merchants:merchant_id (shop_name)
        `,
        )
        .eq("courier_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-20 flex justify-center items-center">
        <Loader2 className="animate-spin text-[#008080]" size={36} />
      </div>
    );
  }

  // 🚀 RENDER HALAMAN CHAT AKTIF (FULL SCREEN OVERLAY)
  if (selectedChat) {
    return (
      <div className="fixed inset-0 z-[200] flex justify-center bg-white md:bg-slate-900/80 backdrop-blur-sm">
        <div className="w-full max-w-[480px] h-[100dvh] bg-white flex flex-col shadow-2xl relative animate-in slide-in-from-right-8 duration-300">
          {/* HEADER CHAT */}
          <div className="bg-[#008080] text-white p-4 flex items-center gap-3 shrink-0 shadow-md relative z-10 pt-safe">
            <button
              onClick={() => setSelectedChat(null)}
              className="p-2 hover:bg-teal-700 rounded-full transition-all active:scale-90"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="flex-1 min-w-0">
              <h2 className="font-[1000] text-[14px] uppercase truncate leading-none">
                {selectedChat.name}
              </h2>
              <p className="text-[10px] text-teal-200 uppercase tracking-widest mt-1 truncate">
                {selectedChat.type === "courier_customer"
                  ? "PELANGGAN PASARQU"
                  : "MERCHANT PASARQU"}
              </p>
            </div>
          </div>

          {/* KONTEN CHAT ROOM */}
          <div className="flex-1 relative bg-slate-50 overflow-hidden flex flex-col">
            <OrderChatRoom
              orderId={selectedChat.orderId}
              receiverName={selectedChat.name}
              chatType={selectedChat.type}
            />
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER DAFTAR PERCAKAPAN (LIST VIEW) ---
  return (
    <div className="w-full animate-in fade-in duration-500 text-left font-black uppercase tracking-tighter not-italic text-[12px]">
      <div className="flex items-center gap-2 mb-6 border-b-2 border-slate-200 pb-3 px-1">
        <MessageSquare size={20} className="text-[#008080]" />
        <h1 className="text-[18px] text-slate-800">PUSAT PESAN</h1>
      </div>

      <div className="space-y-4">
        {conversations.length === 0 ? (
          <div className="py-16 text-center bg-slate-50 rounded-md border-2 border-dashed border-slate-200 flex flex-col items-center">
            <MessageSquare size={40} className="text-slate-300 mb-4" />
            <p className="text-[11px] text-slate-400 tracking-widest">
              BELUM ADA TUGAS / PERCAKAPAN AKTIF
            </p>
          </div>
        ) : (
          conversations.map((order) => (
            <div
              key={order.id}
              className="bg-white p-5 rounded-md border border-slate-200 shadow-sm relative overflow-hidden group"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-300"></div>

              <div className="mb-4 pl-2">
                <p className="text-[10px] text-slate-400 tracking-[0.2em] leading-none">
                  ORDER ID:{" "}
                  <span className="text-slate-800">
                    #{order.id.slice(0, 8)}
                  </span>
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-2">
                {/* Chat dengan Pelanggan */}
                <button
                  onClick={() =>
                    setSelectedChat({
                      orderId: order.id,
                      name: order.profiles?.full_name || "Pelanggan",
                      type: "courier_customer",
                    })
                  }
                  className="bg-slate-50 p-4 rounded-md border border-slate-200 hover:border-[#008080] transition-colors flex items-center justify-between group active:scale-95 w-full"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 shrink-0 bg-white text-[#008080] rounded-md flex items-center justify-center border border-slate-200 shadow-sm">
                      <User size={20} />
                    </div>
                    <div className="text-left min-w-0">
                      <h4 className="font-[1000] text-slate-800 text-[12px] truncate leading-none mb-1">
                        {order.profiles?.full_name || "PELANGGAN"}
                      </h4>
                      <p className="text-[9px] text-slate-500 tracking-widest truncate">
                        OBROLAN ANTAR (CUSTOMER)
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    size={18}
                    className="text-slate-400 shrink-0 ml-2"
                  />
                </button>

                {/* Chat dengan Merchant */}
                <button
                  onClick={() =>
                    setSelectedChat({
                      orderId: order.id,
                      name: order.merchants?.shop_name || "Toko",
                      type: "courier_merchant",
                    })
                  }
                  className="bg-slate-50 p-4 rounded-md border border-slate-200 hover:border-[#FF6600] transition-colors flex items-center justify-between group active:scale-95 w-full"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 shrink-0 bg-white text-[#FF6600] rounded-md flex items-center justify-center border border-slate-200 shadow-sm">
                      <Store size={20} />
                    </div>
                    <div className="text-left min-w-0">
                      <h4 className="font-[1000] text-slate-800 text-[12px] truncate leading-none mb-1">
                        {order.merchants?.shop_name || "TOKO PASARQU"}
                      </h4>
                      <p className="text-[9px] text-slate-500 tracking-widest truncate">
                        OBROLAN JEMPUT (MERCHANT)
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    size={18}
                    className="text-slate-400 shrink-0 ml-2"
                  />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
