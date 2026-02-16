// --- FULL SCRIPT src/types.ts ---

export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  LOCAL_ADMIN = "LOCAL_ADMIN",
  SELLER = "SELLER",
  COURIER = "COURIER",
  BUYER = "BUYER",
}

export enum SubscriptionType {
  PROMO_BOOST = "PROMO_BOOST",
}

export enum TransactionStatus {
  WAITING_PAYMENT = "WAITING_PAYMENT",
  WAITING_VERIFICATION = "WAITING_VERIFICATION",
  PAID = "PAID",
  PROCESSED = "PROCESSED",
  SHIPPED = "SHIPPED",
  DELIVERED = "DELIVERED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole | string;
  avatarUrl?: string;
  phoneNumber?: string;
  address?: string;
  managedMarketId?: string;
  marketId?: string;
  status: "active" | "pending" | "suspended" | "blacklisted";
  createdAt: string;
  isFirstLogin?: boolean;
  walletBalance?: number;
}

export interface ShippingRateTier {
  maxDistance: number;
  price: number;
}

export interface ShippingRates {
  tier1: ShippingRateTier;
  tier2: ShippingRateTier;
  tier3: ShippingRateTier;
}

export interface Market {
  id: string;
  name: string;
  brandName: string; // ✅ Digunakan untuk Branding Area di Top Bar
  district: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
  imageUrl?: string;
  shippingRates: ShippingRates;
  assignedAdminEmail?: string;
  appAdminFee: number;
  localAdminSharePercentage: number;
  city?: string;
  image_url?: string;
}

export interface Product {
  id: string;
  sellerId: string;
  marketId: string;
  market_id?: string;
  name: string;
  description: string;
  price: number;
  discount?: number;
  old_price?: number;
  status?: string;
  is_active?: boolean;
  stock: number;
  unit: string;
  category: string;
  images: string[];
  image_url?: string;
  soldCount: number;
  rating: number;
  isPromoted: boolean;
  createdAt: string;
  merchant_id: string;
  merchants?: {
    id: string;
    name: string;
    city?: string;
    is_verified?: boolean;
    image_url?: string;
  };
}

export interface CartItem extends Product {
  quantity: number;
  variant_name?: string;
  product?: Product;
}

export interface StoreProfile {
  userId: string;
  marketId: string;
  storeName: string;
  description: string;
  isOpen: boolean;
  rating: number;
  isVerified: boolean;
  latitude: number;
  longitude: number;
  address: string;
}

export interface PromoPackage {
  id: string;
  marketId: string;
  name: string;
  price: number;
  durationDays: number;
  type: SubscriptionType;
  description: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  isRead: boolean;
}

export interface ChatThread {
  id: string;
  participantId: string;
  participantName: string;
  participantRole: string;
  lastMessage: string;
  lastUpdated: string;
  unreadCount: number;
  messages: ChatMessage[];
  relatedOrderId?: string;
}

export type PaymentMethod = "cod" | "transfer";
export type DeliveryMethod = "courier" | "pickup";

export interface OrderItem {
  id: number;
  product_id: string;
  quantity: number;
  price_at_purchase: number;
  product?: Product;
  name?: string;
  buyerName?: string;
}

export interface Order {
  id: number;
  user_id: string;
  market_id: string;
  total_amount: number;
  status: TransactionStatus | string;
  payment_status: "unpaid" | "paid";
  payment_method: PaymentMethod;
  delivery_method: DeliveryMethod;
  delivery_address: string;
  created_at: string;
  items?: OrderItem[];
  proof_of_transfer?: string;
  pickupCode?: string;
  buyerName?: string;
}

export type Transaction = Order;