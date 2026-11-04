"use client";

import { createAuthClient } from "better-auth/react";

/** Cliente oficial do Better Auth (mesma origem: /api/auth). Usado no login e no logout. */
export const authClient = createAuthClient();
