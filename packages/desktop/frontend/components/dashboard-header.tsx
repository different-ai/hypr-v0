import { motion } from 'framer-motion'
import { Activity, Bell, Zap, Layers, Settings, User, BarChart, Beaker } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { SettingsModal } from '@/components/settings-modal'
import { useState } from 'react'
import { useDashboardStore } from '@/stores/dashboard-store'
import { Switch } from '@/components/ui/switch'

const menuItems = [
  { id: 'invoices', icon: Activity, label: 'Invoices' },
  { id: 'settings', icon: Settings, label: 'Settings' },
]

export function DashboardHeader({ activePanel, setActivePanel }) {
  const [showSettings, setShowSettings] = useState(false)
  const { isDemoMode, setDemoMode } = useDashboardStore()
  
  const handleDemoToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("0xHypr", "Toggling demo mode from", isDemoMode, "to", !isDemoMode);
    setDemoMode(!isDemoMode);
  };
  
  return (
    <header className="border-b border-border bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <span className="text-2xl font-bold text-primary">
            hyprsqrl
          </span>
          <nav className="hidden md:flex space-x-1">
            {menuItems.map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                className={`relative nav-item ${activePanel === item.id ? 'text-primary' : 'text-foreground'}`}
                onClick={() => setActivePanel(item.id)}
              >
                <item.icon className={`h-5 w-5 mr-2 ${activePanel === item.id ? 'text-primary' : ''}`} />
                {item.label}
                {activePanel === item.id && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                    layoutId="activePanel"
                  />
                )}
              </Button>
            ))}
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/avatars/01.png" alt="@username" />
                  <AvatarFallback>UN</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuItem 
                className="flex items-center justify-between"
                onClick={handleDemoToggle}
              >
                <div className="flex items-center">
                  <Beaker className="mr-2 h-4 w-4" />
                  <span>Demo Mode</span>
                </div>
                <Switch
                  checked={isDemoMode}
                  onCheckedChange={(checked) => {
                    console.log("0xHypr", "Switch toggled to", checked);
                    setDemoMode(checked);
                  }}
                />
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowSettings(true)}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <SettingsModal
          open={showSettings}
          onOpenChange={setShowSettings}
        />
      </div>
    </header>
  )
}

