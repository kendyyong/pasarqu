// src/hooks/useMarketCheck.ts
import { useState, useEffect } from "react";
import { useMarket } from "../contexts/MarketContext";
import { supabase } from "../lib/supabaseClient";

export const useMarketCheck = () => {
  const marketContext = useMarket();
  const [isChecking, setIsChecking] = useState(true);

  const selectedMarket = marketContext?.selectedMarket;
  const setSelectedMarket = marketContext?.setSelectedMarket;

  useEffect(() => {
    const checkMarket = async () => {
      const savedId = localStorage.getItem("selected_market_id");

      // Jika ada ID di storage tapi belum ada di Context, ambil dari DB
      if (savedId && !selectedMarket && setSelectedMarket) {
        try {
          const { data } = await supabase
            .from("markets")
            .select("*")
            .eq("id", savedId)
            .single();

          if (data) {
            setSelectedMarket(data);
          }
        } catch (error) {
          console.error("Gagal memuat pasar:", error);
        }
      }
      setIsChecking(false);
    };

    checkMarket();
  }, [selectedMarket, setSelectedMarket]);

  return { isChecking, selectedMarket, marketContext };
};
