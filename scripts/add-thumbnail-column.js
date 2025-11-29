const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "..", "sqlite.db");
const db = new Database(dbPath);

console.log("Adding thumbnail column to courses table...");

try {
  db.exec(`ALTER TABLE "courses" ADD COLUMN "thumbnail" TEXT;`);
  console.log("✅ Successfully added thumbnail column to courses table");
} catch (error) {
  if (error.message.includes("duplicate column name")) {
    console.log("ℹ️  Thumbnail column already exists in courses table");
  } else {
    console.error("❌ Error adding thumbnail column:", error.message);
    process.exit(1);
  }
} finally {
  db.close();
}

