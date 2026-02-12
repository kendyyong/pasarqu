import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export const useAppSettings = () => {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("app_settings")
        .select("*")
        .eq("id", 1)
        .single();

      if (error) throw error;
      setSettings(data);
    } catch (err) {
      console.error("Gagal mengambil pengaturan aplikasi:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();

    // Opsional: Dengarkan perubahan secara realtime (jika admin ganti harga, user langsung tahu)
    const subscription = supabase
      .channel("settings_change")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "app_settings" },
        (payload) => {
          setSettings(payload.new);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  return { settings, loading };
};
