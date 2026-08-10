import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const response = NextResponse.redirect(new URL('/admin/login', req.url));
  response.cookies.set('auth_token', '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  });
  return response;
}
