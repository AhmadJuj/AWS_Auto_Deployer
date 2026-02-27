# Deploying to Render

This guide will help you deploy the MERN Deployer to Render for a public-facing website.

## Prerequisites

1. A [Render account](https://render.com) (free tier works)
2. Your GitHub repository pushed to GitHub
3. All your environment variables ready (GitHub OAuth, AWS credentials)

## Deployment Steps

### Option 1: Using render.yaml (Recommended - Automatic Setup)

1. **Push your code to GitHub** (if not already)
   ```bash
   git add .
   git commit -m "Add Render deployment config"
   git push
   ```

2. **Create New Blueprint Instance on Render**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New" → "Blueprint"
   - Connect your GitHub repository
   - Render will automatically detect `render.yaml` and create:
     - Redis service
     - Web service (your app)

3. **Configure Environment Variables**
   
   After creation, go to your web service and add these environment variables:
   
   ```
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   NEXTAUTH_URL=https://your-app-name.onrender.com
   NEXTAUTH_SECRET=generate-a-random-32-char-string
   AWS_ACCESS_KEY_ID=your_aws_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret
   AWS_S3_BUCKET_NAME=your-bucket-name
   AWS_CLOUDFRONT_DISTRIBUTION_ID=your-cloudfront-id
   ```

4. **Update GitHub OAuth Callback**
   - Go to your GitHub OAuth App settings
   - Update the callback URL to: `https://your-app-name.onrender.com/api/auth/callback/github`

5. **Deploy!**
   - Render will automatically build and deploy your Docker container
   - Your app will be available at `https://your-app-name.onrender.com`

### Option 2: Manual Setup

If you prefer manual setup:

1. **Create Redis Instance**
   - Dashboard → New → Redis
   - Name: `mern-deployer-redis`
   - Plan: Free
   - Create

2. **Create Web Service**
   - Dashboard → New → Web Service
   - Connect your repository
   - Settings:
     - **Name**: `mern-deployer`
     - **Environment**: Docker
     - **Plan**: Free (or paid for better performance)
     - **Dockerfile Path**: `./Dockerfile`

3. **Add Environment Variables** (same as above)

4. **Link Redis**
   - In your web service settings
   - Add environment variable:
     - `REDIS_HOST`: Copy from your Redis service internal hostname
     - `REDIS_PORT`: 6379

## Important Notes

### Free Tier Limitations
- **Render Free Tier spins down after 15 minutes of inactivity**
- First request after spin-down takes ~1 minute to wake up
- Consider upgrading to a paid plan ($7/month) for 24/7 availability

### Redis Connection
- The app automatically connects to Redis using `REDIS_HOST` and `REDIS_PORT`
- Render's managed Redis is recommended for simplicity

### Environment Variables
Make sure to set `NEXTAUTH_URL` to your actual Render URL:
```
NEXTAUTH_URL=https://your-actual-app-name.onrender.com
```

### GitHub OAuth
Update your GitHub OAuth app with the new callback URL from Render.

## Monitoring

- **Logs**: Available in Render Dashboard → Your Service → Logs
- **Metrics**: Dashboard shows CPU, Memory, and Request metrics
- **Shell Access**: Dashboard → Shell tab for debugging

## Updating Your Deployment

Render auto-deploys when you push to your main branch:
```bash
git add .
git commit -m "Update feature"
git push
```

Render will automatically rebuild and redeploy.

## Troubleshooting

### App won't start
- Check logs in Render dashboard
- Verify all environment variables are set
- Ensure Redis service is running

### Deployment fails
- Check Dockerfile builds locally: `docker build -t test .`
- Verify all dependencies in package.json

### Redis connection issues
- Verify `REDIS_HOST` points to internal Redis hostname
- Check Redis service is running
- Ensure Redis and web service are in same region

## Cost Estimate

**Free Tier:**
- Web Service: Free (with spin-down)
- Redis: Free (25MB)
- Total: $0/month

**Production Ready:**
- Web Service: $7/month (Starter plan)
- Redis: $10/month (1GB)
- Total: $17/month

## Alternative: Deploy to Other Platforms

This Docker setup also works on:
- **Railway.app** - Similar to Render, supports docker-compose
- **Fly.io** - Global edge deployment
- **DigitalOcean App Platform** - Managed container platform
- **AWS ECS/Fargate** - Enterprise-grade container hosting
