import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function middleware(request: NextRequest) {
	const session = await auth.api.getSession({
		headers: request.headers,
	});

	if (session && !session.session.activeOrganizationId) {
		const isAuthPage = request.nextUrl.pathname.startsWith("/api/auth") ||
                           request.nextUrl.pathname.startsWith("/login") ||
                           request.nextUrl.pathname.startsWith("/register");

        const isOrgPage = request.nextUrl.pathname.startsWith("/create-organization") ||
                          request.nextUrl.pathname.startsWith("/select-organization");

		if (!isAuthPage && !isOrgPage) {
			return NextResponse.redirect(new URL("/create-organization", request.url));
		}
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
