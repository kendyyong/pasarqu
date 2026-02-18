import { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { useJsApiLoader } from "@react-google-maps/api";

// PINDAHKAN KE LUAR COMPONENT agar tidak menyebabkan Performance Warning
const LIBRARIES: "places"[] = ["places"];

export const useLocalAdminDashboard = () => {
  const { profile, logout } = useAuth();
  const { showToast } = useToast();

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries: LIBRARIES, // Menggunakan konstanta statis
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

  const fetchData = async () => {
    if (!profile?.managed_market_id) {
      setIsLoading(false);
      return;
    }
    
    try {
      const targetMarketId = profile.managed_market_id;
      const today = new Date().toISOString().split("T")[0];

      // 1. Fetch Market, Users, & Finance
      const [marketRes, usersRes, financeRes] = await Promise.all([
        supabase.from("markets").select("*").eq("id", targetMarketId).single(),
        supabase.from("profiles").select("*").eq("managed_market_id", targetMarketId),
        supabase.from("orders").select("total_price, service_fee").eq("market_id", targetMarketId).gte("created_at", today),
      ]);

      // 2. FETCH PRODUK (Hanya ambil shop_name, karena owner_name tidak ada di tabel merchants)
      const { data: prodData, error: prodError } = await supabase
        .from("products")
        .select(`
          *,
          merchants (
            shop_name
          ),
          categories (
            name
          )
        `)
        .eq("market_id", targetMarketId)
        .eq("status", "PENDING");

      if (prodError) {
        console.error("Error Fetch Products:", prodError.message);
        // Fallback jika relasi masih bermasalah
        const { data: fallback } = await supabase
          .from("products")
          .select("*")
          .eq("market_id", targetMarketId)
          .eq("status", "PENDING");
        setPendingProducts(fallback || []);
      } else {
        setPendingProducts(prodData || []);
      }

      // 3. Set Data Lainnya
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
    } catch (error) {
      console.error("Global Fetch Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const triggerAlarm = () => {
    if (isMuted) return;
    setIsAlarmActive(true);
    if (alarmAudio.current) {
      alarmAudio.current.loop = true;
      alarmAudio.current.play().catch(() => {});
    }
  };

  const stopAlarm = () => {
    setIsAlarmActive(false);
    if (alarmAudio.current) {
      alarmAudio.current.pause();
      alarmAudio.current.currentTime = 0;
    }
  };

  useEffect(() => {
    alarmAudio.current = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
    if (!profile?.managed_market_id) return;

    const mid = profile.managed_market_id;

    const productSub = supabase.channel("engine_produk")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "products", filter: `market_id=eq.${mid}` }, () => {
        fetchData();
        triggerAlarm();
        showToast("🚨 PRODUK BARU MENUNGGU VALIDASI!", "error");
      }).subscribe();

    const profileSub = supabase.channel("engine_mitra")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "profiles", filter: `managed_market_id=eq.${mid}` }, (payload: any) => {
        fetchData();
        triggerAlarm();
        const role = payload.new.role === "MERCHANT" ? "TOKO" : "KURIR";
        showToast(`🚨 ADA MITRA ${role} BARU MENDAFTAR!`, "success");
      }).subscribe();

    return () => {
      supabase.removeChannel(productSub);
      supabase.removeChannel(profileSub);
      stopAlarm();
    };
  }, [profile?.managed_market_id, isMuted]);

  useEffect(() => { 
    if (profile) fetchData(); 
  }, [profile]);

  return {
    profile, isLoaded, isLoading, isMuted, setIsMuted, isAlarmActive,
    myMarket, myMerchants, myCouriers, myCustomers, pendingProducts, marketFinance,
    fetchData, stopAlarm, logout, showToast
  };
};