import { useState, useEffect } from "react";
// PERBAIKAN 1: Jalur import disesuaikan dengan posisi folder 'src/hooks/'
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
      // 1. Fetch Profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*, markets:market_id(name)")
        .eq("id", user.id)
        .single();

      if (profile) {
        setCourierData(profile);
        setIsOnline(profile.is_active || false);
        if (profile.latitude) setCurrentCoords({ lat: profile.latitude, lng: profile.longitude });
      }

      // 2. Fetch Transactions
      const { data: logs } = await supabase
        .from("wallet_logs")
        .select("*")
        .eq("profile_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (logs) setTransactions(logs);

      // 3. Fetch Active Order
      const { data: order } = await supabase
        .from("orders")
        .select(`
          *,
          profiles:customer_id (id, full_name, phone_number, address, latitude, longitude),
          merchants:merchant_id (id, shop_name, address, latitude, longitude)
        `)
        .eq("courier_id", user.id)
        .in("shipping_status", ["COURIER_ASSIGNED", "PICKING_UP", "DELIVERING"])
        .maybeSingle();

      setActiveOrder(order || null);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleOnlineStatus = async () => {
    if (!courierData?.is_verified) return { success: false, msg: "Akun belum diverifikasi Admin" };
    
    const newState = !isOnline;
    const { error } = await supabase.from("profiles").update({ is_active: newState }).eq("id", user?.id);

    if (!error) {
      setIsOnline(newState);
      return { success: true, msg: newState ? "DRIVER ONLINE" : "DRIVER OFFLINE" };
    }
    return { success: false, msg: "Gagal update status" };
  };

  useEffect(() => {
    fetchInitialData();
    if (!user) return;

    const channel = supabase
      .channel(`courier_dashboard_${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `courier_id=eq.${user.id}` }, fetchInitialData)
      // PERBAIKAN 2: Menambahkan tipe ': any' pada payload agar TypeScript tidak protes
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${user.id}` }, (payload: any) => setCourierData(payload.new))
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