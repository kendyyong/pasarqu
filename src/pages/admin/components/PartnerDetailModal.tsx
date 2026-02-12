import React from "react";
import {
  XCircle,
  Truck,
  CreditCard,
  FileText,
  Camera,
  UserCheck,
} from "lucide-react";

interface Props {
  user: any;
  onClose: () => void;
  onApprove: (user: any) => void;
  onDeactivate: (id: string) => void;
}

export const PartnerDetailModal: React.FC<Props> = ({
  user,
  onClose,
  onApprove,
  onDeactivate,
}) => {
  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in">
      <div className="bg-white w-full max-w-4xl h-[90vh] rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="bg-slate-900 p-8 text-white flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight">
              {user.name}
            </h2>
            <p className="text-teal-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2 mt-1">
              {user.role} <span className="text-slate-500">•</span>{" "}
              {user.shop_name || user.phone_number}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-3 bg-white/10 rounded-full hover:bg-red-500 transition-colors"
          >
            <XCircle size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Info Kiri */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <h3 className="font-black text-slate-800 text-sm uppercase border-b border-slate-100 pb-3">
                  Informasi Pribadi
                </h3>
                <InfoRow label="Email" value={user.email} />
                <InfoRow label="WhatsApp" value={user.phone_number} />
                <InfoRow label="Alamat" value={user.address} />
                <InfoRow
                  label="Bergabung"
                  value={new Date(user.created_at).toLocaleDateString()}
                />
              </div>
              {user.role === "COURIER" && (
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                  <h3 className="font-black text-slate-800 text-sm uppercase flex items-center gap-2">
                    <Truck size={16} /> Kendaraan
                  </h3>
                  <InfoRow label="Jenis" value={user.vehicle_type} />
                  <InfoRow label="Plat Nomor" value={user.plat_number} />
                </div>
              )}
            </div>

            {/* Info Kanan (Dokumen) */}
            <div className="space-y-6">
              <h3 className="font-black text-slate-800 text-sm uppercase ml-2">
                Dokumen
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {user.ktp_url ? (
                  <ImageViewer
                    label="KTP"
                    url={user.ktp_url}
                    icon={<CreditCard size={16} />}
                  />
                ) : (
                  <NoData label="KTP Kosong" />
                )}
                {user.sim_url && (
                  <ImageViewer
                    label="SIM"
                    url={user.sim_url}
                    icon={<FileText size={16} />}
                  />
                )}
                {user.selfie_url ? (
                  <ImageViewer
                    label="Selfie"
                    url={user.selfie_url}
                    icon={<Camera size={16} />}
                  />
                ) : (
                  <NoData label="Selfie Kosong" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        {user.role !== "CUSTOMER" && (
          <div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-4 shrink-0">
            {user.is_verified ? (
              <button
                onClick={() => onDeactivate(user.id)}
                className="px-8 py-4 bg-red-100 text-red-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-200 transition-all"
              >
                Bekukan Akun
              </button>
            ) : (
              <button
                onClick={() => onApprove(user)}
                className="px-8 py-4 bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 flex items-center gap-2 shadow-lg shadow-emerald-500/30"
              >
                <UserCheck size={18} /> Validasi & Setujui
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Helper Components
const InfoRow = ({ label, value }: any) => (
  <div>
    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
      {label}
    </p>
    <p className="text-sm font-bold text-slate-800 break-words">
      {value || "-"}
    </p>
  </div>
);
const ImageViewer = ({ label, url, icon }: any) => (
  <div className="group relative rounded-2xl overflow-hidden border-2 border-slate-100 hover:border-teal-500 transition-all cursor-pointer bg-white h-32">
    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-slate-700 shadow-sm z-10">
      {icon} {label}
    </div>
    <img src={url} alt={label} className="w-full h-full object-cover" />
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 text-white font-bold text-xs uppercase transition-opacity"
    >
      Buka
    </a>
  </div>
);
const NoData = ({ label }: any) => (
  <div className="h-24 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-xs font-bold uppercase">
    {label}
  </div>
);
