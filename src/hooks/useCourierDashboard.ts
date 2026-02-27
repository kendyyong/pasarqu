import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient"; 
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext"; // 🚀 UNTUK NOTIFIKASI
import { useNavigate } from "react-router-dom"; // 🚀 UNTUK PINDAH HALAMAN

export const useCourierDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  
  const [courierData, setCourierData] = useState<any>(null);
  
  // 🚀 STATE DIPISAH AGAR LEBIH JELAS
  const [activeOrder, setActiveOrder] = useState<any>(null); // Order yang sedang dikerjakan kurir
  const [availableOrders, setAvailableOrders] = useState<any[]>([]); // Order baru di radar
  
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);

  const fetchInitialData = async () => {
    if (!user) return;
    try {
      // 1. SAFE FETCH PROFILE (ANTI 400 ERROR)
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileData) {
        let finalProfile = { ...profileData };

        if (profileData.market_id) {
          const { data: marketData } = await supabase
            .from("markets")
            .select("name")
            .eq("id", profileData.market_id)
            .maybeSingle();

          if (marketData) {
            finalProfile.markets = { name: marketData.name };
          }
        }

        setCourierData(finalProfile);
        setIsOnline(finalProfile.is_active || false);
        if (finalProfile.latitude) {
          setCurrentCoords({ lat: finalProfile.latitude, lng: finalProfile.longitude });
        }

        // 🚀 AMBIL TUGAS BARU DI RADAR (YANG SIAP DIJEMPUT DI PASAR YANG SAMA)
        if (finalProfile.market_id) {
          const { data: radarOrders } = await supabase
            .from("orders")
            .select("*, profiles:customer_id(name)")
            .eq("market_id", finalProfile.market_id)
            .eq("status", "READY_TO_PICKUP")
            .is("courier_id", null) // Belum diambil kurir lain
            .order("created_at", { ascending: false });
            
          setAvailableOrders(radarOrders || []);
        }
      }

      // 2. SAFE FETCH TRANSACTIONS
      const { data: logs } = await supabase
        .from("wallet_logs")
        .select("*")
        .eq("profile_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (logs) setTransactions(logs);

      // 3. SAFE FETCH ACTIVE ORDER (TUGAS YANG SEDANG DIKERJAKAN KURIR INI)
      const { data: orderData } = await supabase
        .from("orders")
        .select("*")
        .eq("courier_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (orderData && orderData.length > 0) {
        const ord = orderData[0];
        const isCompleted = String(ord.status).toUpperCase() === "COMPLETED" || 
                            String(ord.status).toUpperCase() === "CANCELLED" || 
                            String(ord.status).toUpperCase() === "SELESAI";
        
        if (!isCompleted) {
          let customerData = null;
          let merchantData = null;

          if (ord.customer_id) {
            const { data: c } = await supabase.from('profiles').select('*').eq('id', ord.customer_id).maybeSingle();
            customerData = c;
          }
          
          if (ord.merchant_id) {
            let { data: m } = await supabase.from('profiles').select('*').eq('id', ord.merchant_id).maybeSingle();
            if (!m) {
              const { data: m2 } = await supabase.from('merchants').select('*').eq('id', ord.merchant_id).maybeSingle();
              m = m2;
            }
            merchantData = m;
          }

          setActiveOrder({
            ...ord,
            profiles: customerData,
            merchants: merchantData
          });
        } else {
          setActiveOrder(null);
        }
      } else {
        setActiveOrder(null);
      }
    } catch (err) {
      console.error("ERROR FETCHING DATA:", err);
    } finally {
      setLoading(false);
    }
  };

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

  // 🚀 FUNGSI AMBIL TUGAS (BARU DITAMBAHKAN)
  const acceptOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ 
          status: "PICKING_UP", // Ubah status jadi Menjemput
          courier_id: user?.id    // Daftarkan nama kurir di pesanan
        })
        .eq("id", orderId)
        .eq("status", "READY_TO_PICKUP")
        .is("courier_id", null); // Validasi ganda: Pastikan belum diambil orang lain

      if (error) throw error;

      showToast("TUGAS BERHASIL DIAMBIL!", "success");
      
      // 🚀 MENUJU HALAMAN PENGIRIMAN
      navigate(`/courier/order-active/${orderId}`);
      
    } catch (err) {
      console.error(err);
      showToast("TUGAS GAGAL DIAMBIL, MUNGKIN SUDAH DIAMBIL KURIR LAIN!", "error");
      fetchInitialData(); // Refresh radar
    }
  };

  useEffect(() => {
    fetchInitialData();
    if (!user) return;

    // 🚀 RADAR REALTIME GABUNGAN
    const channel = supabase
      .channel(`courier_dashboard_${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, fetchInitialData) // Pantau semua pesanan
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${user.id}` }, (payload: any) => {
         setCourierData((prev: any) => ({ ...prev, ...payload.new }));
         setIsOnline(payload.new.is_active);
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "wallet_logs", filter: `profile_id=eq.${user.id}` }, fetchInitialData)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return {
    courierData,
    activeOrder, // Tugas yang sedang berjalan
    availableOrders, // Tugas yang ada di radar
    transactions,
    isOnline,
    loading,
    currentCoords,
    fetchInitialData,
    toggleOnlineStatus,
    acceptOrder // 🚀 FUNGSI INI SEKARANG SUDAH ADA
  };
};