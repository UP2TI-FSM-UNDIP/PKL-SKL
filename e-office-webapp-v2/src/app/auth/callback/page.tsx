'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { message } from 'antd';

function SSOCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams ? searchParams.get('token') : null;
    const [status, setStatus] = useState('Mengonfirmasi identitas SSO...');

    useEffect(() => {
        if (!token) {
            setStatus('Token SSO tidak ditemukan. Mengalihkan ke halaman login...');
            setTimeout(() => router.push('/auth/login'), 2000);
            return;
        }

        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

        fetch(`${API_URL}/api/auth/sso/set-session?token=${token}`, {
            method: 'GET',
            credentials: 'include',
        })
            .then(async (res) => {
                if (res.ok) {
                    setStatus('Autentikasi berhasil! Mengalihkan...');
                    // Simply pushing to root will trigger `useAuth` to resolve roles and handle routing correctly.
                    window.location.href = '/persuratan-skl/';
                } else {
                    setStatus('Gagal memvalidasi sesi SSO. Silakan coba lagi.');
                    message.error('Gagal validasi SSO');
                    setTimeout(() => router.push('/auth/login'), 2000);
                }
            })
            .catch((err) => {
                console.error('SSO Error:', err);
                setStatus('Terjadi kesalahan jaringan.');
                message.error('Kesalahan jaringan');
                setTimeout(() => router.push('/auth/login'), 2000);
            });
    }, [token, router]);

    return (
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-sm w-full mx-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-700 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-800">{status}</h2>
        </div>
    );
}

export default function SSOCallbackPage() {
    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <Suspense fallback={
                <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-sm w-full mx-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-700 mx-auto mb-4"></div>
                    <h2 className="text-xl font-semibold text-gray-800">Memuat...</h2>
                </div>
            }>
                <SSOCallbackContent />
            </Suspense>
        </div>
    );
}
