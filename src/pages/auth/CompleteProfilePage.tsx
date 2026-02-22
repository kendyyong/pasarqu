import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useToast } from "../../contexts/ToastContext";
import {
  User,
  Camera,
  ChevronRight,
  Loader2,
  CheckCircle2,
  Image as ImageIcon,
} from "lucide-react";

export const CompleteProfilePage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName) return showToast("NAMA LENGKAP WAJIB DIISI", "error");

    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("USER TIDAK DITEMUKAN");

      let avatarUrl = "";

      // 1. UPLOAD FOTO JIKA ADA
      if (image) {
        const fileExt = image.name.split(".").pop();
        const fileName = `${user.id}-${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, image);

        if (uploadError) throw uploadError;
        avatarUrl = fileName;
      }

      // 2. UPDATE TABEL PROFILES
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      showToast("PROFIL BERHASIL DILENGKAPI!", "success");
      navigate("/customer-dashboard");
    } catch (err: any) {
      showToast(err.message.toUpperCase(), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] md:bg-[#008080] flex flex-col items-center justify-center p-0 md:p-6 font-black uppercase tracking-tighter text-left">
      <div className="w-full max-w-md bg-white md:rounded-[2.5rem] md:shadow-2xl overflow-hidden min-h-screen md:min-h-0 flex flex-col">
        <div className="p-8 flex-1 flex flex-col justify-center">
          <div className="mb-8">
            <h1 className="text-3xl font-[1000] text-slate-900 leading-none uppercase">
              LENGKAPI
              <br />
              IDENTITAS
            </h1>
            <p className="text-[10px] text-slate-400 mt-2 tracking-widest uppercase font-bold">
              AGAR PENGALAMAN BELANJA LEBIH PERSONAL
            </p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-8">
            {/* UPLOAD FOTO AREA */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative group">
                <div className="w-32 h-32 bg-slate-100 rounded-[2rem] border-4 border-slate-50 overflow-hidden flex items-center justify-center shadow-inner relative">
                  {preview ? (
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={48} className="text-slate-300" />
                  )}
                  <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-all">
                    <Camera className="text-white" size={24} />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </label>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-[#FF6600] text-white p-2 rounded-xl shadow-lg">
                  <Camera size={16} />
                </div>
              </div>
              <span className="text-[9px] text-slate-400 tracking-widest">
                TAP FOTO UNTUK MENGGANTI
              </span>
            </div>

            {/* INPUT NAMA */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] text-slate-400 tracking-widest uppercase ml-1">
                  NAMA LENGKAP SESUAI KTP
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="CONTOH: BUDI SANTOSO"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[14px] font-black outline-none focus:border-[#008080] transition-all"
                  />
                  {fullName.length > 3 && (
                    <CheckCircle2
                      size={18}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-teal-500"
                    />
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl text-[12px] font-[1000] shadow-xl hover:bg-[#008080] active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-[0.2em] disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                "SIMPAN & MULAI BELANJA"
              )}{" "}
              <ChevronRight size={18} />
            </button>
          </form>
        </div>

        <div className="p-6 bg-slate-50 border-t-2 border-slate-100">
          <div className="flex items-center gap-3 justify-center">
            <ImageIcon size={14} className="text-slate-300" />
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
              FOTO ANDA AKAN DILIHAT OLEH PEDAGANG & KURIR.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfilePage;
