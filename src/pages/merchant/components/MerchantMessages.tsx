import React, { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useAuth } from "../../../contexts/AuthContext";
import {
  MessageSquare,
  User,
  Bike,
  Loader2,
  ChevronRight,
  Power,
  Headset,
  ShieldAlert,
} from "lucide-react";
import { OrderChatRoom } from "../../../components/Chat/OrderChatRoom";
import { useToast } from "../../../contexts/ToastContext";

export const MerchantMessages = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [isServiceActive, setIsServiceActive] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, [user]);

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

  const toggleService = () => {
    const newState = !isServiceActive;
    setIsServiceActive(newState);
    showToast(
      newState ? "Layanan Chat Aktif" : "Layanan Chat Ditutup",
      newState ? "success" : "info",
    );
  };

  if (loading)
    return (
      <div className="p-20 text-center">
        <Loader2 className="animate-spin mx-auto text-teal-600" />
      </div>
    );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-left">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">
            Layanan <span className="text-teal-600">Chat</span>
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Layanan CS & Koordinasi Kurir
          </p>
        </div>
        <button
          onClick={toggleService}
          className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 transition-all shadow-xl ${isServiceActive ? "bg-slate-900 text-white" : "bg-red-500 text-white"}`}
        >
          <Power size={14} />{" "}
          {isServiceActive ? "STATUS: BUKA" : "STATUS: TUTUP"}
        </button>
      </div>

      {!isServiceActive ? (
        <div className="py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 flex flex-col items-center">
          <ShieldAlert size={60} className="text-slate-200 mb-6" />
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
            Layanan Non-Aktif
          </h3>
        </div>
      ) : selectedChat ? (
        <div className="space-y-4">
          <button
            onClick={() => setSelectedChat(null)}
            className="text-[10px] font-black text-teal-600 uppercase tracking-widest flex items-center gap-2 mb-4 hover:bg-teal-50 px-6 py-3 rounded-full transition-all border border-teal-100"
          >
            ← Kembali ke Daftar
          </button>
          <div className="h-[650px] border border-slate-100 rounded-[3rem] overflow-hidden shadow-2xl bg-white">
            <OrderChatRoom
              orderId={selectedChat.orderId}
              receiverName={selectedChat.name}
              chatType={selectedChat.type}
            />
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {conversations.map((order) => (
            <div
              key={order.id}
              className="bg-white p-3 rounded-[3rem] border border-slate-50 shadow-sm"
            >
              <div className="px-8 py-3">
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                  Order #{order.id.slice(0, 8)}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-2">
                <button
                  onClick={() =>
                    setSelectedChat({
                      orderId: order.id,
                      name: order.profiles?.full_name || "Pelanggan",
                      type: "merchant_customer",
                    })
                  }
                  className="p-6 rounded-[2.2rem] bg-slate-50 hover:bg-slate-900 hover:text-white transition-all flex items-center justify-between border border-slate-100 group"
                >
                  <div className="flex items-center gap-4 text-left">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-900 group-hover:bg-teal-500 group-hover:text-white transition-all">
                      <Headset size={24} />
                    </div>
                    <div>
                      <h4 className="font-black text-xs uppercase tracking-tight">
                        {order.profiles?.full_name || "Pelanggan"}
                      </h4>
                      <p className="text-[8px] font-bold uppercase opacity-50">
                        Layanan Pelanggan (CS)
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    size={18}
                    className="opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
                  />
                </button>
                {order.couriers && (
                  <button
                    onClick={() =>
                      setSelectedChat({
                        orderId: order.id,
                        name: order.couriers?.full_name || "Kurir",
                        type: "courier_merchant",
                      })
                    }
                    className="p-6 rounded-[2.2rem] bg-orange-50 hover:bg-orange-500 hover:text-white transition-all flex items-center justify-between border border-orange-100 group"
                  >
                    <div className="flex items-center gap-4 text-left">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-orange-600 group-hover:bg-white group-hover:text-orange-500 transition-all">
                        <Bike size={24} />
                      </div>
                      <div>
                        <h4 className="font-black text-xs uppercase tracking-tight">
                          {order.couriers?.full_name}
                        </h4>
                        <p className="text-[8px] font-bold uppercase opacity-50">
                          Koordinasi Driver
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      size={18}
                      className="opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
                    />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
