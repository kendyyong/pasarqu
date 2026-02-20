import { useState, useEffect } from "react";
import { useJsApiLoader } from "@react-google-maps/api";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";

const libraries: "places"[] = ["places"];

export const useSuperAdminDashboard = () => {
  const { user } = useAuth();
  
  const [isDark, setIsDark] = useState(() => localStorage.getItem("admin-theme") === "dark");

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem("admin-theme", newTheme ? "dark" : "light");
  };

  const currentTheme = isDark
    ? {
        bg: "bg-[#0b0f19]",
        card: "bg-[#0f172a]",
        border: "border-white/5",
        text: "text-slate-200",
        subText: "text-slate-500",
        header: "bg-[#0f172a]/80",
        sidebar: "bg-[#0f172a]",
      }
    : {
        bg: "bg-slate-50",
        card: "bg-white",
        border: "border-slate-200",
        text: "text-slate-800",
        subText: "text-slate-400",
        header: "bg-white/90",
        sidebar: "bg-white",
      };

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  // ✅ KEMBALI NORMAL: Default selalu ke dashboard saat pertama dimuat
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [auditMarket, setAuditMarket] = useState<any>(null);
  const [markets, setMarkets] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [complaintsCount, setComplaintsCount] = useState(0);
  const [finance, setFinance] = useState({ revenue: 0, orders: 0, active_markets: 0 });

  const fetchData = async () => {
    if (!user) return;
    try {
      const { data: mData } = await supabase.from("markets").select("*");
      setMarkets(mData || []);

      const { data: uData } = await supabase.from("profiles").select("*, markets(name)");
      setAllUsers(uData || []);
      
      setCandidates(uData?.filter((u: any) => u.role === "ADMIN_CANDIDATE" || (u.role === "LOCAL_ADMIN" && !u.is_verified)) || []);

      const { data: fData } = await supabase.rpc("get_financial_summary");
      if (fData?.[0]) setFinance(fData[0]);

      const { count } = await supabase.from("complaints").select("*", { count: "exact", head: true }).eq("status", "open");
      setComplaintsCount(count || 0);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  return {
    isDark, toggleTheme, currentTheme, isLoaded,
    activeTab, setActiveTab, auditMarket, setAuditMarket,
    markets, allUsers, candidates, complaintsCount, finance, fetchData
  };
};