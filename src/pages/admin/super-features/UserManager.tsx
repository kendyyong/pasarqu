import React, { useState } from "react";
import { Download, FileText, Eye, X, CreditCard, Camera } from "lucide-react";
import { exportToPDF, exportToExcel } from "../../../utils/exportUtils";
import { Input } from "../../../components/super-admin/SharedUI";

// Komponen Kecil untuk Modal
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

export const UserManager = ({ allUsers, theme }: any) => {
  const [userDetailModal, setUserDetailModal] = useState<{
    isOpen: boolean;
    user: any;
  }>({ isOpen: false, user: null });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      {/* HEADER & EXPORT */}
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
            onClick={() => exportToExcel("Data User Global", allUsers)}
            className="flex-1 md:flex-none px-6 py-4 bg-green-600 text-white rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-3 shadow-lg hover:bg-green-700"
          >
            <FileText size={18} /> Excel
          </button>
        </div>
      </div>

      {/* TABEL USER */}
      <div
        className={`rounded-[2.5rem] border overflow-hidden shadow-sm ${theme.card}`}
      >
        <table className="w-full text-left">
          <thead
            className={`border-b text-[10px] uppercase font-black tracking-widest bg-slate-50`}
          >
            <tr>
              <th className="p-6">User</th>
              <th className="p-6">Role</th>
              <th className="p-6">Lokasi</th>
              <th className="p-6 text-right">Berkas</th>
            </tr>
          </thead>
          <tbody>
            {allUsers.map((u: any) => (
              <tr key={u.id} className="border-b last:border-0">
                <td className="p-6">
                  <div className="font-black text-sm">{u.name}</div>
                  <div className={`text-xs ${theme.subText}`}>{u.email}</div>
                </td>
                <td className="p-6">
                  <span
                    className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${u.role === "LOCAL_ADMIN" ? "bg-indigo-500/20 text-indigo-400" : u.role === "MERCHANT" ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-100 text-slate-500"}`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="p-6 text-xs">{u.markets?.name || "-"}</td>
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

      {/* MODAL DETAIL */}
      {userDetailModal.isOpen && userDetailModal.user && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-6 animate-in fade-in">
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
                <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
                  <InfoRow
                    label="Email"
                    val={userDetailModal.user.email}
                    theme={theme}
                  />
                  <InfoRow
                    label="HP"
                    val={userDetailModal.user.phone_number}
                    theme={theme}
                  />
                  <InfoRow
                    label="Alamat"
                    val={userDetailModal.user.address}
                    theme={theme}
                  />
                </div>
                <div className="space-y-6">
                  {userDetailModal.user.ktp_url ? (
                    <ImageViewer
                      label="KTP"
                      url={userDetailModal.user.ktp_url}
                      icon={<CreditCard size={18} />}
                    />
                  ) : (
                    <div className="p-4 bg-slate-100 rounded-xl text-center text-xs font-bold text-slate-400">
                      KTP Tidak Ada
                    </div>
                  )}
                  {userDetailModal.user.selfie_url ? (
                    <ImageViewer
                      label="Selfie"
                      url={userDetailModal.user.selfie_url}
                      icon={<Camera size={18} />}
                    />
                  ) : (
                    <div className="p-4 bg-slate-100 rounded-xl text-center text-xs font-bold text-slate-400">
                      Selfie Tidak Ada
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
