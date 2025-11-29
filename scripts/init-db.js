const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

const dbPath = path.join(__dirname, "..", "sqlite.db");
const sqlite = new Database(dbPath);

// Read the migration file
const migrationPath = path.join(__dirname, "..", "drizzle", "0000_orange_war_machine.sql");
let migrationSQL = "";

if (fs.existsSync(migrationPath)) {
  migrationSQL = fs.readFileSync(migrationPath, "utf8");
} else {
  // If migration file doesn't exist, create tables manually
  migrationSQL = `
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      topic TEXT NOT NULL,
      level TEXT NOT NULL,
      duration TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS lessons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      "order" INTEGER NOT NULL,
      duration TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    );

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
  `;
}

// Execute the migration
try {
  sqlite.exec(migrationSQL);
  console.log("✅ Database initialized successfully!");
  console.log("Tables created: courses, lessons");
} catch (error) {
  console.error("❌ Error initializing database:", error.message);
  process.exit(1);
} finally {
  sqlite.close();
}

