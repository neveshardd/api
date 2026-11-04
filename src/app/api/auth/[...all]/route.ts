import { getAppContext } from "@/lib/context/appContext";

/** Endpoints oficiais do Better Auth (login, logout, sessão), com rate limit no D1. */
async function handle(request: Request): Promise<Response> {
  return getAppContext().auth.handler(request);
}

export const GET = handle;
export const POST = handle;
