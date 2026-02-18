import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useToast } from "../contexts/ToastContext";

export const useMitraWallet = (profileId: string, balance: number, onRefresh?: () => void) => {
  const { showToast } = useToast();
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchHistory = async () => {
    if (!profileId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("withdrawals")
        .select("*")
        .eq("profile_id", profileId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setWithdrawals(data || []);
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const processWithdraw = async (form: any, onSuccess: () => void) => {
    const amountNum = parseInt(form.amount);

    if (amountNum > balance) return showToast("Saldo tidak mencukupi!", "error");
    if (amountNum < 50000) return showToast("Minimal penarikan Rp 50.000", "error");

    setSubmitting(true);
    try {
      const { error } = await supabase.from("withdrawals").insert([
        {
          profile_id: profileId,
          amount: amountNum,
          bank_name: form.bank_name,
          account_number: form.account_number,
          account_name: form.account_name,
          status: "PENDING",
        },
      ]);

      if (error) throw error;

      showToast("Pengajuan berhasil dikirim!", "success");
      onSuccess();
      fetchHistory();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => { fetchHistory(); }, [profileId]);

  return { withdrawals, loading, submitting, processWithdraw, fetchHistory };
};