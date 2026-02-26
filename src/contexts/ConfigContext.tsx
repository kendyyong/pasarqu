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
  appConfig: AppSettings; // 🚀 FIX: Dibuat PASTI ADA (tidak boleh null) untuk mencegah blank
  loading: boolean;
  refreshConfig: () => Promise<void>;
  updateConfig: (newConfig: Partial<AppSettings>) => void;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // 🚀 FIX: Inisialisasi tidak akan pernah null
  const [appConfig, setAppConfig] = useState<AppSettings>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);

  // --- FUNGSI AMBIL DATA DARI SUPABASE ---
  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("app_settings")
        .select("*")
        .eq("id", 1)
        .single();

      if (error) {
        console.warn("Menggunakan config default karena:", error.message);
        setAppConfig(DEFAULT_CONFIG);
        return;
      }

      if (data) {
        // ✅ LOGIKA CACHE BUSTER
        const freshLogoUrl = data.logo_url
          ? `${data.logo_url}?t=${new Date().getTime()}`
          : null;

        // 🚀 FIX: PARSING SUPER AMAN UNTUK OBJEK (MENCEGAH BLANK SCREEN)
        let safeBankAccount = DEFAULT_CONFIG.bankAccount;
        if (data.bankAccount) {
          if (typeof data.bankAccount === "string") {
            try {
              safeBankAccount = JSON.parse(data.bankAccount);
            } catch (e) {}
          } else if (typeof data.bankAccount === "object") {
            safeBankAccount = {
              ...DEFAULT_CONFIG.bankAccount,
              ...data.bankAccount,
            };
          }
        }

        let safeShippingRates = DEFAULT_CONFIG.defaultShippingRates;
        if (data.defaultShippingRates) {
          if (typeof data.defaultShippingRates === "string") {
            try {
              safeShippingRates = JSON.parse(data.defaultShippingRates);
            } catch (e) {}
          } else if (typeof data.defaultShippingRates === "object") {
            safeShippingRates = {
              ...DEFAULT_CONFIG.defaultShippingRates,
              ...data.defaultShippingRates,
            };
          }
        }

        // 🚀 SETTING DATA FINAL (Pelapis Baja)
        setAppConfig({
          ...DEFAULT_CONFIG,
          ...data, // Timpa dengan data DB

          // TAPI kita timpa balik kolom berbahaya agar tidak null!
          app_name: data.app_name || DEFAULT_CONFIG.app_name,
          logo_url: freshLogoUrl,
          primary_color: data.primary_color || DEFAULT_CONFIG.primary_color,

          bankAccount: safeBankAccount, // Pasti berbentuk objek, tidak akan pernah null
          defaultShippingRates: safeShippingRates, // Pasti berbentuk objek, tidak akan pernah null

          appAdminFeePercentage:
            data.appAdminFeePercentage ?? DEFAULT_CONFIG.appAdminFeePercentage,
          defaultAppFee: data.defaultAppFee ?? DEFAULT_CONFIG.defaultAppFee,
          shippingCommissionPercentage:
            data.shippingCommissionPercentage ??
            DEFAULT_CONFIG.shippingCommissionPercentage,
          min_wallet_limit:
            data.min_wallet_limit ?? DEFAULT_CONFIG.min_wallet_limit,
        });

        console.log("✅ Config Terbaru Berhasil Dimuat:", data.app_name);
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
    setAppConfig((prev) => ({ ...prev, ...newConfig }));
  };

  return (
    <ConfigContext.Provider
      value={{ appConfig, loading, refreshConfig: fetchSettings, updateConfig }}
    >
      {/* Jika aplikasi masih meload config pertama kali, tampilkan anak-anaknya menggunakan DEFAULT_CONFIG agar layar tidak pernah blank! */}
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
