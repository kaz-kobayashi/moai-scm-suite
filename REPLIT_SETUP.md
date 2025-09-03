# MOAI SCM Suite - Replit Setup Guide

## 🚀 Quick Deploy to Replit

### Method 1: Import from GitHub (Recommended)

1. **Go to Replit.com and log in**
2. **Click "Create Repl"**
3. **Select "Import from GitHub"**
4. **Enter repository URL**: `https://github.com/kaz-kobayashi/moai-scm-suite`
5. **Click "Import from GitHub"**

### Method 2: One-Click Deploy

[![Run on Repl.it](https://replit.com/badge/github/kaz-kobayashi/moai-scm-suite)](https://replit.com/new/github/kaz-kobayashi/moai-scm-suite)

## ⚡ Automatic Setup

The application will automatically:
- ✅ Install Python dependencies
- ✅ Build React frontend
- ✅ Configure FastAPI backend
- ✅ Start the web server

## 🔧 Configuration

### Environment Variables (Optional)

In Replit, go to "Secrets" and add:

- `GOOGLE_CLIENT_ID`: Your Google OAuth Client ID (for authentication)
- `OSRM_HOST`: `test-osrm-intel.aq-cloud.com` (for vehicle routing)

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 Client ID
3. Add authorized origins:
   - `https://[your-repl-name].[your-username].repl.co`
4. Add the Client ID to Replit Secrets

## 🌐 Access Your Application

After deployment, your application will be available at:
`https://[your-repl-name].[your-username].repl.co`

## 📱 Features Available on Replit

- ✅ **Full Web Application**: Complete React frontend + FastAPI backend
- ✅ **Supply Chain Optimization**: ABC Analysis, VRP, Inventory Optimization
- ✅ **Interactive Dashboards**: Charts, graphs, and visualizations
- ✅ **AI Chat Interface**: Gemini AI integration (requires API key)
- ✅ **Real-time Updates**: Development server with hot reload
- ✅ **Mobile Responsive**: Works on all devices

## 🛠️ Development on Replit

### Manual Build (if needed):
```bash
# Build frontend
cd frontend
npm install
npm run build

# Start backend
cd ../webapp  
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8080
```

### File Structure:
```
moai-scm-suite/
├── .replit              # Replit configuration
├── replit.nix          # Nix environment setup
├── start_replit.sh     # Startup script
├── frontend/           # React TypeScript app
├── webapp/             # FastAPI backend
└── nbs/                # Original notebooks
```

## 🔍 Troubleshooting

### If the app doesn't start:
1. Check the Console for error messages
2. Ensure all dependencies are installed
3. Verify the PORT environment variable is set

### If authentication doesn't work:
1. Add your Repl URL to Google OAuth authorized origins
2. Set GOOGLE_CLIENT_ID in Replit Secrets

### For optimization features:
- VRP requires OSRM service (configured automatically)
- Some features may need additional API keys

## 🎯 Next Steps

1. **Test the Application**: Try the ABC Analysis and other features
2. **Customize**: Modify the code to fit your specific needs
3. **Deploy to Production**: Use the GitHub Actions for Google Cloud Run
4. **Share**: Your Repl URL can be shared with others

## 📞 Support

- Check the main [README.md](README.md) for detailed documentation
- Review [DEPLOYMENT_VERIFICATION.md](DEPLOYMENT_VERIFICATION.md) for troubleshooting
- Open issues on the GitHub repository

Your MOAI SCM Suite is now running on Replit! 🎉