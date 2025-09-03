# SCMOpt - Supply Chain Management Optimization System

A comprehensive web application for supply chain management optimization, featuring ABC analysis, Vehicle Routing Problem (VRP) solving, inventory optimization, and interactive data visualization.

## 🚀 Features

- **ABC Analysis**: Product and customer classification by importance
- **Vehicle Routing Problem (VRP)**: Multi-constraint vehicle routing with real-world distance calculations
- **Inventory Optimization**: Safety stock calculations, lot sizing, and demand forecasting
- **Interactive Visualizations**: Plotly-based charts and Leaflet maps
- **Google Authentication**: Secure access control
- **AI Chat Interface**: Integrated Ollama/Gemini support for optimization guidance

## 🏗️ Architecture

- **Frontend**: React TypeScript with Material-UI
- **Backend**: FastAPI with complete notebook algorithm ports
- **Authentication**: Google OAuth 2.0
- **Maps**: OSRM integration for real-world routing
- **Deployment**: Docker containerization with Google Cloud Run support

## 📋 Prerequisites

- Node.js 18+ 
- Python 3.10+
- Docker (for containerization)
- Google Cloud SDK (for deployment)
- Google OAuth Client ID (for authentication)

## 🛠️ Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/[your-username]/scmopt.git
cd scmopt
```

### 2. Backend Setup

```bash
cd webapp
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm start
```

The application will be available at `http://localhost:3000` with the API at `http://localhost:8000`.

### 4. Environment Configuration

Create a `.env.local` file in the frontend directory:

```bash
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
REACT_APP_API_BASE_URL=http://localhost:8000
```

## 🚀 Deployment to Google Cloud Run

### Option 1: Automated GitHub Actions Deployment (Recommended)

1. **Fork this repository** to your GitHub account

2. **Set up Google Cloud Project**:
   ```bash
   gcloud projects create [PROJECT_ID]
   gcloud config set project [PROJECT_ID]
   gcloud services enable cloudbuild.googleapis.com run.googleapis.com
   ```

3. **Create Service Account**:
   ```bash
   gcloud iam service-accounts create github-actions \
     --description="Service account for GitHub Actions" \
     --display-name="GitHub Actions"

   gcloud projects add-iam-policy-binding [PROJECT_ID] \
     --member="serviceAccount:github-actions@[PROJECT_ID].iam.gserviceaccount.com" \
     --role="roles/run.admin"

   gcloud projects add-iam-policy-binding [PROJECT_ID] \
     --member="serviceAccount:github-actions@[PROJECT_ID].iam.gserviceaccount.com" \
     --role="roles/storage.admin"

   gcloud projects add-iam-policy-binding [PROJECT_ID] \
     --member="serviceAccount:github-actions@[PROJECT_ID].iam.gserviceaccount.com" \
     --role="roles/iam.serviceAccountUser"

   gcloud iam service-accounts keys create key.json \
     --iam-account=github-actions@[PROJECT_ID].iam.gserviceaccount.com
   ```

4. **Configure GitHub Secrets**:
   Go to your repository Settings > Secrets and variables > Actions, and add:
   - `GCP_PROJECT_ID`: Your Google Cloud project ID
   - `GCP_SA_KEY`: Content of the key.json file (entire JSON content)
   - `GOOGLE_CLIENT_ID`: Your Google OAuth client ID

5. **Trigger Deployment**:
   - Push to the `main` branch or manually trigger the "Deploy to Cloud Run" workflow
   - The GitHub Action will automatically build and deploy your application

### Option 2: Manual Deployment

1. **Authenticate with Google Cloud**:
   ```bash
   gcloud auth login
   gcloud config set project [PROJECT_ID]
   ```

2. **Build and Deploy**:
   ```bash
   chmod +x deploy-to-cloud-run.sh
   # Edit the PROJECT_ID in the script first
   ./deploy-to-cloud-run.sh
   ```

3. **Configure Environment Variables** (after deployment):
   ```bash
   gcloud run services update scmopt --region asia-northeast1 \
     --set-env-vars "GOOGLE_CLIENT_ID=[your-client-id]"
   ```

### Option 3: One-Click Deploy

[![Run on Google Cloud](https://deploy.cloud.run/button.svg)](https://deploy.cloud.run/?git_repo=https://github.com/[your-username]/scmopt.git)

## 🔧 Configuration

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" > "Credentials"
3. Create OAuth 2.0 Client ID for web application
4. Add authorized origins:
   - `http://localhost:3000` (for development)
   - `https://your-app-name-hash.a.run.app` (for production)

### API Keys

The application supports both Ollama and Gemini API providers:
- **Ollama**: Configure URL in the settings (default: localhost:11434)
- **Gemini**: Enter API key in the application settings

## 📖 API Documentation

Once deployed, visit `/docs` for the interactive API documentation (Swagger UI).

### Key Endpoints

- `POST /api/v1/abc/analysis` - Run ABC analysis
- `POST /api/v1/vrp/solve` - Solve vehicle routing problems  
- `POST /api/v1/inventory/optimize` - Optimize inventory levels
- `GET /api/v1/health` - Health check

## 🧪 Testing

### Backend Tests
```bash
cd webapp
pytest tests/ -v
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 🐳 Docker

### Build Locally
```bash
docker build -t scmopt:latest .
```

### Run with Docker
```bash
docker run -p 8080:8080 \
  -e GOOGLE_CLIENT_ID="your-client-id" \
  scmopt:latest
```

## 📁 Project Structure

```
scmopt/
├── .github/workflows/        # GitHub Actions
│   └── deploy.yml           # Automated deployment workflow
├── frontend/                 # React TypeScript frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── services/        # API client
│   │   └── types/           # TypeScript definitions
│   └── package.json
├── webapp/                   # FastAPI backend
│   ├── app/
│   │   ├── api/endpoints/   # API route handlers
│   │   ├── services/        # Business logic
│   │   └── models/          # Pydantic models
│   └── requirements.txt
├── nbs/                      # Original Jupyter notebooks
├── Dockerfile               # Multi-stage Docker build
├── deploy-to-cloud-run.sh   # Manual deployment script
├── cloudbuild.yaml          # Google Cloud Build configuration
└── README.md                # This file
```

## 🔒 Security

- Google OAuth 2.0 authentication for all routes
- CORS properly configured for production
- No hardcoded secrets or API keys
- Input validation on all API endpoints

## 🚨 Troubleshooting

### Common Issues

1. **Architecture mismatch on Apple Silicon**: Use GitHub Actions for deployment or build from Linux environment
2. **Google OAuth errors**: Verify client ID and authorized origins
3. **CORS issues**: Check frontend URL in backend CORS configuration

### View Deployment Logs
```bash
# View Cloud Run logs
gcloud logging read "resource.type=cloud_run_revision" --limit 50

# View build logs
gcloud builds list
gcloud builds log [BUILD_ID]
```

### Local Development Issues
- Backend logs appear in terminal where uvicorn is running
- Frontend logs in browser developer console
- API documentation available at `http://localhost:8000/docs`

## 🚀 GitHub Repository Setup Instructions

### Step-by-Step GitHub Deployment

1. **Create New Repository on GitHub**
   - Go to GitHub.com and create a new repository named `scmopt`
   - Choose "Public" or "Private" as needed
   - Don't initialize with README (we have one)

2. **Upload Code to GitHub**
   ```bash
   # In your local project directory
   git init
   git add .
   git commit -m "Initial commit: Complete SCM optimization web application"
   git branch -M main
   git remote add origin https://github.com/[your-username]/scmopt.git
   git push -u origin main
   ```

3. **Set up Google Cloud Project**
   ```bash
   # Create new project (replace [PROJECT_ID] with your choice)
   gcloud projects create [PROJECT_ID]
   gcloud config set project [PROJECT_ID]
   
   # Enable required services
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable run.googleapis.com
   gcloud services enable containerregistry.googleapis.com
   ```

4. **Create Service Account for GitHub Actions**
   ```bash
   # Create service account
   gcloud iam service-accounts create github-actions

   # Grant necessary permissions
   gcloud projects add-iam-policy-binding [PROJECT_ID] \
     --member="serviceAccount:github-actions@[PROJECT_ID].iam.gserviceaccount.com" \
     --role="roles/run.admin"

   gcloud projects add-iam-policy-binding [PROJECT_ID] \
     --member="serviceAccount:github-actions@[PROJECT_ID].iam.gserviceaccount.com" \
     --role="roles/storage.admin"

   gcloud projects add-iam-policy-binding [PROJECT_ID] \
     --member="serviceAccount:github-actions@[PROJECT_ID].iam.gserviceaccount.com" \
     --role="roles/iam.serviceAccountUser"

   # Create and download key
   gcloud iam service-accounts keys create key.json \
     --iam-account=github-actions@[PROJECT_ID].iam.gserviceaccount.com
   ```

5. **Configure GitHub Secrets**
   - Go to your repository on GitHub
   - Navigate to Settings → Secrets and variables → Actions
   - Click "New repository secret" and add:
     - **Name**: `GCP_PROJECT_ID`, **Value**: Your project ID
     - **Name**: `GCP_SA_KEY`, **Value**: Entire content of key.json file
     - **Name**: `GOOGLE_CLIENT_ID`, **Value**: Your Google OAuth client ID

6. **Set up Google OAuth**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized origins:
     - `http://localhost:3000` (for development)
     - `https://scmopt-[random].a.run.app` (will be assigned after first deployment)

7. **Deploy**
   - Push any commit to the `main` branch
   - Or go to Actions tab and manually trigger the workflow
   - The deployment will automatically start

8. **Configure Production URLs**
   - After first deployment, check the Cloud Run service URL
   - Update Google OAuth credentials with the production URL
   - Update any hardcoded URLs in your application

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Original algorithms ported from Jupyter notebooks
- OSRM for real-world routing calculations
- Google Cloud Platform for hosting
- Material-UI for React components

## 📞 Support

For support, create an issue in the GitHub repository or contact the development team.