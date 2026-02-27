import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { useJsApiLoader } from "@react-google-maps/api";

// 🚀 MASTER LIBRARIES: Seragam agar tidak Blank Putih
const GOOGLE_MAPS_LIBRARIES: ("places" | "routes" | "geometry" | "drawing")[] = ["places", "routes", "geometry", "drawing"];

export const useLocalAdminDashboard = () => {
  const { profile, logout } = useAuth();
  const { showToast } = useToast();

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isAlarmActive, setIsAlarmActive] = useState(false);
  const alarmAudio = useRef<HTMLAudioElement | null>(null);

  const [myMarket, setMyMarket] = useState<any>(null);
  const [myMerchants, setMyMerchants] = useState<any[]>([]);
  const [myCouriers, setMyCouriers] = useState<any[]>([]);
  const [myCustomers, setMyCustomers] = useState<any[]>([]);
  const [pendingProducts, setPendingProducts] = useState<any[]>([]);
  const [marketFinance, setMarketFinance] = useState({ revenue: 0, serviceFees: 0 });
  
  const [weeklyChartData, setWeeklyChartData] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  // 1. FUNGSI AMBIL DATA
  const fetchData = useCallback(async () => {
    if (!profile?.managed_market_id) {
      setIsLoading(false);
      return;
    }
    
    try {
      const targetMarketId = profile.managed_market_id;
      const todayString = new Date().toISOString().split("T")[0];
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      const sevenDaysAgoString = sevenDaysAgo.toISOString().split("T")[0];

      const [marketRes, usersRes, financeRes, weeklyFinanceRes, recentOrdersRes] = await Promise.all([
        supabase.from("markets").select("*").eq("id", targetMarketId).single(),
        supabase.from("profiles").select("*").eq("managed_market_id", targetMarketId),
        supabase.from("orders").select("total_price, service_fee").eq("market_id", targetMarketId).gte("created_at", todayString),
        supabase.from("orders").select("created_at, service_fee").eq("market_id", targetMarketId).gte("created_at", sevenDaysAgoString),
        supabase.from("orders").select("id, total_price, status, created_at, profiles:customer_id(name)").eq("market_id", targetMarketId).order("created_at", { ascending: false }).limit(5)
      ]);

      const { data: prodData } = await supabase.from("products").select(`*, merchants (shop_name), categories (name)`).eq("market_id", targetMarketId).eq("status", "PENDING");
      setPendingProducts(prodData || []);

      if (marketRes.data) setMyMarket(marketRes.data);
      if (usersRes.data) {
        setMyMerchants(usersRes.data.filter((p: any) => p.role === "MERCHANT"));
        setMyCouriers(usersRes.data.filter((p: any) => p.role === "COURIER"));
        setMyCustomers(usersRes.data.filter((p: any) => p.role === "CUSTOMER"));
      }
      
      if (financeRes.data) {
        const total = financeRes.data.reduce((acc, curr) => acc + Number(curr.total_price || 0), 0);
        const fees = financeRes.data.reduce((acc, curr) => acc + Number(curr.service_fee || 0), 0);
        setMarketFinance({ revenue: total, serviceFees: fees });
      }

      if (weeklyFinanceRes.data) {
        const days = ["MIN", "SEN", "SEL", "RAB", "KAM", "JUM", "SAB"];
        const chartMap = new Map();
        for (let i = 6; i >= 0; i--) {
          const d = new Date(); d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split("T")[0];
          chartMap.set(dateStr, { day: days[d.getDay()], value: 0 });
        }
        weeklyFinanceRes.data.forEach((order) => {
          const orderDate = new Date(order.created_at).toISOString().split("T")[0];
          if (chartMap.has(orderDate)) chartMap.get(orderDate).value += Number(order.service_fee || 0);
        });

        const finalChartData = Array.from(chartMap.values());
        const maxVal = Math.max(...finalChartData.map(d => d.value), 1);
        setWeeklyChartData(finalChartData.map(d => ({
            ...d,
            percentage: Math.max(10, Math.round((d.value / maxVal) * 100)) 
        })));
      }

      if (recentOrdersRes.data) {
        setRecentActivities(recentOrdersRes.data.map((order: any, index: number) => {
          const time = new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
          const profileData: any = order.profiles;
          const customerName = profileData ? (Array.isArray(profileData) ? profileData[0]?.name : profileData.name) : "Customer";
          return {
            id: order.id || index,
            title: order.status === "COMPLETED" ? "Pesanan Selesai" : order.status === "CANCELLED" ? "Pesanan Batal" : "Pesanan Baru",
            desc: `${customerName} - Rp ${(order.total_price || 0).toLocaleString()}`,
            time: `${time} WITA`,
            iconName: order.status === "COMPLETED" ? "CheckCircle2" : "ShoppingBag",
            bgClass: order.status === "COMPLETED" ? "bg-teal-50" : order.status === "CANCELLED" ? "bg-red-50" : "bg-orange-50",
            colorClass: order.status === "COMPLETED" ? "text-[#008080]" : order.status === "CANCELLED" ? "text-red-500" : "text-[#FF6600]"
          };
        }));
      }
    } catch (error) { console.error("Global Fetch Error:", error); } finally { setIsLoading(false); }
  }, [profile]);

  // 2. LOGIKA ALARM (HANYA BEEP SEKALI - ANTI BERISIK)
  const triggerAlarm = useCallback(() => {
    if (isMuted) return;
    setIsAlarmActive(true);
    if (alarmAudio.current) {
      alarmAudio.current.loop = false; // 🚀 FIX: Tidak berulang-ulang
      alarmAudio.current.play().catch(() => {});
      
      // Reset status alarm setelah 2 detik agar indikator visual hilang sendiri
      setTimeout(() => setIsAlarmActive(false), 2000);
    }
  }, [isMuted]);

  const stopAlarm = () => {
    setIsAlarmActive(false);
    if (alarmAudio.current) {
      alarmAudio.current.pause();
      alarmAudio.current.currentTime = 0;
    }
  };

  // 3. INISIALISASI AUDIO & DATA
  useEffect(() => {
    // 🚀 MENGGUNAKAN SUARA NOTIFIKASI DIGITAL YANG BERSIH
    alarmAudio.current = new Audio("https://actions.google.com/sounds/v1/communication/notification_high.ogg");
    if (profile) fetchData();
  }, [profile, fetchData]);

  // 4. RADAR REAL-TIME
  useEffect(() => {
    if (!profile?.managed_market_id) return;
    const mid = profile.managed_market_id;

    const orderSub = supabase.channel("engine_order")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `market_id=eq.${mid}` }, (payload: any) => {
        fetchData();
        if (payload.eventType === "INSERT" || (payload.new.status === "PROCESSING" && payload.old.status === "UNPAID")) {
            triggerAlarm();
            showToast("🚨 ADA PESANAN MASUK!", "success");
        }
      }).subscribe();

    const productSub = supabase.channel("engine_produk")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "products", filter: `market_id=eq.${mid}` }, () => {
        fetchData(); 
        triggerAlarm();
        showToast("🚨 PRODUK BARU MENUNGGU VALIDASI!", "error");
      }).subscribe();

    const profileSub = supabase.channel("engine_mitra")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "profiles", filter: `managed_market_id=eq.${mid}` }, () => {
        fetchData(); 
        triggerAlarm();
        showToast("🚨 ADA MITRA BARU MENDAFTAR!", "info");
      }).subscribe();

    return () => {
      supabase.removeChannel(orderSub);
      supabase.removeChannel(productSub);
      supabase.removeChannel(profileSub);
      stopAlarm();
    };
  }, [profile?.managed_market_id, isMuted, fetchData, triggerAlarm, showToast]);

  return {
    profile, isLoaded, isLoading, isMuted, setIsMuted, isAlarmActive,
    myMarket, myMerchants, myCouriers, myCustomers, pendingProducts, marketFinance,
    weeklyChartData, recentActivities, fetchData, stopAlarm, logout, showToast
  };
};