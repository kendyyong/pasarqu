import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  InfoWindow,
  Autocomplete,
} from "@react-google-maps/api";
import {
  Shield,
  UserPlus,
  MapPin,
  Mail,
  Phone,
  Lock,
  Save,
  Trash2,
  Edit,
  Search,
  CheckCircle2,
  LayoutDashboard,
  LogOut,
  Loader2,
  Store,
  Key,
  X,
  Check,
  Sun,
  Moon,
  TrendingUp,
  Users,
  ChevronRight,
  Activity,
  Tags,
  Layers,
  Pencil,
  AlertTriangle,
  UserX,
  UserCheck,
  ArrowLeft,
  DollarSign,
  FileText,
  Flag,
  Globe,
  Briefcase,
  Truck,
  ShoppingBag,
  Eye,
  ExternalLink,
  Download,
  Camera,
  CreditCard,
  XCircle,
  SearchCode,
  Percent,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { generateWALink, waTemplates } from "../../utils/whatsapp";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

// ==========================================
// 1. KONFIGURASI GLOBAL
// ==========================================

const mapContainerStyle = {
  width: "100%",
  height: "100%",
  borderRadius: "1.5rem",
};
const centerDefault = { lat: -0.7893, lng: 113.9213 };
const libraries: "places"[] = ["places"];

const getTheme = (darkMode: boolean) => ({
  bg: darkMode ? "bg-slate-950" : "bg-slate-50",
  text: darkMode ? "text-slate-100" : "text-slate-900",
  subText: darkMode ? "text-slate-400" : "text-slate-500",
  card: darkMode
    ? "bg-slate-900 border-slate-800"
    : "bg-white border-slate-200",
  input: darkMode
    ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
    : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400",
  sidebar: darkMode
    ? "bg-slate-900 border-slate-800"
    : "bg-white border-slate-200",
  accent: "text-indigo-500",
  accentLight: darkMode
    ? "bg-indigo-500/10 text-indigo-400"
    : "bg-indigo-50 text-indigo-600",
  hover: darkMode ? "hover:bg-slate-800" : "hover:bg-slate-50",
});

const mapDarkStyle = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#38414e" }],
  },
];

const exportToPDF = (title: string, data: any[]) => {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("PT. PASAR MJ NUSANTARA", 105, 20, { align: "center" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Laporan Resmi Super Admin", 105, 26, { align: "center" });
  doc.line(15, 30, 195, 30);
  doc.text(title.toUpperCase(), 105, 40, { align: "center" });

  const tableColumn = ["Nama", "Role", "Email", "HP", "Pasar", "Status"];
  const tableRows = data.map((u) => [
    u.name,
    u.role,
    u.email,
    u.phone_number,
    u.markets?.name || "-",
    u.is_verified ? "AKTIF" : "PENDING",
  ]);
  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 50,
    theme: "grid",
  });
  doc.save(`${title}_${Date.now()}.pdf`);
};

const exportToExcel = (title: string, data: any[]) => {
  const formattedData = data.map((u) => ({
    Nama: u.name,
    Role: u.role,
    Email: u.email,
    HP: u.phone_number,
    Pasar: u.markets?.name || "-",
    Status: u.is_verified ? "AKTIF" : "PENDING",
  }));
  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
  XLSX.writeFile(workbook, `${title}_${Date.now()}.xlsx`);
};

// ==========================================
// 2. UI SUB-COMPONENTS (DEFINED FIRST)
// ==========================================

const SidebarItem = ({
  icon,
  label,
  active,
  onClick,
  theme,
  count,
  isAlert,
}: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-5 py-4 rounded-[1.2rem] transition-all font-bold text-xs uppercase tracking-wider group ${active ? theme.accentLight : `text-slate-500 ${theme.hover}`}`}
  >
    {icon}{" "}
    <span className={active ? "" : "group-hover:text-slate-500"}>{label}</span>
    {count > 0 && (
      <span
        className={`ml-auto text-white text-[10px] px-2 py-0.5 rounded-lg ${isAlert ? "bg-red-500 animate-pulse" : "bg-indigo-500"}`}
      >
        {count}
      </span>
    )}
  </button>
);

const StatCard = ({ label, value, icon, theme, darkMode }: any) => (
  <div className={`p-6 rounded-[2.5rem] border shadow-sm ${theme.card}`}>
    <div
      className={`p-4 rounded-2xl w-fit mb-4 ${darkMode ? "bg-slate-800" : "bg-slate-50"}`}
    >
      {icon}
    </div>
    <h3 className="text-3xl font-black mb-1">{value}</h3>
    <p
      className={`text-[10px] font-bold uppercase tracking-widest ${theme.subText}`}
    >
      {label}
    </p>
  </div>
);

const InfoRow = ({ label, val, theme }: any) => (
  <div>
    <p
      className={`text-[10px] font-bold uppercase tracking-widest ${theme.subText}`}
    >
      {label}
    </p>
    <p className="text-sm font-bold mt-0.5 break-words">{val || "-"}</p>
  </div>
);

const Input = ({
  label,
  val,
  set,
  type = "text",
  readOnly = false,
  theme,
  placeholder,
}: any) => (
  <div>
    <label
      className={`text-[10px] font-black uppercase tracking-widest ml-4 mb-2 block ${theme.subText}`}
    >
      {label}
    </label>
    <input
      type={type}
      value={val}
      onChange={(e) => set(e.target.value)}
      readOnly={readOnly}
      placeholder={placeholder}
      className={`w-full p-4 border rounded-2xl font-bold text-sm outline-none focus:border-indigo-500 transition-all ${theme.input}`}
    />
  </div>
);

const ImageViewer = ({ label, url, icon }: any) => (
  <div className="group relative rounded-3xl overflow-hidden border-4 border-white shadow-lg bg-slate-200 aspect-video cursor-pointer">
    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 text-slate-800 z-10">
      {icon} {label}
    </div>
    <img
      src={url}
      alt={label}
      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
    />
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="absolute inset-0 bg-indigo-900/0 group-hover:bg-indigo-900/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 text-white font-black text-xs uppercase"
    >
      Buka Berkas
    </a>
  </div>
);

const NoData = ({ label }: any) => (
  <div className="h-32 rounded-[2rem] border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-xs font-black uppercase bg-slate-100/50">
    {label}
  </div>
);

// --- KOMPONEN TAB TOMBOL (YANG TADI HILANG) ---
const TabButton = ({
  label,
  icon,
  count,
  active,
  onClick,
  theme,
  color,
}: any) => (
  <button
    onClick={onClick}
    className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all ${active ? `${color} text-white shadow-lg` : `${theme.subText} hover:bg-slate-800 hover:text-white`}`}
  >
    <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wide">
      {icon} {label}
    </div>
    <span className={`text-[10px] px-2 py-0.5 rounded bg-black/20 text-white`}>
      {count}
    </span>
  </button>
);

const TabAudit = ({ label, icon, count, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`w-full p-6 rounded-[2rem] flex items-center justify-between transition-all ${active ? "bg-indigo-600 text-white shadow-xl scale-105" : "bg-white text-slate-500 border border-slate-100 hover:bg-slate-50"}`}
  >
    <div className="flex items-center gap-4 font-black text-xs uppercase tracking-widest">
      {icon} {label}
    </div>
    <span
      className={`text-[10px] font-black px-3 py-1 rounded-lg ${active ? "bg-black/20" : "bg-slate-100 text-slate-400"}`}
    >
      {count}
    </span>
  </button>
);

// --- 3. SUB COMPONENT (MARKET AUDIT & DETAIL) ---

const MarketAuditFullView = ({ market, allUsers, theme, onViewUser }: any) => {
  const [subTab, setSubTab] = useState<
    "ADMIN" | "MERCHANT" | "COURIER" | "BUYER"
  >("ADMIN");
  const filtered = allUsers.filter(
    (u: any) => u.managed_market_id === market.id,
  );
  const activeList =
    subTab === "ADMIN"
      ? filtered.filter((u: any) => u.role.includes("ADMIN"))
      : subTab === "MERCHANT"
        ? filtered.filter((u: any) => u.role === "MERCHANT")
        : subTab === "COURIER"
          ? filtered.filter((u: any) => u.role === "COURIER")
          : filtered.filter((u: any) => u.role === "CUSTOMER");

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="w-full lg:w-80 flex flex-col gap-3">
        <TabAudit
          label="Admin Wilayah"
          icon={<Shield />}
          count={filtered.filter((u: any) => u.role.includes("ADMIN")).length}
          active={subTab === "ADMIN"}
          onClick={() => setSubTab("ADMIN")}
        />
        <TabAudit
          label="Merchant / Toko"
          icon={<Store />}
          count={filtered.filter((u: any) => u.role === "MERCHANT").length}
          active={subTab === "MERCHANT"}
          onClick={() => setSubTab("MERCHANT")}
        />
        <TabAudit
          label="Kurir Pasar"
          icon={<Truck />}
          count={filtered.filter((u: any) => u.role === "COURIER").length}
          active={subTab === "COURIER"}
          onClick={() => setSubTab("COURIER")}
        />
        <TabAudit
          label="Warga / Pembeli"
          icon={<Users />}
          count={filtered.filter((u: any) => u.role === "CUSTOMER").length}
          active={subTab === "BUYER"}
          onClick={() => setSubTab("BUYER")}
        />
      </div>
      <div className="flex-1 bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden min-h-[600px]">
        <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
          <h3 className="font-black text-sm uppercase tracking-widest text-slate-700">
            Database {subTab}
          </h3>
          <div className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black">
            Data Ditemukan: {activeList.length}
          </div>
        </div>
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto max-h-[65vh]">
          {activeList.length === 0 ? (
            <div className="col-span-2 py-20 text-center text-slate-300 font-bold uppercase tracking-widest border-2 border-dashed border-slate-100 rounded-[2rem]">
              Belum ada data
            </div>
          ) : (
            activeList.map((u: any) => (
              <div
                key={u.id}
                className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex justify-between items-center group hover:bg-white hover:shadow-xl hover:border-indigo-200 transition-all"
              >
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg">
                    {u.name[0]}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 uppercase text-sm">
                      {u.name}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold">
                      {u.email}
                    </p>
                    <p className="text-[10px] text-indigo-500 font-black mt-1">
                      {u.phone_number}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onViewUser(u)}
                  className="p-4 bg-white text-slate-400 rounded-2xl shadow-sm border border-slate-100 hover:bg-indigo-600 hover:text-white transition-all"
                >
                  <Eye size={20} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Component Modal Detail Pasar (Normal View)
const MarketDetailModal = ({ market, allUsers, onClose, theme }: any) => {
  const [subTab, setSubTab] = useState<
    "ADMIN" | "MERCHANT" | "COURIER" | "BUYER"
  >("ADMIN");
  const filtered = allUsers.filter(
    (u: any) => u.managed_market_id === market.id,
  );
  const activeList =
    subTab === "ADMIN"
      ? filtered.filter((u: any) => u.role.includes("ADMIN"))
      : subTab === "MERCHANT"
        ? filtered.filter((u: any) => u.role === "MERCHANT")
        : subTab === "COURIER"
          ? filtered.filter((u: any) => u.role === "COURIER")
          : filtered.filter((u: any) => u.role === "CUSTOMER");

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div
        className={`w-full max-w-5xl h-[85vh] rounded-[3rem] shadow-2xl relative border flex flex-col ${theme.card}`}
      >
        <div className="p-8 border-b border-slate-700/30 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-2xl font-black uppercase mb-1">
              {market.name}
            </h2>
            <p
              className={`text-xs font-bold uppercase tracking-widest ${theme.subText}`}
            >
              {market.city}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                exportToPDF(`Data ${subTab} - ${market.name}`, activeList)
              }
              className="px-4 py-3 bg-red-600 text-white rounded-xl font-black uppercase text-[10px] hover:bg-red-700 transition-all flex items-center gap-2"
            >
              <Download size={16} /> PDF
            </button>
            <button
              onClick={() =>
                exportToExcel(`Data ${subTab} - ${market.name}`, activeList)
              }
              className="px-4 py-3 bg-emerald-600 text-white rounded-xl font-black uppercase text-[10px] hover:bg-emerald-700 transition-all flex items-center gap-2"
            >
              <FileText size={16} /> Excel
            </button>
            <button
              onClick={onClose}
              className={`p-3 rounded-full bg-slate-800 text-white hover:bg-red-500 transition-all`}
            >
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="flex flex-1 overflow-hidden">
          <div
            className={`w-64 p-6 border-r border-slate-700/30 flex flex-col gap-2 bg-slate-900/20`}
          >
            <TabButton
              label="Admin Lokal"
              icon={<Shield size={18} />}
              count={
                filtered.filter((u: any) => u.role.includes("ADMIN")).length
              }
              active={subTab === "ADMIN"}
              onClick={() => setSubTab("ADMIN")}
              theme={theme}
              color="bg-indigo-500"
            />
            <TabButton
              label="Toko / Merchant"
              icon={<Store size={18} />}
              count={filtered.filter((u: any) => u.role === "MERCHANT").length}
              active={subTab === "MERCHANT"}
              onClick={() => setSubTab("MERCHANT")}
              theme={theme}
              color="bg-emerald-500"
            />
            <TabButton
              label="Kurir Pasar"
              icon={<Truck size={18} />}
              count={filtered.filter((u: any) => u.role === "COURIER").length}
              active={subTab === "COURIER"}
              onClick={() => setSubTab("COURIER")}
              theme={theme}
              color="bg-orange-500"
            />
            <TabButton
              label="Warga / Pembeli"
              icon={<Users size={18} />}
              count={filtered.filter((u: any) => u.role === "CUSTOMER").length}
              active={subTab === "BUYER"}
              onClick={() => setSubTab("BUYER")}
              theme={theme}
              color="bg-blue-500"
            />
          </div>
          <div className="flex-1 p-8 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeList.map((u: any) => (
                <div
                  key={u.id}
                  className={`p-5 rounded-[2rem] border flex items-center gap-4 ${theme.card}`}
                >
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white shadow-lg ${subTab === "ADMIN" ? "bg-indigo-500" : subTab === "MERCHANT" ? "bg-emerald-500" : subTab === "COURIER" ? "bg-orange-500" : "bg-blue-500"}`}
                  >
                    {u.name[0]}
                  </div>
                  <div>
                    <h4 className="font-black text-sm">{u.name}</h4>
                    <p className={`text-[10px] ${theme.subText}`}>{u.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 4. MAIN COMPONENT (SUPER ADMIN DASHBOARD)
// ==========================================

export const SuperAdminDashboard: React.FC<{ onBack?: () => void }> = ({
  onBack,
}) => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  // CONFIG & STATE
  const [darkMode, setDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState<
    | "dashboard"
    | "finance"
    | "disputes"
    | "verification"
    | "markets"
    | "users"
    | "categories"
  >("dashboard");
  const [auditMarket, setAuditMarket] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Theme Helper
  const th = getTheme(darkMode);

  // DATA
  const [markets, setMarkets] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [finance, setFinance] = useState({
    revenue: 0,
    orders: 0,
    active_markets: 0,
  });
  const [adminFee, setAdminFee] = useState<string>("20");
  const [isSavingFee, setIsSavingFee] = useState(false);

  // MODALS
  const [approvalModal, setApprovalModal] = useState<{
    isOpen: boolean;
    candidate: any;
  }>({ isOpen: false, candidate: null });
  const [marketDetailModal, setMarketDetailModal] = useState<{
    isOpen: boolean;
    market: any;
  }>({ isOpen: false, market: null });
  const [userDetailModal, setUserDetailModal] = useState<{
    isOpen: boolean;
    user: any;
  }>({ isOpen: false, user: null });
  const [editAdminModal, setEditAdminModal] = useState<{
    isOpen: boolean;
    admin: any;
  }>({ isOpen: false, admin: null });

  const [selectedMarketId, setSelectedMarketId] = useState("");
  const [isMarketModalOpen, setIsMarketModalOpen] = useState(false);
  const [marketForm, setMarketForm] = useState({
    name: "",
    city: "",
    district: "",
    village: "",
    lat: -6.2,
    lng: 106.8,
  });
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [catForm, setCatForm] = useState({
    name: "",
    slug: "",
    icon: "package",
  });
  const [selectedMarker, setSelectedMarker] = useState<any>(null);

  const mapRef = useRef<google.maps.Map | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  // FETCH DATA
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: mData } = await supabase.from("markets").select("*");
      setMarkets(mData || []);
      const { data: uData } = await supabase
        .from("profiles")
        .select("*, markets(name)")
        .order("created_at", { ascending: false });
      setAllUsers(uData || []);
      setCandidates(
        uData?.filter(
          (u: any) =>
            u.role === "ADMIN_CANDIDATE" ||
            (u.role === "LOCAL_ADMIN" && !u.is_verified),
        ) || [],
      );
      const { data: fData } = await supabase.rpc("get_financial_summary");
      if (fData?.[0])
        setFinance({
          revenue: fData[0].total_revenue,
          orders: fData[0].total_orders,
          active_markets: fData[0].active_markets,
        });
      const { data: cData } = await supabase
        .from("complaints")
        .select("*, profiles(name, phone_number)")
        .eq("status", "open");
      setComplaints(cData || []);
      const { data: catData } = await supabase
        .from("categories")
        .select("*")
        .order("created_at", { ascending: true });
      setCategories(catData || []);
      const { data: sData } = await supabase
        .from("global_settings")
        .select("value")
        .eq("key", "admin_fee_percentage")
        .single();
      if (sData) setAdminFee(sData.value);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  // ACTIONS
  const handleLogout = async () => {
    await logout();
    if (onBack) onBack();
    navigate("/");
  };
  const handleSaveFee = async () => {
    setIsSavingFee(true);
    try {
      await supabase
        .from("global_settings")
        .upsert(
          { key: "admin_fee_percentage", value: adminFee },
          { onConflict: "key" },
        );
      showToast("Persentase potongan berhasil disimpan!", "success");
    } catch (e: any) {
      showToast(e.message, "error");
    } finally {
      setIsSavingFee(false);
    }
  };
  const handleApproveAdmin = async () => {
    if (!selectedMarketId)
      return showToast("Pilih pasar wilayah dinas", "error");
    const targetMarket = markets.find((m) => m.id === selectedMarketId);
    const candidate = approvalModal.candidate;
    try {
      await supabase
        .from("profiles")
        .update({
          role: "LOCAL_ADMIN",
          managed_market_id: selectedMarketId,
          is_verified: true,
        })
        .eq("id", candidate.id);
      showToast("Admin Dilantik!", "success");
      if (candidate.phone_number) {
        window.open(
          generateWALink(
            candidate.phone_number,
            waTemplates.adminApproval(
              candidate.name,
              targetMarket?.name || "Pasar Wilayah",
            ),
          ),
          "_blank",
        );
      }
      setApprovalModal({ isOpen: false, candidate: null });
      fetchData();
    } catch (e: any) {
      showToast(e.message, "error");
    }
  };
  const handleCreateMarket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await supabase
        .from("markets")
        .insert([{ ...marketForm, is_active: true }]);
      showToast("Pasar Dibuat", "success");
      setIsMarketModalOpen(false);
      fetchData();
    } catch (e: any) {
      showToast(e.message, "error");
    }
  };
  const handleDeleteMarket = async (id: string) => {
    if (window.confirm("Hapus?")) {
      await supabase.from("markets").delete().eq("id", id);
      fetchData();
    }
  };
  const handleResolveDispute = async (id: string) => {
    if (window.confirm("Selesaikan?")) {
      await supabase
        .from("complaints")
        .update({ status: "resolved" })
        .eq("id", id);
      fetchData();
    }
  };
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const slug =
        catForm.slug || catForm.name.toLowerCase().replace(/ /g, "-");
      await supabase
        .from("categories")
        .insert([{ ...catForm, slug, is_active: true }]);
      showToast("Kategori Dibuat", "success");
      setIsCategoryModalOpen(false);
      fetchData();
    } catch (e: any) {
      showToast(e.message, "error");
    }
  };
  const handleDeleteCategory = async (id: string) => {
    if (window.confirm("Hapus?")) {
      await supabase.from("categories").delete().eq("id", id);
      fetchData();
    }
  };
  const handleUpdateAdminStatus = async (type: string) => {
    const adminId = editAdminModal.admin.id;
    try {
      if (type === "SUSPEND") {
        await supabase
          .from("profiles")
          .update({ role: "SUSPENDED", managed_market_id: null })
          .eq("id", adminId);
      } else if (type === "ACTIVATE") {
        await supabase
          .from("profiles")
          .update({ role: "LOCAL_ADMIN", managed_market_id: selectedMarketId })
          .eq("id", adminId);
      } else {
        await supabase
          .from("profiles")
          .update({ managed_market_id: selectedMarketId })
          .eq("id", adminId);
      }
      setEditAdminModal({ isOpen: false, admin: null });
      fetchData();
    } catch (e: any) {
      showToast(e.message, "error");
    }
  };
  const onPlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry?.location) {
        setMarketForm((p) => ({
          ...p,
          lat: place.geometry!.location!.lat(),
          lng: place.geometry!.location!.lng(),
        }));
      }
    }
  };

  return (
    <div
      className={`min-h-screen font-sans flex transition-colors duration-300 ${th.bg} ${th.text}`}
    >
      {/* SIDEBAR */}
      <aside
        className={`hidden md:flex w-72 border-r flex-col p-6 fixed h-full z-20 transition-colors duration-300 ${th.sidebar}`}
      >
        <div className="flex items-center gap-4 mb-10 px-2">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
            <Globe size={24} />
          </div>
          <div>
            <h2 className="font-black text-sm uppercase leading-none">
              Super Admin
            </h2>
            <span
              className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${th.accent}`}
            >
              Pusat Data
            </span>
          </div>
        </div>
        <nav className="space-y-2 flex-1">
          <SidebarItem
            icon={<MapPin size={20} />}
            label="Peta Sebaran"
            active={activeTab === "dashboard"}
            onClick={() => {
              setActiveTab("dashboard");
              setAuditMarket(null);
            }}
            theme={th}
          />
          <SidebarItem
            icon={<DollarSign size={20} />}
            label="Keuangan"
            active={activeTab === "finance"}
            onClick={() => setActiveTab("finance")}
            theme={th}
          />
          <SidebarItem
            icon={<Flag size={20} />}
            label="Resolusi Sengketa"
            active={activeTab === "disputes"}
            onClick={() => setActiveTab("disputes")}
            theme={th}
            count={complaints.length}
            isAlert
          />
          <SidebarItem
            icon={<Users size={20} />}
            label="Master User"
            active={activeTab === "users"}
            onClick={() => {
              setActiveTab("users");
              setAuditMarket(null);
            }}
            theme={th}
            count={allUsers.length}
          />
          <div className="pt-6 mt-6 border-t border-slate-700/20">
            <SidebarItem
              icon={<Store size={20} />}
              label="Master Pasar"
              active={activeTab === "markets"}
              onClick={() => {
                setActiveTab("markets");
                setAuditMarket(null);
              }}
              theme={th}
            />
            <SidebarItem
              icon={<Tags size={20} />}
              label="Kategori"
              active={activeTab === "categories"}
              onClick={() => setActiveTab("categories")}
              theme={th}
            />
            <SidebarItem
              icon={<UserCheck size={20} />}
              label="Verifikasi"
              active={activeTab === "verification"}
              onClick={() => {
                setActiveTab("verification");
                setAuditMarket(null);
              }}
              theme={th}
              count={candidates.length}
              isAlert
            />
          </div>
        </nav>
        <button
          onClick={handleLogout}
          className="mt-auto flex-1 py-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl font-bold text-xs uppercase flex items-center justify-center gap-2"
        >
          <LogOut size={20} /> Keluar
        </button>
      </aside>

      {/* CONTENT */}
      <main className="flex-1 md:ml-72 p-6 md:p-10 transition-all duration-300">
        {/* VIEW: GOD MODE AUDIT (FULL SCREEN) */}
        {auditMarket ? (
          <div className="animate-in fade-in slide-in-from-right-4">
            <div className="mb-8 flex items-center justify-between bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-500/20">
              <div className="flex items-center gap-6">
                <button
                  onClick={() => setAuditMarket(null)}
                  className="p-4 bg-white/20 rounded-2xl hover:bg-white/40 transition-all"
                >
                  <ArrowLeft size={24} />
                </button>
                <div>
                  <h1 className="text-3xl font-black uppercase">
                    {auditMarket.name}
                  </h1>
                  <p className="text-indigo-200 text-xs font-bold uppercase">
                    God Mode: Audit Wilayah Full Access
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-black/20 px-6 py-3 rounded-2xl border border-white/10">
                <Shield size={20} className="text-emerald-400" />
                <span className="font-black text-xs uppercase">
                  Monitoring Berjalan
                </span>
              </div>
            </div>
            <MarketAuditFullView
              market={auditMarket}
              allUsers={allUsers}
              theme={th}
              onViewUser={(u: any) =>
                setUserDetailModal({ isOpen: true, user: u })
              }
            />
          </div>
        ) : (
          /* VIEW: NORMAL DASHBOARD */
          <>
            <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter">
                  {activeTab === "finance"
                    ? "Pengaturan Keuangan"
                    : activeTab === "dashboard"
                      ? "Peta Sebaran"
                      : "Dashboard"}
                </h1>
                <p
                  className={`font-bold text-xs uppercase tracking-widest ${th.subText}`}
                >
                  Monitoring Nasional
                </p>
              </div>
              {activeTab === "markets" && (
                <button
                  onClick={() => setIsMarketModalOpen(true)}
                  className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs flex items-center gap-2"
                >
                  <MapPin size={18} /> Tambah Pasar
                </button>
              )}
              {activeTab === "categories" && (
                <button
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs flex items-center gap-2"
                >
                  <Tags size={18} /> Buat Kategori
                </button>
              )}
            </header>

            {activeTab === "dashboard" && (
              <div className="h-[70vh] rounded-[3rem] overflow-hidden shadow-2xl relative border border-slate-700">
                {isLoaded ? (
                  <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={centerDefault}
                    zoom={5}
                    options={{ styles: darkMode ? mapDarkStyle : [] }}
                  >
                    {markets.map((m) => (
                      <Marker
                        key={m.id}
                        position={{ lat: m.lat, lng: m.lng }}
                        onClick={() => setSelectedMarker(m)}
                      />
                    ))}
                    {selectedMarker && (
                      <InfoWindow
                        position={{
                          lat: selectedMarker.lat,
                          lng: selectedMarker.lng,
                        }}
                        onCloseClick={() => setSelectedMarker(null)}
                      >
                        <div className="p-4 text-slate-900 min-w-[200px]">
                          <h3 className="font-black text-sm uppercase mb-1">
                            {selectedMarker.name}
                          </h3>
                          <button
                            onClick={() => setAuditMarket(selectedMarker)}
                            className="w-full py-2 bg-indigo-600 text-white text-[10px] font-bold uppercase rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2"
                          >
                            <SearchCode size={12} /> Audit Wilayah
                          </button>
                        </div>
                      </InfoWindow>
                    )}
                  </GoogleMap>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    Memuat Peta...
                  </div>
                )}
              </div>
            )}

            {/* FINANCE TAB (TAHAP 2) */}
            {activeTab === "finance" && (
              <div className="space-y-8 animate-in fade-in">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StatCard
                    label="Total Pendapatan (GMV)"
                    value={`Rp ${finance.revenue.toLocaleString()}`}
                    icon={<DollarSign size={32} className="text-green-500" />}
                    theme={th}
                    darkMode={darkMode}
                  />
                  <StatCard
                    label="Total Transaksi"
                    value={finance.orders}
                    icon={<FileText size={32} className="text-blue-500" />}
                    theme={th}
                    darkMode={darkMode}
                  />
                  <StatCard
                    label="Pasar Aktif"
                    value={finance.active_markets}
                    icon={<Store size={32} className="text-orange-500" />}
                    theme={th}
                    darkMode={darkMode}
                  />
                </div>
                <div
                  className={`p-10 rounded-[2.5rem] border shadow-sm ${th.card}`}
                >
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center">
                      <Percent size={28} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black uppercase">
                        Skema Bagi Hasil
                      </h3>
                      <p className={`text-xs ${th.subText}`}>
                        Atur potongan platform untuk kurir di seluruh Indonesia
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row gap-8 items-end">
                    <div className="flex-1 w-full">
                      <label
                        className={`text-[10px] font-black uppercase ml-4 mb-3 block ${th.subText}`}
                      >
                        Potongan Admin (%)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={adminFee}
                          onChange={(e) => setAdminFee(e.target.value)}
                          className={`w-full p-6 border rounded-[1.5rem] font-black text-2xl outline-none focus:border-indigo-500 transition-all pl-16 ${th.input}`}
                        />
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xl">
                          %
                        </span>
                      </div>
                      <p className="mt-4 text-xs text-slate-500 ml-2 font-bold opacity-60">
                        *Kurir menerima <b>{100 - Number(adminFee)}%</b> dari
                        ongkir.
                      </p>
                    </div>
                    <button
                      onClick={handleSaveFee}
                      disabled={isSavingFee}
                      className="w-full md:w-auto px-12 py-6 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest hover:scale-105 transition-all shadow-xl shadow-indigo-500/30 active:scale-95"
                    >
                      {isSavingFee ? "Menyimpan..." : "Simpan Pengaturan"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "markets" && (
              <div
                className={`rounded-[2.5rem] border overflow-hidden shadow-sm ${th.card}`}
              >
                <table className="w-full text-left">
                  <thead
                    className={`border-b text-[10px] uppercase font-black ${darkMode ? "bg-slate-900/50" : "bg-slate-50"}`}
                  >
                    <tr>
                      <th className="p-6">Pasar</th>
                      <th className="p-6">Wilayah</th>
                      <th className="p-6 text-right">Audit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {markets.map((m) => (
                      <tr
                        key={m.id}
                        className="border-b last:border-0 hover:bg-indigo-500/5 transition-all"
                      >
                        <td className="p-6 font-black text-sm uppercase">
                          {m.name}
                        </td>
                        <td className={`p-6 text-xs font-bold ${th.subText}`}>
                          {m.city}
                        </td>
                        <td className="p-6 text-right">
                          <button
                            onClick={() => setAuditMarket(m)}
                            className="px-6 py-3 bg-teal-600 text-white rounded-xl font-black text-[10px] uppercase flex items-center gap-2 ml-auto shadow-md hover:scale-105 transition-all"
                          >
                            <SearchCode size={14} /> Buka Audit Wilayah
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "users" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-500/20 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div>
                    <h2 className="text-2xl font-black uppercase text-indigo-500">
                      Database User Global
                    </h2>
                    <p className="text-xs font-bold text-slate-500 mt-1">
                      Total: {allUsers.length} Data Pengguna Terdaftar
                    </p>
                  </div>
                  <div className="flex gap-3 w-full md:w-auto">
                    <button
                      onClick={() => exportToPDF("Data User Global", allUsers)}
                      className="flex-1 md:flex-none px-6 py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-3 shadow-lg hover:bg-red-700"
                    >
                      <Download size={18} /> PDF
                    </button>
                    <button
                      onClick={() =>
                        exportToExcel("Data User Global", allUsers)
                      }
                      className="flex-1 md:flex-none px-6 py-4 bg-green-600 text-white rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-3 shadow-lg hover:bg-green-700"
                    >
                      <FileText size={18} /> Excel
                    </button>
                  </div>
                </div>
                <div
                  className={`rounded-[2.5rem] border overflow-hidden shadow-sm ${th.card}`}
                >
                  <table className="w-full text-left">
                    <thead
                      className={`border-b text-[10px] uppercase font-black tracking-widest ${darkMode ? "bg-slate-900/50" : "bg-slate-50"}`}
                    >
                      <tr>
                        <th className="p-6">User</th>
                        <th className="p-6">Role</th>
                        <th className="p-6">Lokasi</th>
                        <th className="p-6 text-right">Berkas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allUsers.map((u) => (
                        <tr key={u.id} className="border-b last:border-0">
                          <td className="p-6">
                            <div className="font-black text-sm">{u.name}</div>
                            <div className={`text-xs ${th.subText}`}>
                              {u.email}
                            </div>
                          </td>
                          <td className="p-6">
                            <span
                              className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${u.role === "LOCAL_ADMIN" ? "bg-indigo-500/20 text-indigo-400" : u.role === "MERCHANT" ? "bg-emerald-500/20 text-emerald-400" : u.role === "COURIER" ? "bg-orange-500/20 text-orange-400" : "bg-slate-700 text-slate-400"}`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="p-6 text-xs">
                            {u.markets?.name || "-"}
                          </td>
                          <td className="p-6 text-right">
                            <button
                              onClick={() =>
                                setUserDetailModal({ isOpen: true, user: u })
                              }
                              className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-black text-[10px] hover:bg-indigo-600 hover:text-white flex items-center gap-2 ml-auto transition-all"
                            >
                              <Eye size={14} /> Cek File
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "verification" && (
              <div className="grid gap-5">
                {candidates.map((c) => (
                  <div
                    key={c.id}
                    className={`p-8 rounded-[2.5rem] border shadow-sm flex items-center justify-between ${th.card}`}
                  >
                    <div>
                      <h3 className="font-black text-lg">{c.name}</h3>
                      <p className="text-xs">{c.email}</p>
                    </div>
                    <button
                      onClick={() =>
                        setApprovalModal({ isOpen: true, candidate: c })
                      }
                      className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase hover:scale-105"
                    >
                      Verifikasi
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* --- MODAL DETAIL USER (Z-INDEX 100) --- */}
      {userDetailModal.isOpen && userDetailModal.user && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in zoom-in-95">
          <div className="bg-white w-full max-w-5xl h-[90vh] rounded-[3rem] overflow-hidden flex flex-col shadow-2xl">
            <div className="bg-slate-900 p-8 text-white flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-3xl font-black uppercase">
                  {userDetailModal.user.name}
                </h2>
                <p className="text-indigo-400 text-xs font-bold uppercase mt-1">
                  Audit Dokumen Asli
                </p>
              </div>
              <button
                onClick={() =>
                  setUserDetailModal({ isOpen: false, user: null })
                }
                className="p-4 bg-white/10 rounded-full hover:bg-red-500 transition-all"
              >
                <X size={32} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-10 bg-slate-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
                    <h3 className="font-black text-sm uppercase border-b pb-4 text-slate-800">
                      Identitas
                    </h3>
                    <InfoRow
                      label="Email"
                      val={userDetailModal.user.email}
                      theme={th}
                    />
                    <InfoRow
                      label="HP"
                      val={userDetailModal.user.phone_number}
                      theme={th}
                    />
                    <InfoRow
                      label="Alamat"
                      val={userDetailModal.user.address}
                      theme={th}
                    />
                  </div>
                </div>
                <div className="space-y-6">
                  <h3 className="font-black text-sm uppercase ml-2 text-slate-400">
                    Berkas Digital
                  </h3>
                  <div className="grid grid-cols-1 gap-6">
                    {userDetailModal.user.ktp_url ? (
                      <ImageViewer
                        label="KTP ASLI"
                        url={userDetailModal.user.ktp_url}
                        icon={<CreditCard size={18} />}
                      />
                    ) : (
                      <NoData label="KTP Tidak Ada" />
                    )}
                    {userDetailModal.user.sim_url && (
                      <ImageViewer
                        label="SIM C"
                        url={userDetailModal.user.sim_url}
                        icon={<FileText size={18} />}
                      />
                    )}{" "}
                    {userDetailModal.user.selfie_url ? (
                      <ImageViewer
                        label="SELFIE"
                        url={userDetailModal.user.selfie_url}
                        icon={<Camera size={18} />}
                      />
                    ) : (
                      <NoData label="Selfie Tidak Ada" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {marketDetailModal.isOpen && (
        <MarketDetailModal
          market={marketDetailModal.market}
          allUsers={allUsers}
          onClose={() => setMarketDetailModal({ isOpen: false, market: null })}
          theme={th}
        />
      )}

      {/* MODAL LAINNYA */}
      {approvalModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div
            className={`w-full max-w-md p-8 rounded-[3rem] shadow-2xl border ${th.card}`}
          >
            <h2 className="text-xl font-black uppercase mb-6">
              Pilih Wilayah Dinas
            </h2>
            <div className="relative mb-6">
              <select
                className={`w-full p-5 border rounded-2xl font-bold text-sm outline-none cursor-pointer ${th.input}`}
                onChange={(e) => setSelectedMarketId(e.target.value)}
              >
                <option value="">-- Pilih Pasar --</option>
                {markets.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} - {m.city}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() =>
                  setApprovalModal({ isOpen: false, candidate: null })
                }
                className="flex-1 py-5 rounded-2xl bg-slate-700 text-white text-xs font-bold uppercase"
              >
                Batal
              </button>
              <button
                onClick={handleApproveAdmin}
                className="flex-1 py-5 bg-indigo-600 text-white rounded-2xl font-bold text-xs uppercase"
              >
                Lantik
              </button>
            </div>
          </div>
        </div>
      )}

      {isMarketModalOpen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div
            className={`w-full max-w-6xl h-[80vh] rounded-[3rem] overflow-hidden flex flex-col md:flex-row shadow-2xl relative border ${th.card}`}
          >
            <div className="w-full md:w-2/3 relative h-1/2 md:h-full">
              <GoogleMap
                mapContainerStyle={{ width: "100%", height: "100%" }}
                center={centerDefault}
                zoom={12}
                onLoad={(map) => {
                  mapRef.current = map;
                }}
                options={{
                  styles: darkMode ? mapDarkStyle : [],
                  disableDefaultUI: true,
                }}
              >
                <Marker
                  position={{ lat: marketForm.lat, lng: marketForm.lng }}
                />
              </GoogleMap>
              <div className="absolute top-4 left-4 w-3/4 max-w-sm">
                <Autocomplete
                  onLoad={(ref) => {
                    autocompleteRef.current = ref;
                  }}
                  onPlaceChanged={onPlaceChanged}
                >
                  <input
                    className="w-full p-4 rounded-xl shadow-lg font-bold text-sm"
                    placeholder="Cari lokasi pasar..."
                  />
                </Autocomplete>
              </div>
            </div>
            <div className="w-full md:w-1/3 p-8 bg-white overflow-y-auto h-1/2 md:h-full">
              <h2 className="text-2xl font-black mb-6 text-black">
                Tambah Pasar
              </h2>
              <Input
                label="Nama Pasar"
                val={marketForm.name}
                set={(v: string) => setMarketForm({ ...marketForm, name: v })}
                theme={th}
              />
              <div className="mt-4 space-y-2">
                <Input
                  label="Kota"
                  val={marketForm.city}
                  set={(v: string) => {}}
                  readOnly
                  theme={th}
                />
                <Input
                  label="Kecamatan"
                  val={marketForm.district}
                  set={(v: string) => {}}
                  readOnly
                  theme={th}
                />
              </div>
              <button
                onClick={handleCreateMarket}
                className="w-full mt-6 py-4 bg-indigo-600 text-white font-bold rounded-xl"
              >
                Simpan Lokasi
              </button>
              <button
                onClick={() => setIsMarketModalOpen(false)}
                className="w-full mt-2 py-4 text-slate-400 font-bold"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
