import React, { createContext, useContext, useState, ReactNode } from "react";
import { CheckCircle2, AlertCircle, X, Info } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
  } | null>(null);

  const showToast = (message: string, type: ToastType = "success") => {
    setToast({ message, type });
    // Otomatis hilang setelah 3 detik
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* UI Toast PasarQu */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-sm animate-in fade-in slide-in-from-bottom-4">
          <div
            className={`flex items-center gap-3 p-4 rounded-md shadow-2xl border bg-white ${
              toast.type === "success"
                ? "border-teal-600/20"
                : toast.type === "error"
                  ? "border-red-600/20"
                  : "border-orange-600/20"
            }`}
          >
            {/* IKON DENGAN WARNA BRAND */}
            {toast.type === "success" && (
              <CheckCircle2 size={20} className="text-teal-600" />
            )}
            {toast.type === "error" && (
              <AlertCircle size={20} className="text-red-600" />
            )}
            {toast.type === "info" && (
              <Info size={20} className="text-[#FF6600]" />
            )}

            {/* TEKS: Ukuran 12 (text-xs), Font Black, Tidak Italik */}
            <p
              className={`flex-1 text-[12px] font-[1000] uppercase tracking-tight not-italic ${
                toast.type === "success"
                  ? "text-teal-800"
                  : toast.type === "error"
                    ? "text-red-800"
                    : "text-[#FF6600]"
              }`}
            >
              {toast.message}
            </p>

            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
