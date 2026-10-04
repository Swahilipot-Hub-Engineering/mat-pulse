# Onboarding — your first hour

Welcome to **Mat-Pulse**! By the end of this guide you will have the project running
on your machine and understand how to run the simulator and tests.

---

## Step 0 — Prerequisites (10 min)

- [ ] Node.js 20+ installed (`node -v`)
- [ ] Git installed (`git --version`)
- [ ] Code editor (VS Code recommended)

## Step 1 — Get the code

```bash
git clone https://github.com/Swahilipot-Hub-Engineering/mat-pulse.git
cd mat-pulse
```

## Step 2 — Run it (5 min)

```bash
npm install
cp .env.example .env
npm run dev
```

Open **<http://localhost:3000>** in your browser. You should see the Mombasa Mat-Pulse Transit Map!

## Step 3 — Stream Live Matatu Telemetry

In a second terminal window, run:

```bash
npm run simulate
```

Watch the interactive map on <http://localhost:3000> update in real time as simulated matatus move along Bamburi, Likoni, and Changamwe corridors.

## Step 4 — Run tests

```bash
npm test
```

All unit and integration tests should pass.

## Step 5 — Pick an issue

Check out [good first issues](https://github.com/Swahilipot-Hub-Engineering/mat-pulse/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) and ask your mentor in Swahilipot Hub if you need any guidance.

Karibu sana! 🌊
