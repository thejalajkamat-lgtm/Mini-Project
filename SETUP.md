# Setup & Local Development Guide

## Prerequisites

- **Node.js** v14 or higher ([download](https://nodejs.org))
- **npm** (comes with Node.js)
- **A code editor** (VS Code recommended)
- **A terminal** (Git Bash, PowerShell, or CMD)

---

## Installation

### Step 1: Open Terminal in Project Directory
```bash
cd C:\Users\JALAJ KAMAT\Documents\Noteshub
```

### Step 2: Install Dependencies
```bash
npm install
```

This installs:
- `express` - Web framework
- `cors` - Cross-origin requests
- `dotenv` - Environment variables
- `mongoose` - Database (optional)

---

## Running the Server

### Start with npm (Recommended)
```bash
npm start
```

**Expected output:**
```
╔════════════════════════════════════════════════════════════╗
║         Noteshub Backend Server Running                    ║
║         Direct UPI/GPay Payment Integration                ║
╚════════════════════════════════════════════════════════════╝

✓ Server listening on: http://localhost:5000
✓ Frontend served at: http://localhost:5000
✓ API endpoints:
  - POST   /api/create-payment-request  (Create UPI payment)
  - POST   /api/confirm-payment         (Confirm payment received)
  - GET    /api/payment-status/:id      (Check payment status)
  - GET    /api/upi-config              (Get UPI details)
  - GET    /api/test                    (Health check)

📱 UPI Configuration:
  - Phone Number: 9209287996
  - UPI ID: 9209287996@okaxis
```

### Or Run Directly
```bash
node server.js
```

---

## Access the Application

Open your browser and go to:
```
http://localhost:5000
```

You should see:
- Hero section with statistics
- "Browse Notes" section with 6 sample notes
- Filter controls (College, Subject, Semester, Type)
- Search bar
- Upload form
- Payment modal (when clicking "Buy Now")

---

## Testing Payment Flow

### Without Real Payment

1. **Click "Buy Now"** on any premium note (₹149 or ₹299)
2. **Payment modal opens** showing:
   - Note title & price
   - QR code placeholder
   - "I've Sent the Payment" button
3. **Check browser console** (F12 → Console tab):
   ```
   💳 Payment modal opened for: [Note Title] (₹299)
   ✓ Payment request created: pay_[ID]
   UPI Link: upi://pay?pa=...&am=299&...
   ✓ QR code generated
   ```
4. **Click "I've Sent the Payment"** to confirm
5. **See success message**: "Access granted! Enjoy your notes!"

### Testing API Endpoints

**Health check:**
```bash
curl http://localhost:5000/api/test
```

**Response:**
```json
{
  "success": true,
  "message": "UPI payment server is running",
  "environment": "development",
  "upiConfigured": true
}
```

**Get UPI configuration:**
```bash
curl http://localhost:5000/api/upi-config
```

---

## Configuration

### Update UPI Details

Edit `.env` file:
```env
UPI_PHONE_NUMBER=9209287996
UPI_ID=9209287996@okaxis
PORT=5000
NODE_ENV=development
```

### Change Port

If port 5000 is in use:
```bash
PORT=8000 npm start
```

---

## File Structure & What Each Does

| File | Purpose | Lines |
|------|---------|-------|
| `server.js` | Express backend, UPI payment APIs | 280+ |
| `index.html` | Main UI structure | 650+ |
| `script.js` | Frontend logic, payment modal, QR code | 900+ |
| `style.css` | All styling, responsive design | 800+ |
| `.env` | Configuration (UPI details, port) | 4 |
| `package.json` | Project metadata & dependencies | 20 |

---

## Understanding the Payment Flow

### Frontend (browser)
1. User clicks "Buy Now"
2. JavaScript calls `/api/create-payment-request`
3. Backend returns UPI link
4. QR code generated from UPI link
5. User scans QR with phone
6. Payment app opens with pre-filled details
7. User confirms payment
8. JavaScript calls `/api/confirm-payment`
9. Backend confirms receipt
10. Success message shown

### Backend (server)
1. Receives payment request
2. Creates unique payment ID
3. Validates amount
4. Generates UPI link
5. Stores payment in memory
6. Returns link to frontend
7. Later, receives confirmation
8. Updates payment status
9. Confirms to frontend

---

## Browser Console for Debugging

Open Developer Tools: **F12 → Console tab**

You'll see logs like:
```javascript
💳 Payment modal opened for: Advanced Calculus Study Guide (₹299)
✓ Payment request created: pay_1729277400000_a1b2c3d4e5
  UPI Link: upi://pay?pa=jalajkamat@okhdfcbank&pn=Noteshub&am=299&tn=Advanced%20Calculus%20Study%20Guide
✓ QR code generated
📱 Scan QR code with GPay/UPI app
✓ Payment confirmed by user
✓ Backend confirmed receipt
✅ Access to note granted!
```

---

## Troubleshooting

### "Port 5000 is already in use"

Find what's using it:
```bash
# Windows
netstat -ano | findstr :5000

# Mac/Linux
lsof -i :5000
```

Kill the process or use a different port:
```bash
PORT=8000 npm start
```

### "Cannot find module 'express'"

Dependencies not installed:
```bash
npm install
```

### Server starts but page won't load

1. Check terminal shows "Server running"
2. Open http://localhost:5000 (not https)
3. Try hard refresh: **Ctrl+Shift+R**
4. Check console (F12) for errors

### QR code doesn't appear

1. Check browser console for errors
2. Verify you have internet (QR code library from CDN)
3. Try different browser
4. Restart server

### Payment modal won't open

1. Check console for JavaScript errors
2. Verify server is running
3. Check `/api/test` endpoint works
4. Try clicking different premium note

---

## Project Features Walkthrough

### Hero Section
- Displays statistics (total notes, students, earnings)
- "Animated" note counter (localStorage-based)

### Browse Notes
- 6 sample notes pre-loaded
- Filters by College, Subject, Semester, Type
- Search bar for keyword matching
- Each note shows: title, college, subject, price
- Free notes show "View Now" button
- Premium notes show "Buy Now" button

### Upload Notes
- Form to upload new notes
- File input with size validation
- Title & description fields
- College/Subject selectors
- Pricing: Free or Premium
- Adds note to localStorage

### Payment Modal
- Opens when "Buy Now" clicked
- Shows note details
- QR code area
- Payment instructions
- "I've Sent the Payment" button

### API Status
- Visit http://localhost:5000/api/test to verify server
- All endpoints return JSON responses

---

## Next Steps

1. ✅ Run server locally
2. ✅ Test all UI features
3. ✅ Try payment flow
4. ✅ Check console logs
5. ✅ Upload a test note
6. ✅ When ready: See DEPLOY.md for production

---

## Need Help?

1. **Check console** (F12 → Console)
2. **Check server logs** (terminal output)
3. **Read PAYMENT.md** for payment specifics
4. **Read DEPLOY.md** for deployment
5. **Check .env** for configuration

---

**Last Updated**: October 18, 2026  
**Status**: Ready to Use
