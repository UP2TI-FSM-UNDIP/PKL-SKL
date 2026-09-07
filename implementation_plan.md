# Integration Plan: persuratan-skl

Register and expose the digital "Surat Keterangan Lulus" (SKL) system through the SSO portal.

## Proposed Changes

### Database & Security

#### [BACKEND] Register Application
Inject application data into the `applications` table:
- **Name**: `persuratan-skl`
- **Callback URL**: `http://10.137.58.124:20052/auth/sso` (Updated to HTTP internal to avoid `EPROTO` error)

#### [BACKEND] Role Access Mapping
Map the generated UUID to the following roles:
- `mahasiswa` (`1169efa1-512d-4253-99ee-d49fe8721f4c`)
- `dosen` (`6e1ab334-648e-42a0-a1b9-b13eec0e330f`)
- `staff` (`b8b816da-5808-4c06-b556-347d15339099`)

---

### Infrastructure (Apache)

#### [MODIFY] [000-default.conf](file:///etc/apache2/sites-available/000-default.conf)
Add proxy rules for Frontend and Backend on both Port 80 and 443.

**Configuration for Frontend (Next.js with `basePath: '/persuratan-skl'`):**
```apache
Redirect temp "/persuratan-skl" "/persuratan-skl/"
<Location "/persuratan-skl/">
    DirectoryCheckHandler Off
    ProxyPreserveHost On
    RequestHeader set X-Forwarded-Proto "https"
    ProxyPass http://10.137.58.124:20051/persuratan-skl/ nocanon
    ProxyPassReverse http://10.137.58.124:20051/persuratan-skl/
</Location>
```

**Configuration for Backend (Elysia.js):**
```apache
<Location "/persuratan-skl-api/">
    ProxyPreserveHost Off
    DirectoryCheckHandler Off
    RequestHeader set X-Forwarded-Proto "https"
    ProxyPass http://10.137.58.124:20052/ nocanon
    ProxyPassReverse http://10.137.58.124:20052/
</Location>
```

---d

### Frontend UI

#### [MODIFY] [apps.ts](file:///var/www/html/folder_backup_sso/fsm_undip_sso/fsm_undip_sso/sso_engine_ui/src/constants/apps.ts)
Update the existing "SKL (Surat Keterangan Lulus)" placeholder entry with the new name, `clientId`, `redirectUri`, and image.

#### [NEW] Logo Asset
Generate a premium elegant 3D logo related to "Surat Keterangan Lulus" (document/diploma/graduation theme) named `persuratan-skl.png` and place it in `/var/www/html/sso/thumbnails/`.

## Verification Plan

### Automated Steps
1. **Conflict Check**: Grep `/etc/apache2/sites-available/000-default.conf` for ports `20051`/`20052` to prevent collisions.
2. **Database Check**: Verify row exists in `applications` and `application_role_access`.
3. **Apache Test**: `sudo apachectl configtest` and `systemctl reload apache2`.
4. **Frontend Build**: `npm run build` and deploy.

### Manual Verification
1. Click the "persuratan-skl" card on the SSO Dashboard.
2. Verify redirect to Home via the SSO auth pipeline.
3. Verify visual appearance of the new card and logo.
