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
  Timer, // Icon untuk Pre-Order
  ShoppingBag,
} from "lucide-react";

// Tipe data untuk menu
export interface MenuItem {
  label: string;
  icon: JSX.Element;
  color: string;
  path?: string;
  action?: string;
  description?: string; // Tambahan untuk keterangan di promo box
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
    label: "Pre-Order", // FITUR BARU: Menggantikan Bantuan
    icon: <Timer size={18} />,
    color: "bg-amber-500",
    path: "/pre-order",
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
    label: "Zona",
    icon: <Globe size={18} />,
    color: "bg-blue-600",
    path: "/login/admin",
  },
  {
    label: "Ganti Pasar",
    icon: <MapPin size={18} />,
    color: "bg-rose-600",
    action: "RESET_MARKET",
  },
];

// 2. DATA PROMO BOX (3 ITEM DI BAWAH GRID)
export const PROMO_ITEMS: MenuItem[] = [
  {
    label: "Mulai Jualan",
    description: "Buka Toko Gratis",
    icon: <Store size={16} />,
    color: "bg-teal-600",
    path: "/promo/toko",
  },
  {
    label: "Daftar Kurir",
    description: "Cuan Tiap Antar",
    icon: <Bike size={16} />,
    color: "bg-orange-500",
    path: "/promo/kurir",
  },
  {
    label: "Mitra Zona",
    description: "Kelola Wilayah",
    icon: <Globe size={16} />,
    color: "bg-blue-600",
    path: "/promo/admin",
  },
];
