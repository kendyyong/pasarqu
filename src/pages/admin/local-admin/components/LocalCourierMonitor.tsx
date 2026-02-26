import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Loader2,
  AlertTriangle,
  RefreshCw,
  X,
  CheckCircle2,
  XCircle,
  Smartphone,
  Eye,
  FileText,
  Camera,
  CreditCard,
  ExternalLink,
  ArrowRight,
  Bike,
  Mail,
  MapPin,
  User,
  Edit3,
  Bot,
  Wallet,
  ShieldAlert,
  Filter,
  List as ListIcon,
  LayoutGrid,
  Megaphone,
  Ban,
  TrendingDown,
  CheckSquare,
  Square,
  Copy,
  PlusCircle,
} from "lucide-react";
import { useAuth } from "../../../../contexts/AuthContext";
import { useToast } from "../../../../contexts/ToastContext";
import { useCourierMonitor } from "../../../../hooks/useCourierMonitor";
import { supabase } from "../../../../lib/supabaseClient";

export const LocalCourierMonitor = () => {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const { couriers, complaints, loading, fetchData } = useCourierMonitor(
    profile?.managed_market_id,
  );

  // --- STATE DASAR ---
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourier, setSelectedCourier] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAlarmPopup, setShowAlarmPopup] = useState(false);
  const [newArrival, setNewArrival] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // --- 🚀 STATE PRO FEATURES ---
  const [viewMode, setViewMode] = useState<"GRID" | "LIST">("GRID");
  const [filterStatus, setFilterStatus] = useState<
    "ALL" | "ACTIVE" | "PENDING" | "FROZEN" | "SUSPENDED"
  >("ALL");
  const [sortOrder, setSortOrder] = useState<
    "NEWEST" | "BALANCE_ASC" | "BALANCE_DESC"
  >("NEWEST");
  const [selectedForBroadcast, setSelectedForBroadcast] = useState<string[]>(
    [],
  );

  // State Top Up Manual
  const [topUpCourier, setTopUpCourier] = useState<any>(null);
  const [topUpAmount, setTopUpAmount] = useState("");

  // --- REALTIME ALARM SENSOR ---
  useEffect(() => {
    const channel = supabase
      .channel("new-courier-monitor")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "profiles",
          filter: `market_id=eq.${profile?.managed_market_id}`,
        },
        (payload) => {
          if (payload.new.role === "COURIER") {
            setNewArrival(payload.new);
            setShowAlarmPopup(true);
            const audio = new Audio("/sounds/alarm-system.mp3");
            audio.play().catch(() => console.log("Audio blocked"));
            fetchData();
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.managed_market_id, fetchData]);

  // --- 📊 LOGIKA STATISTIK CEPAT ---
  const stats = useMemo(() => {
    let total = couriers.length;
    let pending = 0;
    let frozen = 0;
    let active = 0;

    couriers.forEach((c) => {
      if (!c.is_verified) pending++;
      else if ((c.wallet_balance || 0) < 5000) frozen++;
      else if (c.status === "ACTIVE") active++;
    });

    return { total, pending, frozen, active };
  }, [couriers]);

  // --- 🎛️ LOGIKA FILTER & SORTIR ---
  const processedCouriers = useMemo(() => {
    let result = [...couriers];

    // 1. FILTER
    if (filterStatus === "PENDING")
      result = result.filter((c) => !c.is_verified);
    else if (filterStatus === "FROZEN")
      result = result.filter(
        (c) => c.is_verified && (c.wallet_balance || 0) < 5000,
      );
    else if (filterStatus === "ACTIVE")
      result = result.filter(
        (c) =>
          c.is_verified &&
          c.status === "ACTIVE" &&
          (c.wallet_balance || 0) >= 5000,
      );
    else if (filterStatus === "SUSPENDED")
      result = result.filter((c) => c.status === "SUSPENDED");

    // 2. SEARCH
    if (searchQuery) {
      result = result.filter((c) =>
        (c.name || "").toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // 3. SORT
    if (sortOrder === "BALANCE_ASC")
      result.sort((a, b) => (a.wallet_balance || 0) - (b.wallet_balance || 0));
    if (sortOrder === "BALANCE_DESC")
      result.sort((a, b) => (b.wallet_balance || 0) - (a.wallet_balance || 0));
    if (sortOrder === "NEWEST")
      result.sort(
        (a, b) =>
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime(),
      );

    return result;
  }, [couriers, filterStatus, searchQuery, sortOrder]);

  // --- FUNGSI AKSI ADMIN DASAR ---
  const generateAiAdvice = (status: "APPROVE" | "REJECT") => {
    setIsGeneratingAi(true);
    setTimeout(() => {
      let advice = "";
      if (status === "APPROVE") {
        advice = `BERDASARKAN AUDIT SISTEM, SELURUH DOKUMEN DINYATAKAN VALID. SELAMAT BERGABUNG DI EKOSISTEM PASARQU WILAYAH ${profile?.managed_market_name?.toUpperCase()}. HARAP MENJAGA ETIKA DAN KECEPATAN PENGIRIMAN.`;
      } else {
        advice = `PENDAFTARAN DITANGGUHKAN. DITEMUKAN KETIDAKSESUAIAN DATA PADA BERKAS: ${rejectionReason || "DOKUMEN KURANG JELAS"}. MOHON MELAKUKAN PENDAFTARAN ULANG DENGAN DATA YANG VALID.`;
      }
      setRejectionReason(advice.toUpperCase());
      setIsGeneratingAi(false);
      showToast("AI SELESAI MENGANALISA", "success");
    }, 1500);
  };

  const handleUpdateData = async () => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          name: editData.name,
          phone_number: editData.phone_number,
          vehicle_type: editData.vehicle_type,
          vehicle_plate: editData.vehicle_plate,
          address: editData.address,
        })
        .eq("id", selectedCourier.id);

      if (error) throw error;
      showToast("DATA BERHASIL DIPERBAIKI", "success");
      setSelectedCourier({ ...selectedCourier, ...editData });
      setIsEditing(false);
      fetchData();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerifyAction = async (status: "APPROVE" | "REJECT") => {
    if (status === "REJECT" && !rejectionReason)
      return showToast("ALASAN WAJIB DIISI!", "error");
    setIsProcessing(true);
    const isApprove = status === "APPROVE";
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          is_verified: isApprove,
          status: isApprove ? "ACTIVE" : "REJECTED",
        })
        .eq("id", selectedCourier.id);

      if (error) throw error;
      const phone = (
        selectedCourier.phone_number || selectedCourier.phone
      )?.replace(/\D/g, "");
      const message = isApprove
        ? `HALO ${selectedCourier.name}, PENDAFTARAN ANDA DI PASARQU TELAH *DISETUJUI*. SILAKAN LOGIN KE APLIKASI.`
        : `HALO ${selectedCourier.name}, PENDAFTARAN ANDA *DITOLAK* KARENA: ${rejectionReason.toUpperCase()}.`;

      window.open(
        `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
        "_blank",
      );
      showToast(
        `PERSONIL BERHASIL DI${isApprove ? "SETUJUI" : "TOLAK"}`,
        "success",
      );
      setSelectedCourier(null);
      setRejectionReason("");
      fetchData();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuickAction = (courier: any) => {
    if (courier.status === "PENDING" || !courier.is_verified) {
      setSelectedCourier(courier);
    } else {
      const phone = (courier.phone_number || courier.phone)?.replace(/\D/g, "");
      const isFrozen = (courier.wallet_balance || 0) < 5000;
      let message = `Halo ${courier.name}. ${isFrozen ? "Saldomu kritis, mohon top up agar bisa menerima pesanan." : "Ada hal terkait pengiriman yang perlu dikoordinasikan."}`;
      window.open(
        `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
        "_blank",
      );
    }
  };

  // --- ⚡ FUNGSI AKSI PRO (SUSPEND & TOPUP & BROADCAST) ---
  const handleToggleSuspend = async (courier: any) => {
    const newStatus = courier.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
    if (
      !window.confirm(
        `Yakin ingin mengubah status ${courier.name} menjadi ${newStatus}?`,
      )
    )
      return;

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ status: newStatus })
        .eq("id", courier.id);
      if (error) throw error;
      showToast(`STATUS BERHASIL DIUBAH KE ${newStatus}`, "success");
      fetchData();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualTopUp = async () => {
    if (!topUpAmount || isNaN(Number(topUpAmount)))
      return showToast("Nominal tidak valid!", "error");
    setIsProcessing(true);
    try {
      const currentBalance = topUpCourier.wallet_balance || 0;
      const newBalance = currentBalance + Number(topUpAmount);

      const { error } = await supabase
        .from("profiles")
        .update({ wallet_balance: newBalance })
        .eq("id", topUpCourier.id);
      if (error) throw error;

      showToast(
        `TOP UP Rp ${Number(topUpAmount).toLocaleString()} BERHASIL`,
        "success",
      );
      setTopUpCourier(null);
      setTopUpAmount("");
      fetchData();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyBroadcastNumbers = () => {
    if (selectedForBroadcast.length === 0)
      return showToast("PILIH MINIMAL 1 KURIR", "error");

    const numbers = selectedForBroadcast
      .map((id) => {
        const c = couriers.find((courier) => courier.id === id);
        return (c?.phone_number || c?.phone)?.replace(/\D/g, "");
      })
      .filter(Boolean);

    navigator.clipboard.writeText(numbers.join(", "));
    showToast(
      `${numbers.length} NOMOR BERHASIL DISALIN UNTUK BROADCAST WA!`,
      "success",
    );
  };

  const toggleSelectBroadcast = (id: string) => {
    setSelectedForBroadcast((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="animate-spin text-[#008080]" size={40} />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
          SINKRONISASI COMMAND CENTER...
        </p>
      </div>
    );

  return (
    <div className="space-y-6 text-left pb-20 relative font-black uppercase tracking-tighter">
      {/* ALARM PENDAFTAR BARU */}
      {showAlarmPopup && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4">
          <div className="bg-white border-[6px] border-[#FF6600] p-10 max-w-lg w-full shadow-[20px_20px_0px_0px_rgba(255,102,0,1)] text-center animate-in zoom-in">
            <AlertTriangle
              size={64}
              className="text-[#FF6600] mx-auto mb-4 animate-bounce"
            />
            <h2 className="text-3xl mb-2 text-slate-900">PENDAFTAR BARU!</h2>
            <p className="text-slate-500 mb-8 tracking-widest text-[10px]">
              DATA BARU MASUK: {newArrival?.name}
            </p>
            <button
              onClick={() => setShowAlarmPopup(false)}
              className="w-full py-4 bg-slate-900 text-white flex items-center justify-center gap-2 hover:bg-[#FF6600] transition-colors"
            >
              CEK ANTRIAN <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* HEADER COMMAND CENTER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-4 border-slate-900 pb-4">
        <div>
          <h3 className="text-3xl text-slate-900 leading-none">
            PERSONNEL <span className="text-[#008080]">OPS CENTER</span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 tracking-widest">
            <MapPin size={12} /> WILAYAH:{" "}
            {profile?.managed_market_name || "MUARA JAWA"}
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 text-[10px] text-slate-400 hover:text-[#008080] transition-colors"
        >
          <RefreshCw size={14} /> REFRESH DATA
        </button>
      </div>

      {/* 📊 WIDGET STATISTIK CEPAT */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBox
          title="TOTAL KURIR TERDAFTAR"
          value={stats.total}
          icon={<User size={20} />}
          color="bg-blue-50 text-blue-600 border-blue-200"
        />
        <StatBox
          title="AKTIF MENGANTAR"
          value={stats.active}
          icon={<Bike size={20} />}
          color="bg-teal-50 text-teal-600 border-teal-200"
        />
        <StatBox
          title="ANTRIAN VERIFIKASI"
          value={stats.pending}
          icon={<ShieldAlert size={20} />}
          color="bg-orange-50 text-orange-600 border-orange-200"
          isAlert={stats.pending > 0}
        />
        <StatBox
          title="SALDO BEKU (<5K)"
          value={stats.frozen}
          icon={<TrendingDown size={20} />}
          color="bg-red-50 text-red-600 border-red-200"
          isAlert={stats.frozen > 0}
        />
      </div>

      {/* 🎛️ ADVANCED TOOLBAR */}
      <div className="bg-white border-2 border-slate-200 p-3 rounded-2xl flex flex-col lg:flex-row gap-3 items-center justify-between shadow-sm sticky top-0 z-[50]">
        {/* Search & Filter Group */}
        <div className="flex flex-col md:flex-row gap-3 w-full lg:w-auto">
          <div className="relative w-full md:w-64">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              type="text"
              placeholder="CARI NAMA KURIR..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl pl-10 pr-4 py-3 text-[11px] focus:border-[#008080] focus:bg-white outline-none font-black transition-all"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-3 text-[10px] outline-none font-black text-slate-600 flex-1 md:w-36"
            >
              <option value="ALL">SEMUA STATUS</option>
              <option value="ACTIVE">✅ AKTIF / NORMAL</option>
              <option value="PENDING">⏳ PENDING / BARU</option>
              <option value="FROZEN">❄️ SALDO BEKU</option>
              <option value="SUSPENDED">🚫 SUSPENDED</option>
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-3 text-[10px] outline-none font-black text-slate-600 flex-1 md:w-36"
            >
              <option value="NEWEST">TERBARU</option>
              <option value="BALANCE_ASC">SALDO TERENDAH</option>
              <option value="BALANCE_DESC">SALDO TERTINGGI</option>
            </select>
          </div>
        </div>

        {/* View Toggle & Broadcast Action */}
        <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
          <button
            onClick={handleCopyBroadcastNumbers}
            disabled={selectedForBroadcast.length === 0}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-[10px] font-black transition-all ${selectedForBroadcast.length > 0 ? "bg-[#FF6600] text-white shadow-[0_4px_0_0_#CC5200] active:translate-y-1 active:shadow-none" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}
          >
            <Megaphone size={14} />
            <span className="hidden md:inline">
              COPY BROADCAST WA ({selectedForBroadcast.length})
            </span>
            <span className="md:hidden">
              BROADCAST ({selectedForBroadcast.length})
            </span>
          </button>

          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode("GRID")}
              className={`p-2 rounded-lg transition-colors ${viewMode === "GRID" ? "bg-white text-[#008080] shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode("LIST")}
              className={`p-2 rounded-lg transition-colors ${viewMode === "LIST" ? "bg-white text-[#008080] shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
            >
              <ListIcon size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* RENDER LIST/GRID AREA */}
      {processedCouriers.length === 0 ? (
        <div className="text-center py-20 border-4 border-dashed border-slate-200 rounded-[2rem]">
          <Search size={48} className="text-slate-300 mx-auto mb-4" />
          <p className="text-slate-400 tracking-widest">
            TIDAK ADA DATA KURIR DITEMUKAN.
          </p>
        </div>
      ) : (
        <>
          {viewMode === "GRID" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {processedCouriers.map((courier) => (
                <ProCourierCard
                  key={courier.id}
                  courier={courier}
                  isSelected={selectedForBroadcast.includes(courier.id)}
                  onToggleSelect={() => toggleSelectBroadcast(courier.id)}
                  onAudit={() => handleQuickAction(courier)}
                  onTopUp={() => setTopUpCourier(courier)}
                  onSuspend={() => handleToggleSuspend(courier)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white border-2 border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white text-[10px] tracking-widest border-b-4 border-[#008080]">
                      <th className="p-4 w-10 text-center">
                        <button
                          onClick={() => {
                            if (
                              selectedForBroadcast.length ===
                              processedCouriers.length
                            )
                              setSelectedForBroadcast([]);
                            else
                              setSelectedForBroadcast(
                                processedCouriers.map((c) => c.id),
                              );
                          }}
                        >
                          {selectedForBroadcast.length ===
                          processedCouriers.length ? (
                            <CheckSquare size={16} />
                          ) : (
                            <Square size={16} />
                          )}
                        </button>
                      </th>
                      <th className="p-4">IDENTITAS KURIR</th>
                      <th className="p-4">KENDARAAN</th>
                      <th className="p-4">STATUS</th>
                      <th className="p-4 text-right">SALDO DOMPET</th>
                      <th className="p-4 text-center">AKSI CEPAT</th>
                    </tr>
                  </thead>
                  <tbody className="text-[11px] font-bold text-slate-700 divide-y-2 divide-slate-100">
                    {processedCouriers.map((courier) => (
                      <ProCourierRow
                        key={courier.id}
                        courier={courier}
                        isSelected={selectedForBroadcast.includes(courier.id)}
                        onToggleSelect={() => toggleSelectBroadcast(courier.id)}
                        onAudit={() => handleQuickAction(courier)}
                        onTopUp={() => setTopUpCourier(courier)}
                        onSuspend={() => handleToggleSuspend(courier)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* --- MODAL TOP UP MANUAL --- */}
      {topUpCourier && (
        <div className="fixed inset-0 z-[1005] flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm">
          <div className="bg-white border-[6px] border-[#FF6600] p-8 w-full max-w-md shadow-[15px_15px_0px_0px_rgba(255,102,0,0.3)] animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl text-slate-900 flex items-center gap-2">
                <PlusCircle className="text-[#FF6600]" /> MANUAL TOP-UP
              </h3>
              <button
                onClick={() => setTopUpCourier(null)}
                className="text-slate-400 hover:text-red-500"
              >
                <X size={24} />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl mb-6 border-2 border-slate-100">
              <p className="text-[10px] text-slate-400 tracking-widest mb-1">
                Penerima Saldo:
              </p>
              <p className="text-sm font-black text-slate-800">
                {topUpCourier.name}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                Saldo Saat Ini: Rp{" "}
                {(topUpCourier.wallet_balance || 0).toLocaleString()}
              </p>
            </div>

            <div className="space-y-2 mb-8">
              <label className="text-[10px] text-slate-500 tracking-widest">
                Nominal Top Up (Rp)
              </label>
              <input
                type="number"
                placeholder="Contoh: 50000"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                className="w-full text-2xl font-black p-4 border-4 border-slate-200 focus:border-[#FF6600] outline-none text-slate-800 rounded-xl"
              />
            </div>

            <button
              onClick={handleManualTopUp}
              disabled={isProcessing}
              className="w-full py-4 bg-slate-900 text-white font-black text-[12px] tracking-widest rounded-xl hover:bg-[#FF6600] transition-colors flex justify-center items-center gap-2"
            >
              {isProcessing ? (
                <Loader2 className="animate-spin" />
              ) : (
                "PROSES TOP UP SEKARANG"
              )}
            </button>
          </div>
        </div>
      )}

      {/* MODAL AUDIT (TETAP SEPERTI ASLI) */}
      {selectedCourier && (
        <div className="fixed inset-0 z-[1002] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="bg-white border-[6px] border-slate-900 w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col shadow-[20px_20px_0px_0px_rgba(0,0,0,0.2)] animate-in zoom-in-95">
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center border-b-4 border-[#008080]">
              <div className="flex items-center gap-4">
                <h3 className="text-xl">
                  AUDIT PENDAFTARAN: {selectedCourier.name}
                </h3>
                <button
                  onClick={() => {
                    setIsEditing(!isEditing);
                    setEditData(selectedCourier);
                  }}
                  className={`flex items-center gap-2 px-3 py-1 rounded text-[10px] font-black ${isEditing ? "bg-orange-500 text-white" : "bg-[#008080] text-white"}`}
                >
                  <Edit3 size={14} /> {isEditing ? "BATAL" : "EDIT DATA"}
                </button>
              </div>
              <button
                onClick={() => {
                  setSelectedCourier(null);
                  setIsEditing(false);
                }}
                className="p-2 bg-white/10 rounded-lg hover:bg-red-500 transition-colors"
              >
                <X />
              </button>
            </div>

            <div className="p-8 overflow-y-auto flex-1 bg-slate-50 space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border-4 border-slate-200 p-6 rounded-xl space-y-4 shadow-sm">
                  <h4 className="text-[12px] font-black bg-slate-900 text-white px-3 py-1 inline-block">
                    01. IDENTITAS & KONTAK
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    {isEditing ? (
                      <>
                        <EditField
                          label="NAMA"
                          value={editData.name}
                          onChange={(v: string) =>
                            setEditData({ ...editData, name: v })
                          }
                        />
                        <EditField
                          label="WA"
                          value={editData.phone_number}
                          onChange={(v: string) =>
                            setEditData({ ...editData, phone_number: v })
                          }
                        />
                        <EditField
                          label="ALAMAT"
                          value={editData.address}
                          onChange={(v: string) =>
                            setEditData({ ...editData, address: v })
                          }
                          className="col-span-2"
                        />
                      </>
                    ) : (
                      <>
                        <DetailItem
                          label="NAMA LENGKAP"
                          value={selectedCourier.name}
                          icon={<User size={14} />}
                        />
                        <DetailItem
                          label="WHATSAPP"
                          value={
                            selectedCourier.phone_number ||
                            selectedCourier.phone
                          }
                          icon={<Smartphone size={14} />}
                        />
                        <DetailItem
                          label="ALAMAT"
                          value={selectedCourier.address}
                          icon={<MapPin size={14} />}
                          className="col-span-2"
                        />
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-white border-4 border-slate-200 p-6 rounded-xl space-y-4 shadow-sm">
                  <h4 className="text-[12px] font-black bg-[#008080] text-white px-3 py-1 inline-block">
                    02. OPERASIONAL
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    {isEditing ? (
                      <>
                        <EditField
                          label="JENIS KENDARAAN"
                          value={editData.vehicle_type}
                          onChange={(v: string) =>
                            setEditData({ ...editData, vehicle_type: v })
                          }
                        />
                        <EditField
                          label="NO. PLAT"
                          value={editData.vehicle_plate}
                          onChange={(v: string) =>
                            setEditData({ ...editData, vehicle_plate: v })
                          }
                        />
                      </>
                    ) : (
                      <>
                        <DetailItem
                          label="KENDARAAN"
                          value={selectedCourier.vehicle_type}
                          icon={<Bike size={14} />}
                        />
                        <DetailItem
                          label="NOMOR PLAT"
                          value={
                            selectedCourier.vehicle_plate ||
                            selectedCourier.plat_number
                          }
                          icon={<CreditCard size={14} />}
                        />
                      </>
                    )}
                  </div>
                  {isEditing && (
                    <button
                      onClick={handleUpdateData}
                      className="w-full py-2 bg-slate-900 text-white font-black text-[10px] mt-4 hover:bg-[#008080] transition-colors"
                    >
                      SIMPAN PERUBAHAN
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-white border-4 border-slate-200 p-6 rounded-xl space-y-4 shadow-sm">
                <h4 className="text-[12px] font-black bg-orange-500 text-white px-3 py-1 inline-block">
                  03. STATUS KEUANGAN (DOMPET KURIR)
                </h4>
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border-2 border-slate-100 flex-1 flex items-center gap-4 w-full">
                    <div
                      className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${(selectedCourier.wallet_balance || 0) < 5000 ? "bg-red-100 text-red-600" : "bg-[#008080]/10 text-[#008080]"}`}
                    >
                      <Wallet size={28} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">
                        Sisa Saldo Saat Ini
                      </p>
                      <h3
                        className={`text-3xl font-black uppercase tracking-tighter ${(selectedCourier.wallet_balance || 0) < 5000 ? "text-red-600" : "text-slate-800"}`}
                      >
                        Rp{" "}
                        {(selectedCourier.wallet_balance || 0).toLocaleString(
                          "id-ID",
                        )}
                      </h3>
                    </div>
                  </div>
                  {(selectedCourier.wallet_balance || 0) < 5000 && (
                    <div className="flex-1 p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-600 flex items-start gap-3 w-full h-full">
                      <ShieldAlert size={24} className="shrink-0 mt-1" />
                      <div>
                        <h5 className="text-[11px] font-black uppercase tracking-widest mb-1">
                          SALDO DIBEKUKAN!
                        </h5>
                        <p className="text-[9px] font-bold leading-relaxed uppercase">
                          Saldo di bawah batas minimum (Rp 5.000). Kurir ini
                          tidak dapat menerima pesanan baru dari pelanggan
                          sampai melakukan Top Up.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-900 p-6 border-l-[10px] border-[#008080] text-white shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Bot className="text-teal-400" />{" "}
                    <span className="text-[12px] font-black">
                      PASARQU AI ADVISOR
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => generateAiAdvice("REJECT")}
                      className="bg-red-600 px-3 py-1 text-[9px] font-black hover:bg-red-500"
                    >
                      AI TOLAK
                    </button>
                    <button
                      onClick={() => generateAiAdvice("APPROVE")}
                      className="bg-[#008080] px-3 py-1 text-[9px] font-black hover:bg-teal-500"
                    >
                      AI TERIMA
                    </button>
                  </div>
                </div>
                <p
                  className={`text-[11px] font-black leading-relaxed ${isGeneratingAi ? "animate-pulse text-teal-400" : "text-slate-300"}`}
                >
                  {isGeneratingAi
                    ? "MENGANALISA BERKAS..."
                    : "GUNAKAN AI UNTUK MEMBUAT PESAN VERIFIKASI BERDASARKAN HASIL AUDIT."}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ImagePreview
                  label="FOTO KTP"
                  url={selectedCourier.ktp_url}
                  icon={<CreditCard size={18} />}
                />
                <ImagePreview
                  label="FOTO SIM"
                  url={selectedCourier.sim_url}
                  icon={<FileText size={18} />}
                />
                <ImagePreview
                  label="FOTO SELFIE"
                  url={selectedCourier.selfie_url}
                  icon={<Camera size={18} />}
                />
              </div>

              <div className="bg-white border-4 border-slate-200 p-6 rounded-xl shadow-inner">
                <p className="text-[10px] text-slate-400 mb-1 font-black">
                  HASIL AUDIT / PESAN WA
                </p>
                <textarea
                  className="w-full p-4 border-2 border-slate-100 focus:border-[#008080] outline-none h-24 text-xs font-black uppercase mb-4"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleVerifyAction("REJECT")}
                    className="py-4 border-4 border-red-600 text-red-600 font-black flex items-center justify-center gap-2 hover:bg-red-600 hover:text-white transition-all"
                  >
                    <XCircle size={20} /> TOLAK
                  </button>
                  <button
                    onClick={() => handleVerifyAction("APPROVE")}
                    className="py-4 bg-[#008080] text-white font-black flex items-center justify-center gap-2 shadow-xl hover:bg-slate-900 transition-all"
                  >
                    <CheckCircle2 size={20} /> TERIMA
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- 🚀 SUB COMPONENTS UI INTERNAL (Versi PRO) ---

const StatBox = ({ title, value, icon, color, isAlert }: any) => (
  <div
    className={`p-4 rounded-2xl border-2 flex flex-col justify-between h-28 relative overflow-hidden ${color} ${isAlert ? "animate-pulse border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]" : "shadow-sm"}`}
  >
    <div className="flex justify-between items-start">
      <p className="text-[10px] font-black tracking-widest uppercase opacity-80 max-w-[70%] leading-tight">
        {title}
      </p>
      <div className="opacity-70">{icon}</div>
    </div>
    <h2 className="text-3xl font-[1000]">{value}</h2>
  </div>
);

// PENGGANTI COURIER CARD LAMA (Include Ceklis & Aksi Cepat)
const ProCourierCard = ({
  courier,
  isSelected,
  onToggleSelect,
  onAudit,
  onTopUp,
  onSuspend,
}: any) => {
  const isPending = !courier.is_verified && courier.status === "PENDING";
  const isFrozen = courier.is_verified && (courier.wallet_balance || 0) < 5000;
  const isSuspended = courier.status === "SUSPENDED";

  return (
    <div
      className={`bg-white rounded-[2rem] border-4 p-5 flex flex-col transition-all relative ${isPending ? "border-orange-400 shadow-[8px_8px_0px_0px_rgba(251,146,60,0.2)]" : isFrozen ? "border-red-500 shadow-[8px_8px_0px_0px_rgba(239,68,68,0.2)]" : isSuspended ? "border-slate-400 opacity-70" : "border-slate-200 hover:border-[#008080]"}`}
    >
      {/* Checkbox Sudut */}
      <button
        onClick={onToggleSelect}
        className={`absolute top-4 right-4 z-10 p-1 bg-white rounded-md transition-colors ${isSelected ? "text-[#008080]" : "text-slate-300 hover:text-slate-500"}`}
      >
        {isSelected ? <CheckSquare size={24} /> : <Square size={24} />}
      </button>

      <div className="flex gap-4 items-start mb-4 pr-8">
        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 border-2 border-slate-200 shrink-0">
          {courier.selfie_url ? (
            <img
              src={courier.selfie_url}
              alt="Selfie"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300">
              <User size={24} />
            </div>
          )}
        </div>
        <div>
          <h4 className="text-sm font-black text-slate-900 leading-tight uppercase truncate">
            {courier.name}
          </h4>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
            {courier.vehicle_plate || courier.plat_number || "NO-PLAT"}
          </p>

          {isPending ? (
            <span className="inline-block px-2 py-0.5 bg-orange-100 text-orange-600 text-[9px] font-black rounded uppercase tracking-widest">
              MENUNGGU AUDIT
            </span>
          ) : isFrozen ? (
            <span className="inline-block px-2 py-0.5 bg-red-100 text-red-600 text-[9px] font-black rounded uppercase tracking-widest animate-pulse">
              SALDO DIBEKUKAN
            </span>
          ) : isSuspended ? (
            <span className="inline-block px-2 py-0.5 bg-slate-200 text-slate-600 text-[9px] font-black rounded uppercase tracking-widest">
              SUSPENDED
            </span>
          ) : (
            <span className="inline-block px-2 py-0.5 bg-[#008080]/10 text-[#008080] text-[9px] font-black rounded uppercase tracking-widest">
              AKTIF / NORMAL
            </span>
          )}
        </div>
      </div>

      <div className="bg-slate-50 p-3 rounded-xl border-2 border-slate-100 mb-4 flex justify-between items-center">
        <div>
          <p className="text-[9px] text-slate-400 font-black tracking-widest uppercase">
            Saldo Dompet
          </p>
          <p
            className={`text-lg font-[1000] leading-none ${isFrozen ? "text-red-600" : "text-slate-800"}`}
          >
            Rp {(courier.wallet_balance || 0).toLocaleString()}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[9px] text-slate-400 font-black tracking-widest uppercase">
            Performa
          </p>
          <p className="text-sm font-[1000] text-teal-600">100%</p>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="grid grid-cols-3 gap-2 mt-auto">
        <button
          onClick={onAudit}
          className={`col-span-3 py-3 rounded-xl text-[10px] font-black text-white flex items-center justify-center gap-2 transition-all ${isPending ? "bg-[#FF6600] hover:bg-orange-600" : "bg-slate-900 hover:bg-slate-800"}`}
        >
          {isPending ? (
            <>
              <FileText size={14} /> AUDIT BERKAS SEKARANG
            </>
          ) : (
            <>
              <Mail size={14} /> TEGUR VIA WA
            </>
          )}
        </button>
        {!isPending && (
          <>
            <button
              onClick={onTopUp}
              className="col-span-2 py-2 border-2 border-[#008080] text-[#008080] rounded-xl text-[10px] font-black hover:bg-teal-50 flex items-center justify-center gap-1 transition-colors"
            >
              <PlusCircle size={14} /> TOP UP MANUAL
            </button>
            <button
              onClick={onSuspend}
              className={`col-span-1 py-2 border-2 rounded-xl text-[10px] font-black flex items-center justify-center transition-colors ${isSuspended ? "border-teal-500 text-teal-500 hover:bg-teal-50" : "border-red-500 text-red-500 hover:bg-red-50"}`}
            >
              <Ban size={14} /> {isSuspended ? "BUKA" : "BLOKIR"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// PENGGANTI ROW UNTUK LIST VIEW
const ProCourierRow = ({
  courier,
  isSelected,
  onToggleSelect,
  onAudit,
  onTopUp,
  onSuspend,
}: any) => {
  const isPending = !courier.is_verified && courier.status === "PENDING";
  const isFrozen = courier.is_verified && (courier.wallet_balance || 0) < 5000;
  const isSuspended = courier.status === "SUSPENDED";

  return (
    <tr
      className={`hover:bg-slate-50 transition-colors ${isSelected ? "bg-teal-50/50" : ""}`}
    >
      <td className="p-4 text-center">
        <button
          onClick={onToggleSelect}
          className={`${isSelected ? "text-[#008080]" : "text-slate-300"}`}
        >
          {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
        </button>
      </td>
      <td className="p-4">
        <p className="text-sm font-black text-slate-800 uppercase">
          {courier.name}
        </p>
        <p className="text-[10px] text-slate-500 tracking-widest">
          {courier.phone_number || courier.phone}
        </p>
      </td>
      <td className="p-4">
        <p className="text-[11px] font-black uppercase">
          {courier.vehicle_type}
        </p>
        <p className="text-[10px] text-slate-500 tracking-widest">
          {courier.vehicle_plate || courier.plat_number}
        </p>
      </td>
      <td className="p-4">
        {isPending ? (
          <span className="text-orange-600 bg-orange-100 px-2 py-1 rounded text-[9px] tracking-widest">
            PENDING
          </span>
        ) : isFrozen ? (
          <span className="text-red-600 bg-red-100 px-2 py-1 rounded text-[9px] tracking-widest animate-pulse">
            BEKU
          </span>
        ) : isSuspended ? (
          <span className="text-slate-600 bg-slate-200 px-2 py-1 rounded text-[9px] tracking-widest">
            SUSPEND
          </span>
        ) : (
          <span className="text-teal-600 bg-teal-100 px-2 py-1 rounded text-[9px] tracking-widest">
            AKTIF
          </span>
        )}
      </td>
      <td
        className={`p-4 text-right text-sm font-black ${isFrozen ? "text-red-600" : "text-slate-800"}`}
      >
        Rp {(courier.wallet_balance || 0).toLocaleString()}
      </td>
      <td className="p-4">
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={onAudit}
            className={`p-2 rounded-lg text-white ${isPending ? "bg-[#FF6600]" : "bg-slate-900"}`}
            title={isPending ? "Audit Data" : "Chat Kurir"}
          >
            {isPending ? <FileText size={14} /> : <Mail size={14} />}
          </button>
          {!isPending && (
            <>
              <button
                onClick={onTopUp}
                className="p-2 border-2 border-[#008080] text-[#008080] rounded-lg hover:bg-teal-50"
                title="Top Up Saldo"
              >
                <Wallet size={14} />
              </button>
              <button
                onClick={onSuspend}
                className="p-2 border-2 border-red-500 text-red-500 rounded-lg hover:bg-red-50"
                title="Blokir/Buka"
              >
                <Ban size={14} />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
};

// Komponen Pembantu Edit & Preview
const EditField = ({ label, value, onChange, className = "" }: any) => (
  <div className={`space-y-1 ${className}`}>
    <label className="text-[9px] font-black text-orange-500">{label}</label>
    <input
      type="text"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className="w-full p-2 border-2 border-slate-900 text-[11px] font-black outline-none uppercase bg-white focus:border-orange-500"
    />
  </div>
);

const DetailItem = ({ label, value, icon, className = "" }: any) => (
  <div className={`space-y-1 ${className}`}>
    <div className="flex items-center gap-2 text-slate-400">
      {icon} <span className="text-[9px] font-black">{label}</span>
    </div>
    <p className="text-[11px] font-black text-slate-800 leading-tight">
      {value || "-"}
    </p>
  </div>
);

const ImagePreview = ({ label, url, icon }: any) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2 text-slate-400">
      {icon} <p className="text-[10px] font-black">{label}</p>
    </div>
    <div className="border-4 border-slate-900 h-64 bg-slate-200 overflow-hidden group relative rounded-lg">
      <img
        src={url}
        className="w-full h-full object-cover group-hover:scale-110 transition-all duration-500"
      />
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-black"
      >
        KLIK PERBESAR
      </a>
    </div>
  </div>
);
