import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "../lib/supabaseClient";

// --- DEFINISI TIPE DATA ---
export interface GlobalConfig {
  id: string;
  // --- BRANDING DINAMIS (Dari Database) ---
  appName: string;
  logoUrl: string | null;
  primaryColor: string;

  // --- CONFIGURASI BISNIS (Bisa statis atau nanti dari DB juga) ---
  appAdminFeePercentage: number;
  defaultAppFee: number;
  shippingCommissionPercentage: number;

  // Footer Text
  footerSlogan: string;
  footerCopyright: string;

  // Payment Configuration
  bankAccount: {
    bankName: string;
    accountNumber: string;
    holderName: string;
  };
  allowLocalAdminVerification: boolean;

  // Default Template for NEW markets
  defaultShippingRates: {
    tier1: { maxDistance: number; price: number };
    tier2: { maxDistance: number; price: number };
    tier3: { maxDistance: number; price: number };
  };
}

// --- NILAI DEFAULT (Fallback jika internet mati/DB kosong) ---
const DEFAULT_CONFIG: GlobalConfig = {
  id: "config_main",

  // Default Branding
  appName: "Pasarqu",
  logoUrl: null,
  primaryColor: "#059669", // Emerald default

  appAdminFeePercentage: 1.5,
  defaultAppFee: 2000,
  shippingCommissionPercentage: 10,

  footerSlogan: "E-Commerce Lokal Presisi",
  footerCopyright: `© ${new Date().getFullYear()} Pasarqu Ecosystem. All rights reserved.`,

  bankAccount: {
    bankName: "BCA",
    accountNumber: "8830-1234-5678",
    holderName: "PT PASAR KECAMATAN INDONESIA",
  },
  allowLocalAdminVerification: true,

  defaultShippingRates: {
    tier1: { maxDistance: 3, price: 5000 },
    tier2: { maxDistance: 7, price: 8000 },
    tier3: { maxDistance: 15, price: 12000 },
  },
};

interface ConfigContextType {
  config: GlobalConfig;
  refreshConfig: () => Promise<void>; // Fungsi untuk reload data dari DB
  updateConfig: (newConfig: Partial<GlobalConfig>) => void; // Update state lokal
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [config, setConfig] = useState<GlobalConfig>(DEFAULT_CONFIG);

  // --- FUNGSI AMBIL DATA DARI SUPABASE ---
  const fetchSettings = async () => {
    try {
      // Ambil data dari tabel app_settings (ID 1)
      const { data, error } = await supabase
        .from("app_settings")
        .select("*")
        .eq("id", 1)
        .single();

      if (error) {
        console.warn(
          "Menggunakan config default (DB belum diset).",
          error.message,
        );
        return;
      }

      if (data) {
        // Gabungkan data DB dengan data statis yang lain
        setConfig((prev) => ({
          ...prev,
          appName: data.app_name || prev.appName,
          logoUrl: data.logo_url || prev.logoUrl,
          primaryColor: data.primary_color || prev.primaryColor,
        }));
        console.log("✅ Branding dimuat dari Database:", data.app_name);
      }
    } catch (err) {
      console.error("Gagal memuat config:", err);
    }
  };

  // --- LOAD SAAT APLIKASI PERTAMA DIBUKA ---
  useEffect(() => {
    fetchSettings();
  }, []);

  const updateConfig = (newConfig: Partial<GlobalConfig>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
  };

  return (
    <ConfigContext.Provider
      value={{ config, refreshConfig: fetchSettings, updateConfig }}
    >
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error("useConfig must be used within a ConfigProvider");
  }
  return context;
};
