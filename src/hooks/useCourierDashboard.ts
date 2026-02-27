import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabaseClient"; 
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext"; 
import { useNavigate } from "react-router-dom"; 

export const useCourierDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  
  const [courierData, setCourierData] = useState<any>(null);
  const [activeOrder, setActiveOrder] = useState<any>(null); 
  const [availableOrders, setAvailableOrders] = useState<any[]>([]); 
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);

  // 🔊 REF AUDIO & UNLOCKER (AGAR ALARM BUNYI DI HP)
  const alarmRef = useRef<HTMLAudioElement | null>(null);
  const isAudioReady = useRef(false);

  // SETUP ALARM SAAT PERTAMA KALI BUKA
  useEffect(() => {
    const audio = new Audio("/sounds/Alarm.mp3");
    audio.preload = "auto";
    alarmRef.current = audio;

    const unlockAudio = () => {
      if (!isAudioReady.current && alarmRef.current) {
        alarmRef.current.play().then(() => {
          alarmRef.current?.pause();
          alarmRef.current!.currentTime = 0;
          isAudioReady.current = true;
          console.log("✅ ALARM KURIR SIAP BUNYI!");
        }).catch(() => {});
        window.removeEventListener("click", unlockAudio);
        window.removeEventListener("touchstart", unlockAudio);
      }
    };

    window.addEventListener("click", unlockAudio);
    window.addEventListener("touchstart", unlockAudio);

    return () => {
      window.removeEventListener("click", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
    };
  }, []);

  // FUNGSI AMBIL DATA
  const fetchInitialData = useCallback(async () => {
    if (!user?.id) return;
    try {
      // 1. AMBIL PROFILE KURIR
      const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single();

      if (profileData) {
        let finalProfile = { ...profileData };
        if (profileData.market_id) {
          const { data: marketData } = await supabase.from("markets").select("name").eq("id", profileData.market_id).maybeSingle();
          if (marketData) finalProfile.markets = { name: marketData.name };
        }

        setCourierData(finalProfile);
        setIsOnline(profileData.is_active || false);
        if (profileData.latitude) setCurrentCoords({ lat: profileData.latitude, lng: profileData.longitude });

        // 2. AMBIL TUGAS DI RADAR (SEARCHING FOR NEW JOBS)
        if (profileData.market_id) {
          const { data: radarOrders } = await supabase
            .from("orders")
            .select(`
                *, 
                profiles:customer_id(name, full_name),
                order_items(
                    merchants:merchant_id(id, shop_name, address, latitude, longitude)
                )
            `)
            .eq("market_id", profileData.market_id)
            .eq("status", "READY_TO_PICKUP")
            .is("courier_id", null)
            .order("created_at", { ascending: false });
          
          // Memastikan data merchant muncul di radar
          const mappedRadar = (radarOrders || []).map(o => ({
              ...o,
              merchants: o.order_items?.[0]?.merchants
          }));
          setAvailableOrders(mappedRadar);
        }
      }

      // 3. AMBIL TRANSAKSI WALLET
      const { data: logs } = await supabase.from("wallet_logs").select("*").eq("profile_id", user.id).order("created_at", { ascending: false }).limit(20);
      if (logs) setTransactions(logs);

      // 4. AMBIL PESANAN AKTIF (LOGIKA SAPU JAGAT UNTUK KOORDINAT)
      const { data: orderData } = await supabase
        .from("orders")
        .select(`
          *,
          profiles:customer_id(*),
          order_items (
            merchant_id,
            merchants:merchant_id (id, shop_name, address, latitude, longitude)
          )
        `)
        .eq("courier_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (orderData && orderData.length > 0) {
        const ord = orderData[0];
        const isFinished = ["COMPLETED", "CANCELLED", "SELESAI"].includes(String(ord.status).toUpperCase());
        
        if (!isFinished) {
          // 🚀 FIX: Ambil data Toko dari order_items karena merchant_id di tabel order bisa null
          const merchantInfo = ord.order_items?.[0]?.merchants;

          setActiveOrder({ 
            ...ord, 
            profiles: ord.profiles, 
            merchants: merchantInfo 
          });
        } else {
          setActiveOrder(null);
        }
      } else {
        setActiveOrder(null);
      }
    } catch (err) {
      console.error("FETCH ERROR:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const toggleOnlineStatus = async () => {
    if (!courierData?.is_verified) return { success: false, msg: "AKUN BELUM DIVERIFIKASI ADMIN" };
    const newState = !isOnline;
    const { error } = await supabase.from("profiles").update({ is_active: newState }).eq("id", user?.id);
    if (!error) {
      setIsOnline(newState);
      return { success: true, msg: newState ? "DRIVER ONLINE" : "DRIVER OFFLINE" };
    }
    return { success: false, msg: "GAGAL UPDATE STATUS" };
  };

  const acceptOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: "PICKING_UP", courier_id: user?.id })
        .eq("id", orderId)
        .eq("status", "READY_TO_PICKUP")
        .is("courier_id", null);

      if (error) throw error;
      
      if (alarmRef.current) alarmRef.current.pause();

      showToast("TUGAS BERHASIL DIAMBIL!", "success");
      navigate(`/courier/order-active/${orderId}`);
    } catch (err) {
      showToast("GAGAL AMBIL TUGAS, MUNGKIN SUDAH DIAMBIL ORANG LAIN", "error");
      fetchInitialData();
    }
  };

  // 🚀 ENGINE REALTIME DENGAN ALARM & AUTO-SYNC
  useEffect(() => {
    fetchInitialData();
    if (!user?.id) return;

    const channel = supabase
      .channel(`courier_hub_${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (payload: any) => {
        console.log("🔔 Perubahan Pesanan:", payload.new?.status);
        
        if (payload.new?.status === "READY_TO_PICKUP") {
          if (alarmRef.current) {
            alarmRef.current.currentTime = 0;
            alarmRef.current.play().catch((e) => console.warn("Audio blocked", e));
          }
          showToast("🚨 TUGAS BARU TERSEDIA!", "info");
        }
        fetchInitialData();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${user.id}` }, (payload: any) => {
        setCourierData((prev: any) => ({ ...prev, ...payload.new }));
        setIsOnline(payload.new.is_active);
      })
      .subscribe((status) => {
        if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setTimeout(() => channel.subscribe(), 3000);
        }
      });

    const backupInterval = setInterval(() => {
      if (isOnline) fetchInitialData();
    }, 20000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(backupInterval);
    };
  }, [user?.id, fetchInitialData, isOnline, showToast]);

  return {
    courierData, activeOrder, availableOrders, transactions,
    isOnline, loading, currentCoords, fetchInitialData,
    toggleOnlineStatus, acceptOrder
  };
};