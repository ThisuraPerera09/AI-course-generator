const Database = require("better-sqlite3");
const path = require("path");

const dbPath = process.env.DATABASE_URL || path.join(__dirname, "..", "sqlite.db");
const db = new Database(dbPath);

console.log("Adding authentication tables...");

try {
  // Create users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS "user" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "name" TEXT,
      "email" TEXT NOT NULL UNIQUE,
      "emailVerified" INTEGER,
      "image" TEXT,
      "password" TEXT,
      "created_at" INTEGER NOT NULL,
      "updated_at" INTEGER NOT NULL
    );
  `);

  // Create accounts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS "account" (
      "userId" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "provider" TEXT NOT NULL,
      "providerAccountId" TEXT NOT NULL,
      "refresh_token" TEXT,
      "access_token" TEXT,
      "expires_at" INTEGER,
      "token_type" TEXT,
      "scope" TEXT,
      "id_token" TEXT,
      "session_state" TEXT,
      PRIMARY KEY ("provider", "providerAccountId"),
      FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE
    );
  `);

  // Create sessions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS "session" (
      "sessionToken" TEXT PRIMARY KEY NOT NULL,
      "userId" TEXT NOT NULL,
      "expires" INTEGER NOT NULL,
      FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE
    );
  `);

  // Create verificationTokens table
  db.exec(`
    CREATE TABLE IF NOT EXISTS "verificationToken" (
      "identifier" TEXT NOT NULL,
      "token" TEXT NOT NULL,
      "expires" INTEGER NOT NULL,
      PRIMARY KEY ("identifier", "token")
    );
  `);

  // Add userId column to courses table if it doesn't exist
  try {
    db.exec(`ALTER TABLE "courses" ADD COLUMN "user_id" TEXT;`);
    console.log("Added user_id column to courses table");
  } catch (err) {
    if (err.message.includes("duplicate column name")) {
      console.log("user_id column already exists in courses table");
    } else {
      throw err;
    }
  }

  // Update existing courses to have a default user (if any exist)
  // This is a temporary measure - in production, you'd want to handle this differently
  const existingCourses = db.prepare(`SELECT COUNT(*) as count FROM courses`).get();
  if (existingCourses.count > 0) {
    console.log(`Warning: ${existingCourses.count} existing courses found. They need to be assigned to a user.`);
    console.log("You may want to create a default user and assign these courses manually.");
  }

  console.log("✅ Authentication tables created successfully!");
} catch (error) {
  console.error("Error creating authentication tables:", error);
  process.exit(1);
} finally {
  db.close();
}

