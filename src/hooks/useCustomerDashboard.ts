import { useState, useEffect, useCallback } from "react";
// PERBAIKAN 1: Jalur import disesuaikan
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";

export const useCustomerDashboard = () => {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({ unpaid: 0, packing: 0, delivering: 0 });
  const [loading, setLoading] = useState(true);

  // ✅ Menggunakan useCallback agar fungsi stabil dan bisa di-export dengan aman
  const fetchStats = useCallback(async () => {
    if (!user) return;

    try {
      // Ambil semua order aktif milik user ini
      const { data } = await supabase
        .from("orders")
        .select("status, shipping_status")
        .eq("customer_id", user.id)
        .in("status", ["UNPAID", "PAID"]); // Filter dasar

      if (data) {
        // PERBAIKAN 2: Filter logika stats
        const unpaid = data.filter((o: any) => o.status === "UNPAID").length;
        
        const packing = data.filter((o: any) => 
          o.status === "PAID" && 
          ["CONFIRMED", "PROCESSING"].includes(o.shipping_status)
        ).length;

        const delivering = data.filter((o: any) => 
          o.status === "PAID" && 
          ["DELIVERING", "PICKING_UP"].includes(o.shipping_status)
        ).length;

        setStats({ unpaid, packing, delivering });
      }
    } catch (err) {
      console.error("Gagal ambil statistik:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Realtime Listener
  useEffect(() => {
    fetchStats();
    if (!user) return;

    const channel = supabase
      .channel(`customer_stats_${user.id}`)
      .on(
        "postgres_changes",
        { 
          event: "*", 
          schema: "public", 
          table: "orders", 
          filter: `customer_id=eq.${user.id}` 
        },
        () => fetchStats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchStats]);

  // ✅ Tambahkan refreshData: fetchStats agar Dashboard tidak error lagi
  return { 
    stats, 
    loading, 
    profile, 
    refreshData: fetchStats 
  };
};