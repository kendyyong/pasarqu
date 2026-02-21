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
      // 🚀 PENYEBAB DATA HILANG: Filter yang terlalu ketat.
      // Kita ambil semua kurir yang memiliki jejak di pasar ini.
      const { data: courierData, error: courierError } = await supabase
        .from("profiles")
        .select(`
          *,
          orders:orders!courier_id(count)
        `)
        .eq("role", "COURIER")
        .or(`market_id.eq.${managedMarketId},managed_market_id.eq.${managedMarketId}`);

      if (courierError) throw courierError;

      // Ambil Aduan Terbuka
      try {
        const { data: compData } = await supabase
          .from("complaints")
          .select("*")
          .eq("market_id", managedMarketId)
          .eq("status", "OPEN");
        setComplaints(compData || []);
      } catch (e) {
        console.log("TABEL ADUAN BELUM AKTIF");
      }

      // Format data agar kurir yang sudah diverifikasi tetap terbaca
      const formatted = (courierData || []).map((c: any) => ({
        ...c,
        total_orders: c.orders?.[0]?.count || 0,
        // Pastikan status default jika null adalah PENDING, agar tidak hilang dari UI
        status: c.status || (c.is_verified ? "ACTIVE" : "PENDING")
      }))
      .sort((a, b) => b.total_orders - a.total_orders);

      setCouriers(formatted);

      // 🔍 DEBUG UNTUK BAPAK: Cek di Console F12
      if (formatted.length === 0) {
        console.warn("⚠️ PERHATIAN PAK KENDY: Data kurir kosong di Supabase untuk ID Pasar:", managedMarketId);
      } else {
        console.log("✅ DATA BERHASIL DITARIK:", formatted);
      }

    } catch (err: any) {
      showToast("SINKRONISASI GAGAL", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchData(); 
  }, [managedMarketId]);

  return { couriers, complaints, loading, fetchData };
};