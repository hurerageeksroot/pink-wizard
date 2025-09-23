import React from 'react';
import { useGlobalDataProvider } from '@/hooks/useGlobalData';

interface GlobalDataProviderProps {
  children: React.ReactNode;
}

export const GlobalDataProvider: React.FC<GlobalDataProviderProps> = ({ children }) => {
  const globalData = useGlobalDataProvider();
  
  return (
    <globalData.GlobalDataContext.Provider value={globalData}>
      {children}
    </globalData.GlobalDataContext.Provider>
  );
};