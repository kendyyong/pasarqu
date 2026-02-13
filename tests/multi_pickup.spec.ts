import { test, expect } from "@playwright/test";

test("Simulasi Belanja Multi-Toko Pasarqu", async ({ page }) => {
  // 1. Robot Menuju Alamat Aplikasi
  await page.goto("http://localhost:3001");
  await page.waitForLoadState("networkidle");

  // --- LANGKAH PILIH KECAMATAN ---
  console.log("Memilih Kecamatan Muara Jawa...");
  const muaraJawaBtn = page.getByRole("button", { name: /Muara Jawa/i });
  await muaraJawaBtn.scrollIntoViewIfNeeded();
  await muaraJawaBtn.click();

  // 2. Masuk ke Pasar
  console.log("Mencari pasar...");
  await page.click("text=Pasar");

  // --- PROSES BELANJA TOKO 1 ---
  console.log("Mengambil barang dari Toko 1...");
  const allPriceLocators = page.locator("text=Rp");
  await allPriceLocators.first().waitFor({ state: "visible", timeout: 15000 });

  // Kita klik produk pertama berdasarkan harganya
  await allPriceLocators.first().click();

  console.log("Menambahkan ke keranjang (Toko 1)...");
  // FIX: Karena tidak ada teks, kita cari tombol yang berisi gambar (sesuai snapshot e113-e114)
  const addToCartBtn = page
    .locator("button")
    .filter({ has: page.locator("img") });
  await addToCartBtn.first().click();

  // Kembali untuk cari toko lain
  console.log("Kembali ke daftar produk...");
  await page.goBack();

  // --- PROSES BELANJA TOKO 2 ---
  console.log("Mengambil barang dari Toko 2 (Multi-Pickup)...");

  // Pastikan halaman sudah reload dan harga muncul lagi
  await allPriceLocators.nth(2).waitFor({ state: "visible" });
  await allPriceLocators.nth(2).click();

  console.log("Menambahkan ke keranjang (Toko 2)...");
  await addToCartBtn.first().click();

  // 6. Robot Buka Keranjang / Checkout
  console.log("Membuka keranjang...");
  // Mencari ikon keranjang (biasanya ada di header atau floating button)
  const cartBtn = page
    .locator(".cart-icon")
    .or(page.locator('img[src*="cart"]'))
    .or(page.getByRole("button", { name: /keranjang/i }));
  await cartBtn.first().click();

  // 7. VERIFIKASI LOGIKA
  console.log("Memverifikasi biaya tambahan multi-toko...");

  // Tunggu label biaya tambahan muncul
  await expect(page.getByText(/Biaya Tambah 1 Toko/i)).toBeVisible({
    timeout: 10000,
  });

  // Verifikasi angka 3.000
  await expect(page.getByText(/3\.000/)).toBeVisible();

  console.log("✅ Simulasi Berhasil: Biaya Multi-Pickup Terdeteksi Benar!");
});
