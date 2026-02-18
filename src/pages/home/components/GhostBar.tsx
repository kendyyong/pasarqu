import React from 'react';
// import { Eye, XCircle } from 'lucide-react'; // Ikon tidak perlu di-import jika tidak dipakai
// import { useAuth } from '../contexts/AuthContext';

export const GhostBar: React.FC = () => {
  // --- PERBAIKAN ---
  // Fitur Ghost Mode (Impersonation) dinonaktifkan sementara 
  // karena AuthContext saat ini difokuskan untuk Login Toko/Kurir/Customer biasa.
  // Kode ini dibuat return null agar aplikasi tidak error saat dicompile.
  
  return null;
};

/* // KODE LAMA (DISIMPAN JIKA SUATU SAAT BUTUH FITUR SUPER ADMIN LAGI)
export const GhostBarLegacy = () => {
  const { originalUser, user, stopImpersonation } = useAuth(); // Error disini karena properti ini tidak ada

  if (!originalUser) return null;

  return (
    <div className="bg-red-600 text-white px-4 py-2 flex justify-between items-center shadow-lg animate-in slide-in-from-top sticky top-0 z-[100]">
      <div className="flex items-center gap-2">
        <div className="bg-white/20 p-1 rounded-full animate-pulse">
            <Eye size={18} />
        </div>
        <span className="text-sm font-medium">
            <strong>GHOST MODE:</strong> Memantau sebagai <span className="underline decoration-red-300">{user?.user_metadata?.full_name || 'User'}</span>
        </span>
      </div>
      <button 
        onClick={stopImpersonation}
        className="bg-white text-red-600 px-3 py-1 rounded-lg text-xs font-bold hover:bg-red-50 flex items-center gap-1 transition-colors shadow-sm"
      >
        <XCircle size={14} /> Kembali ke Super Admin
      </button>
    </div>
  );
}; 
*/