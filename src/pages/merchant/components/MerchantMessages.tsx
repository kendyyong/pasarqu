import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useAuth } from "../../../contexts/AuthContext";
import { useToast } from "../../../contexts/ToastContext"; // 🚀 Perlu untuk notifikasi Copy
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
  Hash,
  Clock,
  Zap, // 🚀 Icon kilat untuk Quick Reply
} from "lucide-react";
import { OrderChatRoom } from "../../../features/chat/OrderChatRoom";

// 🚀 DATABASE TEMPLATE BALASAN CEPAT
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
    "Mohon ditunggu sekitar 5 menit ya mas, masih proses packing. ⏳",
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

  // 🚀 3. KABEL REAL-TIME: AUTO-UPDATE DAFTAR KONTAK CHAT
  useEffect(() => {
    if (user && isShopOpen) {
      fetchConversations();

      const chatListSub = supabase
        .channel(`chat_list_sync_${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "orders",
            filter: `merchant_id=eq.${user.id}`,
          },
          () => {
            fetchConversations();
          },
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
    showToast("Teks disalin! Silakan Paste di kolom chat bawah.", "success");
  };

  // FILTER LOGIC
  const filteredConversations = conversations.filter((o) => {
    const matchSearch =
      o.profiles?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.id.includes(searchQuery);
    return matchSearch;
  });

  if (loading)
    return (
      <div className="py-20 text-center flex flex-col items-center gap-4 bg-white rounded-xl border border-slate-200">
        <Loader2 className="animate-spin text-[#008080]" size={32} />
        <p className="font-black text-[10px] text-slate-400 uppercase tracking-widest">
          MEMUAT PERCAKAPAN...
        </p>
      </div>
    );

  // VIEW: TOKO TUTUP
  if (!isShopOpen) {
    return (
      <div className="w-full animate-in fade-in duration-500 text-left font-sans">
        <div className="bg-white p-6 rounded-xl border-2 border-slate-200 mb-6 shadow-sm border-b-8 border-red-500">
          <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
            LAYANAN <span className="text-[#008080]">CHAT</span>
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
            KOORDINASI PELANGGAN & DRIVER
          </p>
        </div>
        <div className="py-24 text-center bg-white border-2 border-dashed border-red-200 rounded-xl flex flex-col items-center opacity-80">
          <div className="w-16 h-16 bg-red-50 rounded-xl flex items-center justify-center mb-4">
            <ShieldAlert size={32} className="text-red-500" />
          </div>
          <h3 className="text-[14px] font-black text-slate-800 uppercase tracking-widest">
            LAYANAN CHAT NON-AKTIF
          </h3>
          <p className="text-[11px] text-slate-500 font-bold uppercase mt-2 max-w-[300px] leading-relaxed">
            TOKO SEDANG TUTUP. HARAP BUKA STATUS TOKO ANDA UNTUK KEMBALI
            MELAYANI PELANGGAN.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full animate-in fade-in duration-500 text-left font-sans font-black uppercase tracking-tighter h-[calc(100vh-100px)] flex flex-col">
      {/* 🟢 HEADER GAHAR */}
      <div className="bg-white p-6 rounded-t-xl border-2 border-b-0 border-slate-200 flex justify-between items-center shadow-sm shrink-0">
        <div>
          <h1 className="text-2xl text-slate-800 leading-none flex items-center gap-2">
            <MessageSquare className="text-[#008080]" size={24} /> MESSAGE
            CENTER
          </h1>
          <p className="text-[10px] text-slate-400 mt-1 tracking-widest">
            FAST RESPON TINGKATKAN PENJUALAN
          </p>
        </div>
        <div className="flex bg-slate-50 border-2 border-slate-100 rounded-lg p-1">
          <button
            onClick={() => setActiveFilter("ALL")}
            className={`px-4 py-2 text-[10px] rounded-md transition-all ${activeFilter === "ALL" ? "bg-slate-900 text-white" : "text-slate-400"}`}
          >
            SEMUA
          </button>
          <button
            onClick={() => setActiveFilter("CUSTOMER")}
            className={`px-4 py-2 text-[10px] rounded-md transition-all ${activeFilter === "CUSTOMER" ? "bg-[#008080] text-white" : "text-slate-400"}`}
          >
            PEMBELI
          </button>
          <button
            onClick={() => setActiveFilter("COURIER")}
            className={`px-4 py-2 text-[10px] rounded-md transition-all ${activeFilter === "COURIER" ? "bg-[#FF6600] text-white" : "text-slate-400"}`}
          >
            KURIR
          </button>
        </div>
      </div>

      {/* 🔵 SPLIT SCREEN LAYOUT */}
      <div className="flex-1 flex flex-col lg:flex-row border-2 border-slate-200 rounded-b-xl overflow-hidden bg-white shadow-sm h-full">
        {/* KOLOM KIRI: DAFTAR CHAT */}
        <div
          className={`w-full lg:w-[35%] flex flex-col border-r-2 border-slate-100 bg-slate-50 ${selectedChat ? "hidden lg:flex" : "flex"}`}
        >
          {/* Search Bar Kolom Kiri */}
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

          {/* List Percakapan */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-2">
            {filteredConversations.length === 0 ? (
              <div className="py-10 text-center text-slate-400 opacity-70">
                <MessageCircle size={32} className="mx-auto mb-2" />
                <p className="text-[10px] tracking-widest">KOSONG</p>
              </div>
            ) : (
              filteredConversations.map((order) => (
                <React.Fragment key={order.id}>
                  {/* CHAT PEMBELI */}
                  {(activeFilter === "ALL" || activeFilter === "CUSTOMER") && (
                    <button
                      onClick={() =>
                        setSelectedChat({
                          orderId: order.id,
                          name: order.profiles?.name || "Pelanggan",
                          type: "merchant_customer",
                          orderStatus: order.status,
                          date: order.created_at,
                        })
                      }
                      className={`w-full text-left p-3 rounded-xl border-2 transition-all flex items-center gap-3 ${selectedChat?.orderId === order.id && selectedChat?.type === "merchant_customer" ? "bg-teal-50 border-[#008080] shadow-sm" : "bg-white border-slate-100 hover:border-[#008080]/50"}`}
                    >
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${selectedChat?.orderId === order.id && selectedChat?.type === "merchant_customer" ? "bg-[#008080] text-white border-[#008080]" : "bg-slate-50 text-slate-500 border-slate-200"}`}
                      >
                        <Headset size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[12px] text-slate-900 leading-none truncate">
                          {order.profiles?.name || "PELANGGAN"}
                        </h4>
                        <p className="text-[9px] text-[#008080] mt-1 tracking-widest truncate">
                          ORD#{order.id.slice(0, 8)}
                        </p>
                      </div>
                      <ChevronRight
                        size={14}
                        className="text-slate-300 shrink-0"
                      />
                    </button>
                  )}

                  {/* CHAT KURIR */}
                  {order.couriers &&
                    (activeFilter === "ALL" || activeFilter === "COURIER") && (
                      <button
                        onClick={() =>
                          setSelectedChat({
                            orderId: order.id,
                            name: order.couriers?.name || "Kurir",
                            type: "courier_merchant",
                            orderStatus: order.status,
                            date: order.created_at,
                          })
                        }
                        className={`w-full text-left p-3 rounded-xl border-2 transition-all flex items-center gap-3 ${selectedChat?.orderId === order.id && selectedChat?.type === "courier_merchant" ? "bg-orange-50 border-[#FF6600] shadow-sm" : "bg-white border-slate-100 hover:border-[#FF6600]/50"}`}
                      >
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${selectedChat?.orderId === order.id && selectedChat?.type === "courier_merchant" ? "bg-[#FF6600] text-white border-[#FF6600]" : "bg-slate-50 text-slate-500 border-slate-200"}`}
                        >
                          <Bike size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[12px] text-slate-900 leading-none truncate">
                            {order.couriers?.name}
                          </h4>
                          <p className="text-[9px] text-[#FF6600] mt-1 tracking-widest truncate">
                            KURIR • ORD#{order.id.slice(0, 8)}
                          </p>
                        </div>
                        <ChevronRight
                          size={14}
                          className="text-slate-300 shrink-0"
                        />
                      </button>
                    )}
                </React.Fragment>
              ))
            )}
          </div>
        </div>

        {/* KOLOM KANAN: RUANG OBROLAN */}
        <div
          className={`flex-1 flex flex-col bg-white ${!selectedChat ? "hidden lg:flex items-center justify-center" : "flex"}`}
        >
          {!selectedChat ? (
            <div className="text-center opacity-50">
              <MessageSquare
                size={64}
                className="mx-auto text-slate-300 mb-4"
              />
              <p className="text-[12px] text-slate-400 tracking-widest">
                PILIH PESAN DI SAMPING UNTUK MEMULAI
              </p>
            </div>
          ) : (
            <>
              {/* Context Header untuk Chat Aktif */}
              <div className="bg-slate-900 text-white p-4 shrink-0 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedChat(null)}
                    className="lg:hidden p-2 bg-white/10 rounded-md hover:bg-white/20"
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
                    <p className="text-[9px] text-white/50 tracking-widest mt-1.5 flex items-center gap-2">
                      <Hash size={10} /> ORD#{selectedChat.orderId.slice(0, 8)}
                      <span className="text-white/20">|</span>
                      <Clock size={10} />{" "}
                      {new Date(selectedChat.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div
                  className={`px-3 py-1 rounded-md text-[9px] tracking-widest border ${selectedChat.orderStatus === "PAID" ? "bg-[#008080]/20 border-[#008080] text-[#008080]" : "bg-white/10 border-white/20 text-white/70"}`}
                >
                  {selectedChat.orderStatus}
                </div>
              </div>

              {/* 🚀 QUICK REPLIES BAR (BARU) */}
              <div className="bg-slate-50 border-b-2 border-slate-100 p-2 overflow-x-auto no-scrollbar flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1 text-[9px] text-[#FF6600] font-black shrink-0 px-2">
                  <Zap size={12} className="animate-pulse" /> QUICK REPLY:
                </div>
                {QUICK_REPLIES[
                  selectedChat.type as keyof typeof QUICK_REPLIES
                ]?.map((reply, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickReply(reply)}
                    className="shrink-0 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] text-slate-600 hover:border-[#008080] hover:text-[#008080] hover:shadow-sm transition-all active:scale-95"
                  >
                    {reply}
                  </button>
                ))}
              </div>

              {/* Komponen Chat Asli */}
              <div className="flex-1 relative overflow-hidden bg-white">
                <OrderChatRoom
                  orderId={selectedChat.orderId}
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
