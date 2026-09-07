'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { Terminal } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authService } from '@/services/authService';
import AppHeader from '@/components/AppHeader';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function LoginPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const returnUrl = searchParams ? searchParams.get('returnUrl') : null;

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await authService.login(email, password);

            if (response) {
                // If there's a returnUrl, go there, otherwise redirect based on role
                if (returnUrl) {
                    router.push(returnUrl);
                } else {
                    const role = response.user.roleNames?.[0];
                    const roleRoutes: Record<string, string> = {
                        'mahasiswa': '/mahasiswa',
                        'admin_prodi': '/admin-prodi/dashboard',
                        'ketua_prodi': '/ketua-prodi/dashboard',
                        'kaprodi': '/ketua-prodi/dashboard',
                        'admin_fakultas': '/admin-fakultas/dashboard',
                        'admin_surat': '/admin-fakultas/dashboard',
                        'staf_fakultas': '/staff-fakultas/dashboard',
                        'manajer_tu': '/manajer-tu/dashboard',
                        'supervisor': '/supervisor/dashboard',
                        'upa': '/upa/dashboard',
                        'super_admin': '/super-admin/dashboard',
                    };

                    if (role && roleRoutes[role.toLowerCase()]) {
                        router.push(roleRoutes[role.toLowerCase()]);
                    } else {
                        router.push('/');
                    }
                }
            } else {
                setError('Email atau password salah');
            }
        } catch (err) {
            setError('Terjadi kesalahan saat login');
            console.error('Login error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSSOLogin = () => {
        const clientId = process.env.NEXT_PUBLIC_SSO_CLIENT_ID || 'b2ce9f5d-a22c-4050-8393-3ab2e1a51127';
        window.location.href = `https://apps-fsm.undip.ac.id/sso?clientId=${clientId}`;
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <AppHeader showNavigation={false} />

            <div className="flex items-center justify-center px-4" style={{ minHeight: 'calc(100vh - 64px)' }}>
                <Card className="w-full max-w-3xl shadow-xl">
                    <div className="grid md:grid-cols-2 gap-0">
                        {/* Left Side - Branding */}
                        <div className="bg-gray-50 p-8 flex flex-col justify-center items-start text-left border-r">
                            <div className="mb-4">
                                <svg
                                    className="w-12 h-12 text-slate-700"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                                    />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-bold text-slate-800 mb-2">FSM UNDIP SSO</h1>
                            <p className="text-gray-600 text-sm leading-relaxed">
                                Welcome to FSM UNDIP Application Portal. Please sign in to access your dashboard.
                            </p>
                        </div>

                        {/* Right Side - Login Form */}
                        <div className="bg-white p-8">
                            <div className="mb-6">
                                <h2 className="text-xl font-bold text-slate-800 mb-1">Sign In</h2>
                                <p className="text-gray-600 text-sm">
                                    Enter your credentials to access your account
                                </p>
                                {/* Demo Account Info */}
                                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-xs font-semibold text-blue-800 mb-2">Akun Demo:</p>
                                    <p className="text-xs text-blue-700">Email: <code className="bg-blue-100 px-1 rounded">andi.pratama@students.ac.id</code></p>
                                    <p className="text-xs text-blue-700">Password: <code className="bg-blue-100 px-1 rounded">password123</code></p>
                                </div>
                            </div>

                            <form onSubmit={handleLogin} className="space-y-4">
                                {/* Email Input */}
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-gray-700 text-sm font-medium">Username or Email</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </span>
                                        <Input
                                            id="email"
                                            type="text"
                                            placeholder="Enter your username or email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="pl-9 h-10 border-gray-300 text-sm"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Password Input */}
                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-gray-700 text-sm font-medium">Password</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                        </span>
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Enter your password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="pl-9 pr-10 h-10 border-gray-300 text-sm"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPassword ? (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                </svg>
                                            ) : (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Forgot Password */}
                                <div className="text-right">
                                    <Link
                                        href="/auth/forgot-password"
                                        className="text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium"
                                    >
                                        Forgot Password?
                                    </Link>
                                </div>

                                {/* Error Message */}
                                {error && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                                        {error}
                                    </div>
                                )}

                                {/* Login Button */}
                                <Button
                                    type="submit"
                                    className="w-full bg-slate-700 hover:bg-slate-800 h-10 text-sm"
                                    disabled={loading}
                                >
                                    {loading ? 'Loading...' : 'Login'}
                                </Button>

                                {/* Divider */}
                                <div className="relative py-2">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-300"></div>
                                    </div>
                                    <div className="relative flex justify-center text-xs">
                                        <span className="px-3 bg-white text-gray-500">or</span>
                                    </div>
                                </div>

                                {/* SSO Login Button */}
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full h-10 text-sm border-gray-300"
                                    onClick={handleSSOLogin}
                                >
                                    Login with UNDIP SSO
                                </Button>
                            </form>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Developer Mode Floating Button */}
            <Link
                href="/dev"
                className="fixed bottom-6 right-6 p-3 bg-slate-800/10 hover:bg-slate-800 text-slate-500 hover:text-white rounded-full transition-all duration-300 group shadow-sm hover:shadow-lg backdrop-blur-sm z-50 border border-slate-200 hover:border-slate-800"
                title="Developer Mode"
            >
                <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4" />
                    <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap text-xs font-medium">
                        Developer Mode
                    </span>
                </div>
            </Link>
        </div>
    );
}
