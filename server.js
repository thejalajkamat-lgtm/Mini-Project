/**
 * Noteshub Backend Server with Direct UPI/GPay Integration
 *
 * This server handles:
 * 1. Generating UPI payment links for direct transfers
 * 2. Recording payment requests and confirmations
 * 3. Storing transaction records
 * 4. Serving the static frontend
 *
 * Payment Method:
 * - Direct UPI/GPay to: +91 9209287996
 * - User scans QR or uses UPI ID
 * - Manual verification of payment
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config();

const app = express();

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the project root
app.use(express.static(path.join(__dirname)));

/**
 * UPI Configuration
 * Direct payment details for manual verification
 */
const UPI_CONFIG = {
    phoneNumber: process.env.UPI_PHONE_NUMBER || '9209287996',
    upiId: process.env.UPI_ID || '9209287996@okaxis',
    merchantName: 'Noteshub',
    notes: 'Premium Notes Purchase'
};

// In-memory storage for payment requests (replace with MongoDB in production)
const paymentRequests = {};


/**
 * POST /api/create-payment-request
 *
 * Creates a payment request for direct UPI/GPay transfer
 * Returns UPI link, QR code data, and payment details
 *
 * Request body:
 * {
 *   "amount": 299,              // Amount in INR (not paise)
 *   "noteId": 2,                // ID of the note being purchased
 *   "userId": "user123",        // User ID (or email)
 *   "noteTitle": "Advanced Calculus Study Guide"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "paymentId": "pay_1234567890",
 *   "amount": 299,
 *   "currency": "INR",
 *   "upiLink": "upi://pay?pa=jalajkamat@okhdfcbank&pn=Noteshub&am=299&tn=...",
 *   "phoneNumber": "9292879960",
 *   "upiId": "jalajkamat@okhdfcbank"
 * }
 */
app.post('/api/create-payment-request', (req, res) => {
    try {
        const { amount, currency = 'INR', noteId, userId, noteTitle } = req.body;

        // Validate input
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Invalid amount. Amount must be greater than 0.'
            });
        }

        if (!noteId || !userId) {
            return res.status(400).json({
                success: false,
                error: 'Note ID and User ID are required.'
            });
        }

        // Generate unique payment ID
        const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Create UPI link (standard UPI deep link format)
        const transactionRef = `${noteId}_${userId}_${Date.now()}`;
        const upiLink = `upi://pay?pa=${UPI_CONFIG.upiId}&pn=${encodeURIComponent(UPI_CONFIG.merchantName)}&am=${amount}&tn=${encodeURIComponent(noteTitle)}&tr=${transactionRef}`;

        // Store payment request details
        paymentRequests[paymentId] = {
            paymentId: paymentId,
            amount: amount,
            currency: currency,
            noteId: noteId,
            userId: userId,
            noteTitle: noteTitle,
            createdAt: new Date(),
            status: 'pending',
            transactionRef: transactionRef
        };

        console.log('✓ Payment request created:', paymentId);
        console.log('  Amount: ₹' + amount);
        console.log('  Note: ' + noteTitle);

        // Return payment details to frontend
        res.json({
            success: true,
            paymentId: paymentId,
            amount: amount,
            currency: currency,
            upiLink: upiLink,
            phoneNumber: UPI_CONFIG.phoneNumber,
            upiId: UPI_CONFIG.upiId,
            merchantName: UPI_CONFIG.merchantName
        });

    } catch (error) {
        console.error('✗ Error creating payment request:', error.message);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to create payment request'
        });
    }
});

/**
 * POST /api/confirm-payment
 *
 * Confirms that payment has been received manually
 * In production, this would be verified by bank webhook or admin panel
 *
 * Request body:
 * {
 *   "paymentId": "pay_1234567890",
 *   "transactionId": "UPIREF123456789"  // From bank statement
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "Payment confirmed successfully",
 *   "paymentId": "pay_1234567890",
 *   "noteId": 2
 * }
 */
app.post('/api/confirm-payment', (req, res) => {
    try {
        const { paymentId, transactionId } = req.body;

        // Validate input
        if (!paymentId) {
            return res.status(400).json({
                success: false,
                error: 'Payment ID is required.'
            });
        }

        // Find the payment request
        const paymentRequest = paymentRequests[paymentId];

        if (!paymentRequest) {
            return res.status(404).json({
                success: false,
                error: 'Payment request not found.'
            });
        }

        if (paymentRequest.status === 'completed') {
            return res.status(400).json({
                success: false,
                error: 'Payment already completed.'
            });
        }

        // Mark payment as completed
        paymentRequest.status = 'completed';
        paymentRequest.transactionId = transactionId || null;
        paymentRequest.completedAt = new Date();

        console.log('✓ Payment confirmed:', paymentId);
        console.log('  Note ID:', paymentRequest.noteId);
        console.log('  Transaction ID:', transactionId);

        res.json({
            success: true,
            message: 'Payment confirmed successfully. Access granted to premium notes.',
            paymentId: paymentId,
            noteId: paymentRequest.noteId
        });

    } catch (error) {
        console.error('✗ Error confirming payment:', error.message);
        res.status(500).json({
            success: false,
            error: error.message || 'Payment confirmation failed'
        });
    }
});

/**
 * GET /api/payment-status/:paymentId
 *
 * Check the status of a payment request
 * Useful for polling or checking payment state
 */
app.get('/api/payment-status/:paymentId', (req, res) => {
    try {
        const { paymentId } = req.params;
        const paymentRequest = paymentRequests[paymentId];

        if (!paymentRequest) {
            return res.status(404).json({
                success: false,
                error: 'Payment request not found'
            });
        }

        res.json({
            success: true,
            payment: {
                paymentId: paymentRequest.paymentId,
                amount: paymentRequest.amount,
                currency: paymentRequest.currency,
                status: paymentRequest.status,
                noteId: paymentRequest.noteId,
                createdAt: paymentRequest.createdAt,
                completedAt: paymentRequest.completedAt
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/upi-config
 *
 * Returns UPI configuration (merchant details)
 * Used for generating QR codes and payment links on frontend
 */
app.get('/api/upi-config', (req, res) => {
    res.json({
        success: true,
        config: {
            phoneNumber: UPI_CONFIG.phoneNumber,
            upiId: UPI_CONFIG.upiId,
            merchantName: UPI_CONFIG.merchantName
        }
    });
});


/**
 * GET /api/test
 *
 * Simple health check endpoint
 */
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: 'UPI payment server is running',
        environment: process.env.NODE_ENV || 'development',
        upiConfigured: !!UPI_CONFIG.phoneNumber && UPI_CONFIG.phoneNumber !== '9209287996'
    });
});

// Serve index.html for all other routes (SPA support)
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('✗ Server error:', err);
    res.status(500).json({
        success: false,
        error: err.message || 'Internal server error'
    });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║         Noteshub Backend Server Running                    ║
║         Direct UPI/GPay Payment Integration                ║
╚════════════════════════════════════════════════════════════╝

✓ Server listening on: http://localhost:${PORT}
✓ Frontend served at: http://localhost:${PORT}
✓ API endpoints:
  - POST   /api/create-payment-request  (Create UPI payment)
  - POST   /api/confirm-payment         (Confirm payment received)
  - GET    /api/payment-status/:id      (Check payment status)
  - GET    /api/upi-config              (Get UPI details)
  - GET    /api/test                    (Health check)

📱 UPI Configuration:
  - Phone Number: ${UPI_CONFIG.phoneNumber}
  - UPI ID: ${UPI_CONFIG.upiId}
  - Merchant Name: ${UPI_CONFIG.merchantName}

💳 Payment Method:
  - Direct UPI/GPay transfer to phone number
  - QR code generation on frontend
  - Manual verification of payment

📋 To configure UPI details:
  1. Update .env file with your UPI details
  2. Restart the server

📚 Documentation:
  - UPI Specification: https://www.npci.org.in/
  - GPay Help: https://support.google.com/googlepay/
    `);
});

module.exports = app;
