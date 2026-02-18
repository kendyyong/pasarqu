import React from "react";
import {
  Store,
  Bike,
  MapPin,
  XCircle,
  CheckCircle,
  RefreshCw,
} from "lucide-react";

interface ApprovalTableRowProps {
  request: any;
  processingId: string | null;
  onAction: (user: any, action: "APPROVE" | "REJECT") => void;
}

export const ApprovalTableRow: React.FC<ApprovalTableRowProps> = ({
  request,
  processingId,
  onAction,
}) => {
  const isProcessing = processingId === request.id;

  return (
    <tr className="hover:bg-slate-50/30 transition-colors group">
      {/* MITRA / WILAYAH */}
      <td className="px-8 py-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 group-hover:border-teal-200 group-hover:bg-white transition-all">
            {request.role === "MERCHANT" ? (
              <Store size={20} />
            ) : (
              <Bike size={20} />
            )}
          </div>
          <div>
            <p className="text-sm font-black text-slate-800 uppercase tracking-tight">
              {request.role === "MERCHANT"
                ? request.shop_name
                : request.full_name}
            </p>
            <p className="text-[10px] text-teal-600 font-black uppercase flex items-center gap-1 mt-1">
              <MapPin size={10} />{" "}
              {request.markets?.name || "Wilayah Belum Diset"}
            </p>
          </div>
        </div>
      </td>

      {/* ROLE BADGE */}
      <td className="px-8 py-6">
        <span
          className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
            request.role === "MERCHANT"
              ? "bg-orange-50 text-orange-600 border-orange-100"
              : "bg-blue-50 text-blue-600 border-blue-100"
          }`}
        >
          {request.role}
        </span>
      </td>

      {/* ACTIONS */}
      <td className="px-8 py-6">
        <div className="flex items-center justify-center gap-3">
          {/* Reject Button */}
          <button
            onClick={() => onAction(request, "REJECT")}
            disabled={isProcessing}
            className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all disabled:opacity-30"
            title="Tolak Pendaftaran"
          >
            <XCircle size={22} />
          </button>

          {/* Approve Button */}
          <button
            onClick={() => onAction(request, "APPROVE")}
            disabled={isProcessing}
            className="flex items-center gap-3 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-teal-600 shadow-xl active:scale-95 transition-all disabled:opacity-50"
          >
            {isProcessing ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <CheckCircle size={16} />
            )}
            SETUJUI MITRA
          </button>
        </div>
      </td>
    </tr>
  );
};
