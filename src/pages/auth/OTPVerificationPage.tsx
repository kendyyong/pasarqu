import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import {
  ArrowLeft,
  ShieldCheck,
  RefreshCw,
  MessageCircle,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useToast } from "../../contexts/ToastContext";

export const OTPVerificationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const phoneNumber = location.state?.phone || "";
  const redirectTarget = location.state?.redirect || "/customer-dashboard";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(60);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!phoneNumber) navigate("/register");
  }, [phoneNumber, navigate]);

  useEffect(() => {
    const interval = setInterval(
      () => setTimer((prev) => (prev > 0 ? prev - 1 : 0)),
      1000,
    );
    return () => clearInterval(interval);
  }, []);

  const handleOtpChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0)
      inputRefs.current[index - 1]?.focus();
  };

  // 🚀 LOGIKA VERIFIKASI + LOGIN OTOMATIS
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otp.join("");
    if (fullOtp.length < 6) {
      showToast("MASUKKAN 6 DIGIT KODE LENGKAP", "error");
      return;
    }

    setIsVerifying(true);
    try {
      // 1. Verifikasi Kode
      const { data, error: rpcError } = await supabase.rpc(
        "verify_otp_secure",
        {
          p_phone: "62" + phoneNumber,
          p_code: fullOtp,
        },
      );

      if (rpcError) throw rpcError;

      if (data.success) {
        // 2. LOGIN OTOMATIS KE SUPABASE AUTH
        const virtualEmail = `${phoneNumber}@pasarqu.com`;
        const secretPassword = `PASS_OTP_${phoneNumber}_2026`;

        let { error: loginError } = await supabase.auth.signInWithPassword({
          email: virtualEmail,
          password: secretPassword,
        });

        if (loginError) {
          const { error: signUpError } = await supabase.auth.signUp({
            email: virtualEmail,
            password: secretPassword,
            options: {
              data: { phone_number: "62" + phoneNumber, role: "CUSTOMER" },
            },
          });
          if (signUpError) throw signUpError;
          await supabase.auth.signInWithPassword({
            email: virtualEmail,
            password: secretPassword,
          });
        }

        showToast("VERIFIKASI SUKSES! LANJUT KE PEMBAYARAN...", "success");

        // 3. 🎯 REDIRECT KE TUJUAN AWAL (/checkout)
        const finalPath = redirectTarget.startsWith("/")
          ? redirectTarget
          : `/${redirectTarget}`;
        setTimeout(() => navigate(finalPath, { replace: true }), 1000);
      } else {
        throw new Error(data.message);
      }
    } catch (err: any) {
      showToast(err.message.toUpperCase(), "error");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0 || isResending) return;
    setIsResending(true);
    try {
      const { data: otpData } = await supabase.rpc("generate_otp_secure", {
        p_phone: "62" + phoneNumber,
      });
      await supabase.functions.invoke("send-wa-otp", {
        body: { phone: "62" + phoneNumber, otp: otpData.otp_code },
      });
      setTimer(60);
      showToast("KODE BARU DIKIRIM", "success");
    } catch (err) {
      showToast("GAGAL KIRIM ULANG", "error");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] md:bg-[#008080] flex flex-col items-center justify-center p-0 md:p-6 font-black uppercase tracking-tighter text-left relative">
      <div className="w-full max-w-md bg-white md:rounded-[2.5rem] md:shadow-2xl overflow-hidden min-h-screen md:min-h-0 flex flex-col">
        <div className="p-6 border-b-4 border-slate-100 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-[#008080]"
          >
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1 className="text-[16px] leading-none font-[1000] text-slate-900 uppercase">
              VERIFIKASI OTP
            </h1>
            <p className="text-[9px] text-slate-400 mt-1 tracking-widest uppercase font-bold">
              KEAMANAN PASARQU
            </p>
          </div>
        </div>
        <div className="p-8 flex-1 flex flex-col justify-center">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-teal-50 text-[#008080] rounded-2xl flex items-center justify-center mx-auto mb-4 border-2 border-teal-100">
              <ShieldCheck size={32} />
            </div>
            <h2 className="text-[14px] text-slate-900 leading-tight normal-case font-bold">
              KODE 6-DIGIT DIKIRIM VIA{" "}
              <span className="text-[#008080] font-black uppercase">
                WHATSAPP
              </span>{" "}
              KE:
            </h2>
            <div className="mt-3 flex items-center justify-center gap-2 text-slate-900 text-[18px] font-[1000]">
              <MessageCircle size={20} className="text-[#008080]" />
              <span>+62 {phoneNumber}</span>
            </div>
          </div>
          <form onSubmit={handleVerify} className="space-y-8">
            <div className="flex justify-between gap-2">
              {otp.map((data, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength={1}
                  ref={(el) => (inputRefs.current[index] = el)}
                  value={data}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  disabled={isVerifying}
                  className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-xl text-center text-[20px] font-black text-[#008080] outline-none focus:border-[#FF6600] focus:bg-white"
                />
              ))}
            </div>
            <div className="space-y-3">
              <button
                type="submit"
                disabled={isVerifying || otp.join("").length < 6}
                className="w-full bg-[#008080] text-white py-4 rounded-xl text-[12px] font-[1000] shadow-md uppercase tracking-[0.2em] disabled:opacity-50"
              >
                {isVerifying ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  "VERIFIKASI SEKARANG"
                )}{" "}
                <ChevronRight size={18} />
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={timer > 0 || isVerifying || isResending}
                className={`w-full py-4 text-[10px] font-black tracking-widest uppercase flex items-center justify-center gap-2 transition-all rounded-xl border-2 ${timer > 0 || isResending ? "text-slate-400 border-slate-100 bg-slate-50" : "text-[#FF6600] border-orange-100 bg-orange-50"}`}
              >
                {isResending ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : (
                  <RefreshCw
                    size={14}
                    className={timer > 0 ? "" : "animate-spin-slow"}
                  />
                )}
                {isResending
                  ? "MENGIRIM..."
                  : timer > 0
                    ? `KIRIM ULANG (${timer}s)`
                    : "KIRIM ULANG WA"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OTPVerificationPage;
