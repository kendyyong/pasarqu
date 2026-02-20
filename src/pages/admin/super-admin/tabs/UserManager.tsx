import React, { useState, useMemo } from "react";
import {
  Search,
  User,
  Store,
  Truck,
  MoreVertical,
  Users,
  MapPin,
  ChevronDown,
  FileText,
  Ban,
} from "lucide-react";
import { generateOfficialPDF } from "../../../../utils/pdfGenerator";

interface UserManagerProps {
  allUsers: any[];
  theme: any;
}

export const UserManager: React.FC<UserManagerProps> = ({
  allUsers,
  theme,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<
    "ALL" | "CUSTOMER" | "MERCHANT" | "COURIER"
  >("ALL");
  const [selectedMarket, setSelectedMarket] = useState("GLOBAL");

  // --- LOGIKA FILTER DATA ---
  const marketList = useMemo(() => {
    const markets = allUsers
      .map((u) => u.markets?.name)
      .filter((name): name is string => !!name);
    return ["GLOBAL", ...Array.from(new Set(markets))];
  }, [allUsers]);

  const dataByMarket = useMemo(() => {
    if (selectedMarket === "GLOBAL") return allUsers;
    return allUsers.filter((u) => u.markets?.name === selectedMarket);
  }, [allUsers, selectedMarket]);

  const counts = useMemo(
    () => ({
      all: dataByMarket.length,
      customer: dataByMarket.filter(
        (u) => u.role === "USER" || u.role === "CUSTOMER",
      ).length,
      merchant: dataByMarket.filter((u) => u.role === "MERCHANT").length,
      courier: dataByMarket.filter(
        (u) => u.role === "COURIER" || u.role === "DRIVER",
      ).length,
    }),
    [dataByMarket],
  );

  const filteredData = useMemo(() => {
    return dataByMarket.filter((u) => {
      const nameMatch = (u.full_name || u.name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const emailMatch = (u.email || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesSearch = nameMatch || emailMatch;

      if (activeTab === "ALL") return matchesSearch;
      if (activeTab === "CUSTOMER")
        return matchesSearch && (u.role === "USER" || u.role === "CUSTOMER");
      if (activeTab === "MERCHANT")
        return matchesSearch && u.role === "MERCHANT";
      if (activeTab === "COURIER")
        return matchesSearch && (u.role === "COURIER" || u.role === "DRIVER");
      return matchesSearch;
    });
  }, [dataByMarket, searchTerm, activeTab]);

  const handleExportPDF = async () => {
    const headers = [
      ["NO", "NAMA LENGKAP", "EMAIL", "ROLE", "WILAYAH", "SALDO"],
    ];
    const rows = filteredData.map((u, index) => [
      index + 1,
      (u.full_name || u.name || "-").toUpperCase(),
      u.email,
      u.role,
      u.markets?.name || "NASIONAL",
      `Rp ${(u.wallet_balance || 0).toLocaleString("id-ID")}`,
    ]);

    await generateOfficialPDF(
      "Laporan Data Pengguna Sistem",
      `Kategori: ${activeTab} | Wilayah: ${selectedMarket}`,
      headers,
      rows,
      `Laporan_User_${selectedMarket}`,
    );
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500 font-black uppercase tracking-tighter text-left">
      {/* HEADER & FILTERS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-col md:flex-row gap-3 flex-1 max-w-3xl">
          <div className="relative flex-1">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              type="text"
              placeholder="CARI NAMA / EMAIL / ROLE..."
              className="w-full bg-white border border-slate-200 py-2.5 pl-11 pr-4 rounded-xl text-[12px] outline-none focus:border-[#008080] font-black shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="relative min-w-[200px]">
            <MapPin
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FF6600]"
              size={16}
            />
            <select
              className="w-full bg-white border border-slate-200 py-2.5 pl-11 pr-10 rounded-xl text-[12px] outline-none focus:border-[#008080] appearance-none cursor-pointer font-black shadow-sm"
              value={selectedMarket}
              onChange={(e) => setSelectedMarket(e.target.value)}
            >
              {marketList.map((m) => (
                <option key={m} value={m}>
                  {m === "GLOBAL" ? "SEMUA WILAYAH (GLOBAL)" : m}
                </option>
              ))}
            </select>
            <ChevronDown
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              size={16}
            />
          </div>
        </div>

        <button
          onClick={handleExportPDF}
          className="bg-[#008080] text-white border-none px-6 py-2.5 rounded-xl flex items-center gap-2 text-[12px] hover:bg-slate-900 shadow-md transition-all font-black shrink-0"
        >
          <FileText size={16} /> PRINT PDF RESMI
        </button>
      </div>

      {/* CATEGORY TABS */}
      <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto no-scrollbar gap-1">
        {[
          { id: "ALL", label: "SEMUA", count: counts.all, icon: Users },
          {
            id: "CUSTOMER",
            label: "PEMBELI",
            count: counts.customer,
            icon: User,
          },
          {
            id: "MERCHANT",
            label: "TOKO",
            count: counts.merchant,
            icon: Store,
          },
          { id: "COURIER", label: "KURIR", count: counts.courier, icon: Truck },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-xl transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-[#008080] text-white shadow-md shadow-teal-900/20"
                : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
            }`}
          >
            <tab.icon size={16} />
            <span className="text-[12px]">{tab.label}</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-lg font-sans ${activeTab === tab.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* COMPACT TABLE (Garis Tepi Hijau Dihilangkan) */}
      <div className="bg-white rounded-[1.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-black">
                <th className="py-3 px-4 text-left">NAMA & EMAIL</th>
                <th className="py-3 px-4 text-left">ROLE</th>
                <th className="py-3 px-4 text-left">WILAYAH / PASAR</th>
                <th className="py-3 px-4 text-right">SALDO DOMPET</th>
                <th className="py-3 px-4 text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredData.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-teal-50/40 transition-all group"
                >
                  <td className="py-2 px-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0 font-black ${
                          user.role === "MERCHANT"
                            ? "bg-blue-500"
                            : user.role === "COURIER" || user.role === "DRIVER"
                              ? "bg-[#FF6600]"
                              : "bg-[#008080]"
                        }`}
                      >
                        {(user.full_name || user.name || "U")
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0 font-black">
                        <span className="text-slate-900 truncate leading-tight">
                          {user.full_name || user.name || "GUEST"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-sans tracking-normal font-bold lowercase">
                          {user.email}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-2 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-slate-50 text-slate-600 border border-slate-100">
                      {user.role}
                    </span>
                  </td>
                  <td className="py-2 px-4">
                    <div className="flex items-center gap-1.5 text-slate-600 font-black">
                      <MapPin size={12} className="text-[#FF6600]" />
                      <span className="truncate max-w-[150px]">
                        {user.markets?.name || "NASIONAL"}
                      </span>
                    </div>
                  </td>
                  <td className="py-2 px-4 text-right font-sans font-black text-slate-900 bg-slate-50/30">
                    RP {(user.wallet_balance || 0).toLocaleString("id-ID")}
                  </td>
                  <td className="py-2 px-4 text-center">
                    <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                        <Ban size={14} />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg">
                        <MoreVertical size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManager;
