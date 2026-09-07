'use client';

import { useAuth } from '@/hooks/useAuth';
import { Badge, Popover, List, Modal, Typography, Space } from 'antd';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { mahasiswaService } from '@/services/mahasiswaService';
import Link from 'next/link';
import { BellOutlined, UserOutlined, ClockCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

export default function AppHeader() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [hasNew, setHasNew] = useState(false);

  useEffect(() => {
    if (user?.roleNames?.includes('mahasiswa') || user?.role === 'mahasiswa') {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const data = await mahasiswaService.getDashboard();
      if (data && data.allPengajuan) {
        // Collect all riwayat entries
        const allRiwayat = data.allPengajuan.flatMap((p: any) =>
          (p.riwayat || []).map((r: any) => ({
            ...r,
            pengajuanId: p.id,
            nomorSurat: p.nomorSurat || p.nomorSuratPengantar
          }))
        );

        // Sort by timestamp desc
        const sorted = allRiwayat.sort((a: any, b: any) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        setNotifications(sorted.slice(0, 5));

        // Dot if latest is less than 24h old
        if (sorted.length > 0) {
          const latest = new Date(sorted[0].timestamp).getTime();
          const now = new Date().getTime();
          if (now - latest < 24 * 60 * 60 * 1000) {
            setHasNew(true);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const notificationContent = (
    <div style={{ width: 300 }}>
      <div style={{ padding: '8px 16px', borderBottom: '1px solid #f0f0f0', fontWeight: 'bold' }}>
        Aktivitas Terbaru
      </div>
      <List
        dataSource={notifications}
        renderItem={(item) => (
          <List.Item
            key={item.id}
            style={{ padding: '12px 16px', cursor: 'pointer' }}
            onClick={() => {
              setHasNew(false);
              router.push(`/mahasiswa/detail?id=${item.pengajuanId}`);
            }}
            className="hover:bg-gray-50"
          >
            <List.Item.Meta
              title={
                <Space direction="vertical" size={0}>
                  <Text strong style={{ fontSize: 13 }}>{item.actor?.name || 'Sistem'}</Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {new Date(item.timestamp).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                    })}
                  </Text>
                </Space>
              }
              description={
                <Text style={{ fontSize: 12 }}>{item.catatan || 'Status diperbarui'}</Text>
              }
            />
          </List.Item>
        )}
        locale={{ emptyText: 'Tidak ada aktivitas baru' }}
      />
      <div style={{ padding: '8px', textAlign: 'center', borderTop: '1px solid #f0f0f0' }}>
        <Link href="/mahasiswa/riwayat" style={{ fontSize: 12 }} onClick={() => setHasNew(false)}>
          Lihat Semua Riwayat
        </Link>
      </div>
    </div>
  );

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
    <header className="text-white px-6 py-4 flex items-center justify-between" style={{ background: '#0079BD' }}>
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 flex items-center justify-center">
          <img src="/persuratan-skl/logoundipwhite.png" alt="Logo UNDIP" className="w-full h-full object-contain" />
        </div>
        <div>
          <div className="text-xs opacity-75">Fakultas</div>
          <div className="font-semibold text-sm">SAINS DAN MATEMATIKA</div>
          <div className="text-xs opacity-75">UNIVERSITAS DIPONEGORO</div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Popover
          content={notificationContent}
          trigger="click"
          placement="bottomRight"
          onOpenChange={(open) => {
            if (open) {
              setHasNew(false);
              fetchNotifications();
            }
          }}
        >
          <button
            className="p-2 rounded transition-colors relative"
            style={{ background: 'rgba(255,255,255,0.1)' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          >
            <Badge dot={hasNew} offset={[-2, 2]} color="red">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </Badge>
          </button>
        </Popover>
        <div className="flex items-center gap-3">
          <div className="text-sm">
            <span className="opacity-75">Hi, </span>
            <span className="font-semibold">{user?.nama || user?.name}</span>
          </div>
          <button
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ background: 'rgba(255,255,255,0.2)' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            onClick={() => router.push('/mahasiswa/profile')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}
