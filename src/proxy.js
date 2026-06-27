import { NextResponse } from 'next/server';

export async function proxy(req) {
    const res = NextResponse.next();
    const pathname = req.nextUrl.pathname;

    const isPanitiaRoute = pathname.startsWith('/panitia');
    const isLoginRoute = pathname === '/panitia/login';

    const supabaseAuthCookie = req.cookies.get('sb-access-token') || req.cookies.getAll().find(c => c.name.includes('supabase'));

    if (isPanitiaRoute && !isLoginRoute && !supabaseAuthCookie) {
        return NextResponse.redirect(new URL('/panitia/login', req.url));
    }

    if (isLoginRoute && supabaseAuthCookie) {
        return NextResponse.redirect(new URL('/panitia/dashboard/trafik', req.url));
    }

    return res;
}

export const config = {
    matcher: ['/panitia/:path*'],
};
