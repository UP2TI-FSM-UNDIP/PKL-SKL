import { Elysia } from 'elysia';
import { Prisma } from '@backend/db/index.ts';
import { createHmac, randomBytes } from 'crypto';

export default new Elysia()

  // ─── STEP 1: Dipanggil SSO portal server-side ────────────────────────────
  .get('/', async ({ headers, set, request }) => {
    const authHeader = headers['authorization'];
    if (!authHeader) {
      set.status = 401;
      return { status: false, message: 'No token provided' };
    }

    const ssoToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    const ssoHost = process.env.SSO_HOST || 'https://apps-fsm.undip.ac.id/sso_api';

    // Validasi token ke SSO
    let userData: any;
    try {
      const res = await fetch(`${ssoHost}/users/validate`, {
        headers: { Authorization: ssoToken },
      });
      if (!res.ok) {
        set.status = 401;
        return { status: false, message: 'Invalid SSO Token' };
      }
      const json = await res.json() as any;
      userData = json?.data?.user ?? json?.data ?? json;
    } catch {
      set.status = 401;
      return { status: false, message: 'Failed to reach SSO Engine' };
    }

    const email = userData?.username ?? userData?.email;
    if (!email) {
      set.status = 401;
      return { status: false, message: 'Invalid SSO token payload' };
    }

    // Upsert user ke DB lokal
    let localUser = await Prisma.user.findUnique({ where: { email } });
    if (!localUser) {
      localUser = await Prisma.user.create({
        data: {
          email,
          name: userData.name ?? email,
          emailVerified: true,
          isAnonymous: false,
        },
      });
    }

    // Simpan session ke DB (bukan in-memory)
    const rawToken = randomBytes(32).toString('hex');
    await Prisma.session.create({
      data: {
        id: randomBytes(16).toString('hex'),
        token: rawToken,
        userId: localUser.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ipAddress: request.headers.get('x-forwarded-for') ?? null,
        userAgent: request.headers.get('user-agent') ?? null,
      },
    });

    // SSO akan concat: application_url_callback + callback_url
    // = .../auth/sso + ?token=... = .../auth/sso?token=...
    // Tapi registered callback di SSO adalah .../auth/callback
    // jadi cukup ?token=...
    return { status: true, callback_url: `?token=${rawToken}` };
  })

  // ─── STEP 2: Frontend callback page panggil ini ──────────────────────────
  .get('/set-session', async ({ query, set }) => {
    const token = query.token as string;
    if (!token) {
      set.status = 400;
      return { status: false, message: 'Token missing' };
    }

    // Cari session di DB
    const session = await Prisma.session.findFirst({
      where: { token, expiresAt: { gt: new Date() } },
    });

    if (!session) {
      set.status = 401;
      return { status: false, message: 'Invalid or expired token' };
    }

    // HMAC-sign token agar dikenali better-auth get-session
    const secret = process.env.BETTER_AUTH_SECRET!;
    const sig = createHmac('sha256', secret).update(token).digest('base64');
    const signedToken = encodeURIComponent(`${token}.${sig}`);
    const maxAge = Math.floor((session.expiresAt.getTime() - Date.now()) / 1000);

    set.headers['Set-Cookie'] =
      `__Secure-persuratan-skl.session_token=${signedToken}; HttpOnly; SameSite=Lax; Path=/; Domain=apps-fsm.undip.ac.id; Secure; Max-Age=${maxAge}`;

    return { status: true, message: 'Session created successfully' };
  });
