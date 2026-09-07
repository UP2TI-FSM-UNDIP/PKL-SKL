'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/authService';
import { message } from 'antd';
import { UserOutlined } from '@ant-design/icons';

interface AppHeaderProps {
  showNavigation?: boolean;
  greetingOnly?: boolean; // Only show greeting + name, no buttons
}

export default function AppHeader({ showNavigation = true, greetingOnly = false }: AppHeaderProps) {
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { user } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await authService.logout();
      message.success('Logout berhasil');
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
      message.error('Gagal logout, silakan coba lagi');
    } finally {
      setIsLoggingOut(false);
      setShowDropdown(false);
    }
  };

  // Format role name untuk ditampilkan
  const getRoleName = (role: string) => {
    const roleNames: Record<string, string> = {
      'mahasiswa': 'Mahasiswa',
      'admin_prodi': 'Admin Prodi',
      'ketua_prodi': 'Ketua Prodi',
      'admin_fakultas': 'Admin Fakultas',
      'supervisor': 'Supervisor'
    };
    return roleNames[role] || role;
  };

  return (
    <header className="text-white px-6 py-4 flex items-center justify-between fixed top-0 left-0 right-0 shadow-sm" style={{ zIndex: 1000, height: '64px', background: 'linear-gradient(135deg, #0079BD 0%, #005A8D 100%)' }}>
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-xl p-1.5 backdrop-blur-sm border border-white/10 hover:bg-white/20 transition-all cursor-pointer">
          <img src="/persuratan-skl/logoundipwhite.png" alt="Logo UNDIP" className="w-full h-full object-contain" />
        </div>
        <div className="hidden sm:block">
          <div className="text-[10px] uppercase tracking-wider font-medium opacity-80 leading-tight">Fakultas</div>
          <div className="font-bold text-sm tracking-wide">SAINS DAN MATEMATIKA</div>
          <div className="text-[10px] uppercase font-medium opacity-80 leading-tight">UNIVERSITAS DIPONEGORO</div>
        </div>
      </div>

      {greetingOnly ? (
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs opacity-80">Hi,</div>
            <div className="text-sm font-bold tracking-tight">{user?.nama || user?.name || 'User'}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
            <svg className="w-6 h-6 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>
      ) : showNavigation && (
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 transition-all flex items-center gap-2"
            title="Back to Role Selection"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Kembali
          </button>
          <button className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 transition-all relative">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-400 rounded-full border border-[var(--primary)]"></span>
          </button>
          <div className="h-8 w-[1px] bg-white/20 mx-1"></div>
          <div className="relative" ref={dropdownRef}>
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setShowDropdown(!showDropdown)}>
              <div className="text-right hidden md:block">
                <div className="text-sm font-bold tracking-tight">{user?.nama || user?.name || 'User'}</div>
                <div className="text-[10px] font-medium uppercase tracking-widest opacity-80">{user?.role ? getRoleName(user.role) : ''}</div>
              </div>
              <button className="w-10 h-10 rounded-xl bg-white/10 group-hover:bg-white/20 border border-white/10 flex items-center justify-center transition-all overflow-hidden ring-2 ring-transparent group-hover:ring-white/20">
                <svg className="w-6 h-6 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
            </div>

            {showDropdown && (
              <div className="absolute right-0 mt-3 w-56 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl py-2 z-50 border border-white/20 animate-in-fade">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    <UserOutlined className="text-lg text-gray-500" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-800 line-clamp-1">{user?.nama}</div>
                    <div className="text-[10px] font-medium text-gray-400 uppercase tracking-tighter">{user?.role}</div>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                >
                  <div className="p-1.5 rounded-lg bg-red-50 text-red-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </div>
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
