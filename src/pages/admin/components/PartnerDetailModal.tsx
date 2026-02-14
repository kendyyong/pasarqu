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
  Store,
  MapPin,
  ExternalLink,
  Smartphone,
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
        `BEKUKAN AKUN: Apakah Anda yakin ingin menghentikan operasional ${user.shop_name || user.full_name} untuk sementara?`,
      )
    ) {
      onDeactivate(user.id);
    }
  };

  const handleActivate = () => {
    if (
      window.confirm(
        `AKTIFKAN AKUN: Kembalikan akses operasional penuh untuk ${user.shop_name || user.full_name}?`,
      )
    ) {
      onActivate(user.id);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-4xl h-[95vh] md:h-[90vh] rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl transition-all border border-white/20">
        {/* Header Dinamis Berdasarkan Status */}
        <div
          className={`p-8 text-white flex justify-between items-center shrink-0 transition-all duration-500 ${isSuspended ? "bg-red-600 shadow-lg shadow-red-600/20" : "bg-slate-900 shadow-lg"}`}
        >
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10">
              {user.role === "MERCHANT" ? (
                <Store size={32} />
              ) : (
                <Truck size={32} />
              )}
            </div>
            <div className="text-left">
              <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter leading-none mb-2">
                {user.shop_name || user.full_name || "Tanpa Nama"}
              </h2>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="px-3 py-1 bg-white/20 text-white text-[9px] font-black rounded-lg uppercase tracking-widest border border-white/10">
                  ID: {user.id.slice(0, 8)}...
                </span>
                <span className="opacity-30">|</span>
                {isSuspended ? (
                  <span className="px-4 py-1.5 bg-white text-red-600 text-[10px] font-black rounded-full uppercase tracking-widest shadow-xl animate-pulse flex items-center gap-2">
                    <ShieldAlert size={12} /> Akun Dibekukan
                  </span>
                ) : isVerified ? (
                  <span className="px-4 py-1.5 bg-emerald-500 text-white text-[10px] font-black rounded-full uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck size={12} /> Mitra Aktif
                  </span>
                ) : (
                  <span className="px-4 py-1.5 bg-orange-500 text-white text-[10px] font-black rounded-full uppercase tracking-widest flex items-center gap-2">
                    <AlertTriangle size={12} /> Menunggu Validasi
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-4 bg-white/10 rounded-2xl hover:bg-red-500 hover:text-white transition-all active:scale-90 border border-white/10"
          >
            <XCircle size={28} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-[#F8FAFC]">
          {isSuspended && (
            <div className="mb-8 p-5 bg-red-50 border-2 border-red-100 rounded-3xl flex items-center gap-4 text-red-700 animate-in slide-in-from-top-4 duration-500">
              <div className="p-3 bg-red-100 rounded-2xl">
                <AlertTriangle size={24} />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest">
                  Peringatan Keamanan
                </p>
                <p className="text-xs font-bold opacity-80">
                  Akun ini sedang ditangguhkan. Semua produk dan jasa
                  pengantaran ditarik dari aplikasi.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* KOLOM KIRI - INFO UTAMA */}
            <div className="md:col-span-7 space-y-8">
              <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 space-y-6 text-left border border-slate-50 relative overflow-hidden">
                <h3 className="font-black text-slate-800 text-[11px] uppercase tracking-[0.2em] border-b border-slate-50 pb-4 flex items-center gap-2">
                  <UserCheck size={16} className="text-teal-500" /> Profil
                  Lengkap Mitra
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <InfoRow
                    label="Nama Lengkap"
                    value={user.full_name}
                    icon={<UserCheck size={12} />}
                  />
                  <InfoRow
                    label="WhatsApp"
                    value={user.phone_number || user.phone}
                    icon={<Smartphone size={12} />}
                  />
                  <InfoRow label="Email Terdaftar" value={user.email} />
                  <InfoRow label="Peran Sistem" value={user.role} />
                </div>
                <div className="pt-4">
                  <InfoRow
                    label="Alamat Operasional"
                    value={user.address}
                    icon={<MapPin size={12} />}
                  />
                </div>
              </div>

              {user.role === "COURIER" && (
                <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 space-y-6 text-left border border-slate-50 relative overflow-hidden">
                  <h3 className="font-black text-slate-800 text-[11px] uppercase flex items-center gap-3 tracking-[0.2em]">
                    <Truck size={18} className="text-orange-500" /> Spesifikasi
                    Kendaraan
                  </h3>
                  <div className="grid grid-cols-2 gap-8">
                    <InfoRow
                      label="Jenis Kendaraan"
                      value={user.vehicle_type}
                    />
                    <InfoRow label="Plat Nomor" value={user.plat_number} />
                  </div>
                </div>
              )}
            </div>

            {/* KOLOM KANAN - DOKUMEN */}
            <div className="md:col-span-5 space-y-8 text-left">
              <h3 className="font-black text-slate-800 text-[11px] uppercase tracking-[0.2em] ml-2">
                Dokumen Legalitas
              </h3>
              <div className="flex flex-col gap-6">
                <ImageViewer
                  label="Kartu Tanda Penduduk (KTP)"
                  url={user.ktp_url}
                  icon={<CreditCard size={16} />}
                />
                <ImageViewer
                  label="Foto Selfie Identitas"
                  url={user.selfie_url}
                  icon={<Camera size={16} />}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions - Premium Fixed Layout */}
        {user.role !== "CUSTOMER" && (
          <div className="p-8 border-t border-slate-100 bg-white flex flex-col sm:flex-row justify-end gap-4 shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.02)]">
            <button
              onClick={onClose}
              className="px-8 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-200 transition-all"
            >
              Tutup Panel
            </button>

            {!isVerified ? (
              <button
                onClick={() => onApprove(user)}
                className="px-10 py-4 bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-emerald-600 flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/30 transition-all active:scale-95"
              >
                <UserCheck size={18} strokeWidth={3} /> Verifikasi & Aktifkan
              </button>
            ) : isSuspended ? (
              <button
                onClick={handleActivate}
                className="px-10 py-4 bg-teal-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-teal-700 flex items-center justify-center gap-3 shadow-xl shadow-teal-600/30 transition-all active:scale-95"
              >
                <ShieldCheck size={18} strokeWidth={3} /> Pulihkan Akses Akun
              </button>
            ) : (
              <button
                onClick={handleDeactivate}
                className="px-10 py-4 bg-white border-2 border-red-100 text-red-600 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-red-50 flex items-center justify-center gap-3 transition-all active:scale-95"
              >
                <ShieldAlert size={18} strokeWidth={3} /> Bekukan Akun Ini
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Sub-components
const InfoRow = ({ label, value, icon }: any) => (
  <div className="group">
    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1.5 mb-1.5 opacity-70">
      {icon} {label}
    </p>
    <p className="text-sm font-black text-slate-800 tracking-tight leading-tight group-hover:text-teal-600 transition-colors">
      {value || <span className="text-slate-300 italic">Data Belum Diisi</span>}
    </p>
  </div>
);

const ImageViewer = ({ label, url, icon }: any) => {
  if (!url)
    return (
      <div className="h-40 rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-300 gap-3">
        <div className="p-4 bg-white rounded-2xl shadow-sm italic">{icon}</div>
        <p className="text-[10px] font-black uppercase tracking-widest italic">
          {label} Kosong
        </p>
      </div>
    );

  return (
    <div className="group relative rounded-[2rem] overflow-hidden border-2 border-slate-100 hover:border-teal-500 transition-all cursor-pointer bg-white h-48 md:h-56 shadow-lg shadow-slate-200/50">
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 text-slate-700 shadow-xl z-10 border border-slate-100">
        {icon} {label}
      </div>
      <img
        src={url}
        alt={label}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="p-4 bg-white text-slate-900 rounded-full shadow-2xl mb-3 hover:scale-110 transition-transform"
        >
          <ExternalLink size={20} strokeWidth={3} />
        </a>
        <span className="text-white font-black text-[10px] uppercase tracking-widest">
          Buka Dokumen
        </span>
      </div>
    </div>
  );
};
