interface RegionalSettings {
  flat_distance_km: number;
  flat_rate_amount: number;
  extra_fee_per_km: number;
  extra_pickup_fee_total: number; // Rp 3.000
  extra_pickup_fee_courier: number; // Rp 2.000
  extra_pickup_fee_app: number; // Rp 1.000
  max_merchants_per_order: number; // 3 Toko
}

export const calculateMultiPickupOngkir = (
  distanceStr: string,
  merchantIds: string[],
  settings: RegionalSettings,
) => {
  if (!distanceStr || !settings) {
    return {
      baseShipping: 0,
      serviceFee: 2000,
      extraPickupFee: 0,
      totalToBuyer: 0,
      courierEarning: 0,
      appEarning: 0,
      merchantCount: 0,
    };
  }

  // 1. Konversi Jarak
  let distance = 0;
  const cleanStr = distanceStr.toLowerCase().replace(",", ".");
  if (cleanStr.includes("km"))
    distance = parseFloat(cleanStr.replace(" km", ""));
  else if (cleanStr.includes(" m"))
    distance = parseFloat(cleanStr.replace(" m", "")) / 1000;

  // 2. Hitung Ongkir Dasar
  let baseShipping = Number(settings.flat_rate_amount);
  if (distance > settings.flat_distance_km) {
    baseShipping +=
      (distance - settings.flat_distance_km) *
      Number(settings.extra_fee_per_km);
  }
  baseShipping = Math.ceil(baseShipping / 1000) * 1000;

  // 3. Logika Multi-Pickup (DIAMBIL DARI SETTING ADMIN)
  const uniqueMerchants = [...new Set(merchantIds)];
  const merchantCount = uniqueMerchants.length;

  // Batasi sesuai setting (Misal max 3)
  const limitedMerchantCount = Math.min(
    merchantCount,
    settings.max_merchants_per_order,
  );
  const extraStores = Math.max(0, limitedMerchantCount - 1);

  const serviceFee = 2000;
  const extraPickupFee = extraStores * Number(settings.extra_pickup_fee_total);

  // 4. Pembagian (DIAMBIL DARI SETTING ADMIN)
  const courierExtra = extraStores * Number(settings.extra_pickup_fee_courier);
  const appExtra = extraStores * Number(settings.extra_pickup_fee_app);

  return {
    baseShipping,
    serviceFee,
    extraPickupFee,
    totalToBuyer: baseShipping + serviceFee + extraPickupFee,
    courierEarning: baseShipping + courierExtra,
    appEarning: serviceFee + appExtra,
    merchantCount: limitedMerchantCount,
    isOverLimit: merchantCount > settings.max_merchants_per_order,
  };
};
