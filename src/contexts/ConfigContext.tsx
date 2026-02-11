import React, { createContext, useContext, useState, ReactNode } from 'react';

// Definisi Interface Langsung di sini agar sinkron dengan komponen UI
export interface GlobalConfig {
  id: string;
  appAdminFeePercentage: number;
  defaultAppFee: number;
  shippingCommissionPercentage: number;
  
  // Branding & Footer (Penambahan untuk fix error MarketSelection)
  footerBrandName: string;
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

// Default configuration dengan data lengkap
const DEFAULT_CONFIG: GlobalConfig = {
  id: 'config_main',
  appAdminFeePercentage: 1.5,
  defaultAppFee: 2000,
  shippingCommissionPercentage: 10,
  
  // Data Branding Default
  footerBrandName: "PASARMJ",
  footerSlogan: "E-Commerce Lokal Presisi",
  footerCopyright: "© 2026 Pasarqu Ecosystem. All rights reserved.",

  bankAccount: {
    bankName: 'BCA',
    accountNumber: '8830-1234-5678',
    holderName: 'PT PASAR KECAMATAN INDONESIA'
  },
  allowLocalAdminVerification: true,

  defaultShippingRates: {
    tier1: { maxDistance: 3, price: 5000 },
    tier2: { maxDistance: 7, price: 8000 },
    tier3: { maxDistance: 15, price: 12000 },
  }
};

interface ConfigContextType {
  config: GlobalConfig;
  updateConfig: (newConfig: GlobalConfig) => void;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<GlobalConfig>(DEFAULT_CONFIG);

  const updateConfig = (newConfig: GlobalConfig) => {
    setConfig(newConfig);
    console.log('Global Config Updated:', newConfig);
  };

  return (
    <ConfigContext.Provider value={{ config, updateConfig }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};