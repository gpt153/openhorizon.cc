# Open Horizon

Empowering Youth & Organisations Through Erasmus+

Swedish nonprofit association creating meaningful international opportunities for young people and organisations through Erasmus+ projects.

## 🌍 What We Do

- **Youth Exchanges & Activities** - International mobility activities for ages 13-30
- **Youth Participation Projects** - Civic, social, and political engagement opportunities
- **Youth Worker Mobility & Training** - Professional development and networking
- **Inclusive Support & Accessibility** - Tailored support for diverse needs
- **Project Development Support** - Expert assistance for Erasmus+ applications
- **Reporting & Compliance** - Complete documentation aligned with EU standards

## 📖 Documentation

### For Users

**New to OpenHorizon?** Start here:
- **[Getting Started Guide](docs/user-guide/getting-started.md)** - Your first project in 5 minutes
- **[User Guide](docs/user-guide/README.md)** - Complete feature walkthrough
- **[Troubleshooting](docs/user-guide/troubleshooting.md)** - Common issues and solutions

**Feature Guides:**
- [Seeds](docs/user-guide/features/seeds.md) - AI-powered project ideation
- [Projects](docs/user-guide/features/projects.md) - Full project management
- [Programmes](docs/user-guide/features/programmes.md) - Activity scheduling
- [Budget](docs/user-guide/features/budget.md) - Erasmus+ budget calculator
- [Vendor Search](docs/user-guide/features/vendor-search.md) - Find accommodation, travel & food
- [Export](docs/user-guide/features/export.md) - Application-ready documents

### For Developers

- **[Technical Documentation](DOCUMENTATION.md)** - Complete documentation index
- **[Quick Start](QUICKSTART.md)** - Development setup
- **[Deployment Guide](DEPLOY_INSTRUCTIONS.md)** - Production deployment

## 🛠️ Tech Stack

- **Framework:** Next.js 15 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Deployment:** Google Cloud Run (serverless)

## 📦 Project Structure

This is a **monorepo** containing two Next.js applications:

```
openhorizon.cc/
├── landing/              # Marketing landing page → openhorizon.cc
│   ├── src/app/         # Landing page routes
│   ├── Dockerfile       # Landing page container
│   └── package.json     # Landing dependencies
├── app/                  # Full application → app.openhorizon.cc
│   ├── src/             # Application source code
│   ├── prisma/          # Database schema
│   ├── Dockerfile       # App container
│   └── package.json     # App dependencies
├── cloudbuild-landing.yaml  # Deploy landing page
├── cloudbuild-app.yaml      # Deploy application
└── package.json            # Monorepo workspace root
```

### Domain Structure

- **openhorizon.cc** (root) → Marketing landing page for customers/partners
- **app.openhorizon.cc** (subdomain) → Full application

## 📦 Getting Started

### Prerequisites

- Node.js 20+
- npm

### Installation

```bash
# Install all dependencies (both landing and app)
npm install

# Or install individually
cd landing && npm install
cd ../app && npm install
```

### Development

```bash
# Run landing page (port 3000)
npm run dev:landing

# Run application (port 3001)
npm run dev:app

# Or run individually
cd landing && npm run dev
cd app && npm run dev
```

**Landing page**: [http://localhost:3000](http://localhost:3000)
**Application**: [http://localhost:3001](http://localhost:3001)

### Build for Production

```bash
# Build landing page
npm run build:landing

# Build application
npm run build:app

# Or build individually
cd landing && npm run build
cd app && npm run build
```

## 🐳 Docker Deployment

```bash
# Build landing page
docker build -t openhorizon-landing -f landing/Dockerfile landing

# Build application
docker build -t openhorizon-app -f app/Dockerfile app

# Run containers
docker run -p 3000:3000 openhorizon-landing
docker run -p 3001:3000 openhorizon-app
```

## ☁️ Cloud Run Deployment

**Automatic Deployment** via Cloud Build triggers:
- Push to `main` with changes to `landing/**` → Deploys landing page
- Push to `main` with changes to `app/**` → Deploys application

**Manual Deployment**:

```bash
# Deploy landing page
gcloud run deploy openhorizon-landing \
  --source landing \
  --region=europe-west1 \
  --allow-unauthenticated \
  --env-vars-file=env-landing.yaml

# Deploy application
gcloud run deploy openhorizon-app \
  --source app \
  --region=europe-west1 \
  --allow-unauthenticated \
  --env-vars-file=env-app.yaml
```

See `DEPLOY_INSTRUCTIONS.md` for complete deployment guide.

## 📁 Detailed Structure

### Landing Page (`landing/`)
- **Purpose**: Marketing site for customers and partners
- **URL**: https://openhorizon.cc
- **Features**:
  - Hero section with CTAs
  - Features grid
  - How It Works section
  - EU compliance footer
  - Links to application

### Application (`app/`)
- **Purpose**: Full Erasmus+ project management platform
- **URL**: https://app.openhorizon.cc
- **Features**:
  - User authentication (Clerk)
  - Project creation and management
  - Database (Supabase + Prisma)
  - Background jobs (Inngest)
  - AI-powered features (OpenAI)

## 🇪🇺 EU Compliance

This project is co-funded by the European Union's Erasmus+ programme. All communications include required EU funding acknowledgments and comply with GDPR regulations.

## ❓ Frequently Asked Questions

**Q: How long does it take to create an Erasmus+ project with OpenHorizon?**
A: 4-6 hours with OpenHorizon (vs 40-60 hours manually). Transform weeks of planning into days.

**Q: Do I need technical knowledge to use OpenHorizon?**
A: No! OpenHorizon is designed for project coordinators, not developers. If you can use a web browser, you can use OpenHorizon.

**Q: What Erasmus+ actions are supported?**
A: Currently KA1 (Learning Mobility) and KA2 (Cooperation Partnerships). KA3 support coming soon.

**Q: Is my project data safe?**
A: Yes. All data is encrypted, GDPR compliant, and stored securely on EU servers. We do not share data with third parties.

**Q: Can I export to Word and PDF?**
A: Yes! Export to PDF, DOCX (Word), and XLSX (Excel) formats. All exports include your complete project details and Erasmus+ application forms.

**Q: Does OpenHorizon guarantee my application will be approved?**
A: No. OpenHorizon helps you plan and document high-quality projects, but approval depends on many factors reviewed by National Agencies.

**Q: Can I work on multiple projects simultaneously?**
A: Yes! Create and manage unlimited projects at the same time.

**Q: Is there a mobile app?**
A: Not yet. The web app works on mobile browsers but is optimized for desktop and tablet use.

For more questions, see our [User Guide](docs/user-guide/README.md) or [Troubleshooting Guide](docs/user-guide/troubleshooting.md).

## 📧 Contact

For inquiries: info@openhorizon.cc

---

**Co-funded by the European Union**  
Views and opinions expressed are those of the author(s) only and do not necessarily reflect those of the European Union or EACEA.
# OpenHorizon.cc - CI/CD Pipeline Active
