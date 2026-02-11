import {
  User,
  Product,
  Market,
  UserRole,
  StoreProfile,
  PromoPackage,
  SubscriptionType,
} from "./src/types";

// --- 1. MARKETS ---
export const MOCK_MARKETS: Market[] = [
  {
    id: "mkt_mj",
    name: "Pasar Muara Jawa",
    brandName: "Muara Jawa",
    district: "Muara Jawa",
    latitude: -0.817,
    longitude: 117.236,
    isActive: true,
    assignedAdminEmail: "admin_mj",
    appAdminFee: 2000,
    localAdminSharePercentage: 70,
    city: "Kutai Kartanegara",
    image_url:
      "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&w=800&q=80",
    shippingRates: {
      tier1: { maxDistance: 3, price: 5000 },
      tier2: { maxDistance: 6, price: 8000 },
      tier3: { maxDistance: 10, price: 12000 },
    },
  },
  {
    id: "mkt_mb",
    name: "Pasar Muara Badak",
    brandName: "Muara Badak",
    district: "Muara Badak",
    latitude: -0.322,
    longitude: 117.433,
    isActive: true,
    assignedAdminEmail: "admin_mb",
    appAdminFee: 2500,
    localAdminSharePercentage: 60,
    city: "Kutai Kartanegara",
    image_url:
      "https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=800&q=80",
    shippingRates: {
      tier1: { maxDistance: 3, price: 6000 },
      tier2: { maxDistance: 7, price: 9000 },
      tier3: { maxDistance: 12, price: 15000 },
    },
  },
];

// --- 2. USERS ---
export const MOCK_USERS: User[] = [
  {
    id: "super_admin",
    name: "Super Admin",
    email: "super",
    password: "admin",
    role: UserRole.SUPER_ADMIN,
    phoneNumber: "08110000000",
    status: "active",
    createdAt: new Date().toISOString(),
  },
  {
    id: "u_admin_mj",
    name: "Admin Muara Jawa",
    email: "admin_mj",
    password: "123",
    role: UserRole.LOCAL_ADMIN,
    marketId: "mkt_mj",
    managedMarketId: "mkt_mj",
    phoneNumber: "081211112222",
    status: "active",
    createdAt: new Date().toISOString(),
  },
  {
    id: "u_toko_sembako_mj",
    name: "Toko Sembako MJ",
    email: "toko_mj",
    password: "123",
    role: UserRole.SELLER,
    marketId: "mkt_mj",
    phoneNumber: "081233334444",
    status: "active",
    createdAt: new Date().toISOString(),
    walletBalance: 500000,
  },
  {
    id: "u_budi_kurir",
    name: "Budi Kurir",
    email: "budi_kurir",
    password: "123",
    role: UserRole.COURIER,
    marketId: "mkt_mj",
    phoneNumber: "081255556666",
    status: "active",
    createdAt: new Date().toISOString(),
    walletBalance: 100000,
  },
  {
    id: "u_pembeli_mj",
    name: "Ani Pembeli",
    email: "pembeli",
    password: "123",
    role: UserRole.BUYER,
    marketId: "mkt_mj",
    phoneNumber: "081299998888",
    status: "active",
    createdAt: new Date().toISOString(),
    walletBalance: 0,
    address: "Jl. Melati No. 5, Muara Jawa",
  },
];

// --- 3. SELLERS PROFILE ---
export const MOCK_SELLERS: StoreProfile[] = [
  {
    userId: "u_toko_sembako_mj",
    marketId: "mkt_mj",
    storeName: "Toko Sembako Jaya MJ",
    description: "Sembako murah lengkap di Muara Jawa",
    isOpen: true,
    rating: 4.8,
    isVerified: true,
    latitude: -0.818,
    longitude: 117.237,
    address: "Jl. Ahmad Yani No. 5, Muara Jawa",
  },
];

// --- 4. PRODUCTS (DUA-DUANYA DISISI AGAR TIDAK ERROR) ---
export const MOCK_PRODUCTS: Product[] = [
  {
    id: "prod_mj_beras",
    merchant_id: "u_toko_sembako_mj",
    sellerId: "u_toko_sembako_mj", // TAMBAHKAN INI AGAR TYPESCRIPT PUAS
    marketId: "mkt_mj",
    name: "Beras Premium 5kg",
    description: "Beras pulen tanpa pemutih.",
    price: 65000,
    stock: 50,
    unit: "karung",
    category: "Sembako",
    images: [
      "https://placehold.co/400x400/dcfce7/166534?text=Beras+Premium+5kg",
    ],
    image_url:
      "https://placehold.co/400x400/dcfce7/166534?text=Beras+Premium+5kg",
    soldCount: 20,
    rating: 5.0,
    isPromoted: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "prod_mj_minyak",
    merchant_id: "u_toko_sembako_mj",
    sellerId: "u_toko_sembako_mj", // TAMBAHKAN INI
    marketId: "mkt_mj",
    name: "Minyak Goreng 2L",
    description: "Minyak goreng jernih.",
    price: 35000,
    stock: 30,
    unit: "pouch",
    category: "Sembako",
    images: [
      "https://placehold.co/400x400/fef9c3/854d0e?text=Minyak+Goreng+2L",
    ],
    image_url:
      "https://placehold.co/400x400/fef9c3/854d0e?text=Minyak+Goreng+2L",
    soldCount: 15,
    rating: 4.8,
    isPromoted: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "prod_mj_patin",
    merchant_id: "u_toko_sembako_mj",
    sellerId: "u_toko_sembako_mj", // TAMBAHKAN INI
    marketId: "mkt_mj",
    name: "Ikan Patin Segar 1kg",
    description: "Ikan patin sungai segar.",
    price: 25000,
    stock: 10,
    unit: "kg",
    category: "Lauk",
    images: [
      "https://placehold.co/400x400/e0f2fe/075985?text=Ikan+Patin+Segar",
    ],
    image_url:
      "https://placehold.co/400x400/e0f2fe/075985?text=Ikan+Patin+Segar",
    soldCount: 5,
    rating: 4.5,
    isPromoted: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "prod_mb_kepiting",
    merchant_id: "u_toko_laut_mb",
    sellerId: "u_toko_laut_mb", // TAMBAHKAN INI
    marketId: "mkt_mb",
    name: "Kepiting Bakau Super 1kg",
    description: "Kepiting bakau hidup size 500gr up.",
    price: 120000,
    stock: 15,
    unit: "kg",
    category: "Lauk",
    images: ["https://placehold.co/400x400/fee2e2/991b1b?text=Kepiting+Bakau"],
    image_url: "https://placehold.co/400x400/fee2e2/991b1b?text=Kepiting+Bakau",
    soldCount: 8,
    rating: 5.0,
    isPromoted: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "prod_mb_udang",
    merchant_id: "u_toko_laut_mb",
    sellerId: "u_toko_laut_mb", // TAMBAHKAN INI
    marketId: "mkt_mb",
    name: "Udang Galah 1kg",
    description: "Udang galah sungai muara badak.",
    price: 150000,
    stock: 5,
    unit: "kg",
    category: "Lauk",
    images: ["https://placehold.co/400x400/eff6ff/1e40af?text=Udang+Galah"],
    image_url: "https://placehold.co/400x400/eff6ff/1e40af?text=Udang+Galah",
    soldCount: 2,
    rating: 4.9,
    isPromoted: false,
    createdAt: new Date().toISOString(),
  },
];

export const MOCK_PROMO_PACKAGES: PromoPackage[] = [
  {
    id: "pkg_mj_1",
    marketId: "mkt_mj",
    name: "Iklan Prioritas MJ",
    price: 20000,
    durationDays: 7,
    type: SubscriptionType.PROMO_BOOST,
    description: "Tampil teratas di pencarian Muara Jawa.",
  },
];

export const APP_NAME = "Pasar";
