Instructions:
1) Build and test locally.
2) Push to GitHub main.
3) GitHub Action will build and deploy to Cloud Run.
Secrets required in GitHub repo settings:
- GCP_PROJECT_ID
- GCP_SA_KEY (service account JSON)
- JWT_SECRET (in GCP Secret Manager)
- MONGO_URI

Frontend: run `npm run build` and deploy `dist/` to Firebase Hosting or Vercel. Configure VITE_API_URL to point to Cloud Run URL.
