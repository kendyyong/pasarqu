import { useState, useEffect } from "react";
// PERBAIKAN 1: Jalur import disesuaikan (cukup mundur 1 folder)
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";

export const useCustomerDashboard = () => {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({ unpaid: 0, packing: 0, delivering: 0 });
  const [loading, setLoading] = useState(true);

  // Fungsi untuk menghitung jumlah pesanan berdasarkan status
  const fetchStats = async () => {
    if (!user) return;

    try {
      // Ambil semua order aktif milik user ini
      const { data } = await supabase
        .from("orders")
        .select("status, shipping_status")
        .eq("customer_id", user.id)
        .in("status", ["UNPAID", "PAID"]); // Filter dasar

      if (data) {
        // PERBAIKAN 2: Tambahkan tipe ': any' pada parameter (o)
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
  };

  // Realtime Listener: Update angka otomatis jika ada perubahan status order
  useEffect(() => {
    fetchStats();
    if (!user) return;

    const channel = supabase
      .channel(`customer_stats_${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `customer_id=eq.${user.id}` },
        () => fetchStats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { stats, loading, profile };
};