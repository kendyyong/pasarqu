import { useState, useEffect, useRef } from "react";
// PERBAIKAN 1: Jalur import disesuaikan (cukup mundur 1 folder dari src/hooks)
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";

// --- LINK SUARA ALARM ---
const ALARM_URL = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";

export const useMerchantDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [merchantProfile, setMerchantProfile] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [incomingOrder, setIncomingOrder] = useState<any>(null);
  
  // Audio Ref
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Init Audio
  useEffect(() => {
    audioRef.current = new Audio(ALARM_URL);
    audioRef.current.loop = true;
  }, []);

  // Fetch Data Utama
  const fetchBaseData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // 1. Get Profile & Market Name
      const { data: profile } = await supabase
        .from("profiles")
        .select("*, markets:managed_market_id(name)")
        .eq("id", user.id)
        .single();
        
      // 2. Get Merchant Data (jika ada)
      let { data: merchantData } = await supabase
        .from("merchants")
        .select("*, markets(name)")
        .or(`user_id.eq.${user.id},id.eq.${user.id}`)
        .maybeSingle();

      if (profile?.is_verified) {
        // Gabungkan data profil & merchant agar lengkap
        const effectiveMerchant = {
          ...(merchantData || {}),
          id: merchantData?.id || user.id,
          shop_name: merchantData?.shop_name || profile.shop_name || profile.name || "Toko Saya",
          market_id: merchantData?.market_id || profile.managed_market_id,
          latitude: merchantData?.latitude || profile.latitude,
          longitude: merchantData?.longitude || profile.longitude,
          is_shop_open: merchantData?.is_shop_open ?? true,
          market_name: merchantData?.markets?.name || profile.markets?.name || "Muara Jawa",
        };

        setMerchantProfile(effectiveMerchant);

        // 3. Fetch Products & Orders Parallel
        const [resProducts, resOrders] = await Promise.all([
          supabase.from("products").select("*").eq("merchant_id", effectiveMerchant.id),
          supabase.from("orders").select("*").eq("market_id", effectiveMerchant.market_id).order("created_at", { ascending: false }),
        ]);

        setProducts(resProducts.data || []);
        setOrders(resOrders.data || []);
      } else {
        setMerchantProfile(null);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle Status Toko (Buka/Tutup)
  const toggleShopStatus = async () => {
    if (!merchantProfile) return;
    const newStatus = !merchantProfile.is_shop_open;

    try {
      await supabase.from("merchants").update({ is_shop_open: newStatus }).eq("id", merchantProfile.id);
      setMerchantProfile((prev: any) => ({ ...prev, is_shop_open: newStatus }));
      showToast(newStatus ? "Toko BUKA" : "Toko TUTUP", "info");
    } catch {
      showToast("Gagal update status", "error");
    }
  };

  // Alarm Control
  const triggerAlarm = (orderData: any) => {
    setIncomingOrder(orderData);
    audioRef.current?.play().catch((e) => console.log("Audio Blocked:", e));
  };

  const stopAlarm = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIncomingOrder(null);
  };

  // Realtime Listener
  useEffect(() => {
    fetchBaseData();
    if (!user) return;
  }, [user]);

  // Listener Terpisah agar tidak re-subscribe terus
  useEffect(() => {
    if (!merchantProfile?.id) return;

    const channel = supabase
      .channel("merchant_dashboard_realtime")
      .on(
        "postgres_changes", 
        { event: "UPDATE", schema: "public", table: "merchants", filter: `id=eq.${merchantProfile.id}` }, 
        // PERBAIKAN 2: Tambahkan tipe ': any' pada payload
        (payload: any) => {
           setMerchantProfile((prev: any) => ({ ...prev, is_shop_open: payload.new.is_shop_open }));
        }
      )
      .on(
        "postgres_changes", 
        { event: "INSERT", schema: "public", table: "order_items", filter: `merchant_id=eq.${merchantProfile.id}` }, 
        // PERBAIKAN 2: Tambahkan tipe ': any' pada payload
        (payload: any) => {
           console.log("ALARM TRIGGERED!", payload);
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
    merchantProfile,
    products,
    orders,
    loading,
    incomingOrder,
    fetchBaseData,
    toggleShopStatus,
    stopAlarm
  };
};