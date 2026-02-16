import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "../lib/supabaseClient";

// --- DEFINISI TIPE DATA ---
export interface AppSettings {
  id: number | string;
  // Branding
  app_name: string;
  logo_url: string | null;
  primary_color: string;

  // Konfigurasi Bisnis
  appAdminFeePercentage: number;
  defaultAppFee: number;
  shippingCommissionPercentage: number;

  // Footer & System
  footerSlogan: string;
  footerCopyright: string;
  is_maintenance: boolean;
  min_wallet_limit: number;

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

// --- NILAI DEFAULT (Fallback) ---
const DEFAULT_CONFIG: AppSettings = {
  id: 1,
  app_name: "Pasarqu",
  logo_url: null,
  primary_color: "#059669",
  appAdminFeePercentage: 1.5,
  defaultAppFee: 2000,
  shippingCommissionPercentage: 10,
  footerSlogan: "E-Commerce Lokal Presisi",
  footerCopyright: `© ${new Date().getFullYear()} Pasarqu Ecosystem. All rights reserved.`,
  is_maintenance: false,
  min_wallet_limit: 50000,
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
  appConfig: AppSettings | null;
  loading: boolean;
  refreshConfig: () => Promise<void>;
  updateConfig: (newConfig: Partial<AppSettings>) => void;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [appConfig, setAppConfig] = useState<AppSettings | null>(
    DEFAULT_CONFIG,
  );
  const [loading, setLoading] = useState(true);

  // --- FUNGSI AMBIL DATA DARI SUPABASE ---
  const fetchSettings = async () => {
    // Jangan set loading true di sini jika hanya refresh,
    // agar layar tidak kedap-kedip saat simpan di admin.
    try {
      const { data, error } = await supabase
        .from("app_settings")
        .select("*")
        .eq("id", 1)
        .single();

      if (error) {
        console.warn("Menggunakan config default:", error.message);
        setAppConfig(DEFAULT_CONFIG);
        return;
      }

      if (data) {
        // ✅ LOGIKA CACHE BUSTER:
        // Menambahkan timestamp pada URL logo agar browser dipaksa
        // mendownload ulang jika logo baru saja diganti.
        const freshLogoUrl = data.logo_url
          ? `${data.logo_url}?t=${new Date().getTime()}`
          : null;

        setAppConfig({
          ...DEFAULT_CONFIG,
          ...data,
          app_name: data.app_name || DEFAULT_CONFIG.app_name,
          logo_url: freshLogoUrl, // Gunakan URL yang sudah di-refresh
          primary_color: data.primary_color || DEFAULT_CONFIG.primary_color,
        });

        console.log("✅ Branding Terbaru Berhasil Dimuat:", data.app_name);
      }
    } catch (err) {
      console.error("Gagal memuat config:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateConfig = (newConfig: Partial<AppSettings>) => {
    setAppConfig((prev) => (prev ? { ...prev, ...newConfig } : null));
  };

  return (
    <ConfigContext.Provider
      value={{ appConfig, loading, refreshConfig: fetchSettings, updateConfig }}
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
