import { useState, useEffect, useMemo } from "react";
import { CartItem } from "../types";

export const useCartSelection = (cart: CartItem[], isOpen: boolean) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Default: Pilih semua saat keranjang dibuka
  useEffect(() => {
    if (isOpen && cart.length > 0) {
      setSelectedIds(new Set(cart.map((item) => item.id)));
    }
  }, [isOpen, cart.length]);

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === cart.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(cart.map((item) => item.id)));
  };

  const stats = useMemo(() => {
    // 1. Filter item yang dipilih saja
    const selectedItems = cart.filter((item) => selectedIds.has(item.id));
    
    // 2. Hitung jumlah Toko Unik (Asli)
    const uniqueMerchants = [...new Set(selectedItems.map((item) => item.merchant_id))];
    const merchantCount = uniqueMerchants.length;

    // 3. Patokan Jarak (KM)
    const distanceKm = selectedItems.length > 0 ? selectedItems[0].distance || 0 : 0;

    // 4. KONSTANTA BIAYA (Dapat diatur Super Admin di kemudian hari)
    const BASE_SERVICE_FEE = 2000;  // Layanan Dasar Admin
    const BASE_COURIER_FEE = 5000;  // Tarif Pokok Kurir
    const SURGE_PER_EXTRA = 2000;   // EKSTRA TOKO (Untuk Kurir)
    const SERVICE_PER_EXTRA = 1000; // Layanan Tambahan (Untuk Admin)

    let courierSurgeFee = 0;
    let totalPlatformFee = 0;

    // 🛠️ LOGIKA REVISI (N-1):
    // Biaya ekstra hanya dihitung jika merchant > 1
    if (merchantCount > 0) {
      totalPlatformFee = BASE_SERVICE_FEE;
      
      if (merchantCount > 1) {
        // Jika 2 toko -> extraCount = 1
        // Jika 3 toko -> extraCount = 2
        const extraCount = merchantCount - 1;
        
        courierSurgeFee = extraCount * SURGE_PER_EXTRA;
        totalPlatformFee += (extraCount * SERVICE_PER_EXTRA);
      }
    }

    // 5. Hitung Subtotal & Jumlah
    const subtotalProduk = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totalCount = selectedItems.reduce((sum, item) => sum + item.quantity, 0);

    // 6. Grand Total (Produk + Admin + Kurir Pokok + Ekstra Toko)
    const grandTotal = subtotalProduk + totalPlatformFee + BASE_COURIER_FEE + courierSurgeFee;

    return { 
      totalPrice: subtotalProduk, 
      totalSelectedItems: totalCount,
      merchantCount,         // Mengirim angka asli (N) untuk UI agar bisa dihitung (N-1)
      distanceKm,
      baseCourierFee: BASE_COURIER_FEE, 
      courierSurgeFee,       // Sudah hasil (N-1) * rate
      totalPlatformFee,      // Sudah hasil (N-1) * rate admin
      grandTotal 
    };
  }, [cart, selectedIds]);

  return { selectedIds, toggleSelection, toggleSelectAll, ...stats };
};