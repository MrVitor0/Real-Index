import { auth } from "@/lib/auth/server";
import { NextResponse, type NextRequest } from "next/server";

const authMiddleware = auth
  ? auth.middleware({ loginUrl: "/auth/sign-in" })
  : () => NextResponse.next();

function isPublicRoute(pathname: string) {
  return (
    pathname === "/" ||
    pathname.startsWith("/radar/") ||
    pathname.startsWith("/marketplace")
  );
}

export default function middleware(request: NextRequest) {
  if (isPublicRoute(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  return authMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|brand/).*)"],
};
