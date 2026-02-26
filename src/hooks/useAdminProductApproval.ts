import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";

/**
 * HOOK: useAdminProductApproval
 * Digunakan oleh Admin Lokal untuk memverifikasi produk merchant.
 * Mendukung fitur Persetujuan (APPROVED) dan Penolakan (REJECTED) dengan Alasan.
 */
export const useAdminProductApproval = () => {
  const { profile } = useAuth() as any;
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [pendingProducts, setPendingProducts] = useState<any[]>([]);

  // Mengambil daftar produk yang statusnya PENDING di wilayah admin
  const fetchPendingProducts = useCallback(async () => {
    if (!profile?.managed_market_id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          merchants (shop_name), 
          categories (name)
        `) // 🚀 KEMBALI KE ASAL: Menggunakan tabel 'merchants' sesuai arsitektur database!
        .eq("status", "PENDING")
        .eq("market_id", profile.managed_market_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPendingProducts(data || []);
    } catch (err: any) {
      console.error("Error fetching products:", err);
      showToast("Gagal memuat antrean produk", "error");
    } finally {
      setLoading(false);
    }
  }, [profile?.managed_market_id, showToast]);

  /**
   * FUNGSI: handleProductAction
   * @param productId - ID Produk yang diproses
   * @param action - "APPROVED" atau "REJECTED"
   * @param reason - Alasan jika ditolak (Opsional)
   */
  const handleProductAction = async (
    productId: string, 
    action: "APPROVED" | "REJECTED", 
    reason?: string
  ) => {
    setProcessingId(productId);
    try {
      // Siapkan objek update
      const updateData: any = { 
        status: action,
        // 🚀 FIX: Sinkronkan juga is_verified agar centang hijau di toko langsung aktif
        is_verified: action === "APPROVED",
        // Jika disetujui, kita hapus alasan lama (jika ada)
        // Jika ditolak, kita masukkan alasan baru
        rejection_reason: action === "REJECTED" ? (reason || "Tidak ada alasan spesifik") : null 
      };

      const { error } = await supabase
        .from("products")
        .update(updateData)
        .eq("id", productId);

      if (error) throw error;

      if (action === "APPROVED") {
        showToast("Produk berhasil disetujui dan masuk etalase!", "success");
      } else {
        showToast("Produk ditolak dengan alasan.", "info");
      }

      // Hapus dari state lokal agar langsung hilang dari daftar antrean
      setPendingProducts((prev) => prev.filter((p) => p.id !== productId));
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setProcessingId(null);
    }
  };

  useEffect(() => {
    fetchPendingProducts();

    // Realtime Listener: Jika ada produk baru masuk di wilayah ini, refresh otomatis
    if (profile?.managed_market_id) {
      const channel = supabase
        .channel(`product_approval_${profile.managed_market_id}`)
        .on(
          "postgres_changes",
          { 
            event: "INSERT", 
            schema: "public", 
            table: "products",
            filter: `market_id=eq.${profile.managed_market_id}` 
          },
          () => fetchPendingProducts()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [fetchPendingProducts, profile?.managed_market_id]);

  return { 
    loading, 
    pendingProducts, 
    processingId, 
    fetchPendingProducts, 
    handleProductAction 
  };
};