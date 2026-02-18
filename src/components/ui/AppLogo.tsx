import React from "react";

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
  // Tinggi logo dipangkas sedikit agar Header tidak terlalu tebal
  const heights = {
    sm: "h-7 md:h-8",
    md: "h-9 md:h-11",
    lg: "h-14 md:h-20",
    xl: "h-20 md:h-36",
  };

  const selectedHeight = heights[size] || heights.md;

  return (
    <div
      className={`flex flex-col items-center justify-center select-none ${className} leading-none`}
    >
      {/* 1. AREA LOGO UTAMA */}
      <div className="flex items-center m-0 p-0">
        <img
          src="/logo-pasarqu.png"
          alt="PASARQU BRAND"
          className={`${selectedHeight} w-auto object-contain transform active:scale-95 transition-transform`}
        />
      </div>

      {/* 2. AREA REGION - Dibuat mepet (mt-0.5) */}
      {regionName && (
        <div className="mt-0.5 leading-none">
          <span
            className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em] text-white"
            style={{
              textShadow: "0.5px 0.5px 0px rgba(0,0,0,0.1)",
              opacity: 0.9,
            }}
          >
            {regionName}
          </span>
        </div>
      )}
    </div>
  );
};

export default AppLogo;
