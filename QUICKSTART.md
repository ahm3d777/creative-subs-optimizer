# Creative Subs Optimizer - Quick Start Guide

## 🚀 Get Your App Running in 5 Minutes

### Step 1: Extract the Files
```bash
unzip creative-subs-optimizer.zip
cd creative-subs-optimizer
```

### Step 2: Set Up Backend
```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env and change JWT_SECRET to something secure
# Example: JWT_SECRET=my-super-secret-key-abc123xyz789

# Start the backend server
npm start
```

The backend will run on http://localhost:5000

### Step 3: Set Up Frontend (in a new terminal)
```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start the frontend
npm start
```

The app will automatically open in your browser at http://localhost:3000

### Step 4: Create Your Account
1. Click "Sign Up" on the login page
2. Enter your email and password
3. Start adding subscriptions!

---

## 📝 First Steps After Login

1. **Add a Subscription**: Click "+ Add Subscription" button
2. **Import CSV**: Use the sample-subscriptions.csv file to test bulk import
3. **View Analytics**: Check out the Analytics page for insights
4. **Configure Alerts**: Go to Settings to customize your notification preferences

---

## 🎯 Common Tasks

### Add a Subscription Manually
- Dashboard or Subscriptions page → "+ Add Subscription"
- Fill in: Name, Cost, Billing Cycle, Category, Next Billing Date
- Click "Add Subscription"

### Import from CSV
- Subscriptions page → "Import CSV" button
- Use this format:
  ```csv
  name,cost,billing_cycle,category,next_billing_date,last_used,notes
  Adobe CC,54.99,monthly,Design Tools,2025-11-15,2025-10-20,Essential
  ```

### Mark Subscription as Used
- Subscriptions page → Click "✓ Used" button next to any subscription
- This updates the "Last Used" date to today

### View Potential Savings
- Dashboard → Check the "Dead Weight" alert
- Analytics page → See detailed unused subscriptions and recommendations

---

## 🔧 Configuration

### Enable Email Notifications (Optional)

Edit `backend/.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@subsoptimizer.local
```

**For Gmail:**
1. Go to Google Account → Security
2. Enable 2-Factor Authentication
3. Create an App Password
4. Use the App Password in SMTP_PASS

### Change Default Settings
- Go to Settings page
- Adjust renewal reminder days (default: 7)
- Adjust unused threshold days (default: 90)

---

## 📊 Features Overview

### Dashboard
- Total monthly and yearly spending
- Active subscriptions count
- Upcoming renewals (next 30 days)
- Potential savings alerts

### Subscriptions
- Full CRUD (Create, Read, Update, Delete)
- Mark subscriptions as "used"
- Import/Export CSV
- Filter and sort

### Analytics
- Spending by category (pie chart)
- Monthly spending trends (line chart)
- Dead weight detection
- Optimization recommendations

### Settings
- Profile management
- Email notification preferences
- Alert thresholds
- System information

---

## 🛠️ Troubleshooting

### Backend won't start
- Check if port 5000 is available: `lsof -i :5000`
- Make sure you ran `npm install` in the backend folder
- Check the .env file exists

### Frontend won't start
- Check if port 3000 is available: `lsof -i :3000`
- Make sure you ran `npm install` in the frontend folder
- Verify REACT_APP_API_URL in frontend/.env

### Can't login after creating account
- Check that backend is running
- Open browser console (F12) for error messages
- Make sure JWT_SECRET is set in backend/.env

### Email notifications not working
- SMTP configuration is optional
- Verify your SMTP credentials are correct
- Check backend console for email errors
- For Gmail, use App Password not regular password

---

## 📦 Deployment to Production

### Option 1: Simple VPS (DigitalOcean, Linode, etc.)

1. **Install Node.js on your server**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **Upload your app**
   ```bash
   scp creative-subs-optimizer.zip user@your-server:/home/user/
   ssh user@your-server
   unzip creative-subs-optimizer.zip
   ```

3. **Set up and build**
   ```bash
   cd creative-subs-optimizer/backend
   npm install --production
   
   cd ../frontend
   npm install
   npm run build
   ```

4. **Install PM2 for process management**
   ```bash
   sudo npm install -g pm2
   cd ../backend
   pm2 start server.js --name subs-optimizer
   pm2 save
   pm2 startup
   ```

5. **Set up Nginx as reverse proxy**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           root /home/user/creative-subs-optimizer/frontend/build;
           try_files $uri $uri/ /index.html;
       }
       
       location /api {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

6. **Enable SSL with Let's Encrypt**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

### Option 2: Docker (Coming Soon)
Dockerfile and docker-compose will be added in future updates.

---

## 💡 Tips for Best Results

1. **Update "Last Used" regularly**: Click "✓ Used" when you use a subscription
2. **Review Analytics weekly**: Check for unused subscriptions
3. **Set realistic alert thresholds**: Adjust in Settings based on your usage
4. **Export backups**: Regularly export your data to CSV
5. **Check recommendations**: Review the optimization suggestions monthly

---

## 🆘 Need Help?

- Check the main README.md for detailed documentation
- Review the troubleshooting section above
- Open an issue on GitHub if you encounter bugs

---

**You're all set! Start optimizing your subscriptions now.** 💰✨
