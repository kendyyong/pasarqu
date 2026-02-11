/**
 * GEO UTILITIES - PASARQU
 * Utilitas untuk kalkulasi jarak, format teks, dan estimasi biaya pengiriman.
 */

/**
 * Konversi derajat ke radian
 */
const deg2rad = (deg: number): number => {
  return deg * (Math.PI / 180);
};

/**
 * Menghitung jarak antara dua titik koordinat dalam Kilometer 
 * menggunakan rumus Haversine.
 */
export const calculateDistance = (
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number => {
  // Validasi: Jika koordinat tidak ada, kembalikan 0
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;

  const R = 6371; // Radius bumi dalam km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Jarak dalam km
  
  return parseFloat(d.toFixed(2)); // Mengembalikan dengan presisi 2 desimal
};

/**
 * Mengubah angka jarak menjadi teks yang mudah dibaca.
 * Contoh: 0.5 -> "500 m", 2.5 -> "2.5 km"
 */
export const formatDistanceText = (km: number): string => {
  if (km === 0) return "Lokasi tidak valid";
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
};

/**
 * Menghitung estimasi ongkos kirim otomatis berdasarkan jarak.
 * Referensi Logika:
 * - Jarak 0 - 2 KM: Rp 5.000 (Tarif Flat Minimal)
 * - Di atas 2 KM: Rp 5.000 + (Sisa Jarak * Rp 2.500/KM)
 * - Faktor Koreksi Jarak: 1.3 (Mengompensasi jalan berkelok dibanding garis lurus)
 */
export const calculateShippingFee = (distanceKm: number): number => {
  if (!distanceKm || distanceKm === 0) return 0;

  const baseFare = 5000; // Tarif minimal
  const pricePerKm = 2500; // Tambahan per km
  const minDistance = 2; // Jarak flat minimal
  const routingCorrection = 1.3; // Faktor koreksi jalan raya berkelok

  // Hitung estimasi jarak tempuh jalan raya asli
  const realDistance = distanceKm * routingCorrection;

  if (realDistance <= minDistance) {
    return baseFare;
  }

  const extraDistance = realDistance - minDistance;
  const totalFee = baseFare + (extraDistance * pricePerKm);

  // Pembulatan ke atas ke kelipatan Rp 500 terdekat (Contoh: 8.200 jadi 8.500)
  return Math.ceil(totalFee / 500) * 500;
};

/**
 * Memformat latitude dan longitude menjadi string koordinat sederhana.
 * Digunakan sebagai fallback jika nama alamat tidak ditemukan.
 */
export const formatCoords = (lat: number, lng: number): string => {
  if (!lat || !lng) return "0, 0";
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
};