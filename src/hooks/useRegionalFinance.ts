import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

export const useRegionalFinance = (kecamatanName: string | undefined) => {
  const [regionalSettings, setRegionalSettings] = useState<{
    buyer_service_fee: number;
    courier_app_fee: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRegionalSettings = async () => {
      if (!kecamatanName) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("kecamatan_finance_settings")
          .select("buyer_service_fee, courier_app_fee")
          .eq("kecamatan_name", kecamatanName)
          .eq("is_active", true)
          .single();

        if (error) throw error;

        if (data) {
          setRegionalSettings(data);
        }
      } catch (err) {
        console.error("Regional settings not found, using global default.");
        // Jika kecamatan tidak terdaftar, kita beri harga default agar sistem tidak macet
        setRegionalSettings({
          buyer_service_fee: 2000,
          courier_app_fee: 1000,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRegionalSettings();
  }, [kecamatanName]);

  return { regionalSettings, loading };
};
