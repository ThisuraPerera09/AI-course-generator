import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

export async function getCurrentUser() {
  const session = await auth();
  return session?.user || null;
}

export async function createUser(
  email: string,
  password: string,
  name?: string
) {
  const hashedPassword = await bcrypt.hash(password, 10);
  const userId = randomBytes(16).toString("hex");

  const [newUser] = await db
    .insert(users)
    .values({
      id: userId,
      email,
      name: name || email.split("@")[0],
      password: hashedPassword,
      emailVerified: false,
    })
    .returning();

  return newUser;
}

export async function getUserByEmail(email: string) {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1)
    .then((results) => results[0] || null);

  return user;
}
