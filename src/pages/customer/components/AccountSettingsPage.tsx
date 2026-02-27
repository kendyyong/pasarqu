import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../lib/supabaseClient";
import { useAuth } from "../../../contexts/AuthContext";
import { useToast } from "../../../contexts/ToastContext";
import { useMarket } from "../../../contexts/MarketContext"; // 🚀 Diperlukan untuk data keranjang
import { MobileLayout } from "../../../components/layout/MobileLayout";
import {
  ArrowLeft,
  Camera,
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  Loader2,
  Save,
  ChevronRight,
} from "lucide-react";

export const AccountSettingsPage = () => {
  const { user, profile } = useAuth() as any;
  const { cart } = useMarket(); // 🚀 Sinkronisasi jumlah keranjang
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone_number: "",
    avatar_url: "",
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        phone_number: profile.phone_number || "",
        avatar_url: profile.avatar_url || "",
      });
    }
  }, [profile]);

  // 🚀 LOGIKA UNGGAH AVATAR KE STORAGE
  const handleUploadAvatar = async (event: any) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) return;

      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      // Gunakan nama unik agar browser tidak memuat gambar lama (cache)
      const filePath = `${user.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: filePath })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setFormData((prev) => ({ ...prev, avatar_url: filePath }));
      showToast("FOTO PROFIL BERHASIL DIPERBARUI!", "success");
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setUploading(false);
    }
  };

  // 🚀 LOGIKA SIMPAN NAMA & TELEPON
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          phone_number: formData.phone_number,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;
      showToast("PROFIL BERHASIL DISIMPAN!", "success");
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const publicAvatarUrl = formData.avatar_url
    ? supabase.storage.from("avatars").getPublicUrl(formData.avatar_url).data
        .publicUrl
    : null;

  return (
    <MobileLayout
      activeTab="account"
      onTabChange={(tab: string) => {
        if (tab === "home") navigate("/");
        if (tab === "orders") navigate("/order-history");
      }}
      onSearch={() => navigate("/")} // Redirect ke home untuk cari barang
      onCartClick={() => navigate("/checkout")}
      cartCount={cart.length}
    >
      <div className="min-h-screen bg-[#F8FAFC] pb-32 text-left font-sans font-black uppercase tracking-tighter not-italic">
        {/* HEADER CUSTOM */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-4 h-16 flex items-center gap-4">
          <button
            onClick={() => navigate("/customer-dashboard")}
            className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg active:scale-90 transition-all"
          >
            <ArrowLeft size={24} strokeWidth={3} />
          </button>
          <h1 className="text-[14px] font-black uppercase tracking-widest text-slate-800">
            PENGATURAN AKUN
          </h1>
        </header>

        <main className="max-w-[600px] mx-auto p-4 space-y-6">
          {/* SEKSI FOTO PROFIL VIP */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col items-center">
            <div className="relative group">
              <div className="w-28 h-28 bg-slate-100 rounded-full border-4 border-white shadow-md overflow-hidden flex items-center justify-center">
                {publicAvatarUrl ? (
                  <img
                    src={publicAvatarUrl}
                    className="w-full h-full object-cover"
                    alt="Avatar"
                  />
                ) : (
                  <User size={48} className="text-slate-300" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 p-2 bg-[#FF6600] text-white rounded-full border-4 border-white cursor-pointer hover:scale-110 transition-all shadow-lg active:scale-95">
                {uploading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Camera size={18} />
                )}
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleUploadAvatar}
                  disabled={uploading}
                />
              </label>
            </div>
            <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
              KETUK IKON KAMERA UNTUK UBAH FOTO
            </p>
          </section>

          {/* FORM DATA PRIBADI */}
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
              <h3 className="text-[11px] font-black text-[#008080] uppercase tracking-widest mb-2 flex items-center gap-2">
                <User size={16} /> INFORMASI PRIBADI
              </h3>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <User
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
                    size={16}
                  />
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        full_name: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-bold outline-none focus:border-[#008080] transition-all uppercase"
                    placeholder="NAMA LENGKAP ANDA"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Email (Tercatat)
                </label>
                <div className="relative opacity-60">
                  <Mail
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
                    size={16}
                  />
                  <input
                    type="email"
                    value={user?.email}
                    disabled
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-100 border border-slate-200 rounded-xl text-[12px] font-bold cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Nomor Telepon
                </label>
                <div className="relative">
                  <Phone
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
                    size={16}
                  />
                  <input
                    type="text"
                    value={formData.phone_number}
                    onChange={(e) =>
                      setFormData({ ...formData, phone_number: e.target.value })
                    }
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-bold outline-none focus:border-[#008080] transition-all"
                    placeholder="0812XXXX"
                  />
                </div>
              </div>
            </div>

            <button
              disabled={loading}
              className="w-full py-4 bg-[#008080] text-white rounded-xl font-black uppercase text-[12px] tracking-widest shadow-lg flex justify-center items-center gap-2 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Save size={18} />
              )}{" "}
              SIMPAN PROFIL
            </button>
          </form>

          {/* MENU PENGATURAN PRO LAINNYA */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <button
              onClick={() => navigate("/settings/address")}
              className="w-full flex items-center justify-between p-4 border-b border-slate-100 hover:bg-slate-50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-teal-50 text-[#008080] flex items-center justify-center group-hover:bg-[#008080] group-hover:text-white transition-colors">
                  <MapPin size={20} />
                </div>
                <div className="text-left">
                  <span className="block text-[12px] font-black text-slate-700 uppercase tracking-wide">
                    BUKU ALAMAT
                  </span>
                  <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                    KELOLA LOKASI PENGIRIMAN
                  </span>
                </div>
              </div>
              <ChevronRight
                size={18}
                className="text-slate-300 group-hover:text-[#008080] transition-all"
              />
            </button>

            <button
              onClick={() => showToast("FITUR KEAMANAN SEGERA HADIR", "info")}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-50 text-[#FF6600] flex items-center justify-center group-hover:bg-[#FF6600] group-hover:text-white transition-colors">
                  <Lock size={20} />
                </div>
                <div className="text-left">
                  <span className="block text-[12px] font-black text-slate-700 uppercase tracking-wide">
                    KEAMANAN AKUN
                  </span>
                  <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                    UBAH KATA SANDI & PIN
                  </span>
                </div>
              </div>
              <ChevronRight
                size={18}
                className="text-slate-300 group-hover:text-[#FF6600] transition-all"
              />
            </button>
          </div>
        </main>
      </div>
    </MobileLayout>
  );
};

export default AccountSettingsPage;
