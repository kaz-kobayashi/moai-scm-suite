# Quick Start Guide

## 🚀 Deploy to Google Cloud Run in 5 Minutes

### Prerequisites
- GitHub account
- Google Cloud account with billing enabled
- Google OAuth Client ID

### Step 1: Fork and Clone
```bash
# Fork this repository on GitHub, then:
git clone https://github.com/[your-username]/scmopt.git
cd scmopt
```

### Step 2: Google Cloud Setup
```bash
# Create project and enable APIs
gcloud projects create [your-project-id]
gcloud config set project [your-project-id]
gcloud services enable cloudbuild.googleapis.com run.googleapis.com

# Create service account for GitHub Actions
gcloud iam service-accounts create github-actions
gcloud projects add-iam-policy-binding [your-project-id] \
  --member="serviceAccount:github-actions@[your-project-id].iam.gserviceaccount.com" \
  --role="roles/run.admin"
gcloud projects add-iam-policy-binding [your-project-id] \
  --member="serviceAccount:github-actions@[your-project-id].iam.gserviceaccount.com" \
  --role="roles/storage.admin"
gcloud iam service-accounts keys create key.json \
  --iam-account=github-actions@[your-project-id].iam.gserviceaccount.com
```

### Step 3: Configure GitHub Secrets
Go to your repository → Settings → Secrets and variables → Actions

Add these secrets:
- `GCP_PROJECT_ID`: Your project ID
- `GCP_SA_KEY`: Content of key.json file (entire JSON)
- `GOOGLE_CLIENT_ID`: Your Google OAuth client ID (get from Google Cloud Console)

### Step 4: Deploy
```bash
git push origin main
```

That's it! GitHub Actions will automatically deploy your app to Cloud Run.

## 🔧 Local Development (Optional)

### Backend
```bash
cd webapp
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
cp ../.env.example .env.local
# Edit .env.local with your Google Client ID
npm install
npm start
```

Visit `http://localhost:3000`

## 📋 What You Get

- ✅ Complete supply chain optimization suite
- ✅ Google OAuth authentication
- ✅ Interactive dashboards and maps
- ✅ AI-powered chat interface
- ✅ Automated CI/CD pipeline
- ✅ Scalable cloud deployment

## 🆘 Need Help?

1. Check the [full README](README.md) for detailed instructions
2. View [troubleshooting guide](DEPLOYMENT-STATUS.md)
3. Open an issue on GitHub

The app will be available at your Cloud Run URL after deployment!