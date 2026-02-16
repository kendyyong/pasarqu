import React, { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useAuth } from "../../../contexts/AuthContext";
import {
  MessageSquare,
  Loader2,
  ChevronRight,
  Headset,
  ShieldAlert,
  Bike,
  ArrowLeft,
} from "lucide-react";
import { OrderChatRoom } from "../../../components/Chat/OrderChatRoom";
import { useToast } from "../../../contexts/ToastContext";

export const MerchantMessages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [isShopOpen, setIsShopOpen] = useState(true);

  // ✅ MONITOR STATUS TOKO SECARA REALTIME
  useEffect(() => {
    if (!user?.id) return;

    const fetchStatus = async () => {
      const { data } = await supabase
        .from("merchants")
        .select("is_shop_open")
        .eq("id", user.id)
        .single();
      if (data) setIsShopOpen(data.is_shop_open);
    };

    fetchStatus();

    const shopSub = supabase
      .channel("chat_sync_final")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "merchants",
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          setIsShopOpen(payload.new.is_shop_open);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(shopSub);
    };
  }, [user]);

  // AMBIL DAFTAR PERCAKAPAN
  useEffect(() => {
    if (user && isShopOpen) fetchConversations();
  }, [user, isShopOpen]);

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(
          `id, status, created_at, profiles:customer_id (full_name), couriers:courier_id (full_name)`,
        )
        .eq("merchant_id", user?.id)
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
      <div className="p-10 text-center flex flex-col items-center gap-3">
        <Loader2 className="animate-spin text-slate-900" size={24} />
      </div>
    );

  // ✅ TAMPILAN JIKA TOKO TUTUP (TIDAK ADA INDIKATOR STATUS LAGI)
  if (!isShopOpen) {
    return (
      <div className="animate-in fade-in duration-500">
        <div className="bg-white p-4 md:p-6 border border-slate-200 mb-4">
          <h1 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tighter leading-none text-left">
            Layanan <span className="text-teal-600">Chat</span>
          </h1>
          <p className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 text-left">
            Koordinasi Pelanggan & Driver
          </p>
        </div>

        <div className="py-24 text-center bg-slate-50 border border-slate-200 flex flex-col items-center">
          <ShieldAlert size={48} className="text-slate-200 mb-4" />
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-tighter">
            Layanan Chat Non-Aktif
          </h3>
          <p className="text-[9px] text-slate-400 font-bold uppercase mt-2 max-w-[220px] leading-tight">
            Toko sedang tutup. Harap buka status toko Anda untuk kembali
            melayani pelanggan.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300 text-left">
      {/* HEADER INTERNAL - BERSIH TANPA STATUS */}
      <div className="bg-white p-4 md:p-6 border border-slate-200">
        <h1 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tighter leading-none">
          Layanan <span className="text-teal-600">Chat</span>
        </h1>
        <p className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
          Koordinasi Pelanggan & Driver
        </p>
      </div>

      {selectedChat ? (
        <div className="space-y-3">
          <button
            onClick={() => setSelectedChat(null)}
            className="text-[9px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 bg-slate-100 px-4 py-2 border border-slate-200"
          >
            <ArrowLeft size={14} /> Kembali
          </button>
          <div className="h-[550px] border border-slate-200 bg-white">
            <OrderChatRoom
              orderId={selectedChat.orderId}
              receiverName={selectedChat.name}
              chatType={selectedChat.type}
            />
          </div>
        </div>
      ) : (
        <div className="grid gap-2">
          {conversations.length > 0 ? (
            conversations.map((order) => (
              <div key={order.id} className="bg-white border border-slate-200">
                <div className="px-4 py-2 border-b border-slate-100 bg-slate-50">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-left">
                    Order #{order.id.slice(0, 8)}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2">
                  <button
                    onClick={() =>
                      setSelectedChat({
                        orderId: order.id,
                        name: order.profiles?.full_name || "Pelanggan",
                        type: "merchant_customer",
                      })
                    }
                    className="p-4 hover:bg-slate-900 hover:text-white transition-all flex items-center justify-between group border-b md:border-b-0 md:border-r border-slate-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-slate-100 rounded-none flex items-center justify-center text-slate-900 group-hover:bg-teal-600 group-hover:text-white">
                        <Headset size={18} />
                      </div>
                      <div className="text-left">
                        <h4 className="font-black text-[10px] uppercase truncate max-w-[120px]">
                          {order.profiles?.full_name || "Pelanggan"}
                        </h4>
                        <p className="text-[7px] font-bold uppercase opacity-50">
                          Buyer (Layanan CS)
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      size={14}
                      className="opacity-20 group-hover:opacity-100"
                    />
                  </button>

                  {order.couriers ? (
                    <button
                      onClick={() =>
                        setSelectedChat({
                          orderId: order.id,
                          name: order.couriers?.full_name || "Kurir",
                          type: "courier_merchant",
                        })
                      }
                      className="p-4 bg-orange-50/20 hover:bg-orange-600 hover:text-white transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-white border border-orange-100 rounded-none flex items-center justify-center text-orange-600 group-hover:bg-white group-hover:text-orange-600">
                          <Bike size={18} />
                        </div>
                        <div className="text-left">
                          <h4 className="font-black text-[10px] uppercase truncate max-w-[120px]">
                            {order.couriers?.full_name}
                          </h4>
                          <p className="text-[7px] font-bold uppercase opacity-60">
                            Koordinasi Driver
                          </p>
                        </div>
                      </div>
                      <ChevronRight
                        size={14}
                        className="opacity-20 group-hover:opacity-100"
                      />
                    </button>
                  ) : (
                    <div className="p-4 bg-slate-50 flex items-center justify-center">
                      <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest">
                        Menunggu Kurir
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center bg-white border border-slate-200">
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                Tidak ada percakapan aktif
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
