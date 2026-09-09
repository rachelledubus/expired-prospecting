import { NextResponse } from "next/server";

const SESSION_COOKIE = "portal_session";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/login", request.url));
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
