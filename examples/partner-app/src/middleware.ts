export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/chat/:path*",
    "/api/chat/:path*",
    "/api/chats/:path*",
    "/api/connect/:path*",
    "/api/disconnect/:path*",
    "/api/integrations/:path*",
    "/api/me/:path*",
  ],
};
