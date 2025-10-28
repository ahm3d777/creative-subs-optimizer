# Creative Subs Optimizer

A self-hosted subscription management tool for creative professionals to track, analyze, and optimize their software subscriptions.

## Features

- 📊 **Dashboard Overview**: Real-time view of all subscriptions and spending
- 🔔 **Smart Alerts**: Renewal reminders and free trial notifications
- 📈 **Spend Analytics**: Visual breakdowns by category and trends
- 🧹 **Dead Weight Detection**: Identify unused subscriptions based on usage patterns
- 👥 **Multi-User Support**: Manage subscriptions for teams or family
- 📤 **Import/Export**: CSV support for easy data migration
- 🔒 **Secure & Private**: Self-hosted, encrypted data, no external APIs

## Tech Stack

- **Frontend**: React.js, Chart.js, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: SQLite (zero-config, file-based)
- **Auth**: JWT with bcrypt
- **Notifications**: Nodemailer (email alerts)

## Quick Start

### Prerequisites

- Node.js 16+ and npm
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/creative-subs-optimizer.git
cd creative-subs-optimizer
```

2. **Install Backend Dependencies**
```bash
cd backend
npm install
```

3. **Install Frontend Dependencies**
```bash
cd ../frontend
npm install
```

4. **Configure Environment Variables**

Create a `.env` file in the `backend` directory:
```env
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development

# Optional: Email notifications (configure your SMTP server)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@subsoptimizer.local
```

Create a `.env` file in the `frontend` directory:
```env
REACT_APP_API_URL=http://localhost:5000
```

5. **Initialize Database**

The database will be automatically created on first run. It's stored at `backend/database.sqlite`.

6. **Start the Application**

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

7. **Access the App**

Open your browser and navigate to: `http://localhost:3000`

## Usage

### First Time Setup

1. **Register an Account**: Click "Sign Up" and create your account
2. **Add Subscriptions**: Click "Add Subscription" to manually enter your subscriptions
3. **Import Data** (Optional): Use the CSV import feature to bulk-add subscriptions
4. **Set Alerts**: Configure renewal reminders and notifications
5. **Explore Analytics**: View your spending breakdown and optimization suggestions

### CSV Import Format

Download the sample CSV template from the app, or use this format:

```csv
name,cost,billing_cycle,category,next_billing_date,last_used,notes
Adobe Creative Cloud,54.99,monthly,Design Tools,2025-11-15,2025-10-20,Essential for client work
Figma Pro,12.00,monthly,Design Tools,2025-11-10,2025-10-25,
GitHub Pro,4.00,monthly,Development,2025-11-01,2025-09-15,Rarely use pro features
```

## Default Accounts

For testing, you can create an account or use these credentials after first run:
- Email: demo@example.com
- Password: demo123

(You'll need to create this account on first launch)

## Project Structure

```
creative-subs-optimizer/
├── backend/
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── utils/          # Helper functions
│   ├── database.sqlite     # SQLite database (auto-created)
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React context providers
│   │   ├── pages/          # Page components
│   │   ├── utils/          # Helper functions
│   │   └── App.js
│   └── package.json
└── README.md
```

## Features Explained

### Dashboard
- View all active subscriptions at a glance
- See total monthly and annual spending
- Quick access to upcoming renewals
- Savings potential calculator

### Alerts System
- Email notifications 7 days before renewal
- Free trial expiration warnings (3 days before)
- Price hike detection (manual entry)
- Unused subscription alerts (90+ days inactive)

### Analytics
- Spending breakdown by category
- Monthly trends visualization
- Cost per category comparison
- ROI insights for creative tools

### Dead Weight Detection
- Rule-based analysis: subscriptions unused for 90+ days
- Overlap detection: similar tools you're paying for
- Downgrade suggestions based on usage patterns

## Deployment

### Option 1: Local/Home Server

1. Set `NODE_ENV=production` in backend `.env`
2. Build frontend: `cd frontend && npm run build`
3. Serve frontend build folder with backend or use Nginx
4. Run with PM2 for process management:
```bash
npm install -g pm2
cd backend
pm2 start server.js --name subs-optimizer
```

### Option 2: VPS (DigitalOcean, Linode, etc.)

1. Clone repo to your VPS
2. Follow installation steps
3. Configure Nginx as reverse proxy
4. Set up SSL with Let's Encrypt
5. Use PM2 or systemd for process management

### Option 3: Docker (Coming Soon)

Dockerfile and docker-compose.yml will be added for containerized deployment.

## Security Considerations

- **Change JWT Secret**: Always use a strong, unique JWT secret in production
- **HTTPS**: Use SSL/TLS in production (Let's Encrypt is free)
- **Database Backups**: Regularly backup `database.sqlite`
- **Email Security**: Use app-specific passwords for email services
- **Firewall**: Configure firewall to only expose necessary ports

## Troubleshooting

### Database Issues
- Delete `backend/database.sqlite` to reset database
- Check file permissions for write access

### Port Conflicts
- Change ports in `.env` files if 3000/5000 are in use

### Email Notifications Not Working
- Verify SMTP credentials
- Check spam folder
- Use app-specific passwords for Gmail/Yahoo

### Frontend Can't Connect to Backend
- Ensure backend is running on correct port
- Check `REACT_APP_API_URL` in frontend `.env`
- Verify CORS settings in backend

## Contributing

This is a self-hosted, open-source project. Contributions welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Roadmap

- [ ] Docker containerization
- [ ] Mobile-responsive improvements
- [ ] Dark mode
- [ ] Advanced reporting
- [ ] Category customization
- [ ] Multi-currency support
- [ ] Data export to PDF
- [ ] Browser extension for quick add

## License

MIT License - feel free to use for personal or commercial projects

## Support

For issues or questions:
- Open an issue on GitHub
- Check the troubleshooting section
- Review closed issues for solutions

---

**Built for creative professionals who want control over their subscription spending without sacrificing privacy.** 🎨💰
