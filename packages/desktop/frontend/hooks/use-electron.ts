import { useCallback } from 'react';
import type { ElectronAPI } from '../types/electron';

export const useElectron = (): ElectronAPI => {
  if (!window.api) {
    throw new Error('Electron API not available');
  }
  // Double assertion to avoid TypeScript's type checking during intermediate assertion
  return (window.api as unknown) as ElectronAPI;
};

// Example of a more specific hook for a particular feature
export const useVault = () => {
  const api = useElectron();

  const getConfig = useCallback(async () => {
    return api.getVaultConfig();
  }, [api]);

  const saveConfig = useCallback(async (config: Parameters<ElectronAPI['saveVaultConfig']>[0]) => {
    return api.saveVaultConfig(config);
  }, [api]);

  return {
    getConfig,
    saveConfig,
  };
};                                                