import React from "react";
import {
  XCircle,
  Truck,
  CreditCard,
  Camera,
  UserCheck,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";

interface Props {
  user: any;
  onClose: () => void;
  onApprove: (user: any) => void;
  onDeactivate: (id: string) => void;
  onActivate: (id: string) => void;
}

export const PartnerDetailModal: React.FC<Props> = ({
  user,
  onClose,
  onApprove,
  onDeactivate,
  onActivate,
}) => {
  if (!user) return null;

  const isSuspended = user.status === "SUSPENDED";
  const isVerified = user.is_verified;

  // --- WRAPPER FUNGSI UNTUK KEAMANAN ---
  const handleDeactivate = () => {
    if (
      window.confirm(
        `BEKUKAN AKUN: Apakah Anda yakin ingin menghentikan operasional ${user.shop_name || user.name} untuk sementara?`,
      )
    ) {
      onDeactivate(user.id);
    }
  };

  const handleActivate = () => {
    if (
      window.confirm(
        `AKTIFKAN AKUN: Kembalikan akses operasional penuh untuk ${user.shop_name || user.name}?`,
      )
    ) {
      onActivate(user.id);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-4xl h-[90vh] rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl transition-all">
        {/* Header Dinamis Berdasarkan Status */}
        <div
          className={`p-8 text-white flex justify-between items-center shrink-0 transition-colors duration-500 ${isSuspended ? "bg-red-600" : "bg-slate-900"}`}
        >
          <div className="flex items-center gap-4">
            <div className="text-left">
              <h2 className="text-2xl font-black uppercase tracking-tight leading-none mb-1">
                {user.shop_name || user.name}
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
                  {user.role}
                </span>
                <span className="opacity-30">•</span>
                {isSuspended ? (
                  <span className="px-3 py-1 bg-white text-red-600 text-[9px] font-black rounded-full uppercase tracking-widest shadow-lg animate-pulse">
                    ⚠️ AKUN DIBEKUKAN
                  </span>
                ) : isVerified ? (
                  <span className="px-3 py-1 bg-emerald-500 text-white text-[9px] font-black rounded-full uppercase tracking-widest">
                    ✅ MITRA AKTIF
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-orange-500 text-white text-[9px] font-black rounded-full uppercase tracking-widest">
                    ⏳ MENUNGGU VALIDASI
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
          >
            <XCircle size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
          {isSuspended && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-700 animate-in slide-in-from-top-2">
              <AlertTriangle size={20} />
              <p className="text-[10px] font-black uppercase tracking-wider">
                Peringatan: Akun ini sedang ditangguhkan oleh Admin Wilayah.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 text-left">
                <h3 className="font-black text-slate-800 text-sm uppercase border-b border-slate-100 pb-3">
                  Informasi Pribadi
                </h3>
                <InfoRow label="Email" value={user.email} />
                <InfoRow
                  label="WhatsApp"
                  value={user.phone_number || user.phone}
                />
                <InfoRow label="Alamat" value={user.address} />
              </div>

              {user.role === "COURIER" && (
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 text-left">
                  <h3 className="font-black text-slate-800 text-sm uppercase flex items-center gap-2">
                    <Truck size={16} /> Kendaraan
                  </h3>
                  <InfoRow label="Jenis" value={user.vehicle_type} />
                  <InfoRow label="Plat Nomor" value={user.plat_number} />
                </div>
              )}
            </div>

            <div className="space-y-6 text-left">
              <h3 className="font-black text-slate-800 text-sm uppercase ml-2">
                Dokumen Verifikasi
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <ImageViewer
                  label="KTP"
                  url={user.ktp_url}
                  icon={<CreditCard size={16} />}
                />
                <ImageViewer
                  label="Selfie"
                  url={user.selfie_url}
                  icon={<Camera size={16} />}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions - Smart Logic */}
        {user.role !== "CUSTOMER" && (
          <div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-3 shrink-0">
            {!isVerified ? (
              <button
                onClick={() => onApprove(user)}
                className="px-8 py-4 bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 flex items-center gap-2 shadow-lg shadow-emerald-500/30 transition-all active:scale-95"
              >
                <UserCheck size={18} /> Validasi & Setujui Mitra
              </button>
            ) : isSuspended ? (
              <button
                onClick={handleActivate}
                className="px-8 py-4 bg-teal-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-teal-700 flex items-center gap-2 shadow-lg shadow-teal-500/30 transition-all active:scale-95"
              >
                <ShieldCheck size={18} /> Aktifkan Kembali Akun
              </button>
            ) : (
              <button
                onClick={handleDeactivate}
                className="px-8 py-4 bg-white border-2 border-red-100 text-red-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-50 flex items-center gap-2 transition-all active:scale-95"
              >
                <ShieldAlert size={18} /> Bekukan Akun Mitra
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Sub-components
const InfoRow = ({ label, value }: any) => (
  <div>
    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
      {label}
    </p>
    <p className="text-sm font-bold text-slate-800">{value || "-"}</p>
  </div>
);

const ImageViewer = ({ label, url, icon }: any) => {
  if (!url)
    return (
      <div className="h-24 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-[10px] font-black uppercase italic">
        {label} Kosong
      </div>
    );
  return (
    <div className="group relative rounded-2xl overflow-hidden border-2 border-slate-100 hover:border-teal-500 transition-all cursor-pointer bg-white h-32 shadow-sm">
      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 text-slate-700 shadow-sm z-10">
        {icon} {label}
      </div>
      <img src={url} alt={label} className="w-full h-full object-cover" />
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 text-white font-black text-[10px] uppercase transition-opacity"
      >
        Lihat Dokumen
      </a>
    </div>
  );
};
