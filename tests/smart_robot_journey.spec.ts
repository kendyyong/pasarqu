import { test, expect } from "@playwright/test";

const generateRandomUser = () => {
  const id = Math.floor(Math.random() * 9000) + 1000;
  return {
    name: `Robot MJ ${id}`,
    email: `pasarqu.test${id}@gmail.com`,
    password: `Password123!`,
  };
};

test("Simulasi Full Journey: Robot Pintar Daftar & Belanja", async ({
  page,
  context,
}) => {
  const user = generateRandomUser();

  // 1. SET LOKASI (Muara Jawa)
  await context.setGeolocation({ latitude: -0.8174, longitude: 117.2272 });
  await context.grantPermissions(["geolocation"]);

  console.log(`🤖 Memulai misi dengan identitas: ${user.email}`);

  // --- LANGKAH 1: PENDAFTARAN ---
  await page.goto("http://localhost:3001/register");
  await page.getByPlaceholder(/Nama Lengkap/i).fill(user.name);
  await page.getByPlaceholder(/Email/i).fill(user.email);
  await page.getByPlaceholder(/Password/i).fill(user.password);
  await page.getByRole("button", { name: /DAFTAR/i }).click();

  // --- LANGKAH 1.5: LOGIN (KARENA REDIRECT KE /LOGIN) ---
  console.log("🤖 Menunggu halaman login...");
  await page.waitForURL("**/login", { timeout: 15000 });

  await page.getByPlaceholder(/Email atau Nomor HP/i).fill(user.email);
  await page.getByPlaceholder(/Password/i).fill(user.password);
  await page.getByRole("button", { name: /MASUK/i }).click();

  // Tunggu masuk ke halaman utama setelah login
  await page.waitForURL("**/", { timeout: 15000 });
  console.log("✅ Berhasil login dan masuk halaman utama.");

  // --- LANGKAH 2: PILIH WILAYAH ---
  console.log("🤖 Memilih wilayah Muara Jawa...");
  const muaraJawaBtn = page.getByRole("button", { name: /Muara Jawa/i });
  await muaraJawaBtn.scrollIntoViewIfNeeded();
  await muaraJawaBtn.click();

  // --- LANGKAH 3: BELANJA TOKO 1 ---
  console.log("🤖 Menuju daftar pasar...");
  // Klik menu PASAR di navigasi
  await page.getByText(/PASAR/i).first().click();

  // Pilih Produk (Gunakan teks Rp agar pasti elemen produk)
  const allProducts = page.locator("text=Rp");
  await allProducts.first().waitFor({ state: "visible", timeout: 15000 });
  await allProducts.first().click();

  console.log("🤖 Menambah barang ke keranjang...");
  // Ambil tombol belanja (indeks ke-3 biasanya tombol beli di kartu produk pertama)
  const buyBtn = page.locator("button").filter({ has: page.locator("img") });
  await buyBtn.nth(3).click();

  await page.goBack();

  // --- LANGKAH 4: BELANJA TOKO 2 (MULTI-PICKUP) ---
  console.log("🤖 Mengambil barang dari toko berbeda...");
  await allProducts.nth(2).waitFor({ state: "visible" });
  await allProducts.nth(2).click();
  await buyBtn.nth(3).click();

  // --- LANGKAH 5: CHECKOUT & VERIFIKASI ---
  console.log("🤖 Memeriksa keranjang...");
  const cartBtn = page
    .locator(".cart-icon")
    .or(page.getByRole("button", { name: /keranjang/i }));
  await cartBtn.first().click();

  // VALIDASI BIAYA
  console.log("🤖 Memeriksa Biaya Tambah Toko...");
  await expect(page.getByText(/Biaya Tambah 1 Toko/i)).toBeVisible();
  await expect(page.getByText(/3\.000/)).toBeVisible();

  console.log(`✅ MISI SELESAI: Robot ${user.name} berhasil belanja!`);
});
