import React, { useState, useEffect } from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { FileExplorer } from '@/components/file-explorer';
import { Button } from '@/components/ui/button';
import { Folder } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ElectronAPI } from '../types/electron';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [vaultConfig, setVaultConfig] = useState<NonNullable<Awaited<ReturnType<ElectronAPI['getVaultConfig']>>>>(null);
  const [isFileExplorerCollapsed, setIsFileExplorerCollapsed] = useState(true);

  // Load vault config
  useEffect(() => {
    const checkVaultConfig = async () => {
      try {
        const config = await window.api.getVaultConfig();
        if (config?.path) {
          setVaultConfig(config);
        }
      } catch (error) {
        console.error('Failed to get vault config:', error);
      }
    };

    checkVaultConfig();
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <div className="flex h-screen font-sans">
        {/* File Explorer Sidebar */}
        <div
          className={cn(
            'h-full transition-all duration-200',
            isFileExplorerCollapsed ? 'w-12' : 'w-64'
          )}
        >
          {isFileExplorerCollapsed ? (
            <div className="h-full border-r bg-background flex flex-col items-center py-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFileExplorerCollapsed(false)}
              >
                <Folder className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <div className="h-full border-r bg-background relative ">
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 z-10"
                onClick={() => setIsFileExplorerCollapsed(true)}
              >
                <Folder className="h-5 w-5" />
              </Button>
              <FileExplorer
                vaultPath={vaultConfig?.path ?? ''}
                onSelectVault={async () => {
                  try {
                    const result = await window.api.selectVaultDirectory();
                    if (result.success && result.path) {
                      await window.api.saveVaultConfig({
                        path: result.path,
                      });
                      setVaultConfig(result);
                    }
                  } catch (error) {
                    console.error('Failed to select vault:', error);
                  }
                }}
                onCreateVault={() => {}}
              />
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </ThemeProvider>
  );
}
