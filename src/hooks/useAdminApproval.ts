import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useToast } from "../contexts/ToastContext";

export const useAdminApproval = (filterRole: string) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [requests, setRequests] = useState<any[]>([]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("profiles")
        .select("*, markets(name)")
        .eq("status", "PENDING")
        .order("created_at", { ascending: false });

      if (filterRole !== "ALL") {
        query = query.eq("role", filterRole);
      }

      const { data, error } = await query;
      if (error) throw error;
      setRequests(data || []);
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (user: any, action: "APPROVE" | "REJECT") => {
    setProcessingId(user.id);
    try {
      if (action === "APPROVE") {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ is_verified: true, status: "APPROVED" })
          .eq("id", user.id);

        if (profileError) throw profileError;

        if (user.role === "MERCHANT") {
          await supabase.from("merchants").upsert({
            user_id: user.id,
            shop_name: user.shop_name || user.full_name || "Toko Baru",
            name: user.full_name || "Pemilik Toko",
            market_id: user.managed_market_id,
            status: "APPROVED",
            is_active: true,
            is_shop_open: true,
          });
        } else if (user.role === "COURIER") {
          await supabase.from("couriers").upsert({
            user_id: user.id,
            full_name: user.full_name,
            market_id: user.managed_market_id,
            status: "APPROVED",
            is_active: true,
          });
        }
        showToast(`Akses ${user.role} Berhasil Diaktifkan!`, "success");
      } else {
        await supabase.from("profiles").update({ status: "REJECTED" }).eq("id", user.id);
        showToast("Pendaftaran ditolak.", "info");
      }
      setRequests((prev) => prev.filter((r) => r.id !== user.id));
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setProcessingId(null);
    }
  };

  useEffect(() => { fetchRequests(); }, [filterRole]);

  return { loading, requests, processingId, fetchRequests, handleAction };
};