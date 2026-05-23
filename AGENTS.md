# AGENTS.md — Antigravity Reading List

This file gives AI coding agents (Claude Code, Copilot Workspace, Cursor, etc.) everything they need to build, extend, and maintain this project correctly without making assumptions.

---

## Project Goal

Build a web app where users can:
1. Search for books or authors via the OpenLibrary API
2. Save results to a personal reading list stored in Firebase Firestore
3. Toggle each book's status between `want_to_read` and `read`
4. See their list persist across page refreshes and sessions

---

## Architecture Decision

**Default stack: React + Vite + Firebase JS SDK v9+ (modular)**

Use this unless the human explicitly requests vanilla JS. Reasons:
- Firestore real-time listeners integrate cleanly with React state
- Component model maps naturally to SearchBar / BookCard / ReadingList
- Vite gives fast HMR and env variable support out of the box

---

## What to Build — File by File

### `src/firebase.js`
- Initialize Firebase app using environment variables (`import.meta.env.VITE_*`)
- Export `db` (Firestore instance)
- Export `auth` if authentication is included
- Use modular SDK: `import { initializeApp } from 'firebase/app'`

### `src/hooks/useReadingList.js`
- Custom React hook
- On mount, call `onSnapshot` on `users/{userId}/books` to subscribe to real-time updates
- Expose: `books`, `saveBook(bookData)`, `toggleStatus(bookId)`, `removeBook(bookId)`
- `saveBook` should check for duplicates using the OpenLibrary `key` field before writing
- `toggleStatus` should flip `want_to_read` ↔ `read` and write back to Firestore

### `src/hooks/useBookSearch.js`
- Custom React hook for search state
- Accept a query string and return `{ results, loading, error }`
- Debounce the API call by 400 ms (use a `useEffect` with a `clearTimeout` cleanup)
- Fetch: `https://openlibrary.org/search.json?q={encodeURIComponent(query)}&limit=20`
- Map raw API `docs` into a clean internal shape (see Data Shapes below)

### `src/components/SearchBar.jsx`
- Controlled input that calls `setQuery` on change
- Show a spinner while `loading` is true
- Display `error` message if the fetch fails

### `src/components/BookCard.jsx`
- Props: `book` (search result shape), `isSaved` (bool), `onSave`
- Cover image: `https://covers.openlibrary.org/b/id/{cover_i}-M.jpg`
- Fallback: show a placeholder div with the book title initial if `cover_i` is null
- "Save" button disabled and labeled "Saved ✓" when `isSaved` is true

### `src/components/ReadingListItem.jsx`
- Props: `book` (saved book shape), `onToggleStatus`, `onRemove`
- Show cover thumbnail, title, author, status badge
- Toggle button: clicking it calls `onToggleStatus(book.id)`
- Remove button: calls `onRemove(book.id)` with a confirmation prompt

### `src/App.jsx`
- Compose all components
- Pass search results and reading list data down as props
- Derive `isSaved` per book by checking if the OpenLibrary key exists in the saved list

---

## Data Shapes

### Search Result (internal, mapped from OpenLibrary)

```ts
{
  key: string;           // e.g. "/works/OL45883W" — use as stable ID
  title: string;
  author: string;        // join author_name array with ", "
  coverId: number | null; // docs[].cover_i
  firstPublished: number | null; // docs[].first_publish_year
}
```

### Saved Book (Firestore document at `users/{userId}/books/{bookId}`)

```ts
{
  openLibraryKey: string;   // same as search result key
  title: string;
  author: string;
  coverId: number | null;
  status: "want_to_read" | "read";
  savedAt: Timestamp;       // serverTimestamp()
}
```

Use `openLibraryKey` (with slashes replaced by underscores) as the Firestore document ID to prevent duplicates naturally.

---

## OpenLibrary API

```
GET https://openlibrary.org/search.json?q=YOUR_QUERY&limit=20
```

- No API key needed
- Returns JSON with a `docs` array
- Rate limit: debounce inputs, do not fire on every keystroke
- Add `&limit=20` to avoid huge responses
- Handle network errors gracefully — show a user-facing error message

Cover images:
```
https://covers.openlibrary.org/b/id/{coverId}-M.jpg   // medium
https://covers.openlibrary.org/b/id/{coverId}-S.jpg   // small
```

---

## Firebase Setup Instructions for Agent

1. Read environment variables from `import.meta.env.VITE_FIREBASE_*`
2. Never hardcode credentials
3. Initialize once in `src/firebase.js`, import `db` elsewhere
4. Use Firestore modular API (v9+):
   - `collection`, `doc`, `setDoc`, `deleteDoc`, `onSnapshot`, `serverTimestamp`
   - Do NOT use the compat API (`firebase.firestore()`)
5. Use `onSnapshot` for the reading list so it stays live without polling

---

## Authentication Strategy

**Default: Firebase Anonymous Auth**

```js
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
```

- Sign in anonymously on app load if no user is present
- Use the resulting `uid` as the `userId` path segment in Firestore
- This gives every browser session a stable, persistent identity without a login flow
- If the user later wants Google Sign-In, the anonymous account can be upgraded (do not implement this unless explicitly requested)

---

## Error Handling Rules

| Situation | Required Behavior |
|---|---|
| OpenLibrary fetch fails | Show inline error message near the search bar; do not crash |
| Cover image fails to load | Replace with a styled placeholder (book title initial in a colored box) |
| Firestore write fails | Show a toast/snackbar error; do not silently swallow |
| No search results | Show "No books found for '{query}'" message |
| Empty reading list | Show an encouraging empty state, not a blank screen |

---

## Styling Guidelines

- Use CSS Modules or a single `style.css` — no CSS-in-JS unless already in the project
- Mobile-first responsive layout
- Search results: card grid, 2–4 columns depending on viewport
- Reading list: single-column list with status badges
- Status badge colors: `want_to_read` → muted blue, `read` → green
- Do not add a UI component library (no MUI, no shadcn) unless explicitly requested — keep the bundle small

---

## What NOT to Do

- ❌ Do not use the Firebase compat SDK (`import firebase from 'firebase/app'`)
- ❌ Do not store Firebase credentials in source code
- ❌ Do not fetch OpenLibrary on every keystroke — debounce by 400 ms minimum
- ❌ Do not allow duplicate books in the reading list — check by `openLibraryKey`
- ❌ Do not use `localStorage` for reading list persistence — Firestore is the source of truth
- ❌ Do not add pagination to the reading list unless the human requests it
- ❌ Do not add social/sharing features unless explicitly requested

---

## Files the Agent Must Create

```
src/
  firebase.js
  App.jsx
  main.jsx
  hooks/
    useBookSearch.js
    useReadingList.js
  components/
    SearchBar.jsx
    BookCard.jsx
    ReadingListItem.jsx
    EmptyState.jsx
public/
  index.html
.env.example
.gitignore
vite.config.js
package.json
firebase.json
.firebaserc
README.md
AGENTS.md            ← this file
```

---

## Definition of Done

The implementation is complete when:

- [ ] Searching for a book title or author returns results with cover images
- [ ] Saving a book adds it to Firestore under the authenticated user's collection
- [ ] Duplicate saves are silently ignored (no second copy created)
- [ ] Toggling status updates Firestore and reflects immediately in the UI
- [ ] Reading list survives a full page refresh
- [ ] Cover image load failures show a graceful placeholder
- [ ] Network errors are shown as user-friendly messages
- [ ] No Firebase credentials appear anywhere in source-controlled files
- [ ] The app is deployable via `firebase deploy`

---

## Helpful References

- OpenLibrary API docs: https://openlibrary.org/developers/api
- Firebase Firestore (modular): https://firebase.google.com/docs/firestore/quickstart
- Firebase Anonymous Auth: https://firebase.google.com/docs/auth/web/anonymous-auth
- Vite env variables: https://vitejs.dev/guide/env-and-mode
