import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { token } = req.nextauth;
    const { pathname } = req.nextUrl;

    // Force a password change before allowing access to any protected surface.
    if (token?.mustChangePassword && pathname !== "/change-password") {
      const url = req.nextUrl.clone();
      url.pathname = "/change-password";
      return NextResponse.redirect(url);
    }

    // Coarse role routing (server components do the authoritative check).
    if (pathname.startsWith("/admin") && token?.role !== "ADMIN") {
      const url = req.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
    if (
      pathname.startsWith("/dashboard") &&
      token?.role !== "SUB_ORGANIZER"
    ) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Any valid token is authorized here; page-level guards refine further.
      authorized: ({ token }) => Boolean(token),
    },
    pages: { signIn: "/login" },
  },
);

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/change-password"],
};
