"use client";

import React from 'react';

export const Header = () => {
  return (
    <header className="flex justify-between items-center py-4 sm:py-5 lg:py-6 px-4 sm:px-6 lg:px-8 bg-[#0b0f19] border-b border-[#1e253c]/50">
      <div className="min-w-0">
        <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-white tracking-tight leading-tight">Campaña Precios de Transferencia 2025</h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-1 leading-snug">Plan de trabajo del 16 Mayo 2026 al 31 Mayo 2026</p>
      </div>
    </header>
  );
};
