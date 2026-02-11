import React from "react";
import {
  Zap,
  Ticket,
  CreditCard,
  Gift,
  Truck,
  Store,
  Bike,
  Shield,
  Globe,
  MapPin,
} from "lucide-react";

// Tipe data untuk menu agar TypeScript tidak komplain
export interface MenuItem {
  label: string;
  icon: JSX.Element;
  color: string;
  path?: string; // Untuk link navigasi
  action?: string; // Untuk tombol khusus (seperti Ganti Pasar)
}

// 1. DATA MENU GRID UTAMA (10 ITEM)
export const MAIN_MENUS: MenuItem[] = [
  {
    label: "Flash Sale",
    icon: <Zap size={18} />,
    color: "bg-orange-500",
    path: "/flash-sale",
  },
  {
    label: "Voucher",
    icon: <Ticket size={18} />,
    color: "bg-teal-500",
    path: "/voucher",
  },
  {
    label: "Isi Saldo",
    icon: <CreditCard size={18} />,
    color: "bg-slate-900",
    path: "/wallet",
  },
  {
    label: "Hadiah",
    icon: <Gift size={18} />,
    color: "bg-pink-500",
    path: "/rewards",
  },
  {
    label: "Paket",
    icon: <Truck size={18} />,
    color: "bg-emerald-500",
    path: "/orders",
  },
  {
    label: "Toko",
    icon: <Store size={18} />,
    color: "bg-teal-600",
    path: "/login/toko",
  },
  {
    label: "Kurir",
    icon: <Bike size={18} />,
    color: "bg-orange-600",
    path: "/login/kurir",
  },
  {
    label: "Bantuan",
    icon: <Shield size={18} />,
    color: "bg-slate-400",
    path: "/help",
  },
  {
    label: "Zona",
    icon: <Globe size={18} />,
    color: "bg-blue-600",
    path: "/login/admin",
  },
  // Tombol Khusus Ganti Pasar
  {
    label: "Ganti Pasar",
    icon: <MapPin size={18} />,
    color: "bg-rose-600",
    action: "RESET_MARKET", // Kode khusus untuk dideteksi di App.tsx
  },
];

// 2. DATA PROMO BOX (3 ITEM DI BAWAH GRID)
export const PROMO_ITEMS = [
  {
    label: "Mulai Jualan",
    icon: <Store size={16} />,
    color: "text-teal-700",
    borderColor: "hover:border-teal-400",
    path: "/promo/toko",
  },
  {
    label: "Daftar Kurir",
    icon: <Bike size={16} />,
    color: "text-orange-700",
    borderColor: "hover:border-orange-400",
    path: "/promo/kurir",
  },
  {
    label: "Mitra Zona",
    icon: <Globe size={16} />,
    color: "text-blue-700",
    borderColor: "hover:border-blue-400",
    path: "/promo/admin",
  },
];
