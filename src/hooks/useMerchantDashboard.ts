import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";

export const useMerchantDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [merchantProfile, setMerchantProfile] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [incomingOrder, setIncomingOrder] = useState<any>(null);
  
  // 🚀 STATE BARU: Notifikasi Chat Belum Terbaca
  const [unreadChat, setUnreadChat] = useState<boolean>(false);

  const fetchBaseData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const [resProfile, resMerchant] = await Promise.all([
        supabase.from("profiles").select("*, markets:managed_market_id(name)").eq("id", user.id).maybeSingle(),
        supabase.from("merchants").select("*, markets(name)").or(`user_id.eq.${user.id},id.eq.${user.id}`).maybeSingle()
      ]);

      let profile = resProfile.data;
      let merchantData = resMerchant.data;

      const savedMarketId = localStorage.getItem("selected_market_id");
      
      if (merchantData && !merchantData.market_id && savedMarketId) {
        await supabase.from("merchants").update({ market_id: savedMarketId }).eq("id", merchantData.id);
        merchantData.market_id = savedMarketId;
        const { data: marketDb } = await supabase.from("markets").select("name").eq("id", savedMarketId).maybeSingle();
        if (marketDb) merchantData.markets = { name: marketDb.name };
      }

      if (profile || merchantData) {
        const effectiveMerchant = {
          ...(merchantData || {}),
          id: merchantData?.id || user.id,
          shop_name: merchantData?.shop_name || merchantData?.name || profile?.shop_name || profile?.name || "Toko Saya",
          market_id: merchantData?.market_id || profile?.managed_market_id,
          market_name: merchantData?.markets?.name || profile?.markets?.name || "Muara Jawa",
          is_shop_open: merchantData?.is_shop_open ?? true,
          latitude: merchantData?.latitude || profile?.latitude,
          longitude: merchantData?.longitude || profile?.longitude,
        };

        setMerchantProfile(effectiveMerchant);

        const [resProds, resOrds] = await Promise.all([
          supabase.from("products").select("*").eq("merchant_id", effectiveMerchant.id),
          supabase.from("orders")
            .select(`*, order_items!inner(*)`)
            .eq("order_items.merchant_id", effectiveMerchant.id)
            .order("created_at", { ascending: false })
        ]);

        setProducts(resProds.data || []);
        
        const activeOrders = (resOrds.data || []).filter((o: any) => 
            o.status !== "COMPLETED" && o.status !== "CANCELLED"
        );
        
        setOrders(activeOrders);
      }
    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const toggleShopStatus = async () => {
    if (!merchantProfile?.id) return;
    const newStatus = !merchantProfile.is_shop_open;
    try {
      const { error } = await supabase.from("merchants").update({ is_shop_open: newStatus }).eq("id", merchantProfile.id);
      if (error) throw error;
      setMerchantProfile((prev: any) => ({ ...prev, is_shop_open: newStatus }));
      showToast(newStatus ? "Toko BUKA" : "Toko TUTUP", "info");
    } catch {
      showToast("Gagal update status", "error");
    }
  };

  const stopAlarm = () => setIncomingOrder(null);

  useEffect(() => {
    fetchBaseData();
  }, [fetchBaseData]);

  // 🚀 SENSOR REALTIME: PESANAN & CHAT
  useEffect(() => {
    if (!merchantProfile?.id) return;

    const channel = supabase
      .channel(`merchant_global_sync_${merchantProfile.id}`)
      // 1. Dengar Pesanan Baru
      .on(
        "postgres_changes", 
        { event: "INSERT", schema: "public", table: "order_items", filter: `merchant_id=eq.${merchantProfile.id}` }, 
        async (payload: any) => {
           fetchBaseData(); 
           const { data: fullOrder } = await supabase.from("orders").select("*").eq("id", payload.new.order_id).single();
           if (fullOrder) setIncomingOrder(fullOrder);
        }
      )
      // 2. Dengar Update Status Pesanan
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        () => { fetchBaseData(); }
      )
      // 3. 🔔 DENGAR CHAT BARU DARI KURIR/CUSTOMER
      .on(
        "postgres_changes",
        { 
          event: "INSERT", 
          schema: "public", 
          table: "order_chats", 
          filter: `receiver_id=eq.${merchantProfile.id}` 
        },
        (payload) => {
           // Bunyikan suara notifikasi "Ting!"
           const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2357/2357-preview.mp3");
           audio.play().catch(() => {});
           
           setUnreadChat(true); // Nyalakan tanda merah di UI
           showToast("ADA PESAN BARU DARI KURIR!", "info");
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [merchantProfile?.id, fetchBaseData]); 

  return {
    merchantProfile, products, orders, loading, incomingOrder, unreadChat,
    setUnreadChat, fetchBaseData, toggleShopStatus, stopAlarm
  };
};