/**
 * GENERIC WHATSAPP GATEWAY HELPER
 * Menggunakan layanan 3rd party webhook (Contoh: Fonnte, Watsap.id, Twilio, atau Custom API).
 * 
 * Di lingkungan Production, panggil fungsi ini dari Backend (Node.js/Go) 
 * untuk keamanan Token API. Di sini kita simulasi client-side fetch.
 */

// Ganti dengan URL API Provider pilihan Anda
const WA_GATEWAY_URL = 'https://api.whatsapp-service-provider.com/send'; 
const API_TOKEN = 'YOUR_API_TOKEN_HERE'; // Simpan di .env

interface WANotificationPayload {
  target: string; // No HP (e.g., 0812...)
  message: string;
}

export const sendWhatsAppNotification = async ({ target, message }: WANotificationPayload): Promise<boolean> => {
  console.log(`[WA_GATEWAY_MOCK] Sending to ${target}: ${message}`);
  
  // Simulasi sukses di development
  return new Promise((resolve) => {
    setTimeout(() => {
        console.log("✅ [WA_GATEWAY_MOCK] Sent Successfully!");
        resolve(true);
    }, 1000);
  });

  /* IMPLEMENTASI REAL (Uncomment jika sudah ada API Provider):
  try {
    const response = await fetch(WA_GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Authorization': API_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target: target,
        message: message,
      }),
    });

    const data = await response.json();
    return data.status === true;
  } catch (error) {
    console.error("WA Notification Failed:", error);
    return false;
  }
  */
};

// --- TEMPLATES ---

export const createSellerOrderMessage = (orderId: string, total: number, itemsSummary: string) => {
    return `🔔 *ORDER BARU MASUK!* 🔔\n\nID: ${orderId}\nTotal: Rp ${new Intl.NumberFormat('id-ID').format(total)}\nItem: ${itemsSummary}\n\n👉 *Segera Buka Aplikasi PasarKecamatan untuk Proses!*`;
};

export const createCourierOrderMessage = (marketName: string, distance: string, fee: number) => {
    return `📦 *PENGIRIMAN BARU TERSEDIA!*\n\nLokasi: ${marketName}\nJarak: ${distance}\nPotensi Pendapatan: Rp ${new Intl.NumberFormat('id-ID').format(fee)}\n\n👉 *Ambil Sekarang sebelum diambil kurir lain!*`;
};