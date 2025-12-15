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

## 🛠️ Tech Stack

- **Framework:** Next.js 15 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Deployment:** Google Cloud Run (serverless)

## 📦 Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

### Build for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

## 🐳 Docker Deployment

```bash
# Build Docker image
docker build -t openhorizon .

# Run container
docker run -p 3000:3000 openhorizon
```

## ☁️ Cloud Run Deployment

```bash
# Deploy to Google Cloud Run
gcloud run deploy openhorizon \
  --source . \
  --region=europe-west1 \
  --allow-unauthenticated
```

## 📄 Project Structure

```
openhorizon.cc/
├── app/                  # Next.js app directory
│   ├── globals.css      # Global styles
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Homepage
├── components/          # React components
│   ├── Hero.tsx         # Hero section with email capture
│   ├── Features.tsx     # Features grid
│   ├── HowItWorks.tsx   # Process steps
│   └── Footer.tsx       # Footer with EU compliance
├── public/              # Static assets
└── package.json         # Dependencies
```

## 🇪🇺 EU Compliance

This project is co-funded by the European Union's Erasmus+ programme. All communications include required EU funding acknowledgments and comply with GDPR regulations.

## 📧 Contact

For inquiries: info@openhorizon.cc

---

**Co-funded by the European Union**  
Views and opinions expressed are those of the author(s) only and do not necessarily reflect those of the European Union or EACEA.
# OpenHorizon.cc - CI/CD Pipeline Active
