import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { useJsApiLoader } from "@react-google-maps/api";

const LIBRARIES: "places"[] = ["places"];

export const useLocalAdminDashboard = () => {
  const { profile, logout } = useAuth();
  const { showToast } = useToast();

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries: LIBRARIES,
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
  
  // 🚀 STATE BARU UNTUK GRAFIK & AKTIVITAS
  const [weeklyChartData, setWeeklyChartData] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  const fetchData = async () => {
    if (!profile?.managed_market_id) {
      setIsLoading(false);
      return;
    }
    
    try {
      const targetMarketId = profile.managed_market_id;
      const todayDate = new Date();
      const todayString = todayDate.toISOString().split("T")[0];
      
      // Ambil tanggal 7 hari yang lalu
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      const sevenDaysAgoString = sevenDaysAgo.toISOString().split("T")[0];

      // 1. Fetch Market, Users, Finance Hari Ini & Finance 7 Hari
      const [marketRes, usersRes, financeRes, weeklyFinanceRes, recentOrdersRes] = await Promise.all([
        supabase.from("markets").select("*").eq("id", targetMarketId).single(),
        supabase.from("profiles").select("*").eq("managed_market_id", targetMarketId),
        supabase.from("orders").select("total_price, service_fee").eq("market_id", targetMarketId).gte("created_at", todayString),
        // Ambil data untuk grafik
        supabase.from("orders").select("created_at, service_fee").eq("market_id", targetMarketId).gte("created_at", sevenDaysAgoString),
        // Ambil aktivitas pesanan terbaru
        supabase.from("orders").select("id, total_price, status, created_at, profiles:customer_id(name)").eq("market_id", targetMarketId).order("created_at", { ascending: false }).limit(5)
      ]);

      // 2. FETCH PRODUK
      const { data: prodData } = await supabase
        .from("products")
        .select(`*, merchants (shop_name), categories (name)`)
        .eq("market_id", targetMarketId)
        .eq("status", "PENDING");
      
      setPendingProducts(prodData || []);

      // 3. Set Data Users & Market
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

      // 🚀 4. OLAH DATA GRAFIK MINGGUAN (PROFIT/SERVICE FEE)
      if (weeklyFinanceRes.data) {
        const days = ["MIN", "SEN", "SEL", "RAB", "KAM", "JUM", "SAB"];
        // Inisialisasi array 7 hari ke belakang dengan nilai 0
        const chartMap = new Map();
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split("T")[0];
          chartMap.set(dateStr, { 
            day: days[d.getDay()], 
            value: 0, 
            fullDate: dateStr 
          });
        }

        // Isi nilai dari database
        weeklyFinanceRes.data.forEach((order) => {
          const orderDate = new Date(order.created_at).toISOString().split("T")[0];
          if (chartMap.has(orderDate)) {
            chartMap.get(orderDate).value += Number(order.service_fee || 0);
          }
        });

        // Konversi ke format array & hitung tinggi (persentase)
        const finalChartData = Array.from(chartMap.values());
        const maxVal = Math.max(...finalChartData.map(d => d.value), 1); // Hindari bagi 0
        
        const chartWithHeight = finalChartData.map(d => ({
          ...d,
          height: `h-[${Math.max(10, Math.round((d.value / maxVal) * 100))}%]` // Minimal tinggi 10%
        }));
        
        setWeeklyChartData(chartWithHeight);
      }

      // 🚀 5. OLAH DATA LOG AKTIVITAS TERKINI
      if (recentOrdersRes.data) {
        const formattedActivities = recentOrdersRes.data.map((order, index) => {
          const time = new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
          let title = "Pesanan Masuk";
          let bg = "bg-orange-50";
          let color = "text-[#FF6600]";
          
          if(order.status === "COMPLETED") { title = "Pesanan Selesai"; bg = "bg-teal-50"; color = "text-[#008080]"; }
          if(order.status === "CANCELLED") { title = "Pesanan Batal"; bg = "bg-red-50"; color = "text-red-500"; }

          // 🛠️ PERBAIKAN ERROR TYPESCRIPT: Deteksi Array / Object dengan aman menggunakan 'any'
          const profileData: any = order.profiles;
          const customerName = profileData ? (Array.isArray(profileData) ? profileData[0]?.name : profileData.name) : "Customer";

          return {
            id: order.id || index,
            title: title,
            desc: `${customerName || 'Customer'} - Rp ${(order.total_price || 0).toLocaleString()}`,
            time: `${time} WITA`,
            iconName: order.status === "COMPLETED" ? "CheckCircle2" : "ShoppingBag",
            bgClass: bg,
            colorClass: color
          };
        });
        setRecentActivities(formattedActivities);
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
    weeklyChartData, recentActivities,
    fetchData, stopAlarm, logout, showToast
  };
};