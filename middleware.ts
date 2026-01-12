import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const unauthorized = () => {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Secure Area"',
    },
  });
};

export function middleware(request: NextRequest) {
  const enabledRaw = process.env.BASIC_AUTH_ENABLED ?? "true";
  const enabled = enabledRaw.toLowerCase() !== "false";

  if (!enabled) {
    return NextResponse.next();
  }

  const username = process.env.BASIC_AUTH_USER ?? "";
  const password = process.env.BASIC_AUTH_PASS ?? "";

  if (!username || !password) {
    return unauthorized();
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Basic ")) {
    return unauthorized();
  }

  const encoded = authHeader.slice(6);
  let decoded = "";
  try {
    decoded = new TextDecoder().decode(
      Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0))
    );
  } catch {
    return unauthorized();
  }

  const [incomingUser, incomingPass] = decoded.split(":");
  if (incomingUser !== username || incomingPass !== password) {
    return unauthorized();
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/:path*",
};
