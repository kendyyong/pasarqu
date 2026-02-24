import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import {
  ArrowLeft,
  MapPin,
  CheckCircle,
  MessageCircle,
  Search,
  Share2,
  MoreVertical,
  ShoppingBag,
  Timer,
  Clock,
  AlertCircle,
  Loader2,
  UserCheck,
} from "lucide-react";

import { ChatRoom } from "../../pages/chat/ChatRoom";

const getTimeAgo = (dateString: string) => {
  if (!dateString) return "waktu tidak diketahui";
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) return interval + " tahun lalu";
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return interval + " bulan lalu";
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return interval + " hari lalu";
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return interval + " jam lalu";
  interval = Math.floor(seconds / 60);
  if (interval >= 1) return interval + " menit lalu";
  return "Baru saja";
};

export const ShopDetail: React.FC = () => {
  const { merchantId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [shop, setShop] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("home");

  const [chatLoading, setChatLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const [isDesktopChatOpen, setIsDesktopChatOpen] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [chatInitialMsg, setChatInitialMsg] = useState("");

  const handleShare = async () => {
    const shareData = {
      title: shop?.shop_name || "Toko PasarQu",
      text: `Kunjungi toko ${shop?.shop_name} di PasarQu!`,
      url: window.location.href,
    };

    if (navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log("Share dibatalkan user");
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        showToast("Tautan toko berhasil disalin!", "success");
      } catch (err) {
        showToast("Gagal menyalin link", "error");
      }
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    if (merchantId) {
      fetchShopData();
      checkFollowStatus();
    }
  }, [merchantId, user]);

  const checkFollowStatus = async () => {
    if (!user || !merchantId) return;
    try {
      // 🚀 FIX 400: Gunakan select("*")
      const { data } = await supabase
        .from("shop_followers")
        .select("*")
        .eq("user_id", user.id)
        .eq("merchant_id", merchantId)
        .maybeSingle();
      setIsFollowing(!!data);
    } catch (error) {
      console.error("Gagal cek status follow", error);
    }
  };

  const fetchShopData = async () => {
    setLoading(true);
    try {
      // 🚀 FIX 400: Hapus select("status, updated_at"), gunakan select("*")
      const { data: merchantRecord, error: err1 } = await supabase
        .from("merchants")
        .select("*")
        .eq("user_id", merchantId)
        .maybeSingle();
      if (err1) console.warn("Merchants warning:", err1.message);

      // 🚀 FIX 400: Gunakan select("*")
      const { data: profileRecord, error: err2 } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", merchantId)
        .maybeSingle();
      if (err2) console.warn("Profiles warning:", err2.message);

      if (!profileRecord) {
        setShop(null);
      } else {
        const isOpen = merchantRecord?.status === "APPROVED";
        setShop({
          shop_name:
            profileRecord.name ||
            profileRecord.full_name ||
            profileRecord.username ||
            "Toko Pasarqu",
          avatar_url: profileRecord.avatar_url,
          address: profileRecord.address,
          phone_number: profileRecord.phone,
          is_verified: true,
          is_open: isOpen,
          last_active:
            profileRecord.last_active ||
            profileRecord.updated_at ||
            merchantRecord?.updated_at ||
            new Date().toISOString(),
        });
      }

      // 🚀 FIX 400: Mencegah error jika relasi categories gagal
      const { data: prodData, error: err3 } = await supabase
        .from("products")
        .select("*, categories(name)")
        .eq("merchant_id", merchantId)
        .eq("status", "APPROVED")
        .order("created_at", { ascending: false });
      if (err3) console.warn("Products warning:", err3.message);

      setProducts(prodData || []);
    } catch (error) {
      console.error("Gagal mengambil data toko:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!user) return navigate("/login");
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await supabase
          .from("shop_followers")
          .delete()
          .eq("user_id", user.id)
          .eq("merchant_id", merchantId);
        setIsFollowing(false);
        showToast("Batal mengikuti toko", "success");
      } else {
        await supabase
          .from("shop_followers")
          .insert([{ user_id: user.id, merchant_id: merchantId }]);
        setIsFollowing(true);
        showToast("Berhasil mengikuti toko", "success");
      }
    } catch (error) {
      showToast("Fitur ikuti sedang maintenance", "error");
    } finally {
      setFollowLoading(false);
    }
  };

  const handleContactSeller = async () => {
    if (chatLoading) return;

    if (!user) {
      showToast("Silakan login terlebih dahulu", "error");
      return navigate("/login");
    }
    if (!merchantId || !shop) {
      return showToast("Akun toko tidak valid atau telah dihapus.", "error");
    }

    setChatLoading(true);
    try {
      const cleanId = merchantId.trim();
      let roomId = null;

      // 🚀 FIX 400: Gunakan select("*") untuk mencegah column mismatch
      let { data: roomA } = await supabase
        .from("chat_rooms")
        .select("*")
        .eq("participant_1_id", user.id)
        .eq("participant_2_id", cleanId)
        .maybeSingle();

      if (roomA?.id) {
        roomId = roomA.id;
      } else {
        let { data: roomB } = await supabase
          .from("chat_rooms")
          .select("*")
          .eq("participant_1_id", cleanId)
          .eq("participant_2_id", user.id)
          .maybeSingle();
        if (roomB?.id) roomId = roomB.id;
      }

      if (!roomId) {
        const { data: newRoom, error: insertErr } = await supabase
          .from("chat_rooms")
          .insert([
            {
              participant_1_id: user.id,
              participant_2_id: cleanId,
              updated_at: new Date().toISOString(),
            },
          ])
          .select("*")
          .maybeSingle();

        if (insertErr) {
          if (
            insertErr.code === "23505" ||
            String(insertErr.message).toLowerCase().includes("conflict") ||
            insertErr.code === "409"
          ) {
            const { data: retryRoom } = await supabase
              .from("chat_rooms")
              .select("*")
              .eq("participant_1_id", user.id)
              .eq("participant_2_id", cleanId)
              .maybeSingle();
            if (retryRoom?.id) roomId = retryRoom.id;
            else throw new Error("Gagal memuat ulang ruang chat.");
          } else if (insertErr.code === "23503") {
            throw new Error("Gagal: Akun penjual tidak terdaftar di sistem.");
          } else {
            throw insertErr;
          }
        } else if (newRoom) {
          roomId = newRoom.id;
        }
      }

      if (!roomId) throw new Error("ID Ruang Chat tidak ditemukan.");

      const autoMessage = `Halo ${shop?.shop_name || "Admin"}, saya punya pertanyaan seputar toko Anda.`;

      if (window.innerWidth >= 768) {
        setActiveRoomId(roomId);
        setChatInitialMsg(autoMessage);
        setIsDesktopChatOpen(true);
      } else {
        navigate(`/chat/${roomId}?text=${encodeURIComponent(autoMessage)}`);
      }
    } catch (err: any) {
      console.error("Chat Error:", err.message || err);
      showToast(err.message || "Gagal memulai chat dengan penjual", "error");
    } finally {
      setChatLoading(false);
    }
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-[#008080]" size={40} />
      </div>
    );

  if (!shop)
    return (
      <div className="p-20 text-center flex flex-col items-center justify-center bg-slate-50 h-screen px-6">
        <ShoppingBag size={64} className="text-slate-200 mb-4" />
        <h2 className="text-[16px] font-black text-slate-400 uppercase tracking-widest leading-none">
          Toko Tidak Ditemukan
        </h2>
        <p className="text-[12px] text-slate-400 mt-3 uppercase font-bold max-w-xs leading-relaxed">
          Toko mungkin sedang dalam peninjauan atau ID yang Anda gunakan salah.
        </p>
        <button
          onClick={() => navigate("/")}
          className="mt-8 px-8 py-3 bg-[#008080] text-white rounded-xl font-black text-[12px] uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all"
        >
          Kembali ke Beranda
        </button>
      </div>
    );

  return (
    <div className="bg-[#F5F5F5] min-h-screen pb-20 font-sans text-left antialiased relative">
      <header className="fixed top-0 left-0 right-0 bg-[#008080] z-[100] shadow-md">
        <div className="max-w-[1200px] mx-auto h-14 px-4 flex items-center gap-3 text-white">
          <button
            onClick={() => navigate(-1)}
            className="p-1 active:scale-90 transition-transform"
          >
            <ArrowLeft size={22} />
          </button>
          <div className="flex-1 bg-white/20 rounded-lg py-1.5 px-3 flex items-center gap-2 border border-white/10">
            <Search size={18} className="text-white/70" />
            <input
              type="text"
              placeholder="Cari produk di toko ini..."
              className="bg-transparent border-none outline-none text-[12px] text-white placeholder:text-white/60 w-full"
            />
          </div>
          <button
            onClick={handleShare}
            className="p-1 hover:bg-white/20 rounded-full cursor-pointer transition-all active:scale-90"
          >
            <Share2 size={22} />
          </button>
          <MoreVertical size={22} className="cursor-pointer" />
        </div>
      </header>

      <div
        className={`fixed inset-0 z-[200] transition-all duration-300 ${isDesktopChatOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      >
        <div
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          onClick={() => setIsDesktopChatOpen(false)}
        ></div>
        <div
          className={`absolute top-0 right-0 bottom-0 w-[400px] bg-white shadow-2xl transform transition-transform duration-300 flex flex-col ${isDesktopChatOpen ? "translate-x-0" : "translate-x-full"}`}
        >
          {activeRoomId && isDesktopChatOpen && (
            <ChatRoom
              embeddedRoomId={activeRoomId}
              initialMessage={chatInitialMsg}
              onClose={() => setIsDesktopChatOpen(false)}
            />
          )}
        </div>
      </div>

      <div className="mt-14 bg-slate-900 border-b-4 border-[#FF6600] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#008080]/30 to-transparent"></div>
        <div className="max-w-[1200px] mx-auto p-6 md:p-10 relative z-10 flex flex-col md:flex-row gap-6 md:items-center">
          <div className="flex gap-4 items-center">
            <div className="relative shrink-0">
              <div className="w-20 h-20 md:w-28 md:h-28 bg-white rounded-full p-0.5 shadow-lg border-2 border-[#008080] overflow-hidden text-center flex items-center justify-center">
                {shop.avatar_url ? (
                  <img
                    src={shop.avatar_url}
                    className={`w-full h-full object-cover rounded-full ${!shop.is_open ? "grayscale opacity-80" : ""}`}
                    alt="logo"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-3xl md:text-5xl font-black text-[#008080] uppercase">
                    {shop.shop_name?.[0]}
                  </div>
                )}
              </div>
              {shop.is_verified && (
                <div className="absolute bottom-0 right-0 bg-[#008080] text-white p-1 rounded-full border-2 border-slate-900 shadow-sm">
                  <CheckCircle size={16} fill="currentColor" />
                </div>
              )}
            </div>
            <div className="flex-1 text-left">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[20px] md:text-3xl font-black text-white uppercase tracking-tight leading-none">
                  {shop.shop_name}
                </h1>
                {!shop.is_open && (
                  <span className="bg-red-500 text-white text-[12px] px-2 py-0.5 rounded font-black uppercase tracking-widest border border-red-400">
                    LIBUR
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Clock size={14} className="text-teal-200 opacity-70" />
                <span className="text-[12px] text-teal-100 font-bold uppercase tracking-widest opacity-80">
                  Aktif {getTimeAgo(shop.last_active)}
                </span>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  className={`px-6 py-2 border rounded-md text-[12px] font-black uppercase flex items-center gap-2 transition-all active:scale-95 ${isFollowing ? "bg-white/20 border-white/50 text-white" : "bg-white/10 border-white/30 text-white hover:bg-white/20"}`}
                >
                  {followLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : isFollowing ? (
                    <UserCheck size={14} />
                  ) : (
                    "+ Ikuti"
                  )}
                  {isFollowing && !followLoading ? "Diikuti" : ""}
                </button>
                <button
                  onClick={handleContactSeller}
                  disabled={chatLoading}
                  className="px-6 py-2 bg-[#FF6600] border border-[#FF6600] rounded-md text-[12px] font-black uppercase text-white flex items-center gap-2 hover:bg-orange-600 shadow-lg active:scale-95"
                >
                  {chatLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <MessageCircle size={14} fill="currentColor" />
                  )}
                  Chat
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 md:gap-12 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-12">
            <Stat label="Penilaian" value="4.9" />
            <Stat label="Produk" value={products.length} />
            <Stat label="Respon" value="98%" />
          </div>
        </div>
      </div>

      <div className="bg-white sticky top-14 z-50 shadow-sm border-b border-slate-100">
        <div className="max-w-[1200px] mx-auto flex">
          <Tab
            active={activeTab === "home"}
            label="Beranda"
            onClick={() => setActiveTab("home")}
          />
          <Tab
            active={activeTab === "all"}
            label="Produk"
            onClick={() => setActiveTab("all")}
          />
          <Tab
            active={activeTab === "cat"}
            label="Kategori"
            onClick={() => setActiveTab("cat")}
          />
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 md:px-0 mt-4">
        <div className="bg-white p-4 mb-4 flex items-start gap-4 border border-slate-100 rounded-2xl text-left shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-[#FF6600] shrink-0 border border-orange-100">
            <MapPin size={24} />
          </div>
          <div>
            <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Lokasi Operasional
            </p>
            <p className="text-[14px] font-bold text-slate-600 leading-relaxed">
              {shop.address || "Belum menyertakan alamat operasional"}
            </p>
          </div>
        </div>

        {!shop.is_open && (
          <div className="bg-orange-50 border-l-4 border-[#FF6600] p-4 mb-4 rounded-r-2xl flex items-center gap-3">
            <AlertCircle size={24} className="text-[#FF6600] shrink-0" />
            <p className="text-[12px] font-bold text-orange-900 leading-tight uppercase">
              Toko sedang libur, namun Anda tetap dapat melakukan pemesanan.
            </p>
          </div>
        )}

        <div className="mt-4">
          <div className="bg-white p-4 border-b border-slate-100 flex justify-between items-center rounded-t-2xl shadow-sm">
            <h3 className="text-[14px] font-black text-slate-800 uppercase tracking-widest">
              Etalase <span className="text-[#008080]">Terbaru</span>
            </h3>
            <span className="text-[12px] font-black text-[#FF6600] uppercase tracking-tighter bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
              {products.length} Items
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 mt-4">
            {products.length > 0 ? (
              products.map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/product/${item.id}`)}
                  className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all group cursor-pointer text-left"
                >
                  <div className="aspect-square relative bg-slate-50 overflow-hidden">
                    <img
                      src={item.image_url}
                      className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ${!shop.is_open ? "grayscale-[0.5] opacity-90" : ""}`}
                      alt={item.name}
                    />
                    {item.is_po && (
                      <div className="absolute top-2 left-2 bg-[#FF6600] text-white text-[12px] font-black px-2 py-1 rounded shadow-lg flex items-center gap-1 uppercase tracking-tighter animate-pulse">
                        <Timer size={14} /> PO {item.po_days} HARI
                      </div>
                    )}
                  </div>
                  <div className="p-4 space-y-2">
                    <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest truncate">
                      {item.categories?.name || "Produk Lokal"}
                    </p>
                    <h4 className="text-[13px] font-bold text-slate-800 uppercase line-clamp-2 leading-tight h-9">
                      {item.name}
                    </h4>
                    <div className="pt-3 border-t border-slate-50">
                      <p className="text-[16px] font-black text-[#FF6600] tracking-tighter">
                        Rp {item.price.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-24 text-center bg-white rounded-2xl border-2 border-dashed border-slate-100">
                <ShoppingBag
                  size={48}
                  className="mx-auto text-slate-200 mb-4"
                />
                <p className="text-[14px] font-black text-slate-400 uppercase tracking-widest">
                  Etalase sedang kosong
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={handleContactSeller}
        disabled={chatLoading}
        className="md:hidden fixed bottom-6 right-6 w-16 h-16 bg-[#FF6600] text-white rounded-full shadow-2xl flex items-center justify-center z-[90] border-4 border-white active:scale-90 transition-all hover:bg-orange-600"
      >
        {chatLoading ? (
          <Loader2 size={32} className="animate-spin" />
        ) : (
          <MessageCircle size={32} fill="currentColor" />
        )}
      </button>
    </div>
  );
};

const Stat = ({ label, value }: any) => (
  <div className="text-center md:text-left">
    <p className="text-[#FF6600] font-black text-[18px] md:text-2xl leading-none mb-1">
      {value}
    </p>
    <p className="text-[12px] text-white/50 uppercase font-black tracking-widest leading-none">
      {label}
    </p>
  </div>
);

const Tab = ({ active, label, onClick }: any) => (
  <button
    onClick={onClick}
    className={`flex-1 py-4 text-[12px] font-black uppercase tracking-widest transition-all border-b-2 ${active ? "text-[#FF6600] border-[#FF6600] bg-orange-50/10" : "text-slate-400 hover:text-slate-600 border-transparent"}`}
  >
    {label}
  </button>
);
