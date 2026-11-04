/** Agregador do schema Drizzle: cada feature define suas tabelas e as registra aqui. */
export {
  account,
  rateLimit,
  session,
  user,
  verification,
} from "@/features/auth/infrastructure/schema";
export { deviceVerifications, trustedDevices } from "@/features/devices/infrastructure/schema";
export { documents } from "@/features/documents/infrastructure/schema";
export { siteContent } from "@/features/site-content/infrastructure/schema";
export { invitations } from "@/features/users/infrastructure/schema";
export { videos } from "@/features/videos/infrastructure/schema";
