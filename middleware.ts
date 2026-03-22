import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
	if (request.nextUrl.pathname.startsWith("/api/auth")) {
		return NextResponse.next();
	}

	const response = await fetch(new URL("/api/auth/get-session", request.url), {
		headers: {
			cookie: request.headers.get("cookie") || "",
		},
	});
	const sessionData = await response.json().catch(() => null);
	const session = sessionData?.session;

	if (session && !session.activeOrganizationId) {
		const isAuthPage = request.nextUrl.pathname.startsWith("/login") ||
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
