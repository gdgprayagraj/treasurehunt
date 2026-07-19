import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export type SessionUser = {
  id: string;
  email: string;
  role: "ADMIN" | "SUB_ORGANIZER";
  collegeId: string | null;
  mustChangePassword: boolean;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return {
    id: session.user.id,
    email: session.user.email ?? "",
    role: session.user.role,
    collegeId: session.user.collegeId,
    mustChangePassword: session.user.mustChangePassword,
  };
}

/** Require any authenticated user; redirect to /login otherwise. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.mustChangePassword) redirect("/change-password");
  return user;
}

/** Require an ADMIN; redirect appropriately otherwise. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/dashboard");
  return user;
}

/** Require a SUB_ORGANIZER bound to a college; redirect appropriately otherwise. */
export async function requireSubOrganizer(): Promise<SessionUser & { collegeId: string }> {
  const user = await requireUser();
  if (user.role !== "SUB_ORGANIZER" || !user.collegeId) redirect("/admin");
  return { ...user, collegeId: user.collegeId };
}
