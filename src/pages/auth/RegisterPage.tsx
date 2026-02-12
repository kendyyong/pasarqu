import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useToast } from "../../contexts/ToastContext";
import { Eye, EyeOff, User, Mail, Lock } from "lucide-react";
import { GoogleLoginButton } from "../../components/GoogleLoginButton";
import { AppLogo } from "../../components/AppLogo"; // Pastikan punya komponen ini, atau ganti text biasa

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Validasi Sederhana
      if (formData.password.length < 6)
        throw new Error("Password minimal 6 karakter");

      // 2. Daftar ke Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName, // Simpan nama di metadata
          },
        },
      });

      if (error) throw error;

      // 3. Simpan ke Tabel Profiles (Backup Data)
      if (data.user) {
        const { error: profileError } = await supabase.from("profiles").insert({
          id: data.user.id,
          name: formData.fullName,
          email: formData.email,
          role: "CUSTOMER",
          created_at: new Date().toISOString(),
        });

        if (profileError && profileError.code !== "23505") {
          console.error("Profile Error:", profileError);
        }
      }

      showToast("Pendaftaran Berhasil! Silakan Login.", "success");
      navigate("/login"); // Arahkan ke login agar user masuk manual
    } catch (error: any) {
      // Handle error duplikat
      let msg = error.message;
      if (msg.includes("already registered"))
        msg = "Email ini sudah terdaftar. Silakan Login.";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col font-sans">
      {/* --- HEADER ALA SHOPEE (Background Putih, Logo Tosca) --- */}
      <div className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Klik Logo kembali ke Beranda */}
            <div
              onClick={() => navigate("/")}
              className="cursor-pointer flex items-center gap-2"
            >
              <div className="text-2xl md:text-3xl font-black text-teal-600 tracking-tighter flex items-center gap-1">
                <span className="bg-teal-600 text-white px-1 rounded">P</span>{" "}
                PASARQU
              </div>
            </div>
            <div className="text-xl text-slate-800 hidden md:block mt-1">
              Daftar
            </div>
          </div>
          <Link
            to="/help"
            className="text-teal-600 text-sm font-bold hover:text-teal-700"
          >
            Butuh Bantuan?
          </Link>
        </div>
      </div>

      {/* --- BODY (Background Hijau Tosca) --- */}
      <div
        className="flex-1 flex items-center justify-center p-4 bg-teal-600"
        style={{
          backgroundImage: "linear-gradient(135deg, #0d9488 0%, #115e59 100%)",
        }}
      >
        {/* Container Card (Mirip Shopee: Gambar di kiri (opsional), Form di kanan) */}
        <div className="w-full max-w-[1000px] flex items-center justify-center md:justify-end">
          {/* Bagian Kiri (Slogan/Gambar - Hidden di Mobile) */}
          <div className="hidden md:flex flex-col text-white mr-16 max-w-md">
            <h1 className="text-5xl font-black mb-4">Pasarqu</h1>
            <p className="text-xl font-medium opacity-90">
              Platform belanja kebutuhan pasar terlengkap & termurah langsung
              dari petani lokal.
            </p>
          </div>

          {/* Bagian Kanan (Form Card Putih) */}
          <div className="bg-white w-full max-w-[420px] rounded-lg shadow-2xl overflow-hidden">
            <div className="p-8">
              <h2 className="text-xl font-bold text-slate-800 mb-6">
                Daftar Sekarang
              </h2>

              {/* Form Input */}
              <form onSubmit={handleRegister} className="space-y-4">
                {/* Nama Lengkap */}
                <div className="relative group">
                  <input
                    type="text"
                    name="fullName"
                    placeholder="Nama Lengkap"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-sm focus:outline-none focus:border-teal-600 focus:shadow-sm transition-all text-sm"
                    required
                  />
                  <User
                    className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-teal-600"
                    size={18}
                  />
                </div>

                {/* Email */}
                <div className="relative group">
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-sm focus:outline-none focus:border-teal-600 focus:shadow-sm transition-all text-sm"
                    required
                  />
                  <Mail
                    className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-teal-600"
                    size={18}
                  />
                </div>

                {/* Password */}
                <div className="relative group">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Password (Min. 6 Karakter)"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-10 py-3 border border-slate-300 rounded-sm focus:outline-none focus:border-teal-600 focus:shadow-sm transition-all text-sm"
                    required
                  />
                  <Lock
                    className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-teal-600"
                    size={18}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Tombol Daftar (Warna Oranye Khas CTA) */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-orange-500 text-white font-bold py-3 rounded-sm shadow-md hover:bg-orange-600 active:scale-[0.98] transition-all uppercase text-sm tracking-wide mt-2"
                >
                  {loading ? "Memproses..." : "DAFTAR"}
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-xs text-slate-400 uppercase">
                  <span className="bg-white px-2">Atau</span>
                </div>
              </div>

              {/* Tombol Google */}
              <div className="mb-6">
                <GoogleLoginButton />
              </div>

              {/* Footer Card */}
              <div className="text-center text-sm text-slate-600">
                Sudah punya akun?{" "}
                <Link
                  to="/login"
                  className="text-teal-600 font-bold hover:underline"
                >
                  Masuk
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
