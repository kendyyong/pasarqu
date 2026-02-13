import { supabase } from "../lib/supabaseClient";

/**
 * Mencari kurir terdekat yang sedang standby (Online)
 */
export const findNearestCourier = async (
  marketLat: number,
  marketLng: number,
) => {
  // 1. Ambil data kurir yang statusnya 'ONLINE' (perlu kolom status di profiles)
  const { data: onlineCouriers, error } = await supabase
    .from("profiles")
    .select("id, name, current_lat, current_lng")
    .eq("role", "COURIER")
    .eq("is_online", true);

  if (error || !onlineCouriers) return null;

  // 2. Logika Sederhana: Urutkan berdasarkan jarak terpendek (Euclidean)
  // Di tahap lanjut, ini bisa diganti dengan PostGIS (St_Distance)
  const sortedCouriers = onlineCouriers
    .map((courier) => {
      const dist = Math.sqrt(
        Math.pow(courier.current_lat - marketLat, 2) +
          Math.pow(courier.current_lng - marketLng, 2),
      );
      return { ...courier, dist };
    })
    .sort((a, b) => a.dist - b.dist);

  return sortedCouriers[0]; // Ambil yang paling dekat
};
