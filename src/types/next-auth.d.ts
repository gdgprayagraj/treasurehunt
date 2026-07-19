import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: "ADMIN" | "SUB_ORGANIZER";
    collegeId: string | null;
    mustChangePassword: boolean;
  }

  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "SUB_ORGANIZER";
      collegeId: string | null;
      mustChangePassword: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid: string;
    role: "ADMIN" | "SUB_ORGANIZER";
    collegeId: string | null;
    mustChangePassword: boolean;
  }
}
