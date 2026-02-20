import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { useToast } from "../contexts/ToastContext";
import { useAuth } from "../contexts/AuthContext";

export const useAdminApproval = (filterRole: string) => {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [requests, setRequests] = useState<any[]>([]);

  const fetchRequests = useCallback(async () => {
    if (!profile?.managed_market_id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      let query = supabase
        .from("profiles")
        .select("*, markets(name)")
        .eq("status", "PENDING")
        .order("created_at", { ascending: false });

      if (profile.role === "LOCAL_ADMIN") {
        query = query.eq("managed_market_id", profile.managed_market_id);
      }
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
  }, [profile, filterRole, showToast]);

  const handleAction = async (targetUser: any, action: "APPROVE" | "REJECT") => {
    if (!targetUser?.id) return;
    setProcessingId(targetUser.id);
    
    try {
      if (action === "APPROVE") {
        // 1. Update status di tabel PROFILES
        const { error: upError } = await supabase
          .from("profiles")
          .update({ 
            status: "APPROVED",
            is_verified: true 
          })
          .eq("id", targetUser.id);

        if (upError) throw upError;

        // 2. Jika yang disetujui adalah MERCHANT, buat datanya di tabel MERCHANTS
        if (targetUser.role === "MERCHANT") {
          const { error: merchantError } = await supabase
            .from("merchants")
            .upsert({
              id: targetUser.id, // Menggunakan ID yang sama dengan Profile
              user_id: targetUser.id,
              name: targetUser.shop_name || targetUser.name || "Toko Baru",
              market_id: targetUser.managed_market_id,
              status: "APPROVED",
              is_shop_open: true,
              deposit_balance: 0
            });
          
          if (merchantError) {
            console.error("Gagal membuat data merchant:", merchantError.message);
            // Tetap lanjut karena profile sudah approved, tapi beri peringatan
          }
        }

        showToast("Mitra Berhasil Disetujui!", "success");
      } else {
        // AKSI REJECT
        const { error } = await supabase
          .from("profiles")
          .update({ status: "REJECTED" })
          .eq("id", targetUser.id);
        
        if (error) throw error;
        showToast("Pendaftaran ditolak.", "info");
      }
      
      // Hapus dari daftar antrean di UI
      setRequests((prev) => prev.filter((r) => r.id !== targetUser.id));
    } catch (err: any) {
      showToast("Gagal memproses: " + err.message, "error");
    } finally {
      setProcessingId(null);
    }
  };

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  return { loading, requests, processingId, fetchRequests, handleAction };
};