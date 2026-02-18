import React, { useState } from "react";
import {
  Search,
  User,
  Shield,
  MoreVertical,
  Ban,
  CheckCircle,
} from "lucide-react";

// ✅ FIX: Jalur mundur satu tingkat ke folder components
import { Badge, Card, Button } from "../components/SharedUI";

interface UserManagerProps {
  allUsers: any[];
  theme: any;
}

export const UserManager: React.FC<UserManagerProps> = ({
  allUsers,
  theme,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Logika Filter Pengguna
  const filteredUsers = allUsers.filter(
    (u) =>
      u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* --- SECTION HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight leading-none mb-1">
            Manajemen Pengguna
          </h1>
          <p
            className={`text-[10px] font-bold uppercase tracking-[0.2em] ${theme.subText}`}
          >
            Total Terdaftar: {allUsers.length} User
          </p>
        </div>

        <div
          className={`flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all ${theme.border} ${theme.card}`}
        >
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            placeholder="Cari Nama, Email, atau Role..."
            className="bg-transparent border-none outline-none text-xs font-bold w-64 placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* --- USERS GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user) => (
          <Card
            key={user.id}
            theme={theme}
            className="p-6 relative overflow-hidden group"
          >
            <div className="flex items-start gap-4">
              {/* Avatar Box */}
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white shadow-lg ${
                  user.role === "SUPER_ADMIN"
                    ? "bg-indigo-600 shadow-indigo-200"
                    : "bg-teal-600 shadow-teal-200"
                }`}
              >
                {user.full_name?.charAt(0) || "U"}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-black text-sm truncate uppercase tracking-tight text-slate-800">
                  {user.full_name || "Tanpa Nama"}
                </h3>
                <p
                  className={`text-[10px] font-bold truncate ${theme.subText} mb-3`}
                >
                  {user.email}
                </p>

                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant={user.role === "SUPER_ADMIN" ? "purple" : "teal"}
                  >
                    {user.role}
                  </Badge>
                  {user.is_verified && <Badge variant="green">VERIFIED</Badge>}
                </div>
              </div>

              <button
                className={`p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all ${theme.hover}`}
              >
                <MoreVertical size={16} className="text-slate-400" />
              </button>
            </div>

            {/* Bottom Actions Area */}
            <div className="mt-6 pt-5 border-t border-dashed border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-slate-400">
                <Shield size={10} />
                ID: {user.id.substring(0, 8)}...
              </div>
              <div className="flex gap-2">
                <button
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                  title="Suspend User"
                >
                  <Ban size={16} />
                </button>
                <button
                  className="p-2 text-teal-500 hover:text-teal-700 hover:bg-teal-50 rounded-xl transition-all"
                  title="Verify User"
                >
                  <CheckCircle size={16} />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* --- EMPTY STATE --- */}
      {filteredUsers.length === 0 && (
        <div className="py-24 text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <User size={40} className="text-slate-300" />
          </div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">
            Pengguna tidak ditemukan
          </p>
        </div>
      )}
    </div>
  );
};

export default UserManager;
