# Deployment to Production

## Quick Deploy (5 minutes)

### Prerequisites
- Vercel account (free at https://vercel.com)
- GitHub account (to connect repo)
- Your UPI details configured in `.env`

---

## Option 1: Deploy to Vercel (Easiest)

### Step 1: Create Vercel Account
1. Go to https://vercel.com
2. Click "Sign Up"
3. Choose "Continue with GitHub"
4. Authorize Vercel to access your repos

### Step 2: Import Your Project
1. In Vercel Dashboard, click "Add New..." → "Project"
2. Select your GitHub repository (`Noteshub`)
3. Click "Import"

### Step 3: Configure Environment Variables
1. In Vercel dashboard, go to **Settings** → **Environment Variables**
2. Add these variables:

| Key | Value |
|-----|-------|
| `UPI_PHONE_NUMBER` | 9209287996 |
| `UPI_ID` | 9209287996@okaxis |
| `NODE_ENV` | production |
| `PORT` | 5000 |

3. Click "Save"

### Step 4: Deploy
1. Click the "Deploy" button
2. Wait 2-3 minutes for build to complete
3. You'll get a URL like: `noteshub-abcd1234.vercel.app`

### Step 5: Test Live
1. Open your Vercel URL
2. Test all features
3. Try payment flow with real device
4. Check console for errors

---

## Option 2: Deploy to Render.com

### Step 1: Create Render Account
1. Go to https://render.com
2. Sign up with GitHub

### Step 2: Create New Web Service
1. Dashboard → "New+" → "Web Service"
2. Connect your GitHub repository
3. Select `Noteshub` repo

### Step 3: Configure
1. **Name**: noteshub
2. **Environment**: Node
3. **Build Command**: `npm install`
4. **Start Command**: `npm start`
5. **Runtime**: node-18

### Step 4: Environment Variables
Add in dashboard:
```
UPI_PHONE_NUMBER=9209287996
UPI_ID=9209287996@okaxis
NODE_ENV=production
```

### Step 5: Deploy
- Click "Deploy"
- Wait for build (2-3 minutes)
- Get URL

---

## Before Deploying - Checklist

- [ ] `.env` has your UPI details
- [ ] Tested locally with `npm start`
- [ ] All files committed to git
- [ ] No console errors in browser
- [ ] `/api/test` endpoint works locally
- [ ] Payment flow tested locally
- [ ] `.gitignore` excludes node_modules

---

## Configuration Files

### vercel.json (Already Created)
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ]
}
```

This tells Vercel:
- Use Node.js runtime
- Run `server.js` as entry point
- Route all requests to server

### .gitignore (Already Created)
```
node_modules/
.env
.env.local
.DS_Store
*.log
dist/
build/
```

This prevents committing:
- Dependencies (too large)
- Sensitive `.env` files
- Generated files

---

## Testing After Deployment

### 1. Check Server Status
Visit: `https://your-url.vercel.app/api/test`

Should return:
```json
{
  "success": true,
  "message": "UPI payment server is running",
  "environment": "production",
  "upiConfigured": true
}
```

### 2. Test Payment Flow
1. Open main app: `https://your-url.vercel.app`
2. Find premium note
3. Click "Buy Now"
4. See payment modal with QR code
5. Check browser console for UPI link
6. On real device: scan QR with GPay
7. Send small amount (₹1-10)
8. Verify money received in bank
9. Click "I've Sent the Payment" to confirm
10. See success message

### 3. Check Logs
In Vercel Dashboard:
- Go to "Deployments"
- Click latest deployment
- View logs to see any errors

---

## Custom Domain (Optional)

### Add Your Domain to Vercel

1. Own a domain (buy at Namecheap, GoDaddy, etc.)
2. In Vercel Settings → Domains
3. Add your domain: `noteshub.com`
4. Follow instructions to update DNS
5. Wait 24-48 hours for propagation

Then access at: `https://noteshub.com`

---

## Setting Up Automated Verification

For production, you need to verify that payment was actually sent before granting access.

### Option 1: Manual Verification (Simple)
```javascript
// Admin sees all pending payments
// Manually marks as confirmed after checking bank
```

**Pros:** Simple, works immediately  
**Cons:** Not scalable, time-consuming

### Option 2: Bank Webhook Integration (Advanced)
```javascript
// Bank sends webhook when money arrives
// Automatically marks payment as confirmed
```

**Pros:** Instant, automatic, scalable  
**Cons:** Requires bank account with webhook support

### Option 3: Periodic Reconciliation (Hybrid)
```javascript
// Cron job checks bank API every 5 minutes
// Confirms payments that have arrived
```

**Pros:** Automatic, works with any bank  
**Cons:** Small delay (5 min)

**For now:** Use Option 1 (manual) while you scale

---

## Environment Variables in Production

### Vercel Dashboard Method (Recommended)
1. Settings → Environment Variables
2. Add each variable
3. Applies to all deployments
4. Redeploy to pick up changes

### .env File (Not Recommended for Secrets)
- ❌ Don't commit `.env` with real credentials
- ❌ Hackers can see if repo is public
- ✅ Use dashboard instead

---

## Monitoring & Troubleshooting

### View Production Logs
1. Vercel Dashboard → Deployments
2. Click latest deployment
3. Scroll to "Logs" tab
4. See any errors or requests

### Common Issues

**502 Bad Gateway**
- Server crashed
- Check logs for errors
- Common: Missing dependency

**Payment modal won't open**
- Check browser console (F12)
- Verify UPI config is set
- Check /api/test endpoint

**QR code not showing**
- Verify CDN is accessible (internet needed)
- Check browser console
- Try different browser

**Money not received**
- Verify UPI ID is correct
- Check bank account
- Review payment status in logs

---

## Scaling Considerations

### When You Need More Power

1. **If 100+ users/day:**
   - Add database (MongoDB Atlas)
   - Set up caching
   - Monitor performance

2. **If 1000+ users/day:**
   - Use Vercel Pro ($20/month)
   - Set up CDN
   - Add redundancy

3. **If real payment processing:**
   - Add bank webhooks
   - Set up auto-verification
   - Add admin dashboard
   - Implement refunds

---

## Backup & Recovery

### Backup Your Code
```bash
git push origin main
```

Code is always backed up on GitHub.

### Backup Your Payments
In production, regularly export payment data:
```javascript
// Save to file or database
const allPayments = Object.values(payments);
fs.writeFileSync('payments-backup.json', JSON.stringify(allPayments, null, 2));
```

---

## SSL/HTTPS

✅ **Vercel provides free SSL** - all URLs are HTTPS automatically

This means:
- 🔒 Secure connection
- 🔐 Safe for payments
- ✅ Mobile apps accept it
- ✅ Banks trust it

---

## Database Migration (Future)

When you need persistent storage:

### Add MongoDB
```bash
npm install mongoose
```

### Update server.js
```javascript
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

// Define payment schema
const paymentSchema = new mongoose.Schema({
  paymentId: String,
  amount: Number,
  status: String,
  noteId: Number,
  userId: String,
  createdAt: Date,
  confirmedAt: Date
});

const Payment = mongoose.model('Payment', paymentSchema);
```

### Update API to use database
```javascript
// Instead of in-memory storage
payments[paymentId] = {...};

// Use MongoDB
await Payment.create({paymentId, amount, ...});
```

---

## Post-Deployment Checklist

- [ ] App loads at production URL
- [ ] All UI works (filters, search, upload)
- [ ] /api/test returns success
- [ ] Payment modal opens
- [ ] QR code displays
- [ ] Test payment works (small amount)
- [ ] Money received in bank account
- [ ] Payment confirmation works
- [ ] Success message shows
- [ ] No console errors
- [ ] Logs show no errors
- [ ] DNS working (if custom domain)

---

## Monitoring Tools

### Free Options
- **Vercel Analytics** - Automatic with deployment
- **UptimeRobot** - Monitors if site is down
- **Sentry** - Error tracking (free tier)

### Set Up Uptime Monitoring
1. Go to https://uptimerobot.com
2. Create account
3. Add monitor for your URL
4. Get alerted if site goes down

---

## Performance Tips

### Reduce Load Time
- Images are already compressed
- Minify CSS/JS (Vercel does this)
- Use CDN for static files (Vercel does this)

### Monitor Performance
- Check Vercel Analytics
- Look at Core Web Vitals
- Track first-paint metrics

---

## Security Best Practices

### In Production
1. ✅ Never expose `.env` in code
2. ✅ Use HTTPS (automatic with Vercel)
3. ✅ Validate all inputs
4. ✅ Limit payment amounts
5. ✅ Log all transactions
6. ✅ Rate limit API endpoints
7. ✅ Keep dependencies updated

### Keep Updated
```bash
npm audit
npm update
```

---

## Troubleshooting Deployment

### Build Fails
```
Error: Cannot find module 'express'
```
**Solution:** `npm install` before deploying

### Server Crashes
```
TypeError: Cannot read property 'toString' of undefined
```
**Solution:** Check logs, missing environment variable or undefined data

### Slow Performance
**Solution:** Check Vercel metrics, may need Pro plan or database

---

## Rollback if Issues

### On Vercel
1. Dashboard → Deployments
2. Find previous successful deployment
3. Click "..." → "Rollback"
4. Confirms all previous version
5. Sites reverts instantly

### With Git
```bash
git revert HEAD
git push origin main
# Vercel redeploys automatically
```

---

## Next Steps After Deployment

1. ✅ Share URL with friends
2. ✅ Monitor for errors
3. ✅ Test real payments
4. ✅ Collect user feedback
5. ✅ Add features as needed
6. ✅ Set up database when ready
7. ✅ Add admin dashboard

---

## Support & Help

- **Vercel Docs:** https://vercel.com/docs
- **Express Docs:** https://expressjs.com
- **UPI Specs:** https://www.npci.org.in/
- **Your Issues:** Check browser console & server logs

---

**Last Updated**: October 18, 2026  
**Status**: Ready for Production
