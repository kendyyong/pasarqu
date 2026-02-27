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

  const fetchBaseData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      // 1. AMBIL DATA PROFIL & MERCHANT
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

        // 2. FETCH PRODUCTS & ORDERS
        // 🚀 Kita tarik data order yang belum selesai/batal agar badge tetap akurat
        const [resProds, resOrds] = await Promise.all([
          supabase.from("products").select("*").eq("merchant_id", effectiveMerchant.id),
          supabase.from("orders")
            .select(`*, order_items!inner(*)`)
            .eq("order_items.merchant_id", effectiveMerchant.id)
            .order("created_at", { ascending: false })
        ]);

        setProducts(resProds.data || []);
        setOrders(resOrds.data || []);
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

  // 🚀 SENSOR REALTIME UNTUK BADGE SIDEBAR
  useEffect(() => {
    if (!merchantProfile?.id) return;

    const channel = supabase
      .channel(`merchant_global_sync_${merchantProfile.id}`)
      // SENSOR 1: Jika ada pesanan baru masuk ke Toko (INSERT)
      .on(
        "postgres_changes", 
        { event: "INSERT", schema: "public", table: "order_items", filter: `merchant_id=eq.${merchantProfile.id}` }, 
        async (payload: any) => {
           const { data: fullOrder } = await supabase.from("orders").select("*").eq("id", payload.new.order_id).single();
           if (fullOrder) {
               setIncomingOrder(fullOrder); // Bunyikan Alarm
               fetchBaseData(); // Update jumlah pesanan di badge
           }
        }
      )
      // 🚀 SENSOR 2: Jika status pesanan berubah (Misal: Pembeli Cancel / UPDATE)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        () => {
          console.log("🔄 Ada perubahan status pesanan, menyelaraskan badge...");
          fetchBaseData(); // Refresh data agar pesanan batal hilang dari hitungan badge
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [merchantProfile?.id, fetchBaseData]); 

  return {
    merchantProfile, products, orders, loading, incomingOrder,
    fetchBaseData, toggleShopStatus, stopAlarm
  };
};