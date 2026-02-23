import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { useAuth } from "../../../../contexts/AuthContext";
import { useToast } from "../../../../contexts/ToastContext";
import { useCourierMonitor } from "../../../../hooks/useCourierMonitor";
import { CourierCard } from "./CourierCard";
import { supabase } from "../../../../lib/supabaseClient";

export const LocalCourierMonitor = () => {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedCourier, setSelectedCourier] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAlarmPopup, setShowAlarmPopup] = useState(false);
  const [newArrival, setNewArrival] = useState<any>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const { couriers, complaints, loading, fetchData } = useCourierMonitor(
    profile?.managed_market_id,
  );

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
      let message = `Halo ${courier.name}. ${isFrozen ? "Saldomu kritis, mohon top up." : "Ada hal terkait pengiriman."}`;
      window.open(
        `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
        "_blank",
      );
    }
  };

  const filteredCouriers = couriers.filter((c) =>
    (c.name || "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="animate-spin text-teal-600" size={40} />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
          SINKRONISASI DATA...
        </p>
      </div>
    );

  return (
    <div className="space-y-6 text-left pb-20 relative font-black uppercase tracking-tighter">
      {/* ALARM */}
      {showAlarmPopup && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4">
          <div className="bg-white border-[6px] border-[#FF6600] p-10 max-w-lg w-full shadow-[20px_20px_0px_0px_rgba(255,102,0,1)] text-center">
            <AlertTriangle
              size={64}
              className="text-[#FF6600] mx-auto mb-4 animate-bounce"
            />
            <h2 className="text-3xl mb-2">PENDAFTAR BARU!</h2>
            <p className="text-slate-500 mb-8 tracking-widest text-[10px]">
              DATA BARU MASUK: {newArrival?.name}
            </p>
            <button
              onClick={() => setShowAlarmPopup(false)}
              className="w-full py-4 bg-slate-900 text-white flex items-center justify-center gap-2"
            >
              CEK ANTRIAN <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-4 border-slate-900 pb-6">
        <div>
          <h3 className="text-2xl text-slate-900 leading-none">
            PERSONNEL <span className="text-[#008080]">OPS CENTER</span>
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">
            WILAYAH: {profile?.managed_market_name || "MUARA JAWA"}
          </p>
        </div>
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={16}
          />
          <input
            type="text"
            placeholder="CARI NAMA PERSONIL..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-white border-2 border-slate-200 rounded-xl pl-12 pr-6 py-4 text-xs focus:border-[#008080] outline-none w-full md:w-64 font-black"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCouriers.map((courier, index) => (
          <CourierCard
            key={courier.id}
            courier={courier}
            index={index}
            onChat={handleQuickAction}
          />
        ))}
      </div>

      {/* MODAL AUDIT */}
      {selectedCourier && (
        <div className="fixed inset-0 z-[1002] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="bg-white border-[6px] border-slate-900 w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col shadow-[20px_20px_0px_0px_rgba(0,0,0,0.2)]">
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
                className="p-2 bg-white/10 rounded-lg"
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

              {/* --- MULAI TAMBAHAN: 03. STATUS KEUANGAN --- */}
              <div className="bg-white border-4 border-slate-200 p-6 rounded-xl space-y-4 shadow-sm">
                <h4 className="text-[12px] font-black bg-orange-500 text-white px-3 py-1 inline-block">
                  03. STATUS KEUANGAN (DOMPET KURIR)
                </h4>

                <div className="flex flex-col md:flex-row items-center gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border-2 border-slate-100 flex-1 flex items-center gap-4 w-full">
                    <div
                      className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${
                        (selectedCourier.wallet_balance || 0) < 5000
                          ? "bg-red-100 text-red-600"
                          : "bg-[#008080]/10 text-[#008080]"
                      }`}
                    >
                      <Wallet size={28} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">
                        Sisa Saldo Saat Ini
                      </p>
                      <h3
                        className={`text-3xl font-black uppercase tracking-tighter ${
                          (selectedCourier.wallet_balance || 0) < 5000
                            ? "text-red-600"
                            : "text-slate-800"
                        }`}
                      >
                        Rp{" "}
                        {(selectedCourier.wallet_balance || 0).toLocaleString(
                          "id-ID",
                        )}
                      </h3>
                    </div>
                  </div>

                  {/* Peringatan jika saldo kritis */}
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
              {/* --- AKHIR TAMBAHAN --- */}

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
                      className="bg-red-600 px-3 py-1 text-[9px] font-black"
                    >
                      AI TOLAK
                    </button>
                    <button
                      onClick={() => generateAiAdvice("APPROVE")}
                      className="bg-[#008080] px-3 py-1 text-[9px] font-black"
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
