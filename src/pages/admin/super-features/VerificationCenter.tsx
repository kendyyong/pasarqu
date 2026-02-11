import React, { useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useToast } from "../../../contexts/ToastContext";
import { generateWALink, waTemplates } from "../../../utils/whatsapp";

export const VerificationCenter = ({
  candidates,
  markets,
  theme,
  refreshData,
}: any) => {
  const { showToast } = useToast();
  const [approvalModal, setApprovalModal] = useState<{
    isOpen: boolean;
    candidate: any;
  }>({ isOpen: false, candidate: null });
  const [selectedMarketId, setSelectedMarketId] = useState("");

  const handleApproveAdmin = async () => {
    if (!selectedMarketId)
      return showToast("Pilih pasar wilayah dinas", "error");
    const targetMarket = markets.find((m: any) => m.id === selectedMarketId);
    const candidate = approvalModal.candidate;

    try {
      await supabase
        .from("profiles")
        .update({
          role: "LOCAL_ADMIN",
          managed_market_id: selectedMarketId,
          is_verified: true,
        })
        .eq("id", candidate.id);
      showToast("Admin Dilantik!", "success");

      if (candidate.phone_number) {
        window.open(
          generateWALink(
            candidate.phone_number,
            waTemplates.adminApproval(
              candidate.name,
              targetMarket?.name || "Pasar Wilayah",
            ),
          ),
          "_blank",
        );
      }
      setApprovalModal({ isOpen: false, candidate: null });
      refreshData();
    } catch (e: any) {
      showToast(e.message, "error");
    }
  };

  return (
    <div className="grid gap-5 animate-in fade-in">
      {candidates.length === 0 && (
        <div className="text-center p-10 text-slate-400 font-bold">
          Tidak ada antrian verifikasi.
        </div>
      )}

      {candidates.map((c: any) => (
        <div
          key={c.id}
          className={`p-8 rounded-[2.5rem] border shadow-sm flex items-center justify-between ${theme.card}`}
        >
          <div>
            <h3 className="font-black text-lg">{c.name}</h3>
            <p className="text-xs">{c.email}</p>
            <p className="text-xs text-indigo-500 font-bold mt-1">
              Calon Admin Wilayah
            </p>
          </div>
          <button
            onClick={() => setApprovalModal({ isOpen: true, candidate: c })}
            className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase hover:scale-105 transition-transform shadow-lg shadow-indigo-500/30"
          >
            Verifikasi
          </button>
        </div>
      ))}

      {/* MODAL APPROVAL */}
      {approvalModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div
            className={`w-full max-w-md p-8 rounded-[3rem] shadow-2xl border bg-white`}
          >
            <h2 className="text-xl font-black uppercase mb-6 text-slate-900">
              Pilih Wilayah Dinas
            </h2>
            <div className="relative mb-6">
              <select
                className="w-full p-5 border rounded-2xl font-bold text-sm outline-none cursor-pointer bg-slate-50"
                onChange={(e) => setSelectedMarketId(e.target.value)}
              >
                <option value="">-- Pilih Pasar --</option>
                {markets.map((m: any) => (
                  <option key={m.id} value={m.id}>
                    {m.name} - {m.city}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() =>
                  setApprovalModal({ isOpen: false, candidate: null })
                }
                className="flex-1 py-5 rounded-2xl bg-slate-200 text-slate-600 text-xs font-bold uppercase hover:bg-slate-300"
              >
                Batal
              </button>
              <button
                onClick={handleApproveAdmin}
                className="flex-1 py-5 bg-indigo-600 text-white rounded-2xl font-bold text-xs uppercase hover:bg-indigo-700 shadow-lg"
              >
                Lantik
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
