A full-stack web application that automates the deployment of GitHub repositories to AWS S3. Built with Next.js, it provides a seamless workflow for cloning, building, and deploying web projects with real-time progress tracking.

---

## 🚀 Features

* **GitHub OAuth Integration** – Sign in with your GitHub account to access your repositories
* **Repository Browser** – View and select from your GitHub repositories
* **Automated Build & Deploy** – Clone, install dependencies, build, and deploy to AWS S3 automatically
* **Build Path Configuration** – Support for monorepos and nested projects
* **Real-time Progress Tracking** – Monitor deployment progress with live updates
* **Job Queue System** – Background processing using BullMQ and Redis
* **S3 Static Hosting** – Deploy static sites directly to AWS S3

---

## 🛠 Tech Stack

**Frontend:** Next.js 16, React, TailwindCSS
**Authentication:** NextAuth.js with GitHub OAuth
**Backend:** Next.js API Routes
**Queue System:** BullMQ + Redis
**Cloud Storage:** AWS S3
**Job Processing:** Node.js Worker

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

* Node.js (v18 or higher)
* npm or yarn
* Redis (running locally or via Docker)
* Git
* AWS Account
* GitHub Account

---

## ⚙️ Setup Instructions

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/AhmadJuj/AWS_Auto_Deployer.git
cd AWS_Auto_Deployer
```

### 2️⃣ Install Dependencies

```bash
npm install
```

---

### 3️⃣ Set Up Redis

#### Option A: Using Docker (Recommended)

```bash
docker run -d --name redis-dev -p 6379:6379 redis:latest
```

#### Option B: Install Redis Locally

**Windows:** Download from Redis for Windows
**Mac:**

```bash
brew install redis && brew services start redis
```

**Linux:**

```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

---

### 4️⃣ Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials.

---

## 🔑 Getting API Keys and Credentials

### GitHub OAuth App

Go to GitHub Developer Settings:
[https://github.com/settings/developers](https://github.com/settings/developers)

* Click **"New OAuth App"**
* Fill in the details:

  * Application name: AWS Auto Deployer
  * Homepage URL: [http://localhost:3000](http://localhost:3000)
  * Authorization callback URL: [http://localhost:3000/api/auth/callback/github](http://localhost:3000/api/auth/callback/github)
* Click **"Register application"**
* Copy the Client ID → `GITHUB_CLIENT_ID`
* Click **"Generate a new client secret"**
* Copy it → `GITHUB_CLIENT_SECRET`

---

### NextAuth Secret

Generate a random secret:

```bash
openssl rand -base64 32
```

Copy the output → `NEXTAUTH_SECRET`

---

### AWS Credentials

* Log in to AWS Console: [https://aws.amazon.com/console/](https://aws.amazon.com/console/)
* Go to **IAM → Users → Create User**
* Attach policy: `AmazonS3FullAccess` (or create a custom policy)
* Go to **Security Credentials → Create Access Key**
* Choose: *Application running outside AWS*
* Copy:

  * Access Key ID → `AWS_ACCESS_KEY_ID`
  * Secret Access Key → `AWS_SECRET_ACCESS_KEY`

---

### AWS S3 Bucket

* Go to S3 Console: [https://s3.console.aws.amazon.com/](https://s3.console.aws.amazon.com/)
* Click **"Create bucket"**
* Enter a unique bucket name → `AWS_S3_BUCKET_NAME`
* Choose your region → `AWS_REGION` (e.g., eu-north-1, us-east-1)
* Uncheck **"Block all public access"** (for static hosting)

Enable Static Website Hosting:

* Go to bucket → Properties → Static website hosting
* Enable it
* Set Index document: `index.html`

Add Bucket Policy (replace your-bucket-name):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

---

## ▶️ Running the Application

### Start the Next.js Development Server

```bash
npm run dev
```

App runs at: [http://localhost:3000](http://localhost:3000)

---

### Start the Worker (Required for Deployments)

Open a new terminal:

```bash
npm run worker
```

The worker processes deployment jobs in the background.

---

## 🔄 How It Works

### Deployment Flow

1. **Sign In** – Authenticate with GitHub OAuth
2. **Browse Repos** – View your GitHub repositories
3. **Select and Configure** – Choose repo and optional build path
4. **Deploy** – Click "Clone Now"
5. **Queue Job** – Job added to Redis queue

### Worker Processing Steps

* Clone repository to temp folder
* Navigate to build path (if specified)
* Install dependencies (`npm install`)
* Build project (`npm run build`)
* Detect build output (`out`, `dist`, `build`, `.next`)
* Upload files to S3
* Clean up temp files
* Return S3 deployment URL

---

## 📁 Build Path Support

For monorepos or nested projects:

Examples:

* `frontend`
* `packages/web`
* `data-analysis_Agent/Frontend`

Leave empty if `package.json` is in the repository root.

---

## 📂 Project Structure

```
.
├── app/
│   ├── api/
│   │   ├── auth/      # NextAuth routes
│   │   ├── deploy/    # Deployment API
│   │   └── github/    # GitHub API integration
│   ├── components/    # React components
│   ├── deploy/        # Deploy page
│   ├── repos/         # Repository browser
│   └── page.jsx       # Home page
├── lib/
│   ├── queues/        # BullMQ configuration
│   ├── workers/       # Deployment worker logic
│   └── redis.js       # Redis connection
├── worker.js          # Worker entry point
├── .env.local         # Environment variables
└── package.json
```

---

## 🧯 Troubleshooting

### Redis Connection Issues

**Error:**
Port should be >= 0 and < 65536. Received type number (NaN)

**Solution:**

* Ensure `.env.local` is properly configured
* Ensure Redis is running:

  ```bash
  docker ps
  ```

---

### Worker Not Processing Jobs

**Solution:**
Ensure worker is running:

```bash
npm run worker
```

---

### Build Not Found Error

**Error:** Could not find build output directory

**Solution:**

* Verify build script exists in `package.json`
* Ensure correct build path (monorepos)
* Ensure build generates one of:

  * `out`
  * `dist`
  * `build`
  * `.next`

---

### AWS S3 Upload Fails

**Solution:**

* Verify AWS credentials
* Check IAM permissions
* Confirm bucket exists and name is correct

---

## 🔐 Security Notes

* Never commit `.env.local`
* Use minimal IAM permissions
* Enable MFA on AWS account
* Rotate access keys regularly
* Use separate credentials for production

---

## 📜 Scripts

```bash
npm run dev      # Start development server
npm run build    # Production build
npm start        # Start production server
npm run worker   # Start background worker
npm run lint     # Run ESLint
```

---

## 🤝 Contributing

Contributions are welcome! Feel free to submit a Pull Request.

---

## 📄 License

This project is open source under the MIT License.

---

## 👤 Author

Ahmad Juj
GitHub: [https://github.com/AhmadJuj](https://github.com/AhmadJuj)

---

## 🙌 Acknowledgments

* Next.js team for the amazing framework
* BullMQ for robust job queue management
* AWS for reliable cloud infrastructure
