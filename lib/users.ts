import { prisma } from "@/lib/prisma";

/**
 * Resolves a client-provided id (Prisma User.id or Firebase UID) to the database User.id.
 */
export async function resolveDatabaseUserId(
  userIdOrFirebaseUid: string
): Promise<string | null> {
  if (!userIdOrFirebaseUid) return null;

  const byId = await prisma.user.findUnique({
    where: { id: userIdOrFirebaseUid },
    select: { id: true },
  });
  if (byId) return byId.id;

  const byFirebase = await prisma.user.findUnique({
    where: { firebaseUid: userIdOrFirebaseUid },
    select: { id: true },
  });
  if (byFirebase) return byFirebase.id;

  return null;
}
