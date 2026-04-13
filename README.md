# Market Calculator

A smart market calculator for cost analysis, pricing, and order management — built for supply chain vendors.

**[Live Demo](https://vendorcalc.web.app)**

![Next.js](https://img.shields.io/badge/Next.js_15-000000?logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-DD2C00?logo=firebase&logoColor=white)
![GCP](https://img.shields.io/badge/Google_Cloud-4285F4?logo=googlecloud&logoColor=white)

## Features

- **Item Calculator** — Single item cost breakdown and profit analysis
- **Batch Calculator** — Bulk pricing across multiple products
- **Market Calculator** — Competitive pricing and market analysis
- **Unit Conversion** — Multi-unit measurement support
- **Order Management** — Create and track orders with detailed line items
- **Auth & RBAC** — Login system with protected routes (up to 3 concurrent users)
- **Responsive UI** — Mobile-first design with dark mode support

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Backend | Firebase Cloud Functions (Node.js 20) |
| Database | Google Sheets API |
| Hosting | Firebase Hosting |
| Auth | Custom authentication |

## Getting Started

### Prerequisites

- Node.js 18+
- Firebase CLI

### Development

```bash
git clone https://github.com/daith/market-calculator.git
cd market-calculator
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Setup

Create a `.env.local` file:

```env
NEXT_PUBLIC_ENV=development
NEXT_PUBLIC_API_URL=<your-cloud-functions-url>
```

## Project Structure

```
app/                    Next.js App Router pages
components/
  Auth/                 Authentication components
  Calculator/           Calculator modules
functions/              Firebase Cloud Functions (API)
styles/                 Global styles
```

## Deployment

```bash
# Deploy frontend
./deploy-host.sh prod

# Deploy API
./deploy-functions.sh prod
```

## Scripts

| Command | Description |
|---------|------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run type-check` | TypeScript check |

## License

MIT
