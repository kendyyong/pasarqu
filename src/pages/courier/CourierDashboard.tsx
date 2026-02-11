import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { supabase } from "../../lib/supabaseClient";
import { calculateDistance, formatDistanceText } from "../../utils/geo";
import {
  Bike,
  LogOut,
  Navigation,
  MapPin,
  Zap,
  CheckCircle,
  Smartphone,
  History,
  User,
  Bell,
  ChevronRight,
  Clock,
  ShieldAlert,
  MessageCircle,
  Loader2,
  X,
  Radar,
  Power,
  Package,
  DollarSign,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LocationPicker } from "../../components/LocationPicker";

export const CourierDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("bid");
  const [isOnline, setIsOnline] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [courierProfile, setCourierProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // STATE LOKASI
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // --- 1. INIT DATA & VERIFIKASI ---
  useEffect(() => {
    if (!user) return;

    const initProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (data) {
        setCourierProfile(data);
        setIsOnline(data.is_active || false);

        if (data.latitude && data.longitude) {
          setCurrentCoords({ lat: data.latitude, lng: data.longitude });
        }
      }
      setLoading(false);
    };

    initProfile();
    detectLocation();
  }, [user]);

  // --- 2. LOGIKA REALTIME ORDER (YANG DIPERBAIKI) ---
  useEffect(() => {
    let interval: any;

    const fetchNearbyOrders = async () => {
      if (!isOnline || !currentCoords) return;

      // PERBAIKAN: Ambil order yang statusnya 'READY_FOR_PICKUP' (Panggilan dari Penjual)
      const { data } = await supabase
        .from("orders")
        .select(
          `
                id, total_amount, status, created_at,
                profiles:buyer_id (name, phone_number, address, latitude, longitude),
                merchants:merchant_id (name, address, latitude, longitude)
            `,
        )
        .eq("status", "READY_FOR_PICKUP") // Filter Status Kunci
        // .eq('market_id', courierProfile?.managed_market_id) // Optional: Jika ingin membatasi per pasar
        .order("created_at", { ascending: false });

      if (data) {
        // Filter jarak (Misal max 10km)
        const nearby = data
          .filter((order: any) => {
            if (!order.merchants?.latitude || !order.merchants?.longitude)
              return false;
            const dist = calculateDistance(
              currentCoords.lat,
              currentCoords.lng,
              order.merchants.latitude,
              order.merchants.longitude,
            );
            return dist <= 10; // Max 10 KM dari posisi kurir saat ini
          })
          .map((order: any) => ({
            ...order,
            distance: calculateDistance(
              currentCoords.lat,
              currentCoords.lng,
              order.merchants.latitude,
              order.merchants.longitude,
            ),
          }));

        setOrders(nearby);
      }
    };

    if (isOnline) {
      fetchNearbyOrders(); // Fetch pertama
      interval = setInterval(fetchNearbyOrders, 5000); // Polling tiap 5 detik agar cepat update
    } else {
      setOrders([]);
    }

    // Subscribe Realtime Supabase (Opsional, untuk respons instan)
    const channel = supabase
      .channel("courier_room")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: "status=eq.READY_FOR_PICKUP",
        },
        (payload) => {
          fetchNearbyOrders(); // Refresh jika ada data baru
          playNotificationSound();
        },
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [isOnline, currentCoords]);

  // --- 3. FUNGSI PENDUKUNG ---
  const playNotificationSound = () => {
    const audio = new Audio(
      "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3",
    );
    audio
      .play()
      .catch((e) => console.log("Audio play failed interaction needed"));
  };

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newCoords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setCurrentCoords(newCoords);
        if (user) {
          supabase
            .from("profiles")
            .update({
              latitude: newCoords.lat,
              longitude: newCoords.lng,
              last_active_at: new Date(),
            })
            .eq("id", user.id);
        }
      },
      (err) => console.error("GPS Error:", err),
    );
  };

  const handleUpdateBaseLocation = async (
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

      setCourierProfile({
        ...courierProfile,
        latitude: lat,
        longitude: lng,
        address: address,
      });
      setCurrentCoords({ lat, lng });
      showToast("Lokasi Pangkalan Diperbarui!", "success");
      setShowLocationModal(false);
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    if (!window.confirm("Ambil orderan ini?")) return;

    try {
      // Update status order jadi 'ON_DELIVERY' dan assign kurir_id
      const { error } = await supabase
        .from("orders")
        .update({
          status: "ON_DELIVERY",
          courier_id: user?.id,
        })
        .eq("id", orderId);

      if (error) throw error;

      showToast("Orderan Berhasil Diambil! Segera ke Toko.", "success");
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (err: any) {
      showToast("Gagal ambil order: " + err.message, "error");
    }
  };

  const handleLogout = async () => {
    if (window.confirm("Selesai Bid & Keluar?")) {
      await logout();
      navigate("/");
    }
  };

  const toggleOnline = async () => {
    if (!courierProfile?.is_verified) {
      showToast("Akun belum diverifikasi Admin.", "error");
      return;
    }

    const newState = !isOnline;
    setIsOnline(newState);

    await supabase
      .from("profiles")
      .update({ is_active: newState })
      .eq("id", user?.id);

    showToast(
      newState ? "MODE ONLINE AKTIF" : "MODE OFFLINE",
      newState ? "success" : "info",
    );
    if (newState) detectLocation();
  };

  if (loading)
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-teal-600">
        <Loader2 className="animate-spin" size={40} />
      </div>
    );

  // VIEW: BELUM VERIFIKASI
  if (courierProfile && !courierProfile.is_verified) {
    return (
      <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-6 text-left font-sans">
        <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl border border-slate-200 text-center animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-teal-50 text-teal-600 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-teal-100 shadow-inner">
            <Clock size={40} className="animate-pulse" />
          </div>
          <h1 className="text-xl font-black uppercase tracking-tight text-slate-800 leading-none">
            Menunggu Verifikasi
          </h1>
          <p className="text-[11px] text-slate-500 font-bold uppercase mt-4 leading-relaxed tracking-widest px-2">
            Data Mitra{" "}
            <span className="text-teal-600">"{courierProfile.name}"</span>{" "}
            sedang ditinjau.
          </p>
          <div className="mt-8 space-y-3">
            <button
              onClick={() =>
                window.open("https://wa.me/628123456789", "_blank")
              }
              className="w-full py-4 bg-teal-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-teal-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-200"
            >
              <MessageCircle size={16} /> Hubungi Admin
            </button>
            <button
              onClick={handleLogout}
              className="w-full py-4 bg-white border border-slate-200 text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:text-rose-500 transition-all"
            >
              Keluar Aplikasi
            </button>
          </div>
        </div>
      </div>
    );
  }

  // VIEW: DASHBOARD UTAMA
  return (
    <div className="min-h-screen font-sans flex bg-slate-50 text-slate-900 pb-24 md:pb-0">
      {/* SIDEBAR (Desktop) */}
      <aside className="hidden md:flex w-72 flex-col p-6 fixed h-full z-20 bg-white border-r border-slate-200">
        <div className="flex items-center gap-4 mb-10 px-2">
          <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-teal-200">
            <Bike size={20} />
          </div>
          <div className="text-left">
            <h2 className="font-black text-sm uppercase leading-none">
              Driver
            </h2>
            <div className="flex items-center gap-1 mt-1">
              <p className="text-[10px] font-bold uppercase text-teal-500 truncate w-32">
                {courierProfile?.name?.split(" ")[0]}
              </p>
              <CheckCircle size={10} className="text-blue-500" />
            </div>
          </div>
        </div>
        <nav className="space-y-2 flex-1">
          <SidebarItem
            icon={<Zap size={20} />}
            label="Bid Area"
            active={activeTab === "bid"}
            onClick={() => setActiveTab("bid")}
          />
          <SidebarItem
            icon={<History size={20} />}
            label="Riwayat"
            active={activeTab === "history"}
            onClick={() => setActiveTab("history")}
          />
          <SidebarItem
            icon={<MapPin size={20} />}
            label="Atur Pangkalan"
            onClick={() => setShowLocationModal(true)}
          />
          <SidebarItem
            icon={<User size={20} />}
            label="Profil"
            active={activeTab === "profile"}
            onClick={() => setActiveTab("profile")}
          />
        </nav>

        <div className="p-4 bg-slate-50 rounded-2xl mb-4 border border-slate-100 text-center">
          <p className="text-[10px] font-black uppercase text-slate-400 mb-2">
            Status Kerja
          </p>
          <button
            onClick={toggleOnline}
            className={`w-full py-2 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2 transition-all ${isOnline ? "bg-green-500 text-white shadow-green-200 shadow-lg" : "bg-slate-200 text-slate-500"}`}
          >
            <PowerIcon size={14} /> {isOnline ? "ONLINE" : "OFFLINE"}
          </button>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-5 py-4 rounded-xl text-red-500 hover:bg-red-50 transition-all font-bold text-xs uppercase"
        >
          <LogOut size={20} /> Keluar
        </button>
      </aside>

      {/* MOBILE HEADER */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white z-40 px-6 py-4 flex justify-between items-center border-b border-slate-100 shadow-sm text-left">
        <div className="flex items-center gap-3 text-left">
          <div className="w-10 h-10 bg-teal-50 rounded-full flex items-center justify-center text-teal-600 border border-teal-100">
            <Bike size={20} />
          </div>
          <div className="text-left">
            <h1 className="font-black text-sm uppercase text-slate-800 leading-none">
              {courierProfile?.name?.split(" ")[0]}
            </h1>
            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tight">
              Saldo: Rp{courierProfile?.wallet_balance || 0}
            </p>
          </div>
        </div>
        <div
          onClick={toggleOnline}
          className={`px-4 py-2 rounded-full flex items-center gap-2 cursor-pointer transition-all ${isOnline ? "bg-green-100 text-green-700 shadow-sm" : "bg-slate-100 text-slate-400"}`}
        >
          <div
            className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-500 animate-pulse" : "bg-slate-400"}`}
          ></div>
          <span className="text-[10px] font-black uppercase">
            {isOnline ? "ON" : "OFF"}
          </span>
        </div>
      </div>

      {/* MOBILE BOTTOM NAV */}
      <div className="md:hidden fixed bottom-6 left-6 right-6 bg-slate-900 text-white rounded-[2rem] p-2 flex justify-around items-center z-50 shadow-2xl shadow-slate-900/40 backdrop-blur-md bg-opacity-90">
        <MobileNavItem
          icon={<Zap size={20} />}
          active={activeTab === "bid"}
          onClick={() => setActiveTab("bid")}
        />
        <MobileNavItem
          icon={<History size={20} />}
          active={activeTab === "history"}
          onClick={() => setActiveTab("history")}
        />
        <MobileNavItem
          icon={<MapPin size={20} />}
          onClick={() => setShowLocationModal(true)}
        />
        <MobileNavItem
          icon={<User size={20} />}
          active={activeTab === "profile"}
          onClick={() => setActiveTab("profile")}
        />
      </div>

      {/* MAIN CONTENT */}
      <main className="flex-1 md:ml-72 p-6 md:p-10 pt-24 md:pt-10 text-left">
        {/* TAB: BID AREA (ORDER MASUK) */}
        {activeTab === "bid" && (
          <div className="max-w-2xl mx-auto animate-in fade-in duration-500 text-left">
            {/* STATUS CARD */}
            <div
              className={`p-8 rounded-[2.5rem] mb-6 text-white relative overflow-hidden flex flex-col items-center justify-center text-center py-12 transition-all duration-700 ${isOnline ? "bg-teal-600 shadow-2xl shadow-teal-200" : "bg-slate-800"}`}
            >
              {isOnline ? (
                <>
                  <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center animate-ping absolute opacity-10"></div>
                  <Radar size={56} className="mb-4 animate-pulse text-white" />
                  <h2 className="text-2xl font-black uppercase tracking-tight text-center">
                    Menunggu Orderan...
                  </h2>
                  <p className="text-[10px] text-teal-100 uppercase tracking-widest mt-2">
                    Menyisir area sekitar {currentCoords ? "Anda" : "..."}
                  </p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4">
                    <Zap size={32} className="opacity-50" />
                  </div>
                  <h2 className="text-xl font-black uppercase opacity-50 tracking-widest text-center">
                    Status Offline
                  </h2>
                  <p className="text-[10px] font-bold uppercase opacity-40 mt-1 tracking-tight text-center">
                    Aktifkan untuk mulai bekerja
                  </p>
                </>
              )}
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
            </div>

            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-slate-800 uppercase flex items-center gap-2 text-xs tracking-[0.2em]">
                <Bell size={14} className="text-teal-600" /> Order Masuk (
                {orders.length})
              </h3>
              <button
                onClick={detectLocation}
                className="text-[9px] font-bold text-teal-600 uppercase hover:underline flex items-center gap-1"
              >
                <Navigation size={10} /> Update Lokasi
              </button>
            </div>

            {orders.length === 0 ? (
              <div
                className={`p-10 text-center rounded-[2rem] border-2 border-dashed border-slate-200 bg-white/50 animate-in zoom-in-95`}
              >
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">
                  Belum ada pesanan masuk
                </p>
              </div>
            ) : (
              <div className="space-y-4 pb-20">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 hover:border-teal-200 transition-all group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center">
                          <Package size={20} />
                        </div>
                        <div>
                          <h4 className="font-black text-sm text-slate-800">
                            {order.merchants?.name || "Toko"}
                          </h4>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">
                            Jarak: {formatDistanceText(order.distance)}
                          </p>
                        </div>
                      </div>
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                        Rp{order.total_amount?.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-start gap-3 pl-3 border-l-2 border-slate-100 ml-5 mb-4">
                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">
                          Ambil Di:
                        </p>
                        <p className="text-xs text-slate-700 line-clamp-1">
                          {order.merchants?.address}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 pl-3 border-l-2 border-teal-100 ml-5 mb-4">
                      <div className="space-y-1">
                        <p className="text-[10px] text-teal-600 font-bold uppercase">
                          Antar Ke:
                        </p>
                        <p className="text-xs text-slate-700 font-bold">
                          {order.profiles?.name}
                        </p>
                        <p className="text-xs text-slate-500 line-clamp-1">
                          {order.profiles?.address}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAcceptOrder(order.id)}
                      className="w-full py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-teal-600 transition-all flex items-center justify-center gap-2 shadow-lg group-hover:shadow-teal-200/50"
                    >
                      <Bike size={16} /> Ambil Orderan
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: HISTORY */}
        {activeTab === "history" && (
          <div className="text-center py-20 text-slate-400 text-[10px] font-black uppercase tracking-widest">
            Riwayat Masih Kosong
          </div>
        )}

        {/* TAB: PROFILE */}
        {activeTab === "profile" && (
          <div className="max-w-xl mx-auto space-y-4 animate-in slide-in-from-bottom-4 text-left">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 text-center shadow-sm relative overflow-hidden">
              <div className="w-24 h-24 bg-teal-50 rounded-full mx-auto flex items-center justify-center text-teal-600 mb-4 border-4 border-white shadow-xl">
                <User size={40} />
              </div>
              <h2 className="text-xl font-black uppercase text-slate-800 tracking-tight">
                {courierProfile?.name}
              </h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
                {courierProfile?.phone_number}
              </p>

              <div className="grid grid-cols-2 gap-3 text-left">
                <StatBox
                  label="Saldo Dompet"
                  value={`Rp${courierProfile?.wallet_balance?.toLocaleString() || 0}`}
                  icon={<DollarSign size={16} />}
                />
                <StatBox
                  label="Total Order"
                  value="0"
                  icon={<Package size={16} />}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL LOKASI */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[10001] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] p-6 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-black uppercase text-slate-800">
                Atur Pangkalan
              </h2>
              <button onClick={() => setShowLocationModal(false)}>
                <X className="text-slate-400" />
              </button>
            </div>
            <div className="flex-1 rounded-[2rem] overflow-hidden border border-slate-200 relative">
              <LocationPicker
                onLocationSelected={handleUpdateBaseLocation}
                initialPos={
                  courierProfile?.latitude
                    ? [courierProfile.latitude, courierProfile.longitude]
                    : undefined
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// SUB COMPONENTS
const SidebarItem = ({ icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest group ${active ? "bg-teal-50 text-teal-700 shadow-inner" : "text-slate-500 hover:bg-slate-50"}`}
  >
    <div
      className={`${active ? "text-teal-600" : "text-slate-400 group-hover:text-teal-400 transition-colors"}`}
    >
      {icon}
    </div>
    <span className="text-left">{label}</span>
  </button>
);

const MobileNavItem = ({ icon, active, onClick, isDanger }: any) => (
  <button
    onClick={onClick}
    className={`p-4 rounded-full transition-all flex items-center justify-center ${active ? "bg-white text-teal-600 shadow-xl scale-110" : isDanger ? "text-rose-400 hover:bg-rose-500/10" : "text-slate-400 hover:text-white"}`}
  >
    {icon}
  </button>
);

const StatBox = ({ label, value, icon }: any) => (
  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
    <div className="text-teal-500">{icon}</div>
    <div>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
        {label}
      </p>
      <p className="text-sm font-black text-slate-800">{value}</p>
    </div>
  </div>
);

const PowerIcon = ({ size }: { size: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
    <line x1="12" y1="2" x2="12" y2="12" />
  </svg>
);
