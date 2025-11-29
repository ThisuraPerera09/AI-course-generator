const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "..", "sqlite.db");
const sqlite = new Database(dbPath);

try {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS quizzes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_id INTEGER NOT NULL,
      question TEXT NOT NULL,
      options TEXT NOT NULL,
      correct_answer INTEGER NOT NULL,
      explanation TEXT,
      "order" INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
    );
  `);
  console.log("✅ Quizzes table created successfully!");
} catch (error) {
  console.error("❌ Error creating quizzes table:", error.message);
  process.exit(1);
} finally {
  sqlite.close();
}

