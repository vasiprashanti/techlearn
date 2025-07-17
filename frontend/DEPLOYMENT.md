# TechLearn Frontend Deployment Guide

## Netlify Deployment

### Prerequisites
- GitHub repository with your code
- Netlify account (free tier available)

### Deployment Steps

#### Option 1: Deploy via Netlify Dashboard (Recommended)

1. **Connect to Git:**
   - Go to [Netlify](https://netlify.com) and sign in
   - Click "New site from Git"
   - Choose your Git provider (GitHub, GitLab, Bitbucket)
   - Select your repository: `TLS-LearnPage`

2. **Configure Build Settings:**
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/dist`
   - Node.js version: 18.x (set in Environment variables)

3. **Environment Variables:**
   - Go to Site settings > Environment variables
   - Add the following variables:
     ```
     VITE_API_URL=https://your-backend-url.com/api
     NODE_VERSION=18
     ```

4. **Deploy:**
   - Click "Deploy site"
   - Netlify will automatically build and deploy your site

#### Option 2: Deploy via Netlify CLI

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify:**
   ```bash
   netlify login
   ```

3. **Deploy from frontend directory:**
   ```bash
   cd frontend
   netlify deploy --prod --dir=dist
   ```

### Configuration Files

- `netlify.toml`: Contains build settings and redirect rules
- `.env.example`: Template for environment variables

### Important Notes

1. **SPA Routing:** The `netlify.toml` file includes redirect rules for React Router
2. **Environment Variables:** Make sure to set `VITE_API_URL` to your backend URL
3. **Build Optimization:** Consider code splitting for the large bundle size warning
4. **Security Headers:** Basic security headers are configured in `netlify.toml`

### Post-Deployment

1. **Custom Domain:** Configure your custom domain in Netlify dashboard
2. **HTTPS:** Netlify provides free SSL certificates
3. **Continuous Deployment:** Pushes to your main branch will auto-deploy

### Troubleshooting

- **Build Fails:** Check Node.js version and dependencies
- **404 Errors:** Ensure redirect rules are properly configured
- **API Errors:** Verify `VITE_API_URL` environment variable
- **Large Bundle:** Consider implementing code splitting

### Performance Optimization

- Enable Netlify's asset optimization
- Configure caching headers (already set in netlify.toml)
- Consider using Netlify's image optimization features
