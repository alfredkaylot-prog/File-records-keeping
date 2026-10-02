# File Records Keeping

Updatable, offline-first file tracking system for CCO Office, Accra - Ghana.

## Features v2.2.7
- ✅ Enter key support for login and all modals
- ✅ Delete buttons with custom modal (z-9999) - works in PWA and iframe
- ✅ Officer permissions fixed per IT regulations
  - Registry Clerk (3333) = Full IT Admin access to all profiles
  - Regular officers = Can only edit own name/avatar/PIN via Edit My Profile (old PIN verification), others View Only
- ✅ Action Taken = Writable free-text textarea with quick-insert chips
- ✅ Updatable architecture - data in versioned localStorage keys cco_*_v2
- ✅ Update Center with backup/restore JSON, migration logs, version tracking
- ✅ Audit Log - all actions logged
- ✅ Categories - Clerk-only edit
- ✅ PWA ready - installable, offline capable
- ✅ Drive backup integration

## Demo Officers
- Amina Yusuf - Registry Clerk - PIN 3333 - Admin
- John Okoro - Admin Officer - PIN 5678
- Fatima Bello - Records Assistant - PIN 9012
- Chief Compliance Officer - PIN 0000

Change these to real staff PINs in Officers tab.

## Tech Stack
- React + TypeScript
- Tailwind CSS
- localStorage v2 keys (updatable)
- PWA ready

## Installation
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```

## Deployment
Deploy dist/ folder to any static host:
- Vercel, Netlify, GitHub Pages, Firebase Hosting

## Backup System
- App > Update Center > Export Backup JSON
- Store JSON in Google Drive folder: CCO File Register - Backups
- Restore: Update Center > Restore Backup > Import JSON (auto-migrates)

## IT Regulations Compliance
- Only Registry Clerk can manage all officer profiles
- Regular officers self-service only for own profile
- All deletes/edits logged with officer name and timestamp
- Delete requires permission or Clerk PIN 3333 authorization

## Drive
Folder: https://drive.google.com/drive/folders/1ggMWTRZmjKlDKP4RRahCMhzCJkd_ywRo

## Live Demo
Preview: [CCO v2.2.7](container link)

## License
Internal use - CCO Office, Accra

## Changelog
- v2.2.7: Officer permissions fixed, Enter + Delete fixed
- v2.2.6: Enter key + Delete modal fixed
- v2.2.5: Delete guaranteed working
- v2.2.0: Personal password self-service, writable Action Taken
- v2.1.0: Updatable architecture with migration
