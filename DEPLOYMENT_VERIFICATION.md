# Deployment Verification Guide

## ✅ Pre-Deployment Checklist

Before deploying to Google Cloud Run, verify these items:

### 1. Application Code
- [ ] Frontend builds successfully (`npm run build` in frontend/)
- [ ] Backend starts successfully (`uvicorn app.main:app --reload` in webapp/)
- [ ] All tests pass (`npm test` in frontend/, `pytest tests/` in webapp/)
- [ ] Google OAuth client ID is configured
- [ ] API endpoints respond correctly at `/docs`

### 2. Docker Configuration
- [ ] Dockerfile builds successfully
- [ ] Container runs locally (`docker build -t scmopt . && docker run -p 8080:8080 scmopt`)
- [ ] Health check endpoint responds at `/health`
- [ ] Static files are served correctly

### 3. GitHub Repository
- [ ] All code committed and pushed
- [ ] GitHub Actions workflow file exists (`.github/workflows/deploy.yml`)
- [ ] Repository secrets configured:
  - [ ] `GCP_PROJECT_ID`
  - [ ] `GCP_SA_KEY`
  - [ ] `GOOGLE_CLIENT_ID`

### 4. Google Cloud Setup
- [ ] Project created and billing enabled
- [ ] Required APIs enabled (Cloud Build, Cloud Run)
- [ ] Service account created with proper permissions
- [ ] OAuth client configured with correct origins

## 🔍 Post-Deployment Verification

After successful deployment, verify these items:

### 1. Service Availability
```bash
# Get service URL
gcloud run services describe scmopt --region asia-northeast1 --format 'value(status.url)'

# Test health endpoint
curl https://[service-url]/health

# Test API documentation
curl https://[service-url]/docs
```

### 2. Authentication Flow
- [ ] Navigate to the deployed URL
- [ ] Google sign-in button appears
- [ ] Can successfully authenticate with Google account
- [ ] Redirected to main application after authentication
- [ ] User profile displays correctly in header

### 3. Core Functionality
- [ ] Dashboard loads with sample data
- [ ] ABC Analysis runs successfully
- [ ] VRP solver works with sample data
- [ ] Inventory optimization completes
- [ ] Charts and visualizations render
- [ ] Maps display correctly (if using map features)

### 4. AI Chat Interface
- [ ] Chat interface is accessible
- [ ] Can select between Ollama/Gemini providers
- [ ] API key input works for Gemini
- [ ] Chat responses are generated successfully

### 5. Performance
- [ ] Application loads within 5 seconds
- [ ] API responses complete within 30 seconds
- [ ] No console errors in browser developer tools
- [ ] Responsive design works on mobile devices

## 🚨 Common Issues and Solutions

### Issue: "Architecture mismatch" error
**Solution**: This is expected when deploying from Apple Silicon. The GitHub Actions workflow handles this automatically by building in a Linux environment.

### Issue: "Authentication failed" in deployment
**Solution**: 
1. Verify service account has correct roles
2. Check that service account key is valid JSON in GitHub secrets
3. Ensure project ID matches in all configurations

### Issue: "OAuth error" in application
**Solution**:
1. Add the deployed Cloud Run URL to OAuth authorized origins
2. Verify client ID is correct in GitHub secrets
3. Check that OAuth consent screen is configured

### Issue: "502 Bad Gateway" or "503 Service Unavailable"
**Solution**:
1. Check Cloud Run logs: `gcloud logging read "resource.type=cloud_run_revision" --limit 10`
2. Verify container is listening on port 8080
3. Check health endpoint is responding
4. Increase memory/CPU allocation if needed

### Issue: Frontend not loading (404 errors)
**Solution**:
1. Verify static files are built and copied correctly
2. Check Dockerfile copies frontend build to `/static`
3. Ensure FastAPI serves static files with catch-all route

## 📊 Monitoring and Logs

### View Deployment Logs
```bash
# View build logs
gcloud builds list --limit=5
gcloud builds log [BUILD_ID]

# View service logs  
gcloud logging read "resource.type=cloud_run_revision" --limit=20
```

### Monitor Performance
```bash
# View service metrics
gcloud run services describe scmopt --region asia-northeast1

# Check current revisions
gcloud run revisions list --service=scmopt --region=asia-northeast1
```

### Setup Alerts (Optional)
```bash
# Create uptime check
gcloud monitoring uptime check-configs create \
  --display-name="SCMOpt Uptime Check" \
  --http-check-path="/health" \
  --http-check-port=443 \
  --monitored-resource-type="url_check" \
  --hostname="[your-service-url]"
```

## 🔄 Update Deployment

To update your deployment:

1. **Make code changes locally**
2. **Test changes**: Verify locally and run tests
3. **Commit and push**:
   ```bash
   git add .
   git commit -m "Update: description of changes"
   git push origin main
   ```
4. **Monitor deployment**: Watch GitHub Actions and Cloud Run logs
5. **Verify update**: Test key functionality after deployment

## 📞 Support

If you encounter issues:

1. **Check logs first**: GitHub Actions and Cloud Run logs contain most error information
2. **Verify configuration**: Double-check all secrets and environment variables
3. **Test locally**: Ensure the issue isn't in the code itself
4. **Create GitHub issue**: Include logs and steps to reproduce

The deployment should work smoothly with the provided GitHub Actions workflow, which handles the architecture compatibility issues automatically.