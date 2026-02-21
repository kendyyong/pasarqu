import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient"; 
import { useAuth } from "../contexts/AuthContext";

export const useCourierDashboard = () => {
  const { user } = useAuth();
  
  const [courierData, setCourierData] = useState<any>(null);
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);

  const fetchInitialData = async () => {
    if (!user) return;
    try {
      // 1. SAFE FETCH PROFILE (ANTI 400 ERROR)
      // Tarik data profil murni tanpa embel-embel join tabel
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileData) {
        let finalProfile = { ...profileData };

        // Jika kurir punya market_id, kita cari nama pasarnya secara manual
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
      }

      // 2. SAFE FETCH TRANSACTIONS
      const { data: logs } = await supabase
        .from("wallet_logs")
        .select("*")
        .eq("profile_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (logs) setTransactions(logs);

      // 3. SAFE FETCH ACTIVE ORDER (ANTI 400 ERROR)
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
          // AMBIL DATA PELANGGAN & TOKO SECARA MANUAL
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

  useEffect(() => {
    fetchInitialData();
    if (!user) return;

    const channel = supabase
      .channel(`courier_dashboard_${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `courier_id=eq.${user.id}` }, fetchInitialData)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${user.id}` }, (payload: any) => {
         // Agar nama pasar tidak hilang saat update profile dari realtime
         setCourierData((prev: any) => ({ ...prev, ...payload.new }));
         setIsOnline(payload.new.is_active);
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "wallet_logs", filter: `profile_id=eq.${user.id}` }, fetchInitialData)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return {
    courierData,
    activeOrder,
    transactions,
    isOnline,
    loading,
    currentCoords,
    fetchInitialData,
    toggleOnlineStatus
  };
};