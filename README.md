# Donation Matching Platform

A React web app that connects people who want to donate items with people who need them. Users register, post a donation, search existing donations, and get matched automatically by category and district.

## Features

- Registration and login (Firebase Authentication), with protected routes for signed-in users
- Post a donation with category and district
- Search donations with filters
- Matching algorithm: a donation scores +20 for a matching category and +10 for the same district; the best-scored results are shown first
- Messages and a contact page
- Settings page for the user profile

## Tech stack

React, React Router 6, React Hook Form, Bootstrap 5, Firebase (Authentication and Firestore).

## Project structure

```
src/
  components/
    algorithem/   matching logic (MatchDonations.js)
    screens/      pages: HomePage, LogIn, Registertion, AddDonation, SearchDonations, Messages, Settings, ...
    navbar, footer, signOut
  services/
    contexts/     AuthContext, UserContext
    firebase/     Firestore access
    protectedRoute/
```

## Getting started

```bash
npm install
npm start
```

The app opens at http://localhost:3000.

## Scripts

| Command | What it does |
|---|---|
| `npm start` | Run in development mode |
| `npm test` | Run the tests |
| `npm run build` | Production build in `build/` |

## Notes

The Firebase web configuration lives in `src/services/firebase/FireStore.js`. Web API keys are not secret, but access should be restricted with Firestore security rules.
