import { test, expect } from "@playwright/test";

test("Ecosystem: Admin Lokal Verifikasi -> Transaksi Full Berjalan", async ({
  browser,
}) => {
  // Waktu test diperpanjang jadi 3 menit
  test.setTimeout(180000);

  // --- KOORDINAT MUARA JAWA (PENTING!) ---
  // Semua aktor harus berada di area yang sama
  const MJ_COORDS = { latitude: -0.8174, longitude: 117.2272 };

  // --- DATA PEMERAN (Pastikan akun ini ada di Database) ---
  const localAdmin = { email: "admin.mj@pasarqu.com", pass: "Admin123!" };
  const merchant = { email: "toko.berkah@gmail.com", pass: "Password123!" };
  const courier = { email: "kurir.cepat@gmail.com", pass: "Password123!" };
  const buyer = { email: "pembeli.test@gmail.com", pass: "Password123!" };

  // --- PERSIAPAN 4 BROWSER CONTEXT DENGAN GPS ---
  // Kita beri "Context Option" agar setiap browser punya GPS aktif
  const contextOptions = {
    geolocation: MJ_COORDS,
    permissions: ["geolocation"],
  };

  const adminContext = await browser.newContext(contextOptions);
  const adminPage = await adminContext.newPage();

  const merchantContext = await browser.newContext(contextOptions);
  const merchantPage = await merchantContext.newPage();

  const courierContext = await browser.newContext(contextOptions);
  const courierPage = await courierContext.newPage();

  const buyerContext = await browser.newContext(contextOptions);
  const buyerPage = await buyerContext.newPage();

  // ==========================================
  // BABAK 1: ADMIN LOKAL VERIFIKASI MITRA
  // ==========================================
  console.log("👮‍♂️ [ADMIN LOKAL] Login...");
  await adminPage.goto("http://localhost:3001/admin/local/login");
  await adminPage.getByPlaceholder(/Email/i).fill(localAdmin.email);
  await adminPage.getByPlaceholder(/Password/i).fill(localAdmin.pass);
  await adminPage.getByRole("button", { name: /MASUK/i }).click();

  await adminPage.waitForURL("**/admin/local/dashboard");
  console.log("👮‍♂️ [ADMIN LOKAL] Membuka menu verifikasi...");

  // Masuk ke Halaman Verifikasi Mitra
  await adminPage.goto("http://localhost:3001/admin/local/verification");

  // --- Verifikasi Toko ---
  console.log("👮‍♂️ [ADMIN LOKAL] Mengecek Toko Berkah...");
  try {
    const row = adminPage.locator("tr").filter({ hasText: merchant.email });
    // Cek apakah ada barisnya (pakai if count > 0 agar tidak error jika kosong)
    if ((await row.count()) > 0) {
      const approveBtn = row.getByRole("button", { name: /Setujui|Approve/i });
      if (await approveBtn.isVisible()) {
        await approveBtn.click();
        console.log("✅ Toko berhasil diverifikasi!");
        await adminPage.waitForTimeout(1000);
      }
    } else {
      console.log("ℹ️ Toko aman (sudah aktif/tidak ada di antrean).");
    }
  } catch (e) {
    console.log("ℹ️ Info: Skip verifikasi toko.");
  }

  // --- Verifikasi Kurir ---
  console.log("👮‍♂️ [ADMIN LOKAL] Mengecek Kurir Cepat...");
  try {
    const row = adminPage.locator("tr").filter({ hasText: courier.email });
    if ((await row.count()) > 0) {
      const approveBtn = row.getByRole("button", { name: /Setujui|Approve/i });
      if (await approveBtn.isVisible()) {
        await approveBtn.click();
        console.log("✅ Kurir berhasil diverifikasi!");
      }
    } else {
      console.log("ℹ️ Kurir aman (sudah aktif/tidak ada di antrean).");
    }
  } catch (e) {
    console.log("ℹ️ Info: Skip verifikasi kurir.");
  }

  // ==========================================
  // BABAK 2: PEMBELI BELANJA
  // ==========================================
  console.log("🛒 [PEMBELI] Login...");
  await buyerPage.goto("http://localhost:3001/login");
  await buyerPage.getByPlaceholder(/Email/i).fill(buyer.email);
  await buyerPage.getByPlaceholder(/Password/i).fill(buyer.pass);
  await buyerPage.getByRole("button", { name: /MASUK/i }).click();

  // Pastikan masuk dashboard
  await buyerPage.waitForURL("**/");

  // Pilih Pasar & Produk
  console.log("🛒 [PEMBELI] Memilih barang...");
  // FIX: Tunggu tombol Pasar muncul
  await buyerPage.getByText(/PASAR/i).first().waitFor();
  await buyerPage.getByText(/PASAR/i).first().click();

  await buyerPage.locator("text=Rp").first().waitFor();
  await buyerPage.locator("text=Rp").first().click();

  // Tambah ke keranjang
  await buyerPage
    .locator("button")
    .filter({ has: buyerPage.locator("img") })
    .nth(3) // Pastikan index ini sesuai dengan tombol 'Tambah' di layout Juragan
    .click();

  // Checkout
  console.log("🛒 [PEMBELI] Checkout...");
  await buyerPage.goto("http://localhost:3001/cart");
  await buyerPage.getByRole("button", { name: /Checkout/i }).click();
  await buyerPage.getByRole("button", { name: /Buat Pesanan/i }).click();

  // Ambil Order ID
  const orderIdEl = buyerPage.locator(".order-id").first();
  await orderIdEl.waitFor();
  const orderId = await orderIdEl.textContent();
  console.log(`✅ Order ID: ${orderId}`);

  // ==========================================
  // BABAK 3: TOKO TERIMA PESANAN
  // ==========================================
  console.log("🏪 [TOKO] Login...");
  await merchantPage.goto("http://localhost:3001/merchant/login");
  await merchantPage.getByPlaceholder(/Email/i).fill(merchant.email);
  await merchantPage.getByPlaceholder(/Password/i).fill(merchant.pass);
  await merchantPage.getByRole("button", { name: /MASUK/i }).click();

  console.log("🏪 [TOKO] Proses pesanan...");
  await merchantPage.waitForURL("**/merchant/dashboard"); // Pastikan login sukses
  await merchantPage.goto("http://localhost:3001/merchant/orders");

  // Pastikan order ada
  await expect(merchantPage.getByText(orderId!)).toBeVisible();

  // Terima & Siap Kirim
  await merchantPage
    .getByRole("button", { name: /Terima/i })
    .first()
    .click();
  await merchantPage.waitForTimeout(1000); // Jeda database
  await merchantPage
    .getByRole("button", { name: /Siap Dikirim/i })
    .first()
    .click();

  // ==========================================
  // BABAK 4: KURIR ANTAR BARANG
  // ==========================================
  console.log("🛵 [KURIR] Login...");
  await courierPage.goto("http://localhost:3001/courier/login");
  await courierPage.getByPlaceholder(/Email/i).fill(courier.email);
  await courierPage.getByPlaceholder(/Password/i).fill(courier.pass);
  await courierPage.getByRole("button", { name: /MASUK/i }).click();

  console.log("🛵 [KURIR] Ambil job...");
  await courierPage.waitForURL("**/courier/dashboard"); // Pastikan login sukses
  await courierPage.goto("http://localhost:3001/courier/jobs");

  // FIX: Refresh jika job belum muncul (karena kurir login sebelum toko klik siap kirim)
  if (!(await courierPage.getByText(orderId!).isVisible())) {
    console.log("🛵 [KURIR] Refresh daftar job...");
    await courierPage.reload();
  }

  // Pastikan job ada
  await expect(courierPage.getByText(orderId!)).toBeVisible();

  // Ambil & Selesaikan
  await courierPage.getByRole("button", { name: /Ambil/i }).first().click();
  console.log("🛵 [KURIR] Sedang mengantar...");
  await courierPage.waitForTimeout(2000); // Simulasi perjalanan

  await courierPage
    .getByRole("button", { name: /Selesai/i })
    .first()
    .click();

  // ==========================================
  // BABAK FINAL: PEMBELI KONFIRMASI
  // ==========================================
  console.log("🛒 [PEMBELI] Cek status akhir...");
  await buyerPage.reload();
  await expect(buyerPage.getByText(/Selesai|Diterima/i)).toBeVisible();
  console.log("🎉 SYSTEM INTEGRATION TEST PASSED!");
});
