# Investment Simulator

> A full-stack paper trading platform and financial sandbox for testing market strategies without financial risk.

Live Demo: [https://invest-sim-tracker.vercel.app/](https://invest-sim-tracker.vercel.app/)

---

## Features

## Features

* **Real-Time Market Data & Asset Imports:** Search and select stocks seamlessly via an interactive live dropdown, track real-time price movements with detailed market metrics, and dynamically import new tickers to expand your viewable markets.
* **Paper Trading Platform:** Execute simulated market trades, track real-time positions, and monitor total profit and loss performance.
* **Database & Row-Level Security:** Production-ready authentication using Supabase Auth with strict Row-Level Security (RLS) rules protecting user portfolio isolation.
* **Leaderboards & Profiles:** Public user profiles and performance rankings for trading competitions.
* **Community Integration:** Embedded Discord community hub powered by WidgetBot.
* **Telemetry & Analytics:** Anonymous web performance monitoring via Vercel Web Analytics.
---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js (App Router, React, TypeScript) |
| **Database & Auth** | Supabase (PostgreSQL, Row-Level Security) |
| **Styling & UI** | Tailwind CSS, Lucide Icons, Sonner |
| **Community** | WidgetBot (Discord Integration) |
| **Hosting & Analytics** | Vercel, `@vercel/analytics` |

---

## Project Structure

```text
├── app/
│   ├── (auth)/             # Authentication routes (login, signup)
│   ├── community/          # Community chat integration
│   ├── sandbox/            # Unauthenticated guest sandbox workspace
│   ├── layout.tsx          # Root layout with Sidebar, Toast, and Analytics
│   ├── page.tsx            # Main trading dashboard and market overview
│   └── globals.css         # Styling directives and global CSS
├── components/             # Reusable UI components
├── lib/                    # Supabase client singletons and helper functions
└── public/                 # Static assets
