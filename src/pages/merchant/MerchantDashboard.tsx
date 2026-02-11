import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import { useToast } from "../../contexts/ToastContext";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  LogOut,
  Store,
  Plus,
  Search,
  Wallet,
  X,
  Upload,
  Bell,
  Power,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  ShieldAlert,
  MessageCircle,
  Loader2,
  MapPin,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
// IMPORT PICKER LOKASI (Pastikan path ini benar sesuai struktur folder Bapak)
import { LocationPicker } from "../../components/LocationPicker";

export const MerchantDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // STATE UTAMA
  const [activeTab, setActiveTab] = useState("products");
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [merchantProfile, setMerchantProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // STATE MODAL & LOKASI
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // STATE TAMBAH PRODUK
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    stock: "",
    description: "",
    unit: "Pcs",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  // --- INIT DATA & REALTIME ---
  useEffect(() => {
    if (!user) return;

    const initProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setMerchantProfile(data);
      setLoading(false);
      if (data) {
        await supabase
          .from("profiles")
          .update({ last_active_at: new Date() })
          .eq("id", user.id);
      }
    };

    const fetchProducts = async () => {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("merchant_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setProducts(data);
    };

    const fetchOrders = async () => {
      const { data } = await supabase
        .from("orders")
        .select("*, products(*)")
        .eq("market_id", user.id);
      if (data) setOrders(data);
    };

    initProfile();
    fetchProducts();
    fetchOrders();

    const channel = supabase
      .channel("merchant_orders")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `market_id=eq.${user.id}`,
        },
        (payload) => {
          playNotificationSound();
          showToast("🎉 PESANAN BARU MASUK!", "success");
          fetchOrders();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // --- FUNGSI UPDATE LOKASI ---
  const handleUpdateLocation = async (
    lat: number,
    lng: number,
    address: string,
  ) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          latitude: lat,
          longitude: lng,
          address: address,
        })
        .eq("id", user?.id);

      if (error) throw error;

      setMerchantProfile({
        ...merchantProfile,
        latitude: lat,
        longitude: lng,
        address: address,
      });
      showToast("Lokasi jualan berhasil diperbarui!", "success");
      setShowLocationModal(false);
    } catch (err: any) {
      showToast("Gagal simpan lokasi: " + err.message, "error");
    }
  };

  const playNotificationSound = () => {
    const audio = new Audio(
      "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3",
    );
    audio
      .play()
      .catch((e) => console.log("Audio play failed interaction needed"));
  };

  const toggleShopStatus = async () => {
    if (!merchantProfile) return;
    // Fitur Tambahan: Cegah buka toko jika belum diverifikasi admin
    if (!merchantProfile.is_verified) {
      showToast("Toko harus diverifikasi Admin sebelum bisa dibuka", "error");
      return;
    }

    const newStatus = !merchantProfile.is_shop_open;
    setMerchantProfile({ ...merchantProfile, is_shop_open: newStatus });

    const { error } = await supabase
      .from("profiles")
      .update({ is_shop_open: newStatus })
      .eq("id", user?.id);
    if (error) {
      showToast("Gagal update status", "error");
      setMerchantProfile({ ...merchantProfile, is_shop_open: !newStatus });
    } else {
      showToast(
        newStatus ? "Toko DIBUKA ✅" : "Toko DITUTUP ⛔",
        newStatus ? "success" : "info",
      );
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsUploading(true);

    try {
      let imageUrl = null;
      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(fileName, imageFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage
          .from("product-images")
          .getPublicUrl(fileName);
        imageUrl = urlData.publicUrl;
      }

      const { data, error } = await supabase
        .from("products")
        .insert({
          merchant_id: user.id,
          market_id: merchantProfile?.managed_market_id || null,
          name: newProduct.name,
          price: parseInt(newProduct.price),
          stock: parseInt(newProduct.stock),
          description: newProduct.description,
          unit: newProduct.unit,
          image_url: imageUrl,
          status: "pending",
        })
        .select();

      if (error) throw error;
      showToast("Produk dikirim ke Admin untuk verifikasi!", "success");
      setProducts([data[0], ...products]);
      setShowAddModal(false);
      setNewProduct({
        name: "",
        price: "",
        stock: "",
        description: "",
        unit: "Pcs",
      });
      setImageFile(null);
    } catch (err: any) {
      showToast("Gagal: " + err.message, "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm("Keluar dari Dashboard Juragan?")) {
      await logout();
      navigate("/");
    }
  };

  const th = {
    bg: "bg-slate-50",
    text: "text-slate-900",
    primary: "bg-indigo-600 text-white",
    card: "bg-white border border-slate-200 shadow-sm",
  };

  if (loading)
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-indigo-600">
        <Loader2 className="animate-spin" size={40} />
      </div>
    );

  // VIEW: KHUSUS JIKA TOKO BELUM DIVERIFIKASI ADMIN
  if (merchantProfile && !merchantProfile.is_verified) {
    return (
      <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-6 text-left font-sans">
        <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl border border-slate-200 text-center animate-in fade-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-indigo-100 shadow-inner">
            <Clock size={40} className="animate-pulse" />
          </div>
          <h1 className="text-xl font-black uppercase tracking-tight text-slate-800 leading-none">
            Toko Sedang Ditinjau
          </h1>
          <p className="text-[11px] text-slate-500 font-bold uppercase mt-4 leading-relaxed tracking-widest px-2 text-center">
            Pendaftaran{" "}
            <span className="text-indigo-600">
              "{merchantProfile.shop_name || "Toko Anda"}"
            </span>{" "}
            telah diterima. Admin Lokal sedang memverifikasi lokasi dan data
            toko Anda.
          </p>

          <div className="mt-10 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 text-left space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <ShieldAlert size={18} className="text-orange-500" />
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                Tahapan Verifikasi
              </span>
            </div>
            <div className="flex justify-between items-center text-[10px] font-bold uppercase border-b border-slate-200 pb-2">
              <span className="text-slate-500">Pendaftaran Akun</span>
              <span className="text-green-600 flex items-center gap-1">
                <CheckCircle size={10} /> Selesai
              </span>
            </div>
            <div className="flex justify-between items-center text-[10px] font-bold uppercase">
              <span className="text-slate-800">Validasi Admin Lokal</span>
              <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded animate-pulse text-[8px]">
                Sedang Proses
              </span>
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <button
              onClick={() =>
                window.open("https://wa.me/628123456789", "_blank")
              }
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
            >
              <MessageCircle size={16} /> Chat Admin Wilayah
            </button>
            <button
              onClick={handleLogout}
              className="w-full py-4 bg-white border border-slate-200 text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:text-rose-500 transition-all"
            >
              Keluar & Cek Nanti
            </button>
          </div>
        </div>
      </div>
    );
  }

  // VIEW: DASHBOARD UTAMA (AKTIF JIKA is_verified: true)
  return (
    <div
      className={`min-h-screen font-sans flex ${th.bg} ${th.text} pb-20 md:pb-0`}
    >
      {/* SIDEBAR */}
      <aside className="hidden md:flex w-72 bg-white border-r border-slate-200 flex-col p-6 fixed h-full z-20">
        <div className="flex items-center gap-4 mb-10 px-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
            <Store size={20} />
          </div>
          <div>
            <h2 className="font-black text-sm uppercase leading-none">
              Juragan
            </h2>
            <div className="flex items-center gap-1 mt-1">
              <p className="text-[9px] font-bold uppercase text-indigo-500 truncate w-32">
                {merchantProfile?.shop_name || "Toko"}
              </p>
              {merchantProfile?.is_verified && (
                <CheckCircle size={10} className="text-blue-500" />
              )}
            </div>
          </div>
        </div>
        <nav className="space-y-2 flex-1">
          <SidebarItem
            icon={<LayoutDashboard size={20} />}
            label="Ringkasan"
            active={activeTab === "overview"}
            onClick={() => setActiveTab("overview")}
          />
          <SidebarItem
            icon={<Package size={20} />}
            label="Produk Saya"
            active={activeTab === "products"}
            onClick={() => setActiveTab("products")}
            count={products.length}
          />
          <SidebarItem
            icon={<ShoppingBag size={20} />}
            label="Pesanan"
            active={activeTab === "orders"}
            onClick={() => setActiveTab("orders")}
            count={orders.length}
          />
          <SidebarItem
            icon={<MapPin size={20} />}
            label="Lokasi Toko"
            onClick={() => setShowLocationModal(true)}
          />
          <SidebarItem
            icon={<Wallet size={20} />}
            label="Keuangan"
            active={activeTab === "finance"}
            onClick={() => setActiveTab("finance")}
          />
        </nav>

        <div className="p-4 bg-slate-50 rounded-2xl mb-4 border border-slate-100">
          <p className="text-[10px] font-black uppercase text-slate-400 mb-2">
            Status Toko
          </p>
          <button
            onClick={toggleShopStatus}
            className={`w-full py-2 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2 transition-all ${merchantProfile?.is_shop_open ? "bg-green-500 text-white shadow-green-200 shadow-lg" : "bg-slate-200 text-slate-500"}`}
          >
            <Power size={14} />{" "}
            {merchantProfile?.is_shop_open ? "TOKO BUKA" : "TOKO TUTUP"}
          </button>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-5 py-4 rounded-xl text-red-500 hover:bg-red-50 transition-all font-bold text-xs uppercase"
        >
          <LogOut size={20} /> Keluar
        </button>
      </aside>

      {/* MOBILE BOTTOM NAV */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-2 flex justify-around items-center z-50 pb-safe shadow-[0_-5px_10px_rgba(0,0,0,0.05)]">
        <MobileNavItem
          icon={<LayoutDashboard size={20} />}
          label="Home"
          active={activeTab === "overview"}
          onClick={() => setActiveTab("overview")}
        />
        <MobileNavItem
          icon={<Package size={20} />}
          label="Produk"
          active={activeTab === "products"}
          onClick={() => setActiveTab("products")}
        />
        <div className="relative -top-5">
          <button
            onClick={() => setShowAddModal(true)}
            className="w-14 h-14 bg-indigo-600 rounded-full text-white flex items-center justify-center shadow-xl shadow-indigo-300 active:scale-90 transition-transform border-4 border-slate-50"
          >
            <Plus size={28} />
          </button>
        </div>
        <MobileNavItem
          icon={<ShoppingBag size={20} />}
          label="Order"
          active={activeTab === "orders"}
          onClick={() => setActiveTab("orders")}
          count={orders.length}
        />
        <MobileNavItem
          icon={<MapPin size={20} />}
          label="Lokasi"
          onClick={() => setShowLocationModal(true)}
        />
      </div>

      {/* MAIN CONTENT */}
      <main className="flex-1 md:ml-72 p-6 md:p-10 text-left">
        <div className="md:hidden flex justify-between items-center mb-8">
          <div>
            <h1 className="text-xl font-black uppercase text-slate-800 leading-none">
              Halo Juragan!
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">
              Kelola tokomu hari ini
            </p>
          </div>
          <button
            onClick={toggleShopStatus}
            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase flex items-center gap-2 transition-all ${merchantProfile?.is_shop_open ? "bg-green-500 text-white shadow-lg" : "bg-slate-200 text-slate-500"}`}
          >
            <Power size={12} />{" "}
            {merchantProfile?.is_shop_open ? "BUKA" : "TUTUP"}
          </button>
        </div>

        {activeTab === "products" && (
          <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black uppercase text-slate-800">
                Daftar Produk
              </h2>
              <button
                onClick={() => setShowAddModal(true)}
                className="hidden md:flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:scale-105 transition-transform shadow-lg shadow-indigo-200"
              >
                <Plus size={18} /> Tambah Produk
              </button>
            </div>
            {products.length === 0 ? (
              <div className="p-10 text-center border-2 border-dashed border-slate-300 rounded-[2rem] bg-slate-50">
                <Package size={48} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500 font-bold mb-4 text-xs uppercase tracking-widest">
                  Etalase toko masih kosong nih, Gan.
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs"
                >
                  Mulai Jualan
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((p) => (
                  <div
                    key={p.id}
                    className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden"
                  >
                    <div className="absolute top-4 right-4 z-10">
                      {p.status === "approved" && (
                        <span className="bg-green-500 text-white px-2 py-1 rounded-lg text-[10px] font-black uppercase shadow-sm flex items-center gap-1">
                          <CheckCircle size={10} /> Aktif
                        </span>
                      )}
                      {p.status === "pending" && (
                        <span className="bg-yellow-400 text-slate-900 px-2 py-1 rounded-lg text-[10px] font-black uppercase shadow-sm flex items-center gap-1">
                          <Clock size={10} /> Verifikasi
                        </span>
                      )}
                      {p.status === "rejected" && (
                        <span className="bg-red-500 text-white px-2 py-1 rounded-lg text-[10px] font-black uppercase shadow-sm flex items-center gap-1">
                          <X size={10} /> Ditolak
                        </span>
                      )}
                    </div>
                    <div className="w-full h-40 bg-slate-100 rounded-2xl mb-4 overflow-hidden relative">
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          className={`w-full h-full object-cover transition-transform duration-500 ${p.status === "approved" ? "group-hover:scale-110" : "grayscale opacity-70"}`}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-slate-300">
                          <Package size={32} />
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-slate-800 line-clamp-2 leading-tight flex-1 uppercase text-xs tracking-tight">
                        {p.name}
                      </h3>
                      <span className="text-[9px] font-bold bg-slate-100 px-2 py-1 rounded text-slate-500">
                        {p.unit}
                      </span>
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">
                          Stok: {p.stock}
                        </p>
                        <p className="text-sm font-black text-indigo-600 tracking-tighter">
                          Rp {p.price.toLocaleString()}
                        </p>
                      </div>
                      <button className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:bg-indigo-600 hover:text-white transition-colors">
                        <Search size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "orders" && (
          <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-2xl font-black uppercase text-slate-800 mb-6">
              Pesanan Masuk
            </h2>
            <div className="flex p-1 bg-slate-200 rounded-xl mb-6 font-bold text-[10px] uppercase tracking-widest">
              <button className="flex-1 py-3 bg-white shadow rounded-lg text-indigo-900">
                Perlu Dikirim
              </button>
              <button className="flex-1 py-3 text-slate-500 hover:bg-white/50 rounded-lg">
                Dikirim
              </button>
              <button className="flex-1 py-3 text-slate-500 hover:bg-white/50 rounded-lg">
                Selesai
              </button>
            </div>
            {orders.length === 0 ? (
              <div className="text-center py-20 opacity-50">
                <ShoppingBag
                  size={48}
                  className="mx-auto text-slate-300 mb-4"
                />
                <p className="font-bold text-slate-400 uppercase text-xs tracking-widest text-center">
                  Belum ada pesanan masuk.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm"
                  >
                    <div className="flex justify-between items-center mb-4 border-b border-slate-50 pb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                          P
                        </div>
                        <span className="font-bold text-sm text-slate-700 uppercase tracking-tighter">
                          Order ID: #{order.id.slice(0, 5)}
                        </span>
                      </div>
                      <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">
                        Perlu Dikirim
                      </span>
                    </div>
                    <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-50">
                      <button className="px-4 py-2 border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-500">
                        Tolak
                      </button>
                      <button className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700">
                        Proses Order
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "overview" && (
          <div className="max-w-4xl mx-auto animate-in fade-in">
            <div className="p-8 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2.5rem] text-white shadow-xl shadow-indigo-200 mb-8 relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-indigo-200 text-xs font-black uppercase tracking-[0.2em] mb-1">
                  Total Saldo
                </p>
                <h2 className="text-4xl font-black tracking-tighter">Rp 0</h2>
                <button className="mt-6 px-6 py-3 bg-white/20 backdrop-blur-md rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-white/30 transition-all border border-white/10">
                  <Wallet size={14} /> Tarik Dana
                </button>
              </div>
              <Wallet className="absolute right-[-20px] bottom-[-20px] text-white/5 w-64 h-64 rotate-[-15deg]" />
            </div>
            <h3 className="font-black text-slate-800 uppercase mb-4 tracking-widest text-xs">
              Performa Toko
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatBox label="Pengunjung" value="0" />
              <StatBox label="Dilihat" value="0" />
              <StatBox label="Pesanan" value="0" />
              <StatBox label="Rating" value="0.0" />
            </div>
          </div>
        )}
      </main>

      {/* MODAL SET LOKASI TOKO */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[10001] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] p-8 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 text-left no-scrollbar shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-black uppercase text-slate-800 tracking-tight leading-none">
                  Atur Lokasi Toko
                </h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-2 tracking-widest">
                  Tentukan titik jualan Anda untuk kalkulasi ongkir
                </p>
              </div>
              <button
                onClick={() => setShowLocationModal(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="text-slate-400" size={20} />
              </button>
            </div>
            <div className="h-[400px] rounded-3xl overflow-hidden border border-slate-200 mb-6 shadow-inner relative z-0">
              <LocationPicker
                onLocationSelected={handleUpdateLocation}
                initialPos={
                  merchantProfile?.latitude
                    ? [merchantProfile.latitude, merchantProfile.longitude]
                    : undefined
                }
              />
            </div>
            <p className="text-[9px] font-bold text-center text-slate-400 uppercase tracking-[0.2em] italic">
              Geser pin ke titik tepat toko/kios Anda berada.
            </p>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH PRODUK */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[1000] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 text-left no-scrollbar shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black uppercase text-slate-800 tracking-tight">
                Tambah Produk Baru
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="text-slate-400" size={20} />
              </button>
            </div>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div className="w-full h-44 bg-slate-50 border-2 border-dashed border-slate-300 rounded-3xl flex flex-col items-center justify-center text-slate-400 hover:bg-slate-100 hover:border-indigo-400 cursor-pointer relative overflow-hidden group">
                {imageFile ? (
                  <img
                    src={URL.createObjectURL(imageFile)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <>
                    <Upload
                      size={32}
                      className="mb-2 group-hover:scale-110 transition-transform"
                    />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      Upload Foto Produk
                    </span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) =>
                    e.target.files && setImageFile(e.target.files[0])
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Nama Produk"
                  val={newProduct.name}
                  set={(v: string) => setNewProduct({ ...newProduct, name: v })}
                />
                <Input
                  label="Satuan"
                  val={newProduct.unit}
                  set={(v: string) => setNewProduct({ ...newProduct, unit: v })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Harga (Rp)"
                  type="number"
                  val={newProduct.price}
                  set={(v: string) =>
                    setNewProduct({ ...newProduct, price: v })
                  }
                />
                <Input
                  label="Stok Awal"
                  type="number"
                  val={newProduct.stock}
                  set={(v: string) =>
                    setNewProduct({ ...newProduct, stock: v })
                  }
                />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase ml-4 mb-2 block tracking-widest">
                  Deskripsi Produk
                </label>
                <textarea
                  className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-indigo-600 h-28 resize-none shadow-inner"
                  placeholder="Jelaskan detail barang..."
                  value={newProduct.description}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      description: e.target.value,
                    })
                  }
                ></textarea>
              </div>
              <button
                disabled={isUploading}
                className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-indigo-700 disabled:bg-slate-300 transition-all active:scale-95 flex items-center justify-center gap-2 mt-4"
              >
                {isUploading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  "Simpan Produk"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// HELPER COMPONENTS
const SidebarItem = ({ icon, label, active, onClick, count }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest group ${active ? "bg-indigo-50 text-indigo-700 shadow-inner" : "text-slate-500 hover:bg-slate-50"}`}
  >
    <div
      className={`${active ? "text-indigo-600" : "text-slate-400 group-hover:text-indigo-400"}`}
    >
      {icon}
    </div>
    <span className="flex-1 text-left">{label}</span>
    {count !== undefined && (
      <span
        className={`px-2 py-0.5 rounded-lg text-[9px] font-black ${active ? "bg-indigo-200 text-indigo-800" : "bg-slate-100 text-slate-500"}`}
      >
        {count}
      </span>
    )}
  </button>
);

const MobileNavItem = ({
  icon,
  label,
  active,
  onClick,
  isDanger,
  count,
}: any) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-2 relative ${isDanger ? "text-red-500" : active ? "text-indigo-600" : "text-slate-400"}`}
  >
    {icon}
    <span className="text-[8px] font-black mt-1 uppercase tracking-widest">
      {label}
    </span>
    {count > 0 && (
      <span className="absolute top-1 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border border-white"></span>
    )}
  </button>
);

const Input = ({ label, val, set, type = "text" }: any) => (
  <div className="space-y-1 text-left">
    <label className="text-[9px] font-black text-slate-400 uppercase ml-4 tracking-widest">
      {label}
    </label>
    <input
      type={type}
      required
      value={val}
      onChange={(e) => set(e.target.value)}
      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-indigo-600 shadow-inner"
    />
  </div>
);

const StatBox = ({ label, value }: any) => (
  <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm text-center">
    <h4 className="text-2xl font-black text-slate-800 tracking-tighter">
      {value}
    </h4>
    <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mt-1">
      {label}
    </p>
  </div>
);
