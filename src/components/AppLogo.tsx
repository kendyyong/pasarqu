import React from 'react';

interface AppLogoProps {
  regionName?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const AppLogo: React.FC<AppLogoProps> = ({ 
  regionName = 'Pasar', 
  className = '', 
  size = 'md' 
}) => {
  
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl md:text-3xl',
    lg: 'text-4xl',
    xl: 'text-5xl md:text-7xl'
  };

  return (
    <div className={`font-black tracking-tighter flex items-baseline drop-shadow-2xl ${sizeClasses[size]} ${className}`}>
      {/* Bagian PASAR (Warna Teal Menyala) */}
      <span className="text-teal-400 italic">PASAR</span>
      
      {/* Bagian MJ atau Nama Wilayah (Warna Putih Bersih) */}
      <span className="text-white ml-1 uppercase tracking-widest">{regionName}</span>
      
      {/* Titik Indikator Live (Warna Oranye/Secondary agar menonjol) */}
      <div className="w-2 h-2 bg-orange-500 rounded-full ml-1.5 animate-pulse shadow-[0_0_10px_rgba(249,115,22,0.8)]"></div>
    </div>
  );
};