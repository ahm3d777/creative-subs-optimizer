# Creative Subs Optimizer - Vercel Edition

A self-hosted subscription management tool for creative professionals, optimized for **Vercel deployment**.

## ✨ Key Features

- 📊 **Dashboard Overview** - Real-time spending analytics
- 💳 **Subscription Management** - Add, edit, delete subscriptions
- 📈 **Smart Analytics** - Visual charts and spending trends
- 🧹 **Dead Weight Detection** - Identify unused subscriptions
- 💡 **Recommendations** - AI-powered savings suggestions
- 🔒 **Secure** - JWT authentication with Vercel Postgres

---

## 🚀 Deploy to Vercel (5 Minutes)

### Prerequisites

- GitHub account
- Vercel account (free at https://vercel.com)

### Step 1: Push to GitHub

```bash
# If you haven't already, initialize git
git init
git add .
git commit -m "Initial commit - Vercel edition"

# Push to your GitHub repository
git remote add origin https://github.com/yourusername/your-repo-name.git
git branch -M main
git push -u origin main
```

### Step 2: Import to Vercel

1. Go to https://vercel.com/new
2. Click "Import Project"
3. Select your GitHub repository
4. Vercel will auto-detect settings ✅

### Step 3: Add Vercel Postgres Database

1. In your Vercel project dashboard, go to **Storage** tab
2. Click "Create Database"
3. Select **Postgres**
4. Choose **free Hobby tier** (5000 rows, perfect for personal use)
5. Click "Create"
6. Vercel will automatically add database environment variables

### Step 4: Add Required Environment Variable

In Vercel project settings → **Environment Variables**, add:

```
JWT_SECRET = your-super-secret-key-change-this-in-production
```

(Generate a random string for security)

### Step 5: Deploy!

Click **"Deploy"** - Vercel will:
- ✅ Build your React frontend
- ✅ Deploy serverless API functions
- ✅ Connect to Postgres database
- ✅ Give you a live URL!

⏳ **Wait 2-3 minutes...**

🎉 **Your app is live!** Visit: `https://your-project.vercel.app`

---

## 📊 Database Auto-Initialization

The database tables are automatically created on first API call. No manual setup needed!

Tables created:
- `users` - User accounts
- `subscriptions` - Subscription data
- `user_settings` - User preferences

---

## 🔧 Local Development

### Install Dependencies

```bash
npm install
```

### Set Up Local Postgres (Optional)

For local development, you can use Vercel's local Postgres:

```bash
# Install Vercel CLI
npm i -g vercel

# Link to your project
vercel link

# Pull environment variables (including database connection)
vercel env pull .env.local

# Start development server
npm run dev
```

The app will run at `http://localhost:3000`

---

## 📁 Project Structure

```
subs-optimizer-vercel/
├── api/                    # Serverless API functions
│   ├── auth/              # Authentication endpoints
│   │   ├── register.js
│   │   ├── login.js
│   │   └── me.js
│   ├── subscriptions/     # CRUD operations
│   │   ├── index.js
│   │   └── [id].js
│   ├── analytics/         # Analytics endpoints
│   └── lib/               # Shared utilities
│       ├── db.js          # Vercel Postgres
│       └── auth.js        # JWT middleware
├── src/                   # React frontend
│   ├── components/
│   ├── pages/
│   ├── contexts/
│   └── utils/
├── public/
├── package.json
└── vercel.json           # Vercel configuration
```

---

## 🌐 API Endpoints

All API routes are automatically available at `/api/*`:

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Subscriptions
- `GET /api/subscriptions` - List all
- `POST /api/subscriptions` - Create new
- `GET /api/subscriptions/[id]` - Get one
- `PUT /api/subscriptions/[id]` - Update
- `DELETE /api/subscriptions/[id]` - Delete

### Analytics
- `GET /api/analytics/overview` - Spending overview
- `GET /api/analytics/by-category` - Category breakdown
- `GET /api/analytics/dead-weight` - Unused subscriptions
- `GET /api/analytics/trends` - Spending trends
- `GET /api/analytics/recommendations` - Savings tips

---

## ⚙️ Environment Variables

Required in Vercel:

```env
# Automatically added by Vercel Postgres
POSTGRES_URL
POSTGRES_PRISMA_URL
POSTGRES_URL_NON_POOLING
POSTGRES_USER
POSTGRES_HOST
POSTGRES_PASSWORD
POSTGRES_DATABASE

# You must add this
JWT_SECRET=your-secret-key-here
```

---

## 🎨 Features Overview

### Dashboard
- Total monthly/yearly spending
- Active subscriptions count
- Upcoming renewals
- Quick action buttons

### Subscriptions
- Full CRUD operations
- CSV import/export
- Mark subscriptions as "used"
- Filter by category

### Analytics
- Pie charts (spending by category)
- Line graphs (spending trends)
- Dead weight detection
- Optimization recommendations

### Settings
- Profile management
- Notification preferences
- Usage thresholds

---

## 🔒 Security Features

- ✅ JWT token authentication
- ✅ Password hashing with bcrypt
- ✅ Secure Vercel Postgres connection
- ✅ CORS protection
- ✅ Environment variable protection

---

## 💰 Pricing (Free Tier Limits)

**Vercel Free Tier:**
- Unlimited deployments
- 100GB bandwidth/month
- Automatic HTTPS

**Vercel Postgres Hobby:**
- 5,000 rows (plenty for personal use)
- 256 MB storage
- 60 hours compute time/month

**Perfect for:**
- Personal use
- Small teams (1-5 users)
- Testing and demos

---

## 🐛 Troubleshooting

### "Database connection failed"
- Ensure Vercel Postgres is created and connected
- Check environment variables are set
- Redeploy after adding database

### "Login not working"
- Verify JWT_SECRET is set in environment variables
- Check browser console for errors
- Clear browser cache and cookies

### "API errors"
- Check Vercel Function Logs in dashboard
- Ensure all environment variables are present
- Try redeploying

---

## 📈 Upgrading

Need more capacity?

**Vercel Pro ($20/month):**
- Unlimited bandwidth
- Advanced analytics
- Priority support

**Vercel Postgres Pro ($20/month):**
- 100,000 rows
- 2 GB storage
- More compute time

---

## 🚀 Custom Domain

1. Go to Vercel project → **Settings** → **Domains**
2. Add your custom domain
3. Update DNS records as instructed
4. SSL certificate automatically provisioned!

---

## 📝 CSV Import Format

```csv
name,cost,billing_cycle,category,next_billing_date,last_used,notes
Adobe CC,54.99,monthly,Design Tools,2025-11-15,2025-10-20,Essential
Figma Pro,12.00,monthly,Design Tools,2025-11-10,2025-10-25,
GitHub Pro,4.00,monthly,Development,2025-11-01,,Rarely use
```

---

## 🤝 Contributing

This is a self-hosted personal tool. Feel free to fork and customize!

---

## 📄 License

MIT License - Use freely for personal or commercial projects.

---

## 💡 Tips

1. **Set realistic thresholds** in Settings (default: 90 days unused)
2. **Mark subscriptions as "used"** regularly for accurate analytics
3. **Export data** periodically as backup
4. **Review recommendations** monthly to optimize spending
5. **Check Vercel logs** for API errors

---

## 🆘 Need Help?

- **Vercel Docs**: https://vercel.com/docs
- **Vercel Postgres**: https://vercel.com/docs/storage/vercel-postgres
- **Check Function Logs**: Vercel Dashboard → Your Project → Logs

---

**Built with ❤️ for creative professionals who want control over their subscription spending**

---

## 🎉 You're All Set!

Visit your Vercel URL and start optimizing your subscriptions! 🚀
