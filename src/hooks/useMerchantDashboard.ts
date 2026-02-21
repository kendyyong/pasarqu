import { useState, useEffect } from "react";
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

  const fetchBaseData = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // 1. AMBIL DATA PROFIL & MERCHANT
      const [resProfile, resMerchant] = await Promise.all([
        supabase.from("profiles").select("*, markets:managed_market_id(name)").eq("id", user.id).maybeSingle(),
        supabase.from("merchants").select("*, markets(name)").or(`user_id.eq.${user.id},id.eq.${user.id}`).maybeSingle()
      ]);

      let profile = resProfile.data;
      let merchantData = resMerchant.data;

      // 🚀 ========================================================
      // FITUR PENAMBAL OTOMATIS: AUTO-BIND MARKET ID
      // ========================================================
      const savedMarketId = localStorage.getItem("selected_market_id");
      
      // Jika di tabel merchants market_id-nya KOSONG, tapi di HP ada memori pilihan pasar
      if (merchantData && !merchantData.market_id && savedMarketId) {
        console.log("Menambal market_id otomatis dari memori HP ke Supabase...");
        
        // 1. Update ke Supabase secara diam-diam
        await supabase
          .from("merchants")
          .update({ market_id: savedMarketId })
          .eq("id", merchantData.id);
          
        // 2. Update state lokal agar tidak perlu refresh
        merchantData.market_id = savedMarketId;
        
        // 3. Tarik nama pasarnya sekalian
        const { data: marketDb } = await supabase.from("markets").select("name").eq("id", savedMarketId).maybeSingle();
        if (marketDb) {
           merchantData.markets = { name: marketDb.name };
        }
      }
      // ========================================================

      if (profile || merchantData) {
        // 2. LOGIKA GABUNGAN (SINKRONISASI LOKASI)
        const effectiveMerchant = {
          ...(merchantData || {}),
          id: merchantData?.id || user.id,
          shop_name: merchantData?.shop_name || merchantData?.name || profile?.shop_name || profile?.name || "Toko Saya",
          market_id: merchantData?.market_id || profile?.managed_market_id,
          market_name: merchantData?.markets?.name || profile?.markets?.name || "Muara Jawa",
          is_shop_open: merchantData?.is_shop_open ?? true,
          // FIX: Ambil koordinat dari profile jika di merchant masih kosong agar Sidebar update status
          latitude: merchantData?.latitude || profile?.latitude,
          longitude: merchantData?.longitude || profile?.longitude,
        };

        setMerchantProfile(effectiveMerchant);

        // 3. FETCH PRODUCTS & ORDERS
        try {
            const { data: prods } = await supabase.from("products").select("*").eq("merchant_id", effectiveMerchant.id);
            setProducts(prods || []);
            
            const { data: ords, error: ordErr } = await supabase
                .from("orders")
                .select(`*, order_items!inner(*)`)
                .eq("order_items.merchant_id", effectiveMerchant.id)
                .order("created_at", { ascending: false });
            
            if (!ordErr) setOrders(ords || []);
        } catch (subErr) {
            console.warn("Gagal memuat rincian produk/order:", subErr);
        }

      } else {
        console.warn("⚠️ Profil tidak ditemukan di tabel profiles.");
      }
    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
      showToast("Gagal memuat data dashboard", "error");
    } finally {
      setLoading(false);
    }
  };

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

  const triggerAlarm = (orderData: any) => {
    // Audio otomatis di-handle oleh komponen MerchantAlarmModal
    setIncomingOrder(orderData);
  };

  const stopAlarm = () => {
    setIncomingOrder(null);
  };

  useEffect(() => {
    fetchBaseData();
  }, [user?.id]);

  useEffect(() => {
    if (!merchantProfile?.id) return;

    const channel = supabase
      .channel(`merchant_sync_${merchantProfile.id}`)
      .on(
        "postgres_changes", 
        { event: "UPDATE", schema: "public", table: "merchants", filter: `id=eq.${merchantProfile.id}` }, 
        (payload: any) => {
           setMerchantProfile((prev: any) => ({ ...prev, is_shop_open: payload.new.is_shop_open }));
        }
      )
      .on(
        "postgres_changes", 
        { event: "INSERT", schema: "public", table: "order_items", filter: `merchant_id=eq.${merchantProfile.id}` }, 
        (payload: any) => {
           triggerAlarm(payload.new);
           fetchBaseData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      stopAlarm();
    };
  }, [merchantProfile?.id]); 

  return {
    merchantProfile, products, orders, loading, incomingOrder,
    fetchBaseData, toggleShopStatus, stopAlarm
  };
};