# Docker Deployment Guide

Deploy your MERN Deployer application using Docker - everything pre-configured, no Redis or complex setup needed!

## 🚀 Quick Start

### 1. Prerequisites
- Docker and Docker Compose installed
- GitHub OAuth App credentials
- AWS credentials (Access Key, Secret Key, S3 Bucket, CloudFront)

### 2. Configuration

Copy the environment template:
```bash
cp .env.docker .env
```

Edit `.env` with your credentials:
```env
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
SESSION_SECRET=generate-a-long-random-string-here
NEXTAUTH_SECRET=generate-another-long-random-string
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-bucket-name
AWS_CLOUDFRONT_DISTRIBUTION_ID=your-cf-id
```

### 3. Build and Run

**Option A: All-in-One Container (Simplest)**
```bash
docker build -t mern-deployer -f Dockerfile .
docker run -p 3000:3000 -p 5000:5000 --env-file .env mern-deployer
```

**Option B: Separate Containers (Recommended)**
```bash
docker-compose up -d
```

### 4. Access Your Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📦 Deployment Options

### Deploy to Any Docker Platform

This works with ANY platform that supports Docker:

#### **Railway.app** (Easiest, Free Tier)
1. Push your code to GitHub
2. Go to [Railway.app](https://railway.app)
3. Click "New Project" → "Deploy from GitHub"
4. Select your repository
5. Railway auto-detects Dockerfile
6. Add environment variables in Settings
7. Done! Railway provides a public URL

#### **Fly.io** (Great for Docker)
```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login
flyctl auth login

# Launch app
flyctl launch

# Add secrets
flyctl secrets set GITHUB_CLIENT_ID=xxx GITHUB_CLIENT_SECRET=yyy AWS_ACCESS_KEY_ID=zzz ...

# Deploy
flyctl deploy
```

#### **DigitalOcean App Platform**
1. Push to GitHub
2. Go to DigitalOcean → App Platform
3. Create New App from GitHub
4. Select your repository
5. It detects Dockerfile automatically
6. Add environment variables
7. Deploy!

#### **Render.com** (Docker Support)
1. Create new Web Service on Render
2. Connect your GitHub repo
3. Runtime: Docker
4. Add environment variables
5. Deploy

#### **Google Cloud Run**
```bash
# Build and push
gcloud builds submit --tag gcr.io/YOUR_PROJECT/mern-deployer

# Deploy
gcloud run deploy mern-deployer \
  --image gcr.io/YOUR_PROJECT/mern-deployer \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

#### **AWS ECS/Fargate**
1. Push image to AWS ECR
2. Create ECS Task Definition using your image
3. Create ECS Service
4. Configure ALB for ports 3000 and 5000

#### **Azure Container Instances**
```bash
az container create \
  --resource-group myResourceGroup \
  --name mern-deployer \
  --image mern-deployer:latest \
  --dns-name-label mern-deployer \
  --ports 3000 5000
```

## 🔧 Docker Commands

### Build Images
```bash
# All-in-one image
docker build -t mern-deployer -f Dockerfile .

# Separate images
docker build -t mern-deployer-frontend -f Dockerfile.frontend .
docker build -t mern-deployer-backend -f Dockerfile.backend .
```

### Run Containers
```bash
# With docker-compose
docker-compose up -d          # Start in background
docker-compose logs -f        # View logs
docker-compose down           # Stop everything

# Manual run
docker run -d -p 3000:3000 -p 5000:5000 --env-file .env mern-deployer
```

### Manage
```bash
# View running containers
docker ps

# View logs
docker logs mern-deployer-backend
docker logs mern-deployer-frontend

# Stop containers
docker stop mern-deployer-backend mern-deployer-frontend

# Remove containers
docker rm mern-deployer-backend mern-deployer-frontend

# Clean up
docker system prune -a
```

## 🌐 Production Deployment Checklist

- [ ] Set strong `SESSION_SECRET` and `NEXTAUTH_SECRET` (32+ characters)
- [ ] Update GitHub OAuth callback URL to your production domain
- [ ] Configure AWS credentials with appropriate IAM permissions
- [ ] Set `FRONTEND_URL` to your actual domain
- [ ] Enable HTTPS (most platforms do this automatically)
- [ ] Configure domain DNS to point to your deployment
- [ ] Set up monitoring and alerts
- [ ] Configure backups for deployment data

## 🎯 What's Included

- ✅ **No Redis Required** - Uses file-based deployment tracking
- ✅ **No Complex Setup** - Everything in Docker
- ✅ **Both Frontend & Backend** - All services included
- ✅ **Persistent Storage** - Deployment data preserved in volumes
- ✅ **Auto-restart** - Containers restart on failure
- ✅ **Production Ready** - Optimized builds

## 📊 Architecture

```
┌─────────────────┐
│  Load Balancer  │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼──────┐
│ :3000 │ │  :5000  │
│ Next  │ │ Express │
│  .js  │ │ Backend │
└───────┘ └─────────┘
    │         │
    └────┬────┘
         │
    ┌────▼────┐
    │ Volumes │
    │ (dist,  │
    │  temp)  │
    └─────────┘
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Find and kill process on port 3000 or 5000
lsof -ti:3000 | xargs kill -9
lsof -ti:5000 | xargs kill -9
```

### Container Won't Start
```bash
# Check logs
docker logs mern-deployer-backend
docker logs mern-deployer-frontend

# Rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Environment Variables Not Working
- Ensure `.env` file exists in project root
- Check variable names match exactly
- Restart containers after changing .env

### Deployment Fails
- Check AWS credentials are correct
- Verify S3 bucket exists and is accessible
- Ensure IAM permissions allow S3 and CloudFront operations

## 💡 Tips

1. **For Development**: Use `docker-compose up` (without -d) to see logs
2. **For Production**: Always use environment-specific secrets
3. **Scaling**: Use Docker Swarm or Kubernetes for multiple instances
4. **Monitoring**: Add health check endpoints and monitoring tools
5. **Updates**: Rebuild images when code changes: `docker-compose up -d --build`

## 📝 Notes

- Frontend runs on port 3000
- Backend runs on port 5000
- Deployment data persists in Docker volumes
- GitHub OAuth callback must match your deployment URL
- AWS credentials needed for S3/CloudFront deployments
