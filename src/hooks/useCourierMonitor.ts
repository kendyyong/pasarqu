import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useToast } from "../contexts/ToastContext";

export const useCourierMonitor = (managedMarketId: string | undefined) => {
  const { showToast } = useToast();
  const [couriers, setCouriers] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!managedMarketId) return;
    setLoading(true);
    try {
      // 1. Fetch Couriers with Order Count
      const { data: courierData, error: courierError } = await supabase
        .from("profiles")
        .select(`*, orders:orders!courier_id(count)`)
        .eq("role", "COURIER")
        .eq("managed_market_id", managedMarketId);

      if (courierError) throw courierError;

      // 2. Fetch Active Complaints
      try {
        const { data: compData } = await supabase
          .from("complaints")
          .select("*")
          .eq("market_id", managedMarketId)
          .eq("status", "OPEN");
        setComplaints(compData || []);
      } catch (e) {
        console.log("Tabel complaints belum tersedia.");
      }

      // Transform & Sort
      const formatted = (courierData || [])
        .map((c: any) => ({
          ...c,
          total_orders: c.orders?.[0]?.count || 0,
        }))
        .sort((a, b) => b.total_orders - a.total_orders);

      setCouriers(formatted);
    } catch (err: any) {
      showToast("Gagal memuat data personil", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [managedMarketId]);

  return { couriers, complaints, loading, fetchData };
};