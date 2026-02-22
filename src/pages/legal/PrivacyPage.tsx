import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
// 🚀 FIX PATH: Naik 2 tingkat ke folder 'src'
import { supabase } from "../../lib/supabaseClient";
import { ArrowLeft, ShieldCheck, RefreshCw } from "lucide-react";

export const PrivacyPage = () => {
  const navigate = useNavigate();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const { data, error } = await supabase
          .from("app_settings")
          .select("privacy_policy")
          .eq("id", 1)
          .single();

        if (error) throw error;
        if (data) setContent(data.privacy_policy);
      } catch (err) {
        console.error("GAGAL AMBIL PRIVASI:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, []);

  return (
    <div className="min-h-screen bg-white font-black uppercase tracking-tighter text-left">
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 h-[60px] bg-[#008080] text-white flex items-center px-4 z-50 shadow-lg">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-white/10 rounded-lg mr-4 transition-all"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-[16px] leading-none font-[1000] tracking-widest">
          KEBIJAKAN PRIVASI
        </h1>
      </header>

      {/* CONTENT */}
      <main className="pt-[90px] pb-10 px-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-3 text-[#008080] mb-8 border-l-4 border-[#FF6600] pl-4">
          <ShieldCheck size={32} strokeWidth={3} />
          <div>
            <h2 className="text-2xl leading-none font-[1000]">
              PRIVASI PENGGUNA
            </h2>
            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">
              DATA PROTECTION PASARQU 2026
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-20 gap-4">
            <RefreshCw className="animate-spin text-[#008080]" />
            <span className="text-[10px] text-slate-400 uppercase">
              MEMUAT KEBIJAKAN...
            </span>
          </div>
        ) : (
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-inner">
            <div className="text-[14px] leading-relaxed text-slate-700 whitespace-pre-wrap normal-case font-bold">
              {content || "ISI KEBIJAKAN PRIVASI BELUM DIATUR OLEH ADMIN."}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PrivacyPage;
