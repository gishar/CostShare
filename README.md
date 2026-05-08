# CostShare

A lightweight web app for splitting shared costs clearly, especially when not everyone shares every expense.

**Live App:** https://costshare.alestead.com

## Why I Built This

Shared expenses during trips, dinners, family outings, or group activities are rarely split evenly across everyone involved.

One person pays for parking. A few people join dinner. Someone covers groceries for the cabin. Another person pays for gas. Then later comes the awkward part: figuring out who owes what.

Most tools I tried either felt too rigid, too complex, or assumed every expense was shared equally among everyone.

CostShare was built to keep this process simple and practical.

## Features

- Add and manage participants
- Add expenses with custom sharing groups
- Automatically calculate balances
- Generate simplified settlement recommendations
- Edit participants and expenses
- Mobile-friendly responsive layout
- Local storage persistence
- Export/import backups (JSON)
- Export spreadsheet summaries (CSV)
- Print / Save PDF support
- Event/session naming
- Lightweight personality touches and contextual footer messages

## Example Use Cases

- Cabin trips
- Group vacations
- Shared Airbnb stays
- Family outings
- Road trips
- Restaurant bills
- Event planning
- Any situation where expenses are shared unevenly

## Tech Stack

- React
- TypeScript
- Tailwind CSS
- Vite
- Vercel Deployment

## Development

Clone the repository:

```bash
git clone https://github.com/gishar/CostShare.git
cd CostShare
```

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Notes

CostShare stores data locally in the browser using localStorage. No account, backend, or cloud sync is required.
