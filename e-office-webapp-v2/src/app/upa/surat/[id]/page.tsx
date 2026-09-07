'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import RiwayatSurat from '@/components/RiwayatSurat';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { upaService } from '@/services/upaService';
import { useAuth } from '@/hooks/useAuth';
import Image from 'next/image';
import SidebarMenu from '@/components/layout/SidebarMenu';

// Utility function to extract clean filename from URL
const getCleanFileName = (url: string): string => {
  if (!url) return 'Dokumen';

  // Remove query parameters
  const urlWithoutQuery = url.split('?')[0];

  // Get the filename from path
  const parts = urlWithoutQuery.split('/');
  const filename = parts[parts.length - 1];

  // Decode URI component in case there are encoded characters
  try {
    return decodeURIComponent(filename);
  } catch (e) {
    return filename;
  }
};

export default function UpaReviewSurat() {
  const router = useRouter();
  const params = useParams() as { id: string };
  const { user } = useAuth();
  const [zoom, setZoom] = useState(100);
  const [pengajuan, setPengajuan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [nomorSklResmi, setNomorSklResmi] = useState('');
  const [previewModal, setPreviewModal] = useState<{ visible: boolean; url: string; title: string }>({ visible: false, url: '', title: '' });

  useEffect(() => {
    if (params?.id) {
      fetchPengajuanDetail();
    }
  }, [params?.id]);

  const fetchPengajuanDetail = async () => {
    try {
      setLoading(true);
      const pengajuanData = await upaService.getPengajuanDetail(params?.id as string);

      if (pengajuanData) {
        setPengajuan(pengajuanData);
        // Set nomor SKL resmi jika sudah ada
        if (pengajuanData.nomorSklResmi) {
          setNomorSklResmi(pengajuanData.nomorSklResmi);
        }
      }
    } catch (error) {
      console.error('Error fetching pengajuan detail:', error);
      alert('Gagal memuat data pengajuan');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalisasi = async () => {
    if (!pengajuan.nomorSuratPengantar) {
      alert('Nomor surat pratinjau dari Admin Prodi belum tersedia.');
      return;
    }

    if (!nomorSklResmi.trim()) {
      alert('Nomor SKL Resmi harus diisi');
      return;
    }

    let currentUser = user;
    if (!currentUser) {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          currentUser = JSON.parse(storedUser);
        }
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    }

    const actorId = currentUser?.id || pengajuan?.mahasiswa?.userId;

    if (!actorId) {
      alert('Error: Tidak dapat menemukan user ID yang valid');
      return;
    }

    try {
      const success = await upaService.finalisasi(
        params?.id as string,
        actorId,
        nomorSklResmi,
        `Surat SKL dengan nomor ${nomorSklResmi} telah selesai. Silakan mengambil Surat Keterangan Lulus di Akademik dengan membawa pas foto dan meminta cap basah`
      );

      if (success) {
        alert('Surat berhasil difinalisasi dengan nomor SKL: ' + nomorSklResmi);
        router.push('/upa/dashboard');
      } else {
        alert('Gagal memfinalisasi surat');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Terjadi kesalahan saat memproses surat');
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 10, 150));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 10, 50));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader greetingOnly={true} />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!pengajuan) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader greetingOnly={true} />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <p>Data pengajuan tidak ditemukan</p>
        </div>
      </div>
    );
  }

  // Extract data from pengajuan - prioritas data sementara > data master
  const mahasiswa = pengajuan.mahasiswa;
  const namaLengkap = pengajuan.namaSementara || mahasiswa?.user?.name || 'Unknown';
  const nim = mahasiswa?.nim || '-';
  const tempatLahir = pengajuan.tempatLahirSementara || mahasiswa?.tempatLahir || '-';
  const tanggalLahir = pengajuan.tanggalLahirSementara
    ? new Date(pengajuan.tanggalLahirSementara).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : (mahasiswa?.tanggalLahir
      ? new Date(mahasiswa.tanggalLahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      : '-');
  const alamat = pengajuan.alamatSementara || mahasiswa?.alamat || '-';
  const noHp = pengajuan.noHpSementara || mahasiswa?.noHp || '-';
  const programStudi = mahasiswa?.programStudi?.name || '-';

  const formatStatus = (status: string) => {
    if (status === 'COMPLETED') return 'Selesai';
    if (status === 'STEP_KONVENSIONAL') return 'Finalisasi Surat';
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  };

  return (
    <div className="h-screen bg-gray-50 overflow-hidden">
      <AppHeader greetingOnly={true} />

      <div className="flex" style={{ marginTop: '64px' }}>
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-md fixed left-0 h-[calc(100vh-64px)] overflow-y-auto" style={{ top: '64px' }}>
          <SidebarMenu role="upa" collapsed={false} />
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden h-[calc(100vh-64px)] bg-gray-50" style={{ marginLeft: '256px' }}>
          {/* Breadcrumb */}
          <div className="mb-6 text-sm text-gray-600 pt-2 px-8">
            <span className="cursor-pointer hover:text-blue-600" onClick={() => router.push('/upa/dashboard')}>Surat Masuk</span>
            <span className="mx-2">/</span>
            <span>Review Surat</span>
          </div>

          <div className="px-8 pb-8 h-[calc(100vh-140px)] overflow-y-auto">
            {/* Left Column - Details */}
            <div className="lg:col-span-1 space-y-6">
              {/* Detail Permohonan */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="font-semibold">Detail Permohonan</h3>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-600">Pengaju</label>
                    <p className="font-medium">{namaLengkap}</p>
                    <p className="text-sm text-gray-500">NIM: {nim}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Program Studi</label>
                    <p className="font-medium">{programStudi}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Perihal</label>
                    <p className="font-medium">Surat Keterangan Lulus</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Tgl Masuk</label>
                    <p className="font-medium">
                      {new Date(pengajuan.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Status</label>
                    <p className="font-medium capitalize">{formatStatus(pengajuan.status)}</p>
                  </div>
                  {pengajuan.nomorSuratPengantar && (
                    <div>
                      <label className="text-sm text-gray-600">Nomor Surat Pengantar</label>
                      <p className="font-medium">{pengajuan.nomorSuratPengantar}</p>
                      <p className="text-xs text-gray-500">Diisi oleh Admin Prodi</p>
                    </div>
                  )}
                  {pengajuan.nomorSkl && (
                    <div>
                      <label className="text-sm text-gray-600">Nomor SKL</label>
                      <p className="font-medium">{pengajuan.nomorSkl}</p>
                      <p className="text-xs text-gray-500">Diisi oleh Admin Fakultas</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tanda Tangan Mahasiswa */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    <h3 className="font-semibold">Tanda Tangan Mahasiswa</h3>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                    <div className="w-full max-w-xs border-2 border-gray-300 rounded-lg p-6 bg-white text-center">
                      {pengajuan.tandatangan ? (
                        <div className="mb-3 flex justify-center">
                          <Image
                            src={pengajuan.tandatangan}
                            alt="Tanda Tangan Mahasiswa"
                            width={120}
                            height={80}
                            className="object-contain"
                          />
                        </div>
                      ) : (
                        <div className="mb-3 flex justify-center items-center h-20 text-gray-400">
                          <p className="text-sm">Tidak ada tanda tangan</p>
                        </div>
                      )}
                      <p className="text-lg font-semibold text-gray-700">{namaLengkap}</p>
                      <p className="text-sm text-gray-500 mt-1">NIM: {nim}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tanda Tangan Ketua Prodi */}
              {pengajuan.ttdKetuaProdi && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h3 className="font-semibold">Tanda Tangan Ketua Prodi</h3>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center p-4 bg-green-50 rounded-lg">
                      <div className="w-full max-w-xs border-2 border-green-300 rounded-lg p-6 bg-white text-center">
                        <div className="mb-3 flex justify-center">
                          <Image
                            src={pengajuan.ttdKetuaProdi}
                            alt="Tanda Tangan Ketua Prodi"
                            width={120}
                            height={80}
                            className="object-contain"
                          />
                        </div>
                        <p className="text-sm text-green-600 font-medium">✓ Sudah ditandatangani Kaprodi</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Lampiran */}
              <Card>
                <CardHeader>
                  <h3 className="font-semibold">Lampiran</h3>
                </CardHeader>
                <CardContent className="space-y-2">
                  {pengajuan.lampiran && pengajuan.lampiran.length > 0 ? (
                    pengajuan.lampiran.map((lamp: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-xs truncate">{index + 1}. {lamp.jenisDokumen}</p>
                          </div>
                        </div>
                        <button
                          className="p-1 hover:bg-gray-200 rounded flex-shrink-0"
                          onClick={() => lamp.pathFile && setPreviewModal({ visible: true, url: lamp.pathFile, title: lamp.jenisDokumen || 'Lampiran' })}
                          title="Buka file"
                        >
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">Tidak ada lampiran</p>
                  )}
                </CardContent>
              </Card>

              {/* Riwayat Surat */}
              <RiwayatSurat
                pengajuanId={params.id as string}
                title="Riwayat Surat"
              />

              {/* Nomor Surat dari Admin Prodi (untuk pratinjau) */}
              <Card>
                <CardHeader>
                  <h3 className="font-semibold">Nomor Surat Pratinjau</h3>
                  <p className="text-xs text-gray-500">Nomor dari Admin Prodi (untuk pratinjau surat)</p>
                </CardHeader>
                <CardContent>
                  {pengajuan.nomorSuratPengantar ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-600 mb-1">Nomor Pratinjau</p>
                      <p className="text-lg font-bold text-blue-800">No : {pengajuan.nomorSuratPengantar}</p>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-700">Nomor pratinjau belum tersedia dari Admin Prodi.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Form Input Nomor SKL Resmi UPA */}
              <Card>
                <CardHeader>
                  <h3 className="font-semibold">Nomor SKL Resmi</h3>
                  <p className="text-xs text-gray-500">Nomor SKL final yang diberitahukan ke mahasiswa</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-600 mb-2 block">Masukkan Nomor SKL Resmi</label>
                      <input
                        type="text"
                        className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Contoh: SKL/2026/001"
                        value={nomorSklResmi}
                        onChange={(e) => setNomorSklResmi(e.target.value)}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Nomor SKL resmi yang akan diberitahukan ke mahasiswa
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  className="w-full bg-green-500 hover:bg-green-600 text-white"
                  onClick={handleFinalisasi}
                  disabled={!pengajuan.nomorSuratPengantar || !nomorSklResmi.trim()}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Finalisasi & Selesaikan
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.back()}
                >
                  Kembali
                </Button>
              </div>
            </div>

            {/* Right Column - Preview Surat */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="font-semibold">Pratinjau Surat</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleZoomOut}>
                      <span className="text-lg">−</span>
                    </Button>
                    <span className="text-sm font-medium min-w-[60px] text-center">{zoom}%</span>
                    <Button variant="outline" size="sm" onClick={handleZoomIn}>
                      <span className="text-lg">+</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Preview Surat */}
                  <div className="relative bg-white border rounded-lg p-8 shadow-sm overflow-auto max-h-[800px]" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left', width: `${10000 / zoom}%` }}>
                    <div className="max-w-3xl mx-auto relative">

                      {/* Header - Kotak AK.008 */}
                      <div className="flex justify-end mb-4">
                        <div className="border border-gray-800 px-4 py-1">
                          <span className="font-bold">AK.008</span>
                        </div>
                      </div>

                      {/* Nomor Surat - tampil jika sudah dipasang Admin Prodi */}
                      {pengajuan.nomorSuratPengantar && (
                        <div className="mb-4">
                          <span className="font-bold">No : {pengajuan.nomorSuratPengantar}</span>
                        </div>
                      )}

                      {/* Perihal */}
                      <div className="flex gap-2 mb-4">
                        <span className="font-bold">Perihal</span>
                        <span>:</span>
                        <span className="font-bold">Surat Keterangan Lulus</span>
                      </div>


                      {/* Content */}
                      <div className="space-y-4 text-sm leading-relaxed" style={{ textAlign: 'justify' }}>
                        <div className="flex gap-8">
                          <span className="w-20 flex-shrink-0">Yth.</span>
                          <span>Dekan<br />Fakultas Sains dan Matematika Universitas Diponegoro<br />Semarang.</span>
                        </div>

                        <p>Dengan ini kami mengajukan permohonan pembuatan Surat Keterangan Lulus atas nama :</p>

                        <div className="space-y-1 ml-8">
                          <div className="flex">
                            <span className="w-48 flex-shrink-0">Nama</span>
                            <span className="flex-shrink-0 mr-2">:</span>
                            <span>{namaLengkap}</span>
                          </div>
                          <div className="flex">
                            <span className="w-48 flex-shrink-0">NIM</span>
                            <span className="flex-shrink-0 mr-2">:</span>
                            <span>{nim}</span>
                          </div>
                          <div className="flex">
                            <span className="w-48 flex-shrink-0">Tempat/Tanggal Lahir</span>
                            <span className="flex-shrink-0 mr-2">:</span>
                            <span>{tempatLahir}, {tanggalLahir}</span>
                          </div>
                          <div className="flex">
                            <span className="w-48 flex-shrink-0">Alamat</span>
                            <span className="flex-shrink-0 mr-2">:</span>
                            <span>{alamat}</span>
                          </div>
                          <div className="flex">
                            <span className="w-48 flex-shrink-0">No Telepon/HP</span>
                            <span className="flex-shrink-0 mr-2">:</span>
                            <span>{noHp}</span>
                          </div>
                          <div className="flex">
                            <span className="w-48 flex-shrink-0">Program Studi</span>
                            <span className="flex-shrink-0 mr-2">:</span>
                            <span>{programStudi}</span>
                          </div>
                        </div>

                        <p>Telah dinyatakan lulus ujian Sarjana pada Departemen/Program Studi {programStudi} Fakultas Sains dan Matematika Universitas Diponegoro pada tanggal {new Date(pengajuan.tglLulus).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} dengan Indeks Prestasi Kumulatif (IPK) {pengajuan.ipkTerakhir}/4.00 dengan Jumlah Satuan Kredit Semester (SKS) 144</p>

                        <p>Demikian surat permohonan kami, atas perhatiannya kami sampaikan terimakasih.</p>

                        <div className="mt-12 flex justify-between">
                          <div className="text-center">
                            <p className="mb-2">Semarang, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                            <p className="mb-4">Ketua Program Studi</p>
                            {pengajuan.ttdKetuaProdi && (
                              <div className="inline-block mb-2">
                                <Image
                                  src={pengajuan.ttdKetuaProdi}
                                  alt="Tanda Tangan Kaprodi"
                                  width={100}
                                  height={60}
                                  className="object-contain"
                                />
                              </div>
                            )}
                            <div className="mt-2">
                              <p className="border-b border-gray-800 inline-block font-semibold">
                                Ketua Program Studi {programStudi}
                              </p>
                              <p>NIP. ........................</p>
                            </div>
                          </div>
                          <div className="text-center">
                            <p className="mb-2">Semarang, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                            <p className="mb-4">Pemohon,</p>
                            <div className="inline-block mb-2">
                              <Image
                                src="/persuratan-skl/tandatanganmahasiswa-removebg-preview.png"
                                alt="Tanda Tangan Mahasiswa"
                                width={100}
                                height={60}
                                className="object-contain"
                              />
                            </div>
                            <div className="mt-2">
                              <p className="border-b border-gray-800 inline-block font-semibold">{namaLengkap}</p>
                              <p>NIM {nim}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      {/* Preview Modal */}
      {previewModal.visible && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setPreviewModal({ visible: false, url: '', title: '' })}>
          <div className="bg-white rounded-lg p-6 max-w-5xl w-full mx-4 max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{previewModal.title}</h3>
              <button
                className="p-2 hover:bg-gray-100 rounded"
                onClick={() => setPreviewModal({ visible: false, url: '', title: '' })}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
              <iframe
                src={previewModal.url}
                className="w-full border-0"
                style={{ height: '70vh' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
