import React from "react";
import { useConfig } from "../contexts/ConfigContext";
import { ShoppingBag } from "lucide-react";

interface AppLogoProps {
  regionName?: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export const AppLogo: React.FC<AppLogoProps> = ({
  regionName,
  className = "",
  size = "md",
}) => {
  const { config } = useConfig();
  const { primaryColor } = config;

  /**
   * RE-KALIBRASI UKURAN KHUSUS PONSEL:
   * Mengurangi ukuran pixel pada brand (pasarqu) dan region (muara jawa)
   * agar lebih ringkas di layar kecil.
   */
  const styles = {
    sm: {
      brand: "text-[16px] md:text-[24px]",
      region: "text-[9px] md:text-[18px]",
      icon: 18,
      mdIcon: 26,
    },
    md: {
      brand: "text-[18px] md:text-[32px]",
      region: "text-[10px] md:text-[24px]",
      icon: 20,
      mdIcon: 34,
    },
    lg: {
      brand: "text-[26px] md:text-[50px]",
      region: "text-[14px] md:text-[38px]",
      icon: 28,
      mdIcon: 50,
    },
    xl: {
      brand: "text-[38px] md:text-[75px]",
      region: "text-[20px] md:text-[55px]",
      icon: 40,
      mdIcon: 70,
    },
  };

  const style = styles[size] || styles.sm;
  const isWhiteMode = className.includes("text-white");

  const baseTextStyle: React.CSSProperties = {
    fontWeight: 950,
    display: "inline-block",
    transformOrigin: "bottom",
    lineHeight: 1,
    letterSpacing: "-0.01em",
    whiteSpace: "nowrap",
  };

  return (
    <div className={`flex items-center select-none ${className}`}>
      {/* 1. IKON TAS - Ukuran Mobile diperkecil menjadi 20px (dari 26px) */}
      <div className="flex items-center mr-1.5 md:mr-3 shrink-0">
        <ShoppingBag
          style={{
            width:
              typeof window !== "undefined" && window.innerWidth < 768
                ? `${style.icon}px`
                : `${style.mdIcon}px`,
            height:
              typeof window !== "undefined" && window.innerWidth < 768
                ? `${style.icon}px`
                : `${style.mdIcon}px`,
            color: isWhiteMode ? "#FFFFFF" : primaryColor || "#059669",
          }}
          strokeWidth={2.5}
        />
      </div>

      {/* 2. AREA TEKS */}
      <div className="flex flex-col md:flex-row items-center md:items-end">
        {/* BARIS ATAS: pasarqu */}
        <div
          className="flex items-center h-fit"
          style={{
            // Tetap menjaga posisi yang sudah kita kunci sebelumnya
            transform:
              typeof window !== "undefined" && window.innerWidth < 768
                ? "translateY(-1px)"
                : "translateY(-5px)",
          }}
        >
          <span
            className={style.brand}
            style={{
              ...baseTextStyle,
              color: "#FF6600",
              WebkitTextStroke:
                typeof window !== "undefined" && window.innerWidth < 768
                  ? "0.2px black"
                  : "0.4px black",
              textShadow: "1px 1px 1px rgba(0,0,0,0.1)",
              transform: "scaleY(1.35)",
            }}
          >
            pasarqu
          </span>
        </div>

        {/* BARIS BAWAH: MUARA JAWA */}
        {regionName && (
          <div
            className="flex items-center h-fit w-full justify-center md:justify-start"
            style={{
              // Jarak antar teks di mobile disesuaikan dengan font yang lebih kecil
              marginTop:
                typeof window !== "undefined" && window.innerWidth < 768
                  ? "4px"
                  : "0px",
              marginBottom:
                typeof window !== "undefined" && window.innerWidth >= 768
                  ? "1px"
                  : "0px",
            }}
          >
            {/* Garis Pemisah (Hanya muncul di Desktop) */}
            <div
              className={`hidden md:block h-5 w-[1.5px] ${isWhiteMode ? "bg-white/30" : "bg-slate-300"} mx-2 mb-1`}
            ></div>

            <span
              className={style.region}
              style={{
                ...baseTextStyle,
                color: isWhiteMode ? "#FFFFFF" : primaryColor || "#059669",
                fontWeight: 800,
                opacity: 0.9,
                textAlign: "center",
                // Mobile ScaleY dinormalkan agar tidak terlalu jangkung di teks kecil
                transform:
                  typeof window !== "undefined" && window.innerWidth < 768
                    ? "scaleY(1)"
                    : "scaleY(1.35)",
              }}
            >
              {regionName}
            </span>
          </div>
        )}
      </div>

      {/* 3. DOT ORANGE (Tetap Tersembunyi di Mobile) */}
      <div className="hidden md:block w-2.5 h-2.5 rounded-full ml-4 bg-[#FF6600] border border-black animate-pulse self-end mb-2.5"></div>
    </div>
  );
};

export default AppLogo;
