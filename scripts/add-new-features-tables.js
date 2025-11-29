const Database = require("better-sqlite3");
const path = require("path");

const dbPath = process.env.DATABASE_URL || path.join(__dirname, "..", "sqlite.db");
const db = new Database(dbPath);

console.log("Adding new features tables...");

try {
  // Add isPublic and shareToken to courses table
  try {
    db.exec(`ALTER TABLE "courses" ADD COLUMN "is_public" INTEGER DEFAULT 0;`);
    console.log("Added is_public column to courses table");
  } catch (err) {
    if (err.message.includes("duplicate column name")) {
      console.log("is_public column already exists in courses table");
    } else {
      throw err;
    }
  }

  try {
    db.exec(`ALTER TABLE "courses" ADD COLUMN "share_token" TEXT;`);
    console.log("Added share_token column to courses table");
    // Create unique index separately
    try {
      db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS "idx_courses_share_token" ON "courses"("share_token") WHERE "share_token" IS NOT NULL;`);
    } catch (idxErr) {
      console.log("Index may already exist, continuing...");
    }
  } catch (err) {
    if (err.message.includes("duplicate column name")) {
      console.log("share_token column already exists in courses table");
    } else {
      throw err;
    }
  }

  // Create notes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS "notes" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "user_id" TEXT NOT NULL,
      "lesson_id" INTEGER NOT NULL,
      "content" TEXT NOT NULL,
      "created_at" INTEGER NOT NULL,
      "updated_at" INTEGER NOT NULL,
      FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE,
      FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE
    );
  `);

  // Create bookmarks table
  db.exec(`
    CREATE TABLE IF NOT EXISTS "bookmarks" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "user_id" TEXT NOT NULL,
      "lesson_id" INTEGER NOT NULL,
      "title" TEXT,
      "note" TEXT,
      "created_at" INTEGER NOT NULL,
      FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE,
      FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE
    );
  `);

  // Create favorites table
  db.exec(`
    CREATE TABLE IF NOT EXISTS "favorites" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "user_id" TEXT NOT NULL,
      "course_id" INTEGER NOT NULL,
      "created_at" INTEGER NOT NULL,
      FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE,
      FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE,
      UNIQUE("user_id", "course_id")
    );
  `);

  // Create learning_sessions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS "learning_sessions" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "user_id" TEXT NOT NULL,
      "course_id" INTEGER,
      "lesson_id" INTEGER,
      "start_time" INTEGER NOT NULL,
      "end_time" INTEGER,
      "duration" INTEGER,
      FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE,
      FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE,
      FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE
    );
  `);

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS "idx_notes_user_id" ON "notes"("user_id");
    CREATE INDEX IF NOT EXISTS "idx_notes_lesson_id" ON "notes"("lesson_id");
    CREATE INDEX IF NOT EXISTS "idx_bookmarks_user_id" ON "bookmarks"("user_id");
    CREATE INDEX IF NOT EXISTS "idx_bookmarks_lesson_id" ON "bookmarks"("lesson_id");
    CREATE INDEX IF NOT EXISTS "idx_favorites_user_id" ON "favorites"("user_id");
    CREATE INDEX IF NOT EXISTS "idx_favorites_course_id" ON "favorites"("course_id");
    CREATE INDEX IF NOT EXISTS "idx_learning_sessions_user_id" ON "learning_sessions"("user_id");
  `);

  console.log("✅ New features tables created successfully!");
} catch (error) {
  console.error("Error creating tables:", error);
  process.exit(1);
} finally {
  db.close();
}

