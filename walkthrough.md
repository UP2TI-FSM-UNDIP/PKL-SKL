# SSO Integration Walkthrough: `persuratan-sk-st`

This document summarizes the successful integration of the **E-Office Persuratan SK/ST** application into the FSM UNDIP SSO ecosystem.

## Accomplishments

### 1. Database Registration
- Registered the new application in the `sso_fsm` database.
- **Client ID generated**: `128ad80f-e6d6-442b-b4ab-a26e8d6dc7eb`
- Configured mandatory Role-Based Access Control (RBAC) mapping for:
    - `mahasiswa`
    - `dosen`
    - `staff`

### 2. Frontend Dashboard Update
- Added the application card to the SSO portal's application list in [src/constants/apps.ts](file:///var/www/html/folder_backup_sso/fsm_undip_sso/fsm_undip_sso/sso_engine_ui/src/constants/apps.ts).
- Rebuilt the frontend production assets and deployed them to the live server.
- The application now appears in the "Aplikasi Persuratan" category on the dashboard.

### 3. Apache Reverse Proxy Configuration
- Implemented routing for Frontend (Port 20091) and Backend API (Port 20092) in [/etc/apache2/sites-available/000-default.conf](file:///etc/apache2/sites-available/000-default.conf).
- **Path-Stripping Fix**: Resolved a 404 error by ensuring Apache preserves the `/persuratan-sk-st/` prefix required by the Next.js `basePath` configuration.

## Verification Results

### Apache Configuration
- `sudo apachectl configtest`: **Syntax OK**
- Proxy rules verified:
```apache
<Location "/persuratan-sk-st/">
    ProxyPass http://10.137.58.124:20091/persuratan-sk-st/ nocanon
    ProxyPassReverse http://10.137.58.124:20091/persuratan-sk-st/
</Location>
```

### Application Dashboard
- Application correctly displays as "E-Office Persuratan SK/ST" with "Sistem Persuratan SK & ST FSM UNDIP" description.
- Links are correctly wired to the SSO launch sequence with the new Client ID.

### 4. Integration: `Lapor FSM!`
- **Database Registration**: Registered in `sso_fsm` with Client ID `0ce39e14-728f-4f10-ae88-3179e4805ad8`.
- **Role Mapping**: Enabled for `mahasiswa`, `dosen`, and `staff`.
- **Apache Proxy**: Exposed `http://10.137.58.124:20072/` as `/lapor-fsm-api/`.
- **Logo Creation**: Generated and deployed a premium 3D aesthetic logo (`lapor-fsm-logo.png`).
- **Dashboard**: Added a new card to the "Aplikasi Lain" category.

### 4. Integration: `Lapor FSM!`
- **Database Registration**: Registered in `sso_fsm` with Client ID `0ce39e14-728f-4f10-ae88-3179e4805ad8`.
- **Role Mapping**: Enabled for `mahasiswa`, `dosen`, and `staff`.
- **Apache Proxy**: Exposed `http://10.137.58.124:20072/` as `/lapor-fsm-api/`.
- **Logo Creation**: Generated and deployed a premium 3D aesthetic logo (`lapor-fsm-logo.png`).
- **Dashboard**: Added a new card to the "Aplikasi Lain" category.

### 5. Integration: `peminjaman-ruang`
- **Database Registration**: Registered in `sso_fsm` with Client ID `ba084ea4-bf89-4fc1-b734-19ff5f6d9e7a`.
- **Role Mapping**: Enabled for `mahasiswa`, `dosen`, and `staff`.
- **Apache Proxy**: 
    - Subpath: `/peminjaman-ruang/`
    - Frontend: `http://10.137.58.124:20081/peminjaman-ruang/` (preserved basePath).
    - Backend: `http://10.137.58.124:20082/`.
- **Logo Creation**: Generated and deployed a premium Emerald Green 3D icon (`peminjaman-ruang.png`).
- **Dashboard**: Integrated into the "Persuratan" category.

### 6. Integration: `Persuratan-keterangan-mahasiswa`
- **Database Registration**: Registered in `sso_fsm` with Client ID `7beae702-9c0c-42b3-922d-ba406429641b`.
- **Role Mapping**: Enabled for `mahasiswa`, `dosen`, and `staff`.
- **Apache Proxy**: 
    - Subpath: `/persuratan-keterangan-mhs/`
    - Frontend: `http://10.137.58.124:20031/persuratan-keterangan-mhs/` (preserved basePath).
    - Backend: `http://10.137.58.124:20032/`.
- **Logo Creation**: Generated and deployed a premium Azure Blue 3D icon (`persuratan-keterangan-mhs.png`).
- **Dashboard**: Added as a new application in the "Persuratan" category.

### 7. Integration: `persuratan-skl`
- **Database Registration**: Registered in `sso_fsm` with Client ID `b2ce9f5d-a22c-4050-8393-3ab2e1a51127`.
- **Role Mapping**: Enabled for `mahasiswa`, `dosen`, and `staff`.
- **Apache Proxy**: 
    - Subpath: `/persuratan-skl/`
    - Frontend: `http://10.137.58.124:20051/persuratan-skl/` (preserved basePath).
    - Backend: `http://10.137.58.124:20052/`.
- **Logo Creation**: Generated and deployed a premium Azure Blue/Gold 3D graduation icon (`persuratan_skl_logo_1774289394201.png` moved to `persuratan-skl.png`).
- **Dashboard**: Added as a new application replacing the SKL placeholder.

## Conclusion
The SSO portal has been successfully expanded to include **E-Office Persuratan SK/ST**, **Lapor FSM!**, **Peminjaman Ruang**, **Persuratan-keterangan-mahasiswa**, and **persuratan-skl**. All applications are fully functional and integrated with central identity management.
