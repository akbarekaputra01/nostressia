const unauthorized = () => {
  return new Response("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Secure Area"',
    },
  });
};

export default function middleware(request: Request) {
  const enabledRaw = process.env.BASIC_AUTH_ENABLED ?? "true";
  const enabled = enabledRaw.toLowerCase() !== "false";

  if (!enabled) {
    return;
  }

  const username = process.env.BASIC_AUTH_USER ?? "";
  const password = process.env.BASIC_AUTH_PASS ?? "";

  if (!username || !password) {
    return;
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Basic ")) {
    return unauthorized();
  }

  const encoded = authHeader.slice(6);
  let decoded = "";
  try {
    decoded = atob(encoded);
  } catch {
    return unauthorized();
  }

  const [incomingUser, incomingPass] = decoded.split(":");
  if (incomingUser !== username || incomingPass !== password) {
    return unauthorized();
  }
}

export const config = {
  matcher: "/:path*",
};
