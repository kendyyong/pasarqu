import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Loader2 } from "lucide-react";

// ✅ KABEL PENTING: Mengimpor MarketplaceApp dari folder pages
import { MarketplaceApp } from "../pages/MarketplaceApp";

export const RoleBasedRedirect = () => {
  const { profile, loading, user } = useAuth();

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center bg-white font-sans text-teal-600">
        <Loader2 className="animate-spin" size={40} />
      </div>
    );

  if (!user) return <MarketplaceApp />;

  switch (profile?.role) {
    case "SUPER_ADMIN":
      return <Navigate to="/super-admin" replace />;
    case "MERCHANT":
      return <Navigate to="/merchant-dashboard" replace />;
    case "COURIER":
      return <Navigate to="/courier-dashboard" replace />;
    case "LOCAL_ADMIN":
      return <Navigate to="/admin-wilayah" replace />;
    default:
      return <MarketplaceApp />;
  }
};
