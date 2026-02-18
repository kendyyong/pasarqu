import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { useJsApiLoader } from "@react-google-maps/api";

const libraries: "places"[] = ["places"];

export const useLocalAdminDashboard = () => {
  const { profile, logout } = useAuth();
  const { showToast } = useToast(); // Fungsi ini sudah ada di sini...

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries,
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

      const [marketRes, usersRes, prodRes, financeRes] = await Promise.all([
        supabase.from("markets").select("*").eq("id", targetMarketId).single(),
        supabase.from("profiles").select("*").eq("managed_market_id", targetMarketId),
        supabase.from("products").select("*, merchants(shop_name, name)").eq("market_id", targetMarketId).eq("status", "PENDING"),
        supabase.from("orders").select("total_price, service_fee").eq("market_id", targetMarketId).gte("created_at", today),
      ]);

      if (marketRes.data) setMyMarket(marketRes.data);
      if (usersRes.data) {
        setMyMerchants(usersRes.data.filter((p: any) => p.role === "MERCHANT"));
        setMyCouriers(usersRes.data.filter((p: any) => p.role === "COURIER"));
        setMyCustomers(usersRes.data.filter((p: any) => p.role === "CUSTOMER"));
      }
      setPendingProducts(prodRes.data || []);
      
      if (financeRes.data) {
        const total = financeRes.data.reduce((acc, curr) => acc + Number(curr.total_price), 0);
        const fees = financeRes.data.reduce((acc, curr) => acc + Number(curr.service_fee), 0);
        setMarketFinance({ revenue: total, serviceFees: fees });
      }
    } catch (error) {
      console.error("Fetch Error:", error);
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

    const productSub = supabase.channel("engine_produk")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "products", filter: `market_id=eq.${profile.managed_market_id}` }, () => {
        fetchData();
        triggerAlarm();
        showToast("🚨 PRODUK BARU MENUNGGU VALIDASI!", "error");
      }).subscribe();

    const profileSub = supabase.channel("engine_mitra")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "profiles", filter: `managed_market_id=eq.${profile.managed_market_id}` }, (payload: any) => {
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

  useEffect(() => { if (profile) fetchData(); }, [profile]);

  // ✅ PERBAIKAN: showToast dimasukkan ke daftar return
  return {
    profile, isLoaded, isLoading, isMuted, setIsMuted, isAlarmActive,
    myMarket, myMerchants, myCouriers, myCustomers, pendingProducts, marketFinance,
    fetchData, stopAlarm, logout, showToast
  };
};