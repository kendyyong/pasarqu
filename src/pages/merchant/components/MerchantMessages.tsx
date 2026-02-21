import React, { useState, useEffect, useCallback } from "react";
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
  Search,
  MessageCircle,
} from "lucide-react";
import { OrderChatRoom } from "../../../features/chat/OrderChatRoom";

export const MerchantMessages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [isShopOpen, setIsShopOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // 1. MONITOR STATUS TOKO REALTIME
  useEffect(() => {
    if (!user?.id) return;

    const fetchStatus = async () => {
      const { data } = await supabase
        .from("merchants")
        .select("is_shop_open")
        .eq("id", user.id)
        .maybeSingle();

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

  // 2. AMBIL DAFTAR PERCAKAPAN
  const fetchConversations = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(
          `id, status, created_at, profiles:customer_id (name), couriers:courier_id (name)`,
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
  }, [user?.id]);

  useEffect(() => {
    if (user && isShopOpen) fetchConversations();
  }, [user, isShopOpen, fetchConversations]);

  if (loading)
    return (
      <div className="py-20 text-center flex flex-col items-center gap-4">
        <Loader2 className="animate-spin text-[#008080]" size={32} />
        <p className="font-bold text-[10px] text-slate-400 uppercase tracking-widest">
          Memuat Percakapan...
        </p>
      </div>
    );

  // VIEW: TOKO TUTUP
  if (!isShopOpen) {
    return (
      <div className="w-full animate-in fade-in duration-500 text-left font-sans">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 mb-6">
          <h1 className="text-xl font-bold text-slate-800 uppercase tracking-tight">
            Layanan <span className="text-[#008080]">Chat</span>
          </h1>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-1">
            Koordinasi Pelanggan & Driver
          </p>
        </div>
        <div className="py-24 text-center bg-white border border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center">
          <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
            <ShieldAlert size={32} className="text-orange-500" />
          </div>
          <h3 className="text-[14px] font-bold text-slate-800 uppercase tracking-widest">
            Layanan Chat Non-Aktif
          </h3>
          <p className="text-[11px] text-slate-400 font-medium uppercase mt-2 max-w-[250px] leading-relaxed">
            Toko sedang tutup. Harap buka status toko Anda untuk kembali
            melayani pelanggan.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full animate-in fade-in duration-500 text-left font-sans pb-20">
      {/* HEADER & SEARCH */}
      {!selectedChat && (
        <div className="space-y-6 mb-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-slate-800 uppercase tracking-tight">
                Layanan <span className="text-[#008080]">Chat</span>
              </h1>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-1">
                Koordinasi Pelanggan & Driver
              </p>
            </div>
            <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center text-[#008080]">
              <MessageCircle size={20} />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-2 flex items-center gap-3 shadow-sm focus-within:border-[#008080] transition-all">
            <div className="pl-3 text-slate-400">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="CARI BERDASARKAN NAMA ATAU ID ORDER..."
              className="flex-1 bg-transparent border-none outline-none py-2 text-[12px] font-bold text-slate-700 placeholder:text-slate-300 uppercase"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      )}

      {selectedChat ? (
        <div className="space-y-4 animate-in slide-in-from-right duration-300">
          <button
            onClick={() => setSelectedChat(null)}
            className="group flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-600 uppercase tracking-widest hover:text-[#008080] hover:border-[#008080] transition-all shadow-sm"
          >
            <ArrowLeft
              size={16}
              className="group-hover:-translate-x-1 transition-transform"
            />{" "}
            Kembali ke Daftar
          </button>
          <div className="h-[600px] border border-slate-200 bg-white rounded-[2rem] overflow-hidden shadow-xl">
            <OrderChatRoom
              orderId={selectedChat.orderId}
              receiverName={selectedChat.name}
              chatType={selectedChat.type}
            />
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {conversations.length > 0 ? (
            conversations
              .filter(
                (o) =>
                  o.profiles?.name
                    ?.toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                  o.id.includes(searchQuery),
              )
              .map((order) => (
                <div
                  key={order.id}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:border-[#008080] transition-all"
                >
                  <div className="px-5 py-3 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 font-mono">
                      ORD#{order.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                      {new Date(order.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                    {/* CHAT DENGAN PEMBELI */}
                    <button
                      onClick={() =>
                        setSelectedChat({
                          orderId: order.id,
                          name: order.profiles?.name || "Pelanggan",
                          type: "merchant_customer",
                        })
                      }
                      className="p-5 flex items-center justify-between group hover:bg-teal-50/30 transition-all"
                    >
                      <div className="flex items-center gap-4 text-left">
                        <div className="w-12 h-12 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-[#008080] group-hover:border-[#008080] transition-all shadow-sm">
                          <Headset size={22} />
                        </div>
                        <div>
                          <h4 className="font-bold text-[13px] text-slate-800 uppercase leading-none mb-1.5">
                            {order.profiles?.name || "Pelanggan"}
                          </h4>
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                            Layanan Pelanggan
                          </p>
                        </div>
                      </div>
                      <ChevronRight
                        size={18}
                        className="text-slate-200 group-hover:text-[#008080] transition-transform group-hover:translate-x-1"
                      />
                    </button>

                    {/* CHAT DENGAN KURIR */}
                    {order.couriers ? (
                      <button
                        onClick={() =>
                          setSelectedChat({
                            orderId: order.id,
                            name: order.couriers?.name || "Kurir",
                            type: "courier_merchant",
                          })
                        }
                        className="p-5 flex items-center justify-between group hover:bg-orange-50/30 transition-all"
                      >
                        <div className="flex items-center gap-4 text-left">
                          <div className="w-12 h-12 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-orange-500 group-hover:border-orange-200 transition-all shadow-sm">
                            <Bike size={22} />
                          </div>
                          <div>
                            <h4 className="font-bold text-[13px] text-slate-800 uppercase leading-none mb-1.5">
                              {order.couriers?.name}
                            </h4>
                            <p className="text-[10px] font-semibold text-orange-500 uppercase tracking-widest">
                              Koordinasi Driver
                            </p>
                          </div>
                        </div>
                        <ChevronRight
                          size={18}
                          className="text-slate-200 group-hover:text-orange-500 transition-transform group-hover:translate-x-1"
                        />
                      </button>
                    ) : (
                      <div className="p-5 flex items-center justify-center bg-slate-50/30">
                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">
                          Menunggu Kurir...
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))
          ) : (
            <div className="py-24 text-center bg-white border border-dashed border-slate-200 rounded-[2rem]">
              <MessageSquare
                size={48}
                className="mx-auto text-slate-100 mb-4"
              />
              <p className="text-[12px] font-bold text-slate-300 uppercase tracking-widest">
                Tidak ada percakapan aktif
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
