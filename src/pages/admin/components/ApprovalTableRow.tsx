import React, { useState } from "react";
import {
  Store,
  Bike,
  MapPin,
  XCircle,
  CheckCircle,
  RefreshCw,
  Eye,
  X,
  ExternalLink,
  Camera,
  CreditCard,
  FileText,
  Smartphone,
} from "lucide-react";

interface ApprovalTableRowProps {
  request: any;
  processingId: string | null;
  onAction: (user: any, action: "APPROVE" | "REJECT", reason?: string) => void;
}

export const ApprovalTableRow: React.FC<ApprovalTableRowProps> = ({
  request,
  processingId,
  onAction,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const isProcessing = processingId === request.id;

  // Fungsi untuk mengeksekusi aksi dari dalam modal
  const handleConfirmAction = (action: "APPROVE" | "REJECT") => {
    if (action === "REJECT" && !rejectionReason) {
      alert("ALASAN PENOLAKAN WAJIB DIISI AGAR KURIR MENGERTI!");
      return;
    }
    onAction(request, action, rejectionReason);
    setShowModal(false);
  };

  return (
    <>
      <tr className="hover:bg-slate-50 transition-colors group border-b-2 border-slate-100">
        {/* MITRA / WILAYAH */}
        <td className="px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 border-2 border-slate-200 group-hover:border-[#008080] group-hover:text-[#008080] transition-all">
              {request.role === "MERCHANT" ? (
                <Store size={20} />
              ) : (
                <Bike size={20} />
              )}
            </div>
            <div>
              <p className="text-[14px] font-black text-slate-800 uppercase leading-none mb-1">
                {request.role === "MERCHANT"
                  ? request.shop_name
                  : request.name || request.full_name}
              </p>
              <div className="flex items-center gap-2 text-[#008080]">
                <MapPin size={10} />
                <p className="text-[10px] font-black uppercase tracking-widest">
                  {request.markets?.name || "MUARA JAWA"}
                </p>
              </div>
            </div>
          </div>
        </td>

        {/* ROLE BADGE */}
        <td className="px-8 py-6">
          <span
            className={`px-3 py-1 rounded text-[9px] font-black uppercase tracking-widest border-2 ${
              request.role === "MERCHANT"
                ? "bg-orange-50 text-orange-600 border-orange-100"
                : "bg-blue-50 text-blue-600 border-blue-100"
            }`}
          >
            {request.role === "MERCHANT" ? "TOKO / MERCHANT" : "DRIVER / KURIR"}
          </span>
        </td>

        {/* TOMBOL LIHAT DATA */}
        <td className="px-8 py-6 text-center">
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[#008080] shadow-xl active:scale-95 transition-all"
          >
            <Eye size={16} /> LIHAT DATA BERKAS
          </button>
        </td>
      </tr>

      {/* --- MODAL VERIFIKASI INDUSTRIAL --- */}
      {showModal && (
        <div className="fixed inset-0 z-[1002] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4">
          <div className="bg-white border-[6px] border-slate-900 w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col shadow-[20px_20px_0px_0px_rgba(0,0,0,0.3)]">
            {/* HEADER */}
            <div className="bg-slate-900 text-white p-6 flex justify-between items-center border-b-4 border-[#008080]">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/10 rounded-lg">
                  {request.role === "MERCHANT" ? (
                    <Store size={24} />
                  ) : (
                    <Bike size={24} />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tighter">
                    VERIFIKASI PENDAFTARAN
                  </h3>
                  <p className="text-[10px] text-teal-400 font-black tracking-[0.2em] uppercase mt-1">
                    CALON MITRA:{" "}
                    {request.role === "MERCHANT"
                      ? request.shop_name
                      : request.name || request.full_name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="hover:rotate-90 transition-all p-2"
              >
                <X size={28} />
              </button>
            </div>

            {/* BODY (SCROLLABLE) */}
            <div className="p-8 overflow-y-auto flex-1 bg-slate-50">
              {/* DISPLAY BERKAS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <DocBox
                  label="FOTO KTP"
                  url={request.ktp_url}
                  icon={<CreditCard size={20} />}
                />
                <DocBox
                  label="FOTO SIM / IJIN"
                  url={request.sim_url}
                  icon={<FileText size={20} />}
                />
                <DocBox
                  label="FOTO SELFIE"
                  url={request.selfie_url}
                  icon={<Camera size={20} />}
                />
              </div>

              {/* DATA TAMBAHAN */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white border-4 border-slate-200 p-6 rounded-xl">
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      KONTAK WHATSAPP
                    </p>
                    <div className="flex items-center gap-2 text-slate-900 font-black">
                      <Smartphone size={16} className="text-[#FF6600]" />
                      <span className="text-lg">
                        {request.phone_number ||
                          request.phone ||
                          "TIDAK TERSEDIA"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      ALAMAT DOMISILI
                    </p>
                    <p className="text-[12px] font-black text-slate-700 uppercase leading-tight">
                      {request.address || "ALAMAT KOSONG"}
                    </p>
                  </div>
                </div>

                {/* ALASAN PENOLAKAN */}
                <div className="border-l-0 md:border-l-2 border-slate-100 md:pl-6">
                  <label className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-2 block">
                    ALASAN PENOLAKAN (WAJIB JIKA DITOLAK)
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) =>
                      setRejectionReason(e.target.value.toUpperCase())
                    }
                    placeholder="CONTOH: FOTO BERKAS KABUR / SIM EXPIRED..."
                    className="w-full h-24 p-4 bg-slate-50 border-2 border-slate-200 focus:border-red-500 outline-none rounded-lg text-[12px] font-black transition-all"
                  />
                </div>
              </div>
            </div>

            {/* FOOTER AKSI */}
            <div className="p-6 bg-white border-t-4 border-slate-100 flex gap-4">
              <button
                disabled={isProcessing}
                onClick={() => handleConfirmAction("REJECT")}
                className="flex-1 py-5 bg-white border-4 border-red-600 text-red-600 font-black text-[12px] tracking-widest hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-3 shadow-lg"
              >
                <XCircle size={20} /> TOLAK & KIRIM WA
              </button>
              <button
                disabled={isProcessing}
                onClick={() => handleConfirmAction("APPROVE")}
                className="flex-[2] py-5 bg-[#008080] border-4 border-[#008080] text-white font-black text-[12px] tracking-widest hover:bg-slate-900 hover:border-slate-900 transition-all flex items-center justify-center gap-3 shadow-xl"
              >
                {isProcessing ? (
                  <RefreshCw className="animate-spin" />
                ) : (
                  <>
                    <CheckCircle size={20} /> TERIMA & AKTIFKAN MITRA
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// SUB-COMPONENT PREVIEW
const DocBox = ({ label, url, icon }: any) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 text-slate-900">
      {icon}
      <span className="text-[10px] font-black uppercase tracking-widest">
        {label}
      </span>
    </div>
    <div className="relative aspect-video bg-slate-200 border-4 border-slate-900 rounded-lg overflow-hidden group shadow-md">
      {url ? (
        <>
          <img
            src={url}
            alt={label}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center text-white"
          >
            <ExternalLink size={24} className="mb-2" />
            <span className="text-[10px] font-black tracking-widest">
              PERBESAR
            </span>
          </a>
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center text-slate-400 font-black text-[10px]">
          BERKAS TIDAK TERLAMPIR
        </div>
      )}
    </div>
  </div>
);
