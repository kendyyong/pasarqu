import { supabase } from "./supabaseClient";

/**
 * Fungsi untuk mencatat aktivitas admin ke database
 */
export const createAuditLog = async (
  action: string,
  resource: string,
  details: string,
) => {
  try {
    // 1. Ambil data admin yang sedang login dari session
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    // 2. Ambil nama admin dari profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    // 3. Masukkan ke tabel audit_logs
    await supabase.from("audit_logs").insert([
      {
        admin_id: user.id,
        admin_name: profile?.full_name || "Unknown Admin",
        action: action, // Contoh: "APPROVE_WITHDRAWAL"
        target_resource: resource, // Contoh: "FINANCE"
        details: details, // Contoh: "Menyetujui penarikan saldo Rp 500.000 oleh Toko A"
      },
    ]);
  } catch (err) {
    console.error("Gagal mencatat log audit:", err);
  }
};
