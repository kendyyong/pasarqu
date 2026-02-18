import React, { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useAuth } from "../../../contexts/AuthContext";
import {
  MessageSquare,
  User,
  Clock,
  Loader2,
  ChevronRight,
  Store,
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
      // Ambil daftar order yang melibatkan kurir ini
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

  if (loading)
    return (
      <div className="p-20 text-center">
        <Loader2 className="animate-spin mx-auto text-teal-600" />
      </div>
    );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-left">
      <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">
        Pusat Pesan
      </h1>

      {selectedChat ? (
        <div className="space-y-4">
          <button
            onClick={() => setSelectedChat(null)}
            className="text-[10px] font-black text-teal-600 uppercase tracking-widest flex items-center gap-2 mb-4 hover:opacity-70"
          >
            ← Kembali ke Daftar
          </button>

          <div className="h-[600px] border border-slate-100 rounded-[3rem] overflow-hidden shadow-2xl">
            {/* PERBAIKAN: Menambahkan properti chatType yang wajib */}
            <OrderChatRoom
              orderId={selectedChat.orderId}
              receiverName={selectedChat.name}
              chatType={selectedChat.type}
            />
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {conversations.length === 0 ? (
            <div className="p-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
              <MessageSquare
                size={40}
                className="text-slate-200 mx-auto mb-4"
              />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Belum ada percakapan
              </p>
            </div>
          ) : (
            conversations.map((order) => (
              <div key={order.id} className="space-y-2">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">
                  Order #{order.id.slice(0, 8)}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {/* Chat dengan Pelanggan */}
                  <button
                    onClick={() =>
                      setSelectedChat({
                        orderId: order.id,
                        name: order.profiles?.full_name || "Pelanggan",
                        type: "courier_customer",
                      })
                    }
                    className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center">
                        <User size={20} />
                      </div>
                      <div className="text-left">
                        <h4 className="font-black text-slate-800 text-xs uppercase">
                          {order.profiles?.full_name || "Pelanggan"}
                        </h4>
                        <p className="text-[8px] font-bold text-slate-400 uppercase">
                          Obrolan Antar Pesanan
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-slate-300" />
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
                    className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
                        <Store size={20} />
                      </div>
                      <div className="text-left">
                        <h4 className="font-black text-slate-800 text-xs uppercase">
                          {order.merchants?.shop_name || "Toko"}
                        </h4>
                        <p className="text-[8px] font-bold text-slate-400 uppercase">
                          Koordinasi Penjemputan
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-slate-300" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
