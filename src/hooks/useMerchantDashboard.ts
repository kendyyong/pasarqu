import { useState, useEffect, useCallback, useRef } from "react";
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
  const [unreadChat, setUnreadChat] = useState<boolean>(false);

  // 🔊 REF AUDIO
  const alarmRef = useRef<HTMLAudioElement | null>(null);
  const isAudioReady = useRef(false);

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

      if (resProfile.data || resMerchant.data) {
        const effectiveMerchant = {
          ...(resMerchant.data || {}),
          id: resMerchant.data?.id || user.id,
          shop_name: resMerchant.data?.shop_name || resProfile.data?.name || "Toko Saya",
          market_id: resMerchant.data?.market_id || resProfile.data?.managed_market_id,
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
        setOrders((resOrds.data || []).filter((o: any) => o.status !== "COMPLETED" && o.status !== "CANCELLED"));
      }
    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // 🚀 FUNGSI PLAY ALARM (MURNI TANPA BURUNG)
  const playAlarmSafe = useCallback(() => {
    if (!alarmRef.current) return;
    
    // Identitas di Console agar Bos tahu file mana yang bunyi
    console.log("🔊 MERCHANT-HOOK: MEMUTAR /sounds/Alarm.mp3");
    
    alarmRef.current.currentTime = 0;
    alarmRef.current.play().catch(() => {
      console.warn(" MERCHANT-HOOK: Suara diblokir browser. Klik area kosong dulu Bos!");
    });
  }, []);

  const stopAlarm = () => {
    setIncomingOrder(null);
    if (alarmRef.current) alarmRef.current.pause();
  };

  // 🚀 SETUP AUDIO & UNLOCKER
  useEffect(() => {
    // Pakai path lokal Bos
    const audio = new Audio("/sounds/Alarm.mp3");
    audio.preload = "auto";
    alarmRef.current = audio;

    const unlockAudio = () => {
      if (!isAudioReady.current && alarmRef.current) {
        alarmRef.current.play()
          .then(() => {
            alarmRef.current?.pause();
            isAudioReady.current = true;
            console.log("✅ MERCHANT-HOOK: AUDIO UNLOCKED!");
          })
          .catch(() => {});
        window.removeEventListener("click", unlockAudio);
      }
    };

    window.addEventListener("click", unlockAudio);
    return () => window.removeEventListener("click", unlockAudio);
  }, []);

  useEffect(() => {
    fetchBaseData();
  }, [fetchBaseData]);

  // 🚀 RADAR REALTIME
  useEffect(() => {
    if (!merchantProfile?.id || !user?.id) return;

    const channel = supabase
      .channel(`merchant_radar_${merchantProfile.id}`)
      .on(
        "postgres_changes", 
        { event: "INSERT", schema: "public", table: "order_items", filter: `merchant_id=eq.${merchantProfile.id}` }, 
        async (payload: any) => {
           fetchBaseData(); 
           const { data: fullOrder } = await supabase.from("orders").select("*").eq("id", payload.new.order_id).single();
           if (fullOrder) {
               playAlarmSafe(); // <--- Panggil fungsi lokal
               setIncomingOrder(fullOrder); 
           }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        () => fetchBaseData()
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "order_chats", filter: `receiver_id=eq.${user.id}` },
        () => {
           playAlarmSafe(); // <--- Panggil fungsi lokal
           setUnreadChat(true); 
           showToast(`PESAN BARU MASUK!`, "info");
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [merchantProfile?.id, user?.id, fetchBaseData, showToast, playAlarmSafe]); 

  return {
    merchantProfile, products, orders, loading, incomingOrder, unreadChat,
    setUnreadChat, fetchBaseData, stopAlarm, toggleShopStatus: () => {}
  };
};