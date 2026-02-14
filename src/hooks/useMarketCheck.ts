import { useState, useEffect } from "react";
import { useMarket } from "../contexts/MarketContext";
import { supabase } from "../lib/supabaseClient";

/**
 * Hook useMarketCheck
 * Berfungsi untuk memvalidasi pasar yang dipilih pengguna saat aplikasi dibuka.
 * Memastikan ID yang ada di LocalStorage masih valid dan aktif di Database.
 */
export const useMarketCheck = () => {
  const marketContext = useMarket();
  const [isChecking, setIsChecking] = useState(true);

  const selectedMarket = marketContext?.selectedMarket;
  const setSelectedMarket = marketContext?.setSelectedMarket;

  useEffect(() => {
    const checkMarket = async () => {
      const savedId = localStorage.getItem("selected_market_id");

      // 1. Jika ada ID di storage tapi Context masih kosong, kita validasi ke DB
      if (savedId && !selectedMarket && setSelectedMarket) {
        try {
          const { data, error } = await supabase
            .from("markets")
            .select("*")
            .eq("id", savedId)
            .eq("is_active", true) // Pastikan pasar masih aktif
            .maybeSingle();

          if (error) throw error;

          if (data) {
            // Pasar valid, masukkan ke Global State
            setSelectedMarket(data);
          } else {
            // Pasar sudah tidak ada atau tidak aktif, hapus dari storage
            console.warn(
              "Pasar yang tersimpan sudah tidak aktif atau dihapus.",
            );
            localStorage.removeItem("selected_market_id");
            setSelectedMarket(null);
          }
        } catch (error) {
          console.error("Gagal melakukan pengecekan pasar:", error);
          // Jika error koneksi, biarkan user memilih ulang nanti
        }
      }

      // Berikan jeda sedikit agar UI tidak kaget saat transisi loading
      setTimeout(() => {
        setIsChecking(false);
      }, 300);
    };

    checkMarket();
  }, [selectedMarket, setSelectedMarket]);

  return {
    isChecking,
    selectedMarket,
    marketContext,
  };
};
