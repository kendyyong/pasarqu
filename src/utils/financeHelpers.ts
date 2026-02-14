// Interface Wajib sama persis dengan nama kolom di Supabase
export interface RegionalSettings {
  flat_distance_km: number; // Jarak flat (misal: 3 km)
  flat_rate_amount: number; // Harga 3km pertama (misal: 10.000)
  extra_fee_per_km: number; // Harga per km selanjutnya
  extra_pickup_fee_total: number; // Total charge ke user per toko tambahan
  extra_pickup_fee_courier: number; // Bagian kurir
  extra_pickup_fee_app: number; // Bagian aplikasi
  max_merchants_per_order: number; // Batas max toko
  buyer_service_fee: number; // Tambahan: Biaya layanan aplikasi (Platform fee)
}

export const calculateMultiPickupOngkir = (
  distanceStr: string,
  merchantIds: string[],
  settings: RegionalSettings | null,
) => {
  // Default Return (Safety First)
  const defaultResult = {
    baseShipping: 0,
    serviceFee: 2000, // Default jika DB belum load
    extraPickupFee: 0,
    totalToBuyer: 0,
    courierEarning: 0,
    appEarning: 0,
    merchantCount: 0,
    isOverLimit: false,
    distance: 0,
  };

  // Validasi Input
  if (!distanceStr || !settings) return defaultResult;

  // ---------------------------------------------------------
  // 1. Parsing Jarak (Anti-Error Google Maps)
  // ---------------------------------------------------------
  let distance = 0;
  const cleanNumStr = distanceStr.replace(/[^0-9.,]/g, "").replace(",", ".");
  distance = parseFloat(cleanNumStr) || 0;

  // Handle jika Google Maps mengembalikan satuan "meter" (jarak dekat)
  if (
    distanceStr.toLowerCase().includes(" m") &&
    !distanceStr.toLowerCase().includes("km")
  ) {
    distance = distance / 1000;
  }

  // ---------------------------------------------------------
  // 2. Hitung Ongkir Dasar (Base Shipping)
  // ---------------------------------------------------------
  // Pakai Number() untuk memastikan tipe data aman (kadang DB return string)
  let baseShipping = Number(settings.flat_rate_amount);

  if (distance > Number(settings.flat_distance_km)) {
    const extraKm = distance - Number(settings.flat_distance_km);
    baseShipping += Math.ceil(extraKm) * Number(settings.extra_fee_per_km);
  }

  // Pembulatan ke ribuan teratas (User Experience lebih rapi)
  // Contoh: 12.100 jadi 13.000
  baseShipping = Math.ceil(baseShipping / 1000) * 1000;

  // ---------------------------------------------------------
  // 3. Logika Multi-Pickup (Inti Fitur)
  // ---------------------------------------------------------
  const uniqueMerchants = [...new Set(merchantIds)]; // Hapus duplikat ID toko
  const realMerchantCount = uniqueMerchants.length;

  // Hitung jumlah toko yang akan dikenakan biaya (dibatasi max setting)
  const calculableMerchantCount = Math.min(
    realMerchantCount,
    Number(settings.max_merchants_per_order),
  );

  // Toko tambahan = Total - 1 (Toko utama gratis biaya jemput tambahan)
  const extraStores = Math.max(0, calculableMerchantCount - 1);

  // Perbaikan: Ambil Service Fee dari Database
  const serviceFee = Number(settings.buyer_service_fee) || 2000;

  const extraPickupFee = extraStores * Number(settings.extra_pickup_fee_total);

  // ---------------------------------------------------------
  // 4. Pembagian Jatah (Split)
  // ---------------------------------------------------------
  const courierExtra = extraStores * Number(settings.extra_pickup_fee_courier);
  const appExtra = extraStores * Number(settings.extra_pickup_fee_app);

  return {
    distance,
    baseShipping,
    serviceFee,
    extraPickupFee,

    // Total yang harus dibayar User
    totalToBuyer: baseShipping + serviceFee + extraPickupFee,

    // Pendapatan Driver = Ongkir Dasar + Jatah Extra Pickup
    courierEarning: baseShipping + courierExtra,

    // Pendapatan App = Biaya Layanan + Jatah Extra Pickup App
    appEarning: serviceFee + appExtra,

    merchantCount: realMerchantCount,

    // Flag Penting: Jika true, tombol bayar harus didisable di UI
    isOverLimit: realMerchantCount > Number(settings.max_merchants_per_order),
  };
};
