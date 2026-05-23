# book-finder 📚 Antigravity Reading List
A web app that lets anyone search for books or authors and save results to a personal reading list — powered by the OpenLibrary API and persisted in Firebase Firestore.

What It Does

Search — Type a book title or author into the search bar. The app queries the OpenLibrary API and displays matching results with cover images.
Save — Click Save on any result to add it to your personal Firestore reading list.
Track — Toggle each saved book between Want to Read and Read.
Persist — Refresh the page and your reading list is still there, pulled live from Firestore.


Tech Stack
LayerTechnologyFrontendHTML / CSS / Vanilla JS (or React — see AGENTS.md)Book DataOpenLibrary Search APIDatabaseFirebase FirestoreAuth (optional)Firebase Anonymous Auth or Google Sign-InHosting (optional)Firebase Hosting

Project Structure
antigravity-reading-list/
├── public/
│   ├── index.html          # App shell
│   ├── style.css           # Styles
│   └── app.js              # Main application logic
├── src/                    # (If using a build tool / React)
│   ├── components/
│   │   ├── SearchBar.jsx
│   │   ├── BookCard.jsx
│   │   └── ReadingList.jsx
│   ├── firebase.js         # Firebase init & Firestore helpers
│   └── main.jsx
├── .env.example            # Environment variable template
├── firebase.json           # Firebase Hosting config
├── .firebaserc             # Firebase project alias
├── AGENTS.md               # AI agent build instructions
└── README.md               # This file

Getting Started
Prerequisites

Node.js ≥ 18 (if using a build step)
A Firebase project with Firestore enabled
Firebase CLI: npm install -g firebase-tools

1. Clone & Install
bashgit clone https://github.com/your-org/antigravity-reading-list.git
cd antigravity-reading-list
npm install          # only needed if using a build tool
2. Configure Firebase
Copy .env.example to .env and fill in your Firebase project credentials:
bashcp .env.example .env
envVITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

Never commit your .env file. It is already listed in .gitignore.

3. Set Up Firestore
In the Firebase Console:

Go to Firestore Database → Create database
Start in test mode for development (lock down rules before going to production)
No schema setup needed — Firestore is schemaless

Recommended Firestore collection structure:
users/{userId}/books/{bookId}
  - openLibraryKey: string        // e.g. "/works/OL45883W"
  - title: string
  - author: string
  - coverId: number | null
  - status: "want_to_read" | "read"
  - savedAt: timestamp
4. Run Locally
Vanilla JS (no build step):
bash# Serve with any static server, e.g.:
npx serve public/
React + Vite:
bashnpm run dev
5. Deploy
bashfirebase login
firebase use --add          # select your project
firebase deploy

OpenLibrary API
Search endpoint:
GET https://openlibrary.org/search.json?q=YOUR_QUERY
Key response fields used by this app:
FieldDescriptiondocs[].keyUnique work key (used as the book ID)docs[].titleBook titledocs[].author_nameArray of author namesdocs[].cover_iCover image IDdocs[].first_publish_yearYear of first publication
Cover image URL pattern:
https://covers.openlibrary.org/b/id/{cover_i}-M.jpg
No API key required. Rate limit: be respectful — debounce search inputs by at least 400 ms.

Firestore Security Rules (Production)
Replace test-mode rules with these before launching:
jsrules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/books/{bookId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}

Environment Variables
VariableRequiredDescriptionVITE_FIREBASE_API_KEY✅Firebase Web API keyVITE_FIREBASE_AUTH_DOMAIN✅Firebase auth domainVITE_FIREBASE_PROJECT_ID✅Firestore project IDVITE_FIREBASE_STORAGE_BUCKET✅Storage bucket nameVITE_FIREBASE_MESSAGING_SENDER_ID✅Messaging sender IDVITE_FIREBASE_APP_ID✅Firebase app ID

Contributing

Fork the repo
Create a feature branch: git checkout -b feat/my-feature
Commit with conventional commits: feat:, fix:, docs:, etc.
Open a pull request


License
MIT
