const Database = require("better-sqlite3");
const path = require("path");

const dbPath = process.env.DATABASE_URL || path.join(__dirname, "..", "sqlite.db");
const db = new Database(dbPath);

console.log("Adding progress tracking and quiz history tables...");

try {
  // Create user_progress table
  db.exec(`
    CREATE TABLE IF NOT EXISTS "user_progress" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "user_id" TEXT NOT NULL,
      "lesson_id" INTEGER NOT NULL,
      "completed_at" INTEGER NOT NULL,
      "quiz_score" INTEGER,
      "created_at" INTEGER NOT NULL,
      "updated_at" INTEGER NOT NULL,
      FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE,
      FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE
    );
  `);

  // Create quiz_attempts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS "quiz_attempts" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "user_id" TEXT NOT NULL,
      "quiz_id" INTEGER NOT NULL,
      "score" INTEGER NOT NULL,
      "correct_count" INTEGER NOT NULL,
      "total_count" INTEGER NOT NULL,
      "answers" TEXT NOT NULL,
      "attempted_at" INTEGER NOT NULL,
      FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE,
      FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE
    );
  `);

  // Create indexes for better query performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS "idx_user_progress_user_id" ON "user_progress"("user_id");
    CREATE INDEX IF NOT EXISTS "idx_user_progress_lesson_id" ON "user_progress"("lesson_id");
    CREATE INDEX IF NOT EXISTS "idx_quiz_attempts_user_id" ON "quiz_attempts"("user_id");
    CREATE INDEX IF NOT EXISTS "idx_quiz_attempts_quiz_id" ON "quiz_attempts"("quiz_id");
    CREATE INDEX IF NOT EXISTS "idx_quiz_attempts_attempted_at" ON "quiz_attempts"("attempted_at");
  `);

  console.log("✅ Progress tracking and quiz history tables created successfully!");
} catch (error) {
  console.error("Error creating tables:", error);
  process.exit(1);
} finally {
  db.close();
}

