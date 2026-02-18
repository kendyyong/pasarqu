import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

// --- PERBAIKAN: Import Path diarahkan ke folder 'src/hooks' ---
import { useCustomerDashboard } from "../../hooks/useCustomerDashboard";

// IMPORT UI COMPONENTS
import { CustomerHeader } from "./components/CustomerHeader";
import { CustomerOrderStatus } from "./components/CustomerOrderStatus";
import { CustomerSupportButton } from "./components/CustomerSupportButton";
import { CustomerMenuGrid } from "./components/CustomerMenuGrid";
import { CustomerActionButtons } from "./components/CustomerActionButtons";

export const CustomerDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  // PANGGIL HOOK (Data Stats sekarang Realtime dari Database!)
  const { stats, profile, loading } = useCustomerDashboard();

  const handleLogout = async () => {
    if (window.confirm("Keluar dari aplikasi?")) {
      await logout();
      navigate("/");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f1f5f9]">
        <Loader2 className="animate-spin text-teal-600" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f5f9] font-sans text-left">
      <div className="max-w-4xl mx-auto bg-white min-h-screen shadow-2xl shadow-slate-200">
        {/* HEADER */}
        <CustomerHeader profile={profile} />

        {/* MAIN CONTENT */}
        <div className="p-4 md:p-8 -mt-6 relative z-20 space-y-6">
          {/* Angka di sini sekarang Real, bukan dummy lagi */}
          <CustomerOrderStatus stats={stats} />

          <CustomerSupportButton />

          <CustomerMenuGrid />

          <CustomerActionButtons onLogout={handleLogout} />

          <p className="text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.5em] pt-6">
            PasarQu v2.0.26
          </p>
        </div>
      </div>
    </div>
  );
};
