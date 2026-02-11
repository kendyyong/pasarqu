/**
 * WHATSAPP UTILITY HELPER
 * Handles phone number formatting and deep link generation.
 */

/**
 * Mengubah format nomor HP lokal (08xx) menjadi format internasional (628xx)
 * Menghapus karakter non-digit.
 */
export const formatPhoneNumber = (phone: string | undefined): string => {
  if (!phone) return '';
  
  // Hapus karakter non-digit (spasi, strip, dll)
  let cleanPhone = phone.replace(/\D/g, '');

  // Ganti 0 di depan dengan 62
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '62' + cleanPhone.slice(1);
  }

  return cleanPhone;
};

/**
 * Generate WhatsApp Direct Link
 */
export const generateWALink = (phone: string, message: string): string => {
  const formattedPhone = formatPhoneNumber(phone);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
};

// --- MESSAGE TEMPLATES ---

export const waTemplates = {
  // Notifikasi Pelantikan Admin Lokal (Oleh Super Admin)
  adminApproval: (adminName: string, marketName: string) => 
    `Halo *${adminName}*, Selamat! Akun Anda telah diverifikasi oleh Pusat.\n\nSekarang Anda resmi menjabat sebagai Admin Wilayah di: *${marketName}*.\n\nSilakan login kembali ke dashboard Pasarqu untuk mulai mengelola pasar Anda.\nTerima kasih!`,

  // FITUR BARU: Notifikasi Toko Disetujui (Oleh Admin Lokal)
  merchantApproval: (name: string, shopName: string, marketName: string) =>
    `Halo *${name}*, Selamat! Toko *${shopName}* telah resmi disetujui oleh Admin Wilayah untuk berjualan di *${marketName}*.\n\nSekarang Anda sudah bisa mengunggah produk dan menerima pesanan. Selamat berjualan!`,

  // FITUR BARU: Notifikasi Kurir Disetujui (Oleh Admin Lokal)
  courierApproval: (name: string, marketName: string) =>
    `Halo *${name}*, Selamat! Pendaftaran Anda sebagai *Kurir Resmi Pasarqu* di wilayah *${marketName}* telah disetujui.\n\nSilakan masuk ke dashboard kurir untuk mulai menerima orderan pengantaran. Salam satu aspal!`,

  buyerToSeller: (storeName: string, orderId: string) => 
    `Halo *${storeName}*, saya pembeli untuk Order *#${orderId}*. Apakah pesanan saya sudah diproses? Mohon infonya ya.`,

  buyerToCourier: (orderId: string, mapsLink: string, houseColor: string = '...') => 
    `Halo Bang Kurir, saya pembeli Order *#${orderId}*. \n📍 Ini patokan lokasi saya: ${mapsLink} \n🏠 Rumah warna: ${houseColor}. Ditunggu ya!`,

  courierToBuyer: (courierName: string, orderId: string) => 
    `Halo kak, saya *${courierName}* (Kurir PasarKecamatan). \n🛵 Saya sedang menuju lokasi kakak untuk mengantar pesanan *#${orderId}*. Mohon pastikan ada penerima ya.`,

  sellerToBuyer_Stock: (storeName: string, orderId: string, itemName: string) => 
    `Halo kak, mohon maaf saya dari *${storeName}*. \n⚠️ Untuk pesanan *#${orderId}*, barang *${itemName}* kebetulan sedang habis/kurang bagus. \n\nApakah boleh diganti dengan yang lain atau di-refund?`
};