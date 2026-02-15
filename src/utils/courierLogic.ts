// 1. FIX: Path diperbaiki ke ../lib/ karena file ini ada di folder utils
import { supabase } from "../lib/supabaseClient";

// --- DEFINISI TIPE DATA ---
interface CourierProfile {
  id: string;
  name: string;
  current_lat: number | null;
  current_lng: number | null;
  fcm_token: string | null;
}

interface CourierWithDist extends CourierProfile {
  dist: number;
}

interface ShippingCostResult {
  total_ongkir: number;          // Hanya tarif perjalanan (distance + surge + stops)
  app_fee_from_ongkir: number;   // Potongan % aplikasi dari ongkir murni (Kas Juragan 1)
  courier_net: number;           // Jatah bersih kurir dari ongkir
  buyer_service_fee: number;     // Biaya layanan flat untuk pembeli (Kas Juragan 2)
  seller_admin_fee_percent: number; // Persentase admin untuk penjual (Kas Juragan 3)
  total_to_buyer: number;        // TOTAL YANG DIBAYAR USER (Ongkir + Service Fee)
  breakdown: {
    base_fare: number;
    distance_fare: number;
    surge_fee: number;
    multi_stop_fee: number;
  };
  rate_source: string;
}

// --- 1. HELPER: HITUNG JARAK (Haversine Formula) ---
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Radius bumi (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return parseFloat(d.toFixed(1)); // Return 1 desimal (contoh: 5.2 km)
};

// --- 2. FITUR UTAMA: HITUNG ONGKIR & BIAYA LAYANAN ---
// Fungsi ini dipanggil saat Checkout untuk menentukan harga akhir sesuai wilayah
export const calculateShippingFee = async (
  districtName: string,
  distanceKm: number,
  isMultiStop: boolean = false,
  isRainy: boolean = false
): Promise<ShippingCostResult> => {
  
  // A. Ambil Tarif Spesifik Kecamatan dari Database
  let { data: rate } = await supabase
    .from("shipping_rates")
    .select("*")
    .ilike("district_name", districtName)
    .maybeSingle();

  // B. Fallback: Jika belum diatur, gunakan standar global (Safety Net)
  if (!rate) {
    rate = {
      base_fare: 10000,
      base_distance_km: 3,
      price_per_km: 2000,
      app_fee_percent: 20,
      buyer_service_fee: 2000,
      seller_admin_fee_percent: 5,
      multi_stop_fee: 5000,
      surge_fee: 3000,
    };
  }

  // C. Kalkulasi Matematika Ongkir
  let tripCost = 0;
  if (distanceKm <= rate.base_distance_km) {
    tripCost = Number(rate.base_fare);
  } else {
    const extraKm = Math.ceil(distanceKm - rate.base_distance_km);
    tripCost = Number(rate.base_fare) + (extraKm * Number(rate.price_per_km));
  }
  
  const baseTrip = tripCost;
  const stopFee = isMultiStop ? Number(rate.multi_stop_fee) : 0;
  const surgeFee = isRainy ? Number(rate.surge_fee) : 0;
  
  // Total Ongkir Murni (sebelum biaya layanan aplikasi)
  const finalOngkirOnly = tripCost + stopFee + surgeFee;

  // D. Pembagian Hasil (Revenue Share)
  // 1. Potongan jatah aplikasi dari ongkir (Misal 20%)
  const appFeeFromOngkir = Math.round(finalOngkirOnly * (Number(rate.app_fee_percent) / 100));
  // 2. Pendapatan bersih kurir
  const courierNet = finalOngkirOnly - appFeeFromOngkir;

  return {
    total_ongkir: finalOngkirOnly,
    app_fee_from_ongkir: appFeeFromOngkir,
    courier_net: courierNet,
    buyer_service_fee: Number(rate.buyer_service_fee),
    seller_admin_fee_percent: Number(rate.seller_admin_fee_percent),
    total_to_buyer: finalOngkirOnly + Number(rate.buyer_service_fee), // ✅ DITAGIHKAN KE USER
    breakdown: {
      base_fare: Number(rate.base_fare),
      distance_fare: baseTrip - Number(rate.base_fare),
      multi_stop_fee: stopFee,
      surge_fee: surgeFee,
    },
    rate_source: rate.id ? "DISTRICT_SPECIFIC" : "GLOBAL_DEFAULT"
  };
};

// --- 3. CARI KURIR TERDEKAT ---
export const findNearestCourier = async (
  marketLat: number,
  marketLng: number
): Promise<CourierWithDist | null> => {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, current_lat, current_lng, fcm_token")
    .eq("role", "COURIER")
    .eq("is_online", true);

  if (error || !data || data.length === 0) return null;

  // Casting data ke tipe CourierProfile
  const onlineCouriers = data as CourierProfile[];

  const sortedCouriers = onlineCouriers
    .map((courier: CourierProfile) => {
      if (!courier.current_lat || !courier.current_lng) {
        return { ...courier, dist: 99999 };
      }

      const dist = calculateDistance(
        marketLat,
        marketLng,
        courier.current_lat,
        courier.current_lng
      );
      return { ...courier, dist };
    })
    .sort((a: CourierWithDist, b: CourierWithDist) => a.dist - b.dist);

  return sortedCouriers[0];
};