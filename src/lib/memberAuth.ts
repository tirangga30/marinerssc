import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const MEMBER_JWT_SECRET = new TextEncoder().encode(
  process.env.MEMBER_JWT_SECRET || 'mariners-community-secret-key-2026-gold-member'
);

export async function signMemberToken(payload: {
  memberId: string;
  memberCode: string;
  fullName: string;
  tier: string;
}) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // Member session stays active for 7 days
    .sign(MEMBER_JWT_SECRET);
}

export async function verifyMemberToken(token: string) {
  try {
    const verified = await jwtVerify(token, MEMBER_JWT_SECRET);
    return verified.payload as {
      memberId: string;
      memberCode: string;
      fullName: string;
      tier: string;
    };
  } catch {
    return null;
  }
}

export async function getMemberSession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('member_auth_token')?.value;
    if (!token) return null;
    return await verifyMemberToken(token);
  } catch {
    return null;
  }
}
