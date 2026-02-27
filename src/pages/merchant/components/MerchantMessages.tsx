import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useAuth } from "../../../contexts/AuthContext";
import { useToast } from "../../../contexts/ToastContext";
import {
  MessageSquare,
  Loader2,
  ChevronRight,
  Headset,
  ShieldAlert,
  Bike,
  ArrowLeft,
  Search,
  Hash,
  Clock,
  Zap,
} from "lucide-react";
import { OrderChatRoom } from "../../../features/chat/OrderChatRoom";

// 🚀 DATABASE TEMPLATE BALASAN CEPAT (PRO VERSION)
const QUICK_REPLIES = {
  merchant_customer: [
    "Halo kak, pesanan sedang kami siapkan ya. Mohon ditunggu! 📦",
    "Stok ready kak, silakan langsung diorder! ✨",
    "Terima kasih sudah belanja di toko kami! 🙏",
    "Mohon maaf kak, stok untuk item ini sedang kosong. 🙏",
  ],
  courier_merchant: [
    "Halo mas kurir, pesanan sudah siap diambil ya! 📦",
    "Tolong hati-hati membawa barangnya ya mas. Terima kasih! 🛵",
    "Mohon tunggu sebentar ya mas, masih proses packing. ⏳",
    "Titik lokasi toko sudah sesuai dengan map ya mas. 📍",
  ],
};

export const MerchantMessages = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [isShopOpen, setIsShopOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL"); // ALL, CUSTOMER, COURIER

  // 1. MONITOR STATUS TOKO REALTIME (AGAR CHAT HANYA AKTIF SAAT BUKA)
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
      .channel("chat_merchant_status_sync")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "merchants",
          filter: `id=eq.${user.id}`,
        },
        (payload) => setIsShopOpen(payload.new.is_shop_open),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(shopSub);
    };
  }, [user]);

  // 2. AMBIL DAFTAR PERCAKAPAN BERDASARKAN ORDER AKTIF
  const fetchConversations = useCallback(async () => {
    if (!user?.id) return;
    try {
      // 🚀 AMBIL DATA PESANAN BESERTA PROFIL PEMBELI & KURIR
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
            id, 
            status, 
            created_at, 
            customer_id,
            courier_id,
            profiles:customer_id (id, full_name, name), 
            couriers:courier_id (id, full_name, name)
        `,
        )
        .eq("merchant_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (err) {
      console.error("Gagal ambil daftar chat:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user && isShopOpen) {
      fetchConversations();
      // Auto refresh list jika ada order baru atau perubahan status
      const chatListSub = supabase
        .channel(`chat_list_merchant_auto_${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "orders",
            filter: `merchant_id=eq.${user.id}`,
          },
          () => fetchConversations(),
        )
        .subscribe();
      return () => {
        supabase.removeChannel(chatListSub);
      };
    }
  }, [user, isShopOpen, fetchConversations]);

  // FUNGSI COPY QUICK REPLY
  const handleQuickReply = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("Teks disalin! Silakan Paste di kolom chat.", "success");
  };

  // 3. LOGIKA FILTER & SEARCH (CARI BERDASARKAN NAMA ATAU NOMOR ORDER)
  const filteredConversations = conversations.filter((o) => {
    const nameCust = (
      o.profiles?.full_name ||
      o.profiles?.name ||
      ""
    ).toLowerCase();
    const nameCour = (
      o.couriers?.full_name ||
      o.couriers?.name ||
      ""
    ).toLowerCase();
    const query = searchQuery.toLowerCase();

    const matchSearch =
      nameCust.includes(query) ||
      nameCour.includes(query) ||
      o.id.includes(query);

    if (activeFilter === "CUSTOMER") return matchSearch && o.customer_id;
    if (activeFilter === "COURIER") return matchSearch && o.courier_id;
    return matchSearch;
  });

  if (loading)
    return (
      <div className="py-20 text-center flex flex-col items-center gap-4 bg-white rounded-xl border border-slate-200">
        <Loader2 className="animate-spin text-[#008080]" size={32} />
        <p className="font-black text-[10px] text-slate-400 uppercase tracking-widest">
          MENYAMBUNGKAN SINYAL CHAT...
        </p>
      </div>
    );

  if (!isShopOpen)
    return (
      <div className="w-full animate-in fade-in duration-500 text-left font-sans">
        <div className="bg-white p-6 rounded-xl border-2 border-slate-200 mb-6 shadow-sm border-b-8 border-red-500">
          <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
            LAYANAN <span className="text-[#008080]">CHAT</span>
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
            SISTEM KOMUNIKASI NON-AKTIF
          </p>
        </div>
        <div className="py-24 text-center bg-white border-2 border-dashed border-red-200 rounded-xl flex flex-col items-center">
          <ShieldAlert size={48} className="text-red-500 mb-4" />
          <h3 className="text-[14px] font-black text-slate-800 uppercase tracking-widest">
            TOKO ANDA SEDANG TUTUP
          </h3>
          <p className="text-[11px] text-slate-500 font-bold uppercase mt-2 max-w-[300px] leading-relaxed">
            BUKA STATUS TOKO ANDA DI HALAMAN DASHBOARD UNTUK DAPAT MENGIRIM DAN
            MENERIMA PESAN DARI KURIR ATAU PEMBELI.
          </p>
        </div>
      </div>
    );

  return (
    <div className="w-full animate-in fade-in duration-500 text-left font-sans font-black uppercase tracking-tighter h-[calc(100vh-120px)] flex flex-col">
      {/* 🟢 HEADER GAHAR DENGAN FILTER */}
      <div className="bg-white p-6 rounded-t-xl border-2 border-b-0 border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm shrink-0">
        <div>
          <h1 className="text-2xl text-slate-800 leading-none flex items-center gap-2">
            <MessageSquare className="text-[#008080]" size={24} /> MESSAGE
            CENTER
          </h1>
          <p className="text-[10px] text-slate-400 mt-1 tracking-widest">
            KOMUNIKASI REAL-TIME PASARQU
          </p>
        </div>
        <div className="flex bg-slate-100 border-2 border-slate-200 rounded-lg p-1 w-full md:w-auto">
          {["ALL", "CUSTOMER", "COURIER"].map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`flex-1 md:flex-none px-4 py-2 text-[10px] rounded-md transition-all ${activeFilter === f ? "bg-slate-900 text-white shadow-md" : "text-slate-400"}`}
            >
              {f === "ALL" ? "SEMUA" : f === "CUSTOMER" ? "PEMBELI" : "KURIR"}
            </button>
          ))}
        </div>
      </div>

      {/* 🔵 LAYOUT DUA KOLOM */}
      <div className="flex-1 flex flex-col lg:flex-row border-2 border-slate-200 rounded-b-xl overflow-hidden bg-white shadow-sm h-full">
        {/* KOLOM KIRI: DAFTAR KONTAK */}
        <div
          className={`w-full lg:w-[35%] flex flex-col border-r-2 border-slate-100 bg-slate-50 ${selectedChat ? "hidden lg:flex" : "flex"}`}
        >
          <div className="p-4 bg-white border-b-2 border-slate-100 shrink-0">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={14}
              />
              <input
                type="text"
                placeholder="CARI NAMA / ID..."
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-lg pl-9 pr-4 py-2.5 text-[11px] outline-none focus:border-[#008080] transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-2">
            {filteredConversations.length === 0 ? (
              <div className="py-10 text-center opacity-30">
                <MessageSquare size={32} className="mx-auto mb-2" />
                <p className="text-[10px]">TIDAK ADA PERCAKAPAN</p>
              </div>
            ) : (
              filteredConversations.map((order) => (
                <div key={order.id} className="space-y-1">
                  {/* CHAT DENGAN PEMBELI */}
                  {(activeFilter === "ALL" || activeFilter === "CUSTOMER") &&
                    order.customer_id && (
                      <button
                        onClick={() =>
                          setSelectedChat({
                            orderId: order.id,
                            name:
                              order.profiles?.full_name ||
                              order.profiles?.name ||
                              "PEMBELI",
                            partnerId: order.customer_id, // 🚀 UUID MANUSIA
                            type: "merchant_customer",
                            status: order.status,
                            date: order.created_at,
                          })
                        }
                        className={`w-full text-left p-3 rounded-xl border-2 transition-all flex items-center gap-3 ${selectedChat?.partnerId === order.customer_id && selectedChat?.orderId === order.id ? "bg-teal-50 border-[#008080] shadow-sm" : "bg-white border-slate-100 hover:border-slate-300"}`}
                      >
                        <div className="w-10 h-10 rounded-lg bg-teal-50 text-[#008080] flex items-center justify-center shrink-0 border border-teal-100">
                          <Headset size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[12px] text-slate-900 truncate">
                            {order.profiles?.full_name || "PEMBELI"}
                          </h4>
                          <p className="text-[9px] text-slate-400 tracking-widest mt-1">
                            ORD#{order.id.slice(0, 8)}
                          </p>
                        </div>
                        <ChevronRight size={14} className="text-slate-300" />
                      </button>
                    )}

                  {/* CHAT DENGAN KURIR */}
                  {(activeFilter === "ALL" || activeFilter === "COURIER") &&
                    order.courier_id && (
                      <button
                        onClick={() =>
                          setSelectedChat({
                            orderId: order.id,
                            name:
                              order.couriers?.full_name ||
                              order.couriers?.name ||
                              "KURIR",
                            partnerId: order.courier_id, // 🚀 UUID MANUSIA
                            type: "courier_merchant",
                            status: order.status,
                            date: order.created_at,
                          })
                        }
                        className={`w-full text-left p-3 rounded-xl border-2 transition-all flex items-center gap-3 ${selectedChat?.partnerId === order.courier_id && selectedChat?.orderId === order.id ? "bg-orange-50 border-[#FF6600] shadow-sm" : "bg-white border-slate-100 hover:border-slate-300"}`}
                      >
                        <div className="w-10 h-10 rounded-lg bg-orange-50 text-[#FF6600] flex items-center justify-center shrink-0 border border-orange-100">
                          <Bike size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[12px] text-slate-900 truncate">
                            {order.couriers?.full_name || "KURIR"}
                          </h4>
                          <p className="text-[9px] text-orange-400 tracking-widest mt-1">
                            KURIR • #{order.id.slice(0, 8)}
                          </p>
                        </div>
                        <ChevronRight size={14} className="text-slate-300" />
                      </button>
                    )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* KOLOM KANAN: RUANG CHAT AKTIF */}
        <div
          className={`flex-1 flex flex-col bg-white ${!selectedChat ? "hidden lg:flex items-center justify-center" : "flex"}`}
        >
          {!selectedChat ? (
            <div className="text-center opacity-20">
              <MessageSquare size={64} className="mx-auto mb-4" />
              <p className="text-[12px] tracking-widest">
                PILIH PESAN UNTUK MEMULAI
              </p>
            </div>
          ) : (
            <>
              {/* Header Ruang Chat */}
              <div className="bg-slate-900 text-white p-4 shrink-0 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedChat(null)}
                    className="lg:hidden p-2 bg-white/10 rounded-md hover:bg-white/20 transition-all"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <div>
                    <h3 className="text-[14px] leading-none flex items-center gap-2">
                      {selectedChat.type === "merchant_customer" ? (
                        <Headset size={14} className="text-[#008080]" />
                      ) : (
                        <Bike size={14} className="text-[#FF6600]" />
                      )}
                      {selectedChat.name}
                    </h3>
                    <p className="text-[9px] text-white/40 tracking-widest mt-1.5 uppercase flex items-center gap-2">
                      <Hash size={10} /> ORD#{selectedChat.orderId.slice(0, 8)}
                      <span className="text-white/10">|</span>
                      <Clock size={10} />{" "}
                      {new Date(selectedChat.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div
                  className={`px-3 py-1 rounded-md text-[9px] border font-black ${selectedChat.status === "COMPLETED" ? "bg-green-500/20 border-green-500 text-green-500" : "bg-[#FF6600]/20 border-[#FF6600] text-[#FF6600]"}`}
                >
                  {selectedChat.status}
                </div>
              </div>

              {/* 🚀 QUICK REPLIES BAR */}
              <div className="bg-slate-50 border-b-2 border-slate-100 p-2 overflow-x-auto no-scrollbar flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1 text-[9px] text-[#008080] font-black shrink-0 px-2">
                  <Zap size={12} className="animate-pulse" /> QUICK REPLY:
                </div>
                {QUICK_REPLIES[
                  selectedChat.type as keyof typeof QUICK_REPLIES
                ]?.map((reply, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickReply(reply)}
                    className="shrink-0 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] text-slate-600 hover:border-[#008080] hover:text-[#008080] transition-all active:scale-95"
                  >
                    {reply}
                  </button>
                ))}
              </div>

              {/* RUANG PESAN REAL-TIME */}
              <div className="flex-1 relative overflow-hidden bg-white">
                <OrderChatRoom
                  orderId={selectedChat.orderId}
                  receiverId={selectedChat.partnerId} // 🚀 PENGIRIMAN ID PASANGAN CHAT
                  receiverName={selectedChat.name}
                  chatType={selectedChat.type}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MerchantMessages;
