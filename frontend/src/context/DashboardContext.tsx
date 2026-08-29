"use client";

import React, { createContext, useContext, useState } from "react";

interface DashboardContextType {
  isComposeOpen: boolean;
  openCompose: () => void;
  closeCompose: () => void;
}

const DashboardContext = createContext<DashboardContextType>({
  isComposeOpen: false,
  openCompose: () => {},
  closeCompose: () => {},
});

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  return (
    <DashboardContext.Provider
      value={{
        isComposeOpen,
        openCompose: () => setIsComposeOpen(true),
        closeCompose: () => setIsComposeOpen(false),
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => useContext(DashboardContext);
