import React, { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import {
  Wallet,
  Plus,
  Search,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  User,
  ShieldAlert,
  RefreshCw,
  History,
  ArrowDownRight,
  ArrowUpRight,
  ShieldX,
} from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import { createAuditLog } from "../../../lib/auditHelper";

export const CourierFinanceManager = () => {
  const { showToast } = useToast();
  const [couriers, setCouriers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  // State untuk Ambang Batas dari Global Config
  const [freezeThreshold, setFreezeThreshold] = useState<number>(0);

  // State Modal Top Up
  const [selectedCourier, setSelectedCourier] = useState<any>(null);
  const [topUpAmount, setTopUpAmount] = useState<string>("");

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Ambil Ambang Batas (Threshold) dari Global Config
      const { data: configData } = await supabase
        .from("app_settings")
        .select("min_wallet_limit")
        .eq("id", 1)
        .single();

      if (configData) {
        setFreezeThreshold(configData.min_wallet_limit || 0);
      }

      // 2. Ambil Data Kurir
      const { data: courierData, error: courierError } = await supabase
        .from("profiles")
        .select(`id, name, email, wallet_balance, status, markets (name)`)
        .eq("role", "COURIER")
        .order("name", { ascending: true });

      if (courierError) throw courierError;
      setCouriers(courierData || []);

      // 3. Ambil Riwayat Mutasi Terakhir
      const { data: logData, error: logError } = await supabase
        .from("wallet_logs")
        .select(`*, profiles(name)`)
        .order("created_at", { ascending: false })
        .limit(10);

      if (!logError) setLogs(logData || []);
    } catch (err: any) {
      showToast("Gagal mengambil data: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTopUp = async () => {
    const amountNum = parseInt(topUpAmount);
    if (!selectedCourier || isNaN(amountNum) || amountNum <= 0) {
      showToast("Masukkan jumlah dana yang valid!", "error");
      return;
    }

    setProcessingId(selectedCourier.id);
    try {
      const currentBalance = Number(selectedCourier.wallet_balance || 0);
      const newBalance = currentBalance + amountNum;

      // Update Saldo & Auto-Unfreeze jika saldo baru di atas threshold
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          wallet_balance: newBalance,
          status:
            newBalance >= freezeThreshold ? "ACTIVE" : selectedCourier.status,
        })
        .eq("id", selectedCourier.id);

      if (updateError) throw updateError;

      // Catat ke Tabel Mutasi
      await supabase.from("wallet_logs").insert([
        {
          profile_id: selectedCourier.id,
          type: "TOPUP",
          amount: amountNum,
          balance_after: newBalance,
          description: "Top up saldo oleh Super Admin",
        },
      ]);

      await createAuditLog(
        "TOPUP_COURIER",
        "FINANCE",
        `Top up Rp ${amountNum.toLocaleString()} ke ${selectedCourier.name}`,
      );

      showToast(`Top up Rp ${amountNum.toLocaleString()} Berhasil!`, "success");
      setSelectedCourier(null);
      setTopUpAmount("");
      fetchData();
    } catch (err: any) {
      showToast("Terjadi kesalahan: " + err.message, "error");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 text-left pb-20">
      {/* HEADER & INFO THRESHOLD */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">
            Courier <span className="text-teal-600">Wallet Control</span>
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <ShieldAlert size={12} className="text-red-500" />
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Ambang Batas Beku:{" "}
              <span className="text-red-600">
                Rp {freezeThreshold.toLocaleString("id-ID")}
              </span>
            </p>
          </div>
        </div>
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Cari Kurir..."
            className="bg-white border-none rounded-2xl pl-12 pr-6 py-3.5 text-xs font-bold shadow-sm w-full md:w-64 outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* GRID DAFTAR KURIR */}
      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="animate-spin mx-auto text-teal-600" size={40} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {couriers
            .filter((c) =>
              c.name?.toLowerCase().includes(searchQuery.toLowerCase()),
            )
            .map((courier) => {
              const balance = Number(courier.wallet_balance || 0);
              const isFrozen = balance < freezeThreshold;
              // Alarm menyala jika saldo mendekati threshold (Threshold + 10.000)
              const isLow =
                balance >= freezeThreshold &&
                balance <= freezeThreshold + 10000;

              return (
                <div
                  key={courier.id}
                  className={`p-6 rounded-[2.5rem] border transition-all relative overflow-hidden group ${
                    isFrozen
                      ? "bg-red-50/50 border-red-200"
                      : isLow
                        ? "bg-amber-50/50 border-amber-200 shadow-lg shadow-amber-100"
                        : "bg-white border-slate-100"
                  }`}
                >
                  {/* Status Badge Dinamis */}
                  <div className="flex justify-between items-start mb-4">
                    <div
                      className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1 ${
                        isFrozen
                          ? "bg-red-600 text-white"
                          : isLow
                            ? "bg-amber-500 text-white animate-pulse"
                            : "bg-teal-500 text-white"
                      }`}
                    >
                      {isFrozen ? (
                        <ShieldX size={10} />
                      ) : isLow ? (
                        <AlertTriangle size={10} />
                      ) : (
                        <CheckCircle2 size={10} />
                      )}
                      {isFrozen
                        ? "DIBEKUKAN"
                        : isLow
                          ? "ALARM ISI SALDO"
                          : "SALDO AMAN"}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isFrozen ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-400"}`}
                    >
                      <User size={20} />
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="font-black text-slate-800 text-xs uppercase truncate">
                        {courier.name}
                      </h4>
                      <p className="text-[9px] text-teal-600 font-bold uppercase truncate">
                        {courier.markets?.name || "Global Market"}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`rounded-2xl p-4 mb-4 text-center transition-colors ${isFrozen ? "bg-red-100" : "bg-slate-50"}`}
                  >
                    <p
                      className={`text-[8px] font-black uppercase tracking-widest mb-1 ${isFrozen ? "text-red-400" : "text-slate-400"}`}
                    >
                      Saldo Akurat
                    </p>
                    <h3
                      className={`text-xl font-black ${isFrozen ? "text-red-700" : "text-slate-800"}`}
                    >
                      Rp {balance.toLocaleString("id-ID")}
                    </h3>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedCourier(courier);
                      setTopUpAmount("");
                    }}
                    className={`w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-md ${
                      isFrozen
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : "bg-slate-900 text-white hover:bg-teal-600"
                    }`}
                  >
                    Input Top Up
                  </button>
                </div>
              );
            })}
        </div>
      )}

      {/* TABEL MUTASI */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
              <History size={20} />
            </div>
            <div>
              <h3 className="font-black text-slate-800 uppercase tracking-tighter">
                Riwayat Mutasi Terakhir
              </h3>
              <p className="text-[9px] text-slate-400 font-bold uppercase">
                Audit otomatis setiap aliran saldo
              </p>
            </div>
          </div>
          <button
            onClick={fetchData}
            className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400"
          >
            <RefreshCw size={16} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase italic">
                  Waktu
                </th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase italic">
                  Kurir
                </th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase italic">
                  Jenis
                </th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase italic">
                  Nominal
                </th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase italic">
                  Keterangan
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50/50 transition-all"
                  >
                    <td className="px-8 py-4 text-[10px] font-bold text-slate-500">
                      {new Date(log.created_at).toLocaleString("id-ID")}
                    </td>
                    <td className="px-8 py-4 text-[11px] font-black text-slate-700 uppercase">
                      {log.profiles?.name}
                    </td>
                    <td className="px-8 py-4">
                      <span
                        className={`px-2 py-1 rounded-md text-[9px] font-black uppercase ${log.type === "TOPUP" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}
                      >
                        {log.type}
                      </span>
                    </td>
                    <td
                      className={`px-8 py-4 text-[11px] font-black ${log.type === "TOPUP" ? "text-green-600" : "text-red-600"}`}
                    >
                      {log.type === "TOPUP" ? "+" : "-"} Rp{" "}
                      {log.amount.toLocaleString("id-ID")}
                    </td>
                    <td className="px-8 py-4 text-[10px] font-medium text-slate-400 uppercase">
                      {log.description}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="p-10 text-center text-xs font-bold text-slate-300 uppercase"
                  >
                    Belum ada mutasi
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL INPUT TOP UP */}
      {selectedCourier && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 text-teal-50 opacity-10">
              <Wallet size={120} />
            </div>
            <div className="relative z-10">
              <h3 className="text-xl font-black text-slate-800 uppercase mb-2">
                Input Saldo
              </h3>
              <p className="text-[10px] text-slate-400 font-black uppercase mb-8 italic">
                Penerima:{" "}
                <span className="text-teal-600 not-italic">
                  {selectedCourier.name}
                </span>
              </p>
              <input
                type="number"
                className="w-full bg-slate-50 border-none rounded-2xl px-6 py-5 text-2xl font-black mb-2 outline-none focus:ring-2 ring-teal-500"
                placeholder="0"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                autoFocus
              />
              <p className="text-[10px] text-teal-600 font-bold mb-8 ml-2">
                Hasil: Rp{" "}
                {topUpAmount
                  ? Number(topUpAmount).toLocaleString("id-ID")
                  : "0"}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedCourier(null)}
                  className="flex-1 py-4 font-black text-[10px] uppercase text-slate-400 tracking-widest"
                >
                  Batal
                </button>
                <button
                  onClick={handleTopUp}
                  disabled={processingId !== null || !topUpAmount}
                  className="flex-[2] bg-teal-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-teal-600/20 disabled:opacity-50"
                >
                  {processingId ? "Memproses..." : "Konfirmasi Top Up"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
