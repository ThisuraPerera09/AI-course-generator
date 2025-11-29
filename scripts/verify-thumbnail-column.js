const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "..", "sqlite.db");
const db = new Database(dbPath);

console.log("Checking courses table structure...");

try {
  const tableInfo = db.prepare("PRAGMA table_info(courses)").all();
  console.log("\nCourses table columns:");
  tableInfo.forEach((col) => {
    console.log(`  - ${col.name} (${col.type})`);
  });
  
  const hasThumbnail = tableInfo.some((col) => col.name === "thumbnail");
  if (hasThumbnail) {
    console.log("\n✅ Thumbnail column exists!");
  } else {
    console.log("\n❌ Thumbnail column does NOT exist!");
    console.log("Running: ALTER TABLE courses ADD COLUMN thumbnail TEXT;");
    db.exec(`ALTER TABLE "courses" ADD COLUMN "thumbnail" TEXT;`);
    console.log("✅ Thumbnail column added!");
  }
} catch (error) {
  console.error("❌ Error:", error.message);
  process.exit(1);
} finally {
  db.close();
}

