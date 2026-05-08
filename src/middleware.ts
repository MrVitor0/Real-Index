import { auth } from "@/lib/auth/server";
import { NextResponse } from "next/server";

const middleware = auth
  ? auth.middleware({ loginUrl: "/auth/sign-in" })
  : () => NextResponse.next();

export default middleware;

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|brand/).*)"],
};
