# AI Course Generator

A full-stack Next.js application that generates comprehensive courses using Google's Gemini AI. Built with Next.js, React, Tailwind CSS, Drizzle ORM, and the Gemini API.

## Features

- 🤖 **AI-Powered Course Generation**: Generate comprehensive courses on any topic using Google Gemini AI
- 📚 **Structured Learning**: Get well-organized courses with lessons, content, and learning paths
- 🎯 **Customizable**: Choose your topic, difficulty level (beginner/intermediate/advanced), and course duration
- 💾 **Persistent Storage**: Save and manage your generated courses using SQLite database with Drizzle ORM
- 🎨 **Modern UI**: Beautiful, responsive interface built with Tailwind CSS
- 📄 **Export Options**: Export courses as PDF or Markdown files
- 🌙 **Dark Mode**: Full dark mode support for comfortable learning
- 📊 **Progress Tracking**: Track your learning progress through lessons
- 🎯 **Interactive Quizzes**: Test your knowledge with AI-generated quizzes
- 🧠 **Spaced Repetition System (SRS)**: Smart review scheduling based on forgetting curve to maximize retention
- 📈 **Retention Analytics**: Track your learning retention rate and study streaks
- 🔔 **Review Reminders**: Get notified when it's time to review learned material
- 🔖 **Bookmarks & Notes**: Take notes and bookmark important lessons
- ⭐ **Favorites**: Mark courses as favorites for quick access
- 🔗 **Course Sharing**: Share your courses publicly with shareable links

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite with Drizzle ORM
- **AI**: Google Gemini API
- **Runtime**: Node.js

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

## Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd AI-Course
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

4. Add your API keys to `.env`:
```
GEMINI_API_KEY=your_actual_api_key_here
NEXTAUTH_SECRET=your_random_secret_here
NEXTAUTH_URL=http://localhost:3000

# Optional: OAuth providers (Google/GitHub)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

**Note**: Generate a random secret for `NEXTAUTH_SECRET` using:
```bash
openssl rand -base64 32
```

5. Generate the database schema and migrations:
```bash
npm run db:generate
```

6. The database will be automatically created when you first run the application. Alternatively, you can manually create it by running:
```bash
npm run db:migrate
```

**Note**: If you encounter any database errors, make sure the `sqlite.db` file is created. The database will be automatically initialized on first use.

## Running the Application

### Development Mode

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## Usage

1. **Generate a Course**: 
   - Navigate to the "Generate New Course" page
   - Enter a topic (e.g., "Machine Learning", "Web Development")
   - Select a difficulty level (Beginner, Intermediate, or Advanced)
   - Optionally specify a duration (e.g., "4 weeks", "8 hours")
   - Click "Generate Course" and wait for the AI to create your course

2. **View Courses**: 
   - Go to "My Courses" to see all your generated courses
   - Click on any course to view its details and lessons

3. **Track Progress**: 
   - Mark lessons as complete as you go through them
   - Take quizzes to test your knowledge
   - View your progress percentage on the course detail page

4. **Smart Review System (SRS)**:
   - Complete quizzes to activate spaced repetition
   - System automatically schedules optimal review dates
   - Check "Reviews" page for due and upcoming reviews
   - Get notifications when reviews are due
   - Track your retention rate and study streaks

5. **Export Courses**:
   - Click "Export as PDF" to download a formatted PDF version
   - Click "Export as Markdown" to download a Markdown file

6. **Take Notes & Bookmark**:
   - Click the bookmark icon to save important lessons
   - Use the notes editor to write personal notes for each lesson

7. **Share Courses**:
   - Make courses public and share via generated links
   - Others can view and clone your public courses

## Project Structure

```
├── app/
│   ├── api/
│   │   └── courses/          # API routes for course CRUD operations
│   ├── courses/              # Course listing and detail pages
│   ├── generate/             # Course generation page
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Home page
├── lib/
│   ├── db/
│   │   ├── index.ts          # Database connection
│   │   └── schema.ts         # Database schema definitions
│   └── gemini.ts             # Gemini AI integration
├── drizzle/                  # Generated migration files
└── sqlite.db                 # SQLite database (created after migration)
```

## Database Schema

- **courses**: Stores course metadata (title, description, topic, level, duration)
- **lessons**: Stores individual lessons belonging to courses (title, content, order, duration)

## API Routes

- `GET /api/courses` - Fetch all courses
- `POST /api/courses` - Generate and create a new course
- `GET /api/courses/[id]` - Fetch a specific course with lessons
- `PUT /api/courses/[id]` - Update a course
- `DELETE /api/courses/[id]` - Delete a course
- `GET /api/courses/[id]/export` - Export course as PDF or Markdown
- `GET /api/progress` - Get user's learning progress
- `POST /api/progress` - Update lesson progress
- `POST /api/quizzes/submit` - Submit quiz answers (automatically creates SRS reviews)
- `GET /api/reviews` - Get quiz reviews (supports filters: due, overdue, upcoming, all)
- `GET /api/reviews/stats` - Get review statistics and retention data
- `POST /api/reviews/update` - Update review schedule after quiz completion
- `GET /api/notes` - Get user's notes
- `POST /api/notes` - Create a note
- `GET /api/bookmarks` - Get user's bookmarks
- `POST /api/bookmarks` - Create a bookmark
- `GET /api/favorites` - Get user's favorite courses
- `POST /api/favorites` - Add a course to favorites

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:generate` - Generate database migrations
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Drizzle Studio (database GUI)

## Environment Variables

- `GEMINI_API_KEY` (required): Your Google Gemini API key

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

