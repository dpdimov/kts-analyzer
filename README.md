# KTS Text Analyzer

Maps written text onto the Kinetic Thinking Styles framework (Dimov & Pistrui, 2023) by analysing linguistic markers of attitudes towards uncertainty and possibility.

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure API key
```bash
cp .env.local.example .env.local
```
Edit `.env.local` and replace `your-api-key-here` with your Anthropic API key.

### 3. Run locally
```bash
npm run dev
```
Open http://localhost:3000

## Deploy to Vercel

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR-USERNAME/kts-analyzer.git
git push -u origin main
```

### 2. Connect to Vercel
- Go to [vercel.com](https://vercel.com) and sign in with GitHub
- Click "New Project" → Import your `kts-analyzer` repository
- In **Environment Variables**, add:
  - Key: `ANTHROPIC_API_KEY`
  - Value: your API key
- Click "Deploy"

Your site will be live at `https://kts-analyzer.vercel.app` (or similar).

## Project structure

```
kts-analyzer/
├── app/
│   ├── api/
│   │   └── analyze/
│   │       └── route.js      # API proxy (keeps key server-side)
│   ├── layout.js              # Root layout
│   └── page.js                # Main analyzer component
├── .env.local.example         # API key template
├── .gitignore
├── next.config.js
├── package.json
└── README.md
```

## Cost

Each analysis uses Claude Sonnet and costs roughly $0.003. With $7 of credit you can run ~2,300 analyses.
