/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import React from 'react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useThemeStore } from '@/lib/themeToggle';
import { useSession, signOut } from 'next-auth/react';
import { User, Mail, Moon, Sun, Info, LogOut, Shield } from 'lucide-react';

const SettingItem = ({ icon: Icon, title, description, children }: any) => (
  <div className="flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors">
    <div className="flex items-start gap-4 flex-1">
      <div className="p-2 rounded-lg bg-primary/10 text-primary">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <h4 className="font-medium mb-1">{title}</h4>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
    <div className="flex items-center">
      {children}
    </div>
  </div>
);

const SectionHeader = ({ title, description }: { title: string, description?: string }) => (
  <div className="mb-4">
    <h3 className="text-lg font-semibold mb-1">{title}</h3>
    {description && (
      <p className="text-sm text-muted-foreground">{description}</p>
    )}
  </div>
);
export default function Page() {
  const { data: session } = useSession();
  const { theme, setTheme } = useThemeStore();
  const isDarkMode = theme === 'dark';

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Pengaturan</h1>
        <p className="text-muted-foreground">Kelola preferensi dan informasi akun Anda</p>
      </div>

      {/* Account Section */}
      <Card className="overflow-hidden">
        <div className="p-6 border-b">
          <SectionHeader
            title="Akun" 
            description="Informasi profil dan keamanan akun Anda"
          />
        </div>
        
        <div className="divide-y">
          <SettingItem
            icon={User}
            title="Nama Pengguna"
            description={session?.user?.name || 'Tidak tersedia'}
          />
          
          <SettingItem
            icon={Mail}
            title="Email"
            description={session?.user?.email?.replace(/(?<=^.{3}).*(?=@)/, '***') || 'Tidak tersedia'}
          />
          
          <SettingItem
            icon={Shield}
            title="Keamanan"
            description="Password terenkripsi dengan aman"
          />
        </div>
      </Card>

      {/* Appearance Section */}
      <Card className="overflow-hidden">
        <div className="p-6 border-b">
          <SectionHeader 
            title="Tampilan" 
            description="Sesuaikan tampilan aplikasi sesuai preferensi Anda"
          />
        </div>
        
        <div className="divide-y">
          <SettingItem
            icon={isDarkMode ? Moon : Sun}
            title="Mode Gelap"
            description="Aktifkan tema gelap untuk kenyamanan mata"
          >
            <Switch
              className='cursor-pointer'
              checked={isDarkMode}
              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            />
          </SettingItem>
        </div>
      </Card>

      {/* About Section */}
      <Card className="overflow-hidden">
        <div className="p-6 border-b">
          <SectionHeader title="Tentang Aplikasi" />
        </div>
        
        <div className="divide-y">
          <SettingItem
            icon={Info}
            title="AI Portfolio Tracker"
            description="Versi 1.0.0"
          />
          
          <div className="p-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Aplikasi tracking portfolio dengan teknologi AI untuk memberikan insight analisis investasi mendalam. 
              Fitur unggulan: Dashboard analytics real-time, AI assistant, dan drag & drop interface yang intuitif.
            </p>
          </div>
        </div>
      </Card>

      {/* Logout Button */}
      <Card className="p-6">
        <Button 
          variant="destructive"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full cursor-pointer"
          size="lg"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Keluar dari Akun
        </Button>
      </Card>

      {/* Footer Info */}
      <div className="text-center text-sm text-muted-foreground py-4">
        <p>© 2024 AI Portfolio Tracker. All rights reserved.</p>
      </div>
    </div>
  );
}