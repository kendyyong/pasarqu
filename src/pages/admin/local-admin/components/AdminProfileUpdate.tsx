import React, { useEffect, useState } from "react";
import {
  User,
  Phone,
  CreditCard,
  MapPin,
  ShieldCheck,
  Save,
  Loader2,
  Landmark,
  Fingerprint,
  AlertCircle,
  Camera,
  Upload,
  X,
  CheckCircle,
  Mail,
} from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";
import { useAuth } from "../../../../contexts/AuthContext";
import { useToast } from "../../../../contexts/ToastContext";

interface InputGroupProps {
  label: string;
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}

export const AdminProfileUpdate = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    nik: "",
    address_detail: "",
    bank_name: "",
    bank_account_number: "",
    bank_account_name: "",
    ktp_image_url: "",
  });

  const [ktpPreview, setKtpPreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setFormData({
            full_name: data.full_name || "",
            email: data.email || user.email || "",
            phone_number: data.phone_number || "",
            nik: data.nik || "",
            address_detail: data.address_detail || "",
            bank_name: data.bank_name || "",
            bank_account_number: data.bank_account_number || "",
            bank_account_name: data.bank_account_name || "",
            ktp_image_url: data.ktp_image_url || "",
          });
          if (data.ktp_image_url) setKtpPreview(data.ktp_image_url);
        }
      } catch (err) {
        console.error("Error fetching admin profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleUploadKTP = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) return showToast("Maksimal 2MB!", "error");

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `ktp/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from("identity_cards")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("identity_cards").getPublicUrl(filePath);
      setFormData((prev) => ({ ...prev, ktp_image_url: publicUrl }));
      setKtpPreview(publicUrl);
      showToast("KTP Berhasil diunggah!", "success");
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.nik.length < 16)
      return showToast("NIK 16 digit wajib!", "error");
    if (!formData.ktp_image_url) return showToast("Unggah KTP dulu!", "error");
    if (!formData.email.includes("@"))
      return showToast("Email tidak valid!", "error");

    setSaving(true);
    try {
      // 🚀 UPDATE TABEL PROFIL (Metadata)
      // Karena kita sudah menanam SQL Trigger di Database, begitu tabel ini terupdate,
      // Supabase Auth (Kunci Pintu) akan otomatis disinkronisasi oleh Database.
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          ...formData,
          updated_at: new Date().toISOString(),
          is_profile_complete: true, // 🚀 Tandai Selesai
        })
        .eq("id", user?.id);

      if (profileError) throw profileError;

      showToast("Data Admin Berhasil Disimpan!", "success");

      // 🚀 REFRESH OTOMATIS
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-[#008080]" size={32} />
      </div>
    );

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-r-xl flex gap-3 text-left">
        <AlertCircle className="text-orange-500 shrink-0" size={20} />
        <div>
          <h4 className="text-sm font-black text-orange-900 uppercase">
            Perhatian Penting
          </h4>
          <p className="text-[10px] text-orange-800 mt-0.5 font-bold">
            Data Anda akan diverifikasi. Jika Anda mengubah Email, gunakan email
            baru tersebut untuk login.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 text-left">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-teal-50 rounded-lg text-[#008080]">
              <Fingerprint size={20} />
            </div>
            <h3 className="text-sm font-black text-slate-700 uppercase">
              Kredensial & Identitas
            </h3>
          </div>

          <div className="mb-6">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
              Foto KTP Asli
            </label>
            <div className="mt-2 relative border-2 border-dashed border-slate-200 rounded-2xl overflow-hidden bg-slate-50 aspect-[16/9] flex items-center justify-center hover:border-[#008080] transition-colors">
              {ktpPreview ? (
                <img
                  src={ktpPreview}
                  className="w-full h-full object-cover"
                  alt="KTP"
                />
              ) : (
                <label className="cursor-pointer text-center p-10 w-full h-full flex flex-col items-center justify-center">
                  <Upload className="text-slate-300 mb-2" size={32} />
                  <span className="text-[10px] font-black text-slate-400 uppercase">
                    Klik Untuk Pilih Foto
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleUploadKTP}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputGroup
              label="Nama Lengkap"
              icon={<User size={18} />}
              placeholder="Nama Sesuai KTP"
              value={formData.full_name}
              onChange={(v) => setFormData({ ...formData, full_name: v })}
            />
            <InputGroup
              label="Email Login"
              icon={<Mail size={18} />}
              type="email"
              placeholder="admin@mail.com"
              value={formData.email}
              onChange={(v) => setFormData({ ...formData, email: v })}
            />
            <InputGroup
              label="No. WhatsApp"
              icon={<Phone size={18} />}
              placeholder="0812..."
              value={formData.phone_number}
              onChange={(v) => setFormData({ ...formData, phone_number: v })}
            />
            <InputGroup
              label="NIK"
              icon={<ShieldCheck size={18} />}
              placeholder="16 Digit NIK"
              value={formData.nik}
              onChange={(v) => setFormData({ ...formData, nik: v })}
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 text-left">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-orange-50 rounded-lg text-[#FF6600]">
              <Landmark size={20} />
            </div>
            <h3 className="text-sm font-black text-slate-700 uppercase">
              Rekening Pencairan
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputGroup
              label="Nama Bank"
              icon={<Landmark size={18} />}
              placeholder="BCA / BRI / Mandiri"
              value={formData.bank_name}
              onChange={(v) => setFormData({ ...formData, bank_name: v })}
            />
            <InputGroup
              label="No. Rekening"
              icon={<CreditCard size={18} />}
              placeholder="0000000000"
              value={formData.bank_account_number}
              onChange={(v) =>
                setFormData({ ...formData, bank_account_number: v })
              }
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving || uploading}
          className="w-full bg-[#008080] text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all disabled:bg-slate-300"
        >
          {saving ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <Save size={20} />
          )}
          VERIFIKASI & SIMPAN DATA
        </button>
      </form>
    </div>
  );
};

const InputGroup: React.FC<InputGroupProps> = ({
  label,
  icon,
  placeholder,
  value,
  onChange,
  type = "text",
}) => (
  <div className="flex flex-col gap-1">
    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
      {label}
    </label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
        {icon}
      </div>
      <input
        type={type}
        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium focus:border-[#008080] outline-none transition-all focus:bg-white"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  </div>
);
