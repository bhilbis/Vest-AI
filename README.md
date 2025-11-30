# Vest AI

Vest AI is an AI‑powered investing assistant built with Next.js and TypeScript. It combines powerful LLM capabilities with a modern web stack to help users explore portfolios, run investment analyses, and generate insights.

> **Status:** Early development – APIs, UI, and features are still evolving.

---

## Features

- 🧠 **AI assistance** for investment questions and portfolio insights  
- 📊 **Modern web UI** using Next.js and TypeScript  
- 🗄 **Database & ORM** via Prisma for persistent data models  
- ⚙️ **Bun‑based tooling** for fast installs and scripts  
- ✅ **Linting & formatting** with ESLint and modern configs  

*(If some of these don’t match what you’re actually building, tell me and I’ll adjust the text.)*

---

## Tech stack

- **Framework:** Next.js (TypeScript)
- **Language:** TypeScript
- **Runtime / Package manager:** Bun (`bun.lock`)
- **ORM / DB:** Prisma (`prisma/`, `prisma.config.ts`)
- **Styling / CSS pipeline:** PostCSS (`postcss.config.mjs`)
- **Linting:** ESLint (`eslint.config.mjs`)

---

## Getting started

### Prerequisites

- **Node.js** or **Bun** installed
- A database supported by Prisma (e.g. PostgreSQL, MySQL, SQLite)
- Required API keys / secrets listed in `.env.example`

### 1. Clone the repo

```bash
git clone https://github.com/bhilbis/Vest-AI.git
cd Vest-AI
```

### 2. Install dependencies

Using **Bun** (recommended if that’s what the project is set up for):

```bash
bun install
```

Or with **npm**:

```bash
npm install
```

### 3. Configure environment variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Open `.env` and set:

- Database connection URL
- Any AI / LLM provider API keys
- Any other secrets required by the app

### 4. Set up the database (Prisma)

If you’re using Prisma migrations, run:

```bash
npx prisma migrate dev
```

Or, if you have a different workflow, adjust accordingly (e.g. `prisma db push`).

### 5. Run the development server

Using Bun:

```bash
bun dev
```

Or using npm:

```bash
npm run dev
```

Then open:

- http://localhost:3000

---

## Project structure

High‑level overview (only the important parts):

```text
.
├── .env.example          # Example environment variables
├── README.md             # Project documentation
├── bun.lock              # Bun lockfile
├── components.json       # UI component tooling/config
├── eslint.config.mjs     # ESLint configuration
├── next.config.ts        # Next.js configuration
├── package.json          # Scripts & dependencies
├── postcss.config.mjs    # PostCSS configuration
├── prisma.config.ts      # Prisma configuration
├── prisma/               # Prisma schema & migrations
├── public/               # Static assets
├── src/                  # Application source code (Next.js)
└── tsconfig.json         # TypeScript configuration
```

Inside `src/` you’ll typically find:

- `app/` or `pages/` – Next.js routes and pages  
- `components/` – Reusable UI components  
- `lib/` or `utils/` – Shared utilities and helpers  
- `styles/` – Global styles (if not purely CSS‑in‑JS)  

*(If your structure is different, I can customize this section once you tell me the folders inside `src/`.)*

---

## Scripts

Commonly used scripts (from `package.json`; adjust names if they differ):

```bash
# Start dev server
npm run dev
# or
bun dev

# Lint code
npm run lint

# Build for production
npm run build

# Start production server
npm start
```

---

## Environment variables

See [`.env.example`](./.env.example) for the full list of environment variables required. At minimum you may need:

- `DATABASE_URL` – Prisma database connection string  
- `OPENAI_API_KEY` or another AI provider key (if applicable)  

Never commit your real `.env` file.

---

## Roadmap / Ideas

- User portfolios and saved strategies
- AI‑generated investment theses and explanations
- Backtesting or risk metrics integration
- Authentication & user profiles
- Dashboard with charts and analytics

---

## Contributing

Contributions, bug reports, and feature ideas are welcome:

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m "Add my feature"`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## License

Add your preferred license here (e.g. MIT). If you already have one, mention it:

```text
This project is licensed under the MIT License.
```

---

## Contact

Created and maintained by [bhilbis](https://github.com/bhilbis).  
Feel free to open an issue for questions, bug reports, or feature requests.
