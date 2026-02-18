import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useToast } from "../contexts/ToastContext";

export const useRegionalFinance = () => {
  const { showToast } = useToast();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const TABLE_NAME = "regional_finance_settings";

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data: res, error } = await supabase
        .from(TABLE_NAME)
        .select("*")
        .order("kecamatan", { ascending: true });
      if (error) throw error;
      if (res) setData(res);
    } catch (err: any) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: string, field: string, value: any) => {
    const cleanValue = isNaN(value) ? 0 : value;
    const oldData = [...data];
    setData(data.map((item) => item.id === id ? { ...item, [field]: cleanValue } : item));

    const { error } = await supabase.from(TABLE_NAME).update({ [field]: cleanValue }).eq("id", id);
    if (error) {
      showToast("Gagal update: " + error.message, "error");
      setData(oldData);
    } else {
      showToast("Data tersimpan", "success");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin hapus?")) return;
    const { error } = await supabase.from(TABLE_NAME).delete().eq("id", id);
    if (!error) {
      setData(data.filter((item) => item.id !== id));
      showToast("Terhapus", "success");
    }
  };

  useEffect(() => { fetchSettings(); }, []);

  return { data, loading, fetchSettings, handleUpdate, handleDelete, TABLE_NAME };
};