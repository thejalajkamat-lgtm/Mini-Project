// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    loadNotes();
    setupEventListeners();
    updateNotesCount();
});

// IndexedDB configuration for large file storage
const DB_NAME = 'NoteshubDB';
const DB_VERSION = 1;
const STORE_NAME = 'notes';

let db;

// Initialize IndexedDB
function initializeApp() {
    return new Promise((resolve) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('IndexedDB error:', request.error);
            // Fallback to localStorage if IndexedDB fails
            resolve();
        };

        request.onsuccess = () => {
            db = request.result;
            console.log('IndexedDB initialized successfully');
            resolve();
        };

        request.onupgradeneeded = (event) => {
            const database = event.target.result;

            // Create object store if it doesn't exist
            if (!database.objectStoreNames.contains(STORE_NAME)) {
                const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('uploadedAt', 'uploadedAt', { unique: false });
                console.log('Notes store created');
            }
        };
    });
}

// Get all notes from IndexedDB
async function getNotesFromStorage() {
    return new Promise((resolve) => {
        if (!db) {
            resolve([]);
            return;
        }

        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
            // Sort by uploadedAt in descending order (newest first)
            const notes = request.result.sort((a, b) =>
                new Date(b.uploadedAt) - new Date(a.uploadedAt)
            );
            resolve(notes);
        };

        request.onerror = () => {
            console.error('Error reading notes:', request.error);
            resolve([]);
        };
    });
}

// Save note to IndexedDB
async function saveNoteToStorage(note) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error('Database not initialized'));
            return;
        }

        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.add(note);

        request.onsuccess = () => {
            console.log('Note saved successfully:', note.id);
            resolve(note);
        };

        request.onerror = () => {
            console.error('Error saving note:', request.error);
            reject(request.error);
        };
    });
}

// Delete note from IndexedDB
async function deleteNoteFromStorage(noteId) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error('Database not initialized'));
            return;
        }

        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(noteId);

        request.onsuccess = () => {
            console.log('Note deleted successfully:', noteId);
            resolve();
        };

        request.onerror = () => {
            console.error('Error deleting note:', request.error);
            reject(request.error);
        };
    });
}

// Get note by ID
async function getNoteById(noteId) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error('Database not initialized'));
            return;
        }

        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(noteId);

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            console.error('Error getting note:', request.error);
            reject(request.error);
        };
    });
}

// Load and display notes
async function loadNotes() {
    const notes = await getNotesFromStorage();
    displayNotes(notes);
}

// Display notes in the grid
function displayNotes(notes) {
    const notesGrid = document.getElementById('notesGrid');
    const noResults = document.getElementById('noResults');

    if (notes.length === 0) {
        notesGrid.style.display = 'none';
        noResults.style.display = 'flex';
        return;
    }

    notesGrid.style.display = 'grid';
    noResults.style.display = 'none';

    notesGrid.innerHTML = notes.map(note => `
        <div class="note-card" data-note-id="${note.id}">
            <div class="note-header">
                <span class="note-badge ${note.type}">${note.type}</span>
            </div>
            <h3 class="note-title">${note.title}</h3>
            <div class="note-meta">
                <div class="note-meta-item">
                    <span>🏛️</span>
                    <span>${note.college}</span>
                </div>
                <div class="note-meta-item">
                    <span>📚</span>
                    <span>${note.subject}</span>
                </div>
                <div class="note-meta-item">
                    <span>📅</span>
                    <span>Semester ${note.semester}</span>
                </div>
            </div>
            <p class="note-description">${note.description}</p>
            <div class="note-footer">
                <div class="note-price ${note.type === 'free' ? 'free-price' : ''}">
                    ${note.type === 'free' ? 'Free' : `₹${note.price}`}
                </div>
                <button class="btn-download" onclick="downloadNote(${note.id})">
                    ${note.type === 'free' ? 'Download' : 'Buy Now'}
                </button>
            </div>
        </div>
    `).join('');
}

// Filter notes based on current filter values
async function filterNotes() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const collegeFilter = document.getElementById('collegeFilter').value;
    const subjectFilter = document.getElementById('subjectFilter').value;
    const semesterFilter = document.getElementById('semesterFilter').value;
    const typeFilter = document.getElementById('typeFilter').value;

    let notes = await getNotesFromStorage();

    // Apply filters
    notes = notes.filter(note => {
        const matchesSearch = searchTerm === '' ||
            note.title.toLowerCase().includes(searchTerm) ||
            note.description.toLowerCase().includes(searchTerm) ||
            note.subject.toLowerCase().includes(searchTerm);

        const matchesCollege = collegeFilter === '' || note.college === collegeFilter;
        const matchesSubject = subjectFilter === '' || note.subject === subjectFilter;
        const matchesSemester = semesterFilter === '' || note.semester === semesterFilter;
        const matchesType = typeFilter === '' || note.type === typeFilter;

        return matchesSearch && matchesCollege && matchesSubject && matchesSemester && matchesType;
    });

    displayNotes(notes);
}

// Reset all filters
function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('collegeFilter').value = '';
    document.getElementById('subjectFilter').value = '';
    document.getElementById('semesterFilter').value = '';
    document.getElementById('typeFilter').value = '';
    loadNotes();
}

// Download note function - triggers real file download or payment
async function downloadNote(noteId) {
    const note = await getNoteById(noteId);

    if (note) {
        if (note.type === 'premium') {
            // Open payment modal for premium notes
            openPaymentModal(note);
        } else if (note.fileData) {
            // Convert base64 back to blob and trigger download
            try {
                const binaryString = atob(note.fileData);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }

                const blob = new Blob([bytes], { type: note.fileMimeType || 'application/octet-stream' });
                const url = URL.createObjectURL(blob);

                // Create download link
                const link = document.createElement('a');
                link.href = url;
                link.download = note.fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                // Clean up the object URL
                URL.revokeObjectURL(url);

                showSuccessMessage(`Downloaded "${note.title}" ✓`);
            } catch (error) {
                console.error('Download error:', error);
                showSuccessMessage(`Error downloading file. Please try again.`, 'error');
            }
        } else {
            showSuccessMessage(`File not available for download.`, 'error');
        }
    }
}

// Setup all event listeners
function setupEventListeners() {
    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const nav = document.querySelector('.nav');

    mobileMenuToggle.addEventListener('click', () => {
        nav.classList.toggle('active');
    });

    // Close mobile menu when clicking on a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            nav.classList.remove('active');
        });
    });

    // Search and filter inputs
    document.getElementById('searchInput').addEventListener('input', filterNotes);
    document.getElementById('collegeFilter').addEventListener('change', filterNotes);
    document.getElementById('subjectFilter').addEventListener('change', filterNotes);
    document.getElementById('semesterFilter').addEventListener('change', filterNotes);
    document.getElementById('typeFilter').addEventListener('change', filterNotes);

    // Reset filters button
    document.getElementById('resetFilters').addEventListener('click', resetFilters);

    // Upload form
    const uploadForm = document.getElementById('uploadForm');
    uploadForm.addEventListener('submit', handleUploadSubmit);

    // Note type change (show/hide price field)
    document.getElementById('noteType').addEventListener('change', (e) => {
        const priceGroup = document.getElementById('priceGroup');
        const priceInput = document.getElementById('notePrice');

        if (e.target.value === 'premium') {
            priceGroup.style.display = 'block';
            priceInput.required = true;
        } else {
            priceGroup.style.display = 'none';
            priceInput.required = false;
        }
    });

    // File input change
    document.getElementById('noteFile').addEventListener('change', (e) => {
        const fileName = document.getElementById('fileName');
        if (e.target.files.length > 0) {
            fileName.textContent = e.target.files[0].name;
        } else {
            fileName.textContent = 'No file chosen';
        }
    });

    // Login modal
    const loginBtn = document.getElementById('loginBtn');
    const loginModal = document.getElementById('loginModal');
    const modalClose = document.querySelector('.modal-close');

    loginBtn.addEventListener('click', () => {
        loginModal.style.display = 'block';
    });

    modalClose.addEventListener('click', () => {
        loginModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === loginModal) {
            loginModal.style.display = 'none';
        }
    });

    // Modal tabs
    document.querySelectorAll('.modal-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;

            // Remove active class from all tabs and contents
            document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

            // Add active class to clicked tab and corresponding content
            tab.classList.add('active');
            document.getElementById(tabName + 'Tab').classList.add('active');
        });
    });

    // Signup form with password validation
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const password = document.getElementById('signupPassword').value;
            const passwordValidation = validatePassword(password);

            if (!passwordValidation.isValid) {
                highlightPasswordField(true);
                displayPasswordFeedback(passwordValidation.errors);
                return;
            }

            highlightPasswordField(false);
            document.getElementById('passwordFeedback').innerHTML = '';
            showSuccessMessage('Signup successful! Welcome to Noteshub.');
            loginModal.style.display = 'none';
            signupForm.reset();
        });

        // Real-time password validation feedback
        document.getElementById('signupPassword').addEventListener('input', (e) => {
            const password = e.target.value;
            if (password.length > 0) {
                const validation = validatePassword(password);
                displayPasswordFeedback(validation.errors);
                highlightPasswordField(!validation.isValid);
            } else {
                document.getElementById('passwordFeedback').innerHTML = '';
                highlightPasswordField(false);
            }
        });
    }

    // Login form
    const loginForm = document.querySelector('#loginTab .auth-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            showSuccessMessage('Login successful! Welcome to Noteshub.');
            loginModal.style.display = 'none';
        });
    }

    // Premium buttons
    document.querySelectorAll('.btn-premium').forEach(btn => {
        btn.addEventListener('click', () => {
            showSuccessMessage('Redirecting to payment...');
        });
    });

    // Smooth scrolling for navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Handle upload form submission with file data
async function handleUploadSubmit(e) {
    e.preventDefault();

    const noteTitle = document.getElementById('noteTitle').value;
    const noteCollege = document.getElementById('noteCollege').value;
    const noteSubject = document.getElementById('noteSubject').value;
    const noteSemester = document.getElementById('noteSemester').value;
    const noteDescription = document.getElementById('noteDescription').value;
    const noteType = document.getElementById('noteType').value;
    const notePrice = noteType === 'premium' ? parseInt(document.getElementById('notePrice').value) : 0;
    const noteFile = document.getElementById('noteFile').files[0];

    // Validate file selection
    if (!noteFile) {
        showSuccessMessage('Please select a file to upload', 'error');
        return;
    }

    // Validate all fields
    if (!noteTitle || !noteCollege || !noteSubject || !noteSemester) {
        showSuccessMessage('Please fill in all required fields', 'error');
        return;
    }

    // Check file size (max 2MB for each note - can handle 50+ notes)
    const maxFileSize = 2 * 1024 * 1024; // 2MB per file
    if (noteFile.size > maxFileSize) {
        showSuccessMessage(`File size must be less than 2MB. Your file is ${(noteFile.size / 1024 / 1024).toFixed(2)}MB`, 'error');
        return;
    }

    // Validate file type (common document formats)
    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/zip',
        'application/x-rar-compressed'
    ];

    if (!allowedTypes.includes(noteFile.type)) {
        showSuccessMessage('File type not supported. Please upload PDF, Word, Excel, TXT, Images, or ZIP files.', 'error');
        return;
    }

    // Read file and convert to base64
    const reader = new FileReader();

    reader.onload = async function(event) {
        try {
            // Get base64 string
            const base64String = event.target.result.split(',')[1];

            if (!base64String) {
                throw new Error('Failed to encode file');
            }

            // Create new note object with file data
            const newNote = {
                id: Date.now(),
                title: noteTitle,
                college: noteCollege,
                subject: noteSubject,
                semester: noteSemester,
                description: noteDescription || 'No description provided',
                type: noteType,
                price: notePrice,
                author: 'You',
                fileName: noteFile.name,
                fileMimeType: noteFile.type,
                fileData: base64String, // Base64 encoded file data
                fileSize: noteFile.size,
                uploadedAt: new Date().toISOString()
            };

            // Save to IndexedDB with error handling
            try {
                await saveNoteToStorage(newNote);
                console.log('Note saved successfully to IndexedDB');
            } catch (storageError) {
                console.error('Storage error:', storageError);
                showSuccessMessage(`Storage error: ${storageError.message}. Please try again.`, 'error');
                return;
            }

            // Reset form
            e.target.reset();
            document.getElementById('fileName').textContent = 'No file chosen';
            document.getElementById('priceGroup').style.display = 'none';

            // Reload notes display
            await loadNotes();
            updateNotesCount();

            // Show success message
            showSuccessMessage('Note uploaded successfully! 🎉');

            // Scroll to browse section
            setTimeout(() => {
                document.getElementById('browse').scrollIntoView({ behavior: 'smooth' });
            }, 500);
        } catch (error) {
            console.error('File processing error:', error);
            showSuccessMessage(`Error processing file: ${error.message}. Please try again.`, 'error');
        }
    };

    reader.onerror = function(error) {
        console.error('File read error:', error);
        showSuccessMessage('Error reading file. Please try again.', 'error');
    };

    reader.onabort = function() {
        console.error('File read aborted');
        showSuccessMessage('File upload cancelled.', 'error');
    };

    // Read file as data URL (which will contain base64)
    try {
        reader.readAsDataURL(noteFile);
    } catch (error) {
        console.error('Failed to read file:', error);
        showSuccessMessage('Failed to read file. Please try again.', 'error');
    }
}

// Update notes count in hero section
async function updateNotesCount() {
    const notes = await getNotesFromStorage();
    const countElement = document.getElementById('notesCount');

    // Animate count
    let current = 0;
    const target = notes.length;
    const increment = Math.ceil(target / 20);

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        countElement.textContent = current;
    }, 50);
}

// Show success/error message
function showSuccessMessage(message, type = 'success') {
    // Remove any existing success messages
    const existing = document.querySelector('.success-message');
    if (existing) {
        existing.remove();
    }

    // Create new success message
    const messageDiv = document.createElement('div');
    messageDiv.className = `success-message ${type}`;
    messageDiv.textContent = message;
    messageDiv.style.backgroundColor = type === 'error' ? '#EF4444' : '#10B981';
    document.body.appendChild(messageDiv);

    // Remove after 3 seconds
    setTimeout(() => {
        messageDiv.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => messageDiv.remove(), 300);
    }, 3000);
}

// Active navigation highlighting
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section[id]');
    const scrollY = window.pageYOffset;

    sections.forEach(section => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 100;
        const sectionId = section.getAttribute('id');
        const navLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);

        if (navLink && scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
            navLink.classList.add('active');
        }
    });
});

// Password validation function
function validatePassword(password) {
    const errors = [];

    // Check minimum length (at least 5 characters)
    if (password.length < 5) {
        errors.push('Password must be at least 5 characters long');
    }

    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least 1 uppercase letter');
    }

    // Check for at least one number
    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least 1 number');
    }

    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

// Display password feedback messages
function displayPasswordFeedback(errors) {
    const feedbackDiv = document.getElementById('passwordFeedback');

    if (errors.length === 0) {
        feedbackDiv.innerHTML = '<span style="color: #10B981; font-size: 13px; font-weight: 500;">✓ Password is strong</span>';
        return;
    }

    feedbackDiv.innerHTML = errors.map(error =>
        `<div style="color: #EF4444; font-size: 13px; margin: 4px 0; display: flex; align-items: center;">
            <span style="margin-right: 6px;">✗</span>${error}
        </div>`
    ).join('');
}

// Highlight password field when invalid
function highlightPasswordField(isInvalid) {
    const passwordInput = document.getElementById('signupPassword');
    if (!passwordInput) return;

    if (isInvalid) {
        passwordInput.style.borderColor = '#EF4444';
        passwordInput.style.backgroundColor = '#FEF2F2';
    } else {
        passwordInput.style.borderColor = '';
        passwordInput.style.backgroundColor = '';
    }
}

/**
 * ═══════════════════════════════════════════════════════════════════════
 * DIRECT UPI/GPAY PAYMENT INTEGRATION
 * ═══════════════════════════════════════════════════════════════════════
 *
 * This section handles direct UPI payments:
 * 1. User clicks "Buy Now" on a premium note
 * 2. Payment modal opens with note details and QR code
 * 3. User scans QR with GPay or UPI app
 * 4. User completes payment in their banking app
 * 5. User confirms payment in the modal
 * 6. Access is granted to the premium note
 */

// Store current note being purchased (for payment flow)
let currentPaymentNote = null;
let currentPaymentId = null;

/**
 * Open Payment Modal
 *
 * Displays payment details for the selected premium note
 * Generates UPI QR code for payment
 */
function openPaymentModal(note) {
    currentPaymentNote = note;

    // Update payment modal with note details
    document.getElementById('paymentNoteTitle').textContent = note.title;
    document.getElementById('paymentNotePrice').textContent = `₹${note.price}`;
    document.getElementById('paymentNoteAuthor').textContent = `By ${note.author || 'Unknown'}`;
    document.getElementById('paymentAmount').textContent = `₹${note.price}`;

    // Show payment modal
    document.getElementById('paymentModal').style.display = 'block';
    document.getElementById('paymentDetails').style.display = 'block';
    document.getElementById('paymentLoading').style.display = 'none';
    document.getElementById('paymentSuccess').style.display = 'none';
    document.getElementById('paymentError').style.display = 'none';

    // Generate QR code
    generateUPIQRCode(note);

    console.log('💳 Payment modal opened for:', note.title, '(₹' + note.price + ')');
}

/**
 * Close Payment Modal
 */
function closePaymentModal() {
    document.getElementById('paymentModal').style.display = 'none';
    currentPaymentNote = null;
    currentPaymentId = null;
    console.log('💳 Payment modal closed');
}

/**
 * Generate UPI QR Code
 *
 * Creates a QR code that encodes the UPI payment link
 * User can scan this with GPay or any UPI app
 */
async function generateUPIQRCode(note) {
    try {
        // First, create a payment request to get UPI link
        const paymentResponse = await fetch('/api/create-payment-request', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: note.price,
                currency: 'INR',
                noteId: note.id,
                userId: 'user_' + Date.now(),
                noteTitle: note.title
            })
        });

        if (!paymentResponse.ok) {
            throw new Error('Failed to create payment request');
        }

        const paymentData = await paymentResponse.json();

        if (!paymentData.success) {
            throw new Error(paymentData.error || 'Payment request creation failed');
        }

        // Store payment ID for later confirmation
        currentPaymentId = paymentData.paymentId;

        console.log('✓ Payment request created:', paymentData.paymentId);
        console.log('  UPI Link:', paymentData.upiLink);

        // Clear previous QR code
        document.getElementById('qrCode').innerHTML = '';

        // Generate QR code from UPI link
        new QRCode(document.getElementById('qrCode'), {
            text: paymentData.upiLink,
            width: 200,
            height: 200,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
        });

        console.log('✓ QR code generated');

    } catch (error) {
        console.error('✗ QR code generation error:', error);
        showPaymentError('Failed to generate QR code: ' + error.message);
    }
}

/**
 * Initiate Payment Confirmation
 *
 * Called when user clicks "I've Sent the Payment"
 * Confirms payment with backend
 */
async function initiatePayment() {
    if (!currentPaymentNote || !currentPaymentId) {
        showSuccessMessage('Error: No payment request found', 'error');
        return;
    }

    // Show loading state
    document.getElementById('paymentDetails').style.display = 'none';
    document.getElementById('paymentLoading').style.display = 'block';

    try {
        const note = currentPaymentNote;

        console.log('✓ Confirming payment...');

        // Send confirmation to backend
        const confirmResponse = await fetch('/api/confirm-payment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                paymentId: currentPaymentId,
                transactionId: null  // In real app, user would provide this
            })
        });

        const confirmData = await confirmResponse.json();

        if (!confirmData.success) {
            throw new Error(confirmData.error || 'Payment confirmation failed');
        }

        console.log('✓ Payment confirmed successfully!');
        console.log('✓ Access granted to premium note');

        // Mark note as purchased
        markNoteAsPurchased(currentPaymentNote.id, currentPaymentId);

        // Show success message
        showPaymentSuccess(`Payment confirmed! You now have access to "${currentPaymentNote.title}".`);

    } catch (error) {
        console.error('✗ Payment confirmation error:', error);
        showPaymentError('Payment confirmation failed: ' + error.message);
    }
}

/**
 * Show Payment Success State
 */
function showPaymentSuccess(message) {
    document.getElementById('paymentDetails').style.display = 'none';
    document.getElementById('paymentLoading').style.display = 'none';
    document.getElementById('paymentError').style.display = 'none';
    document.getElementById('paymentSuccess').style.display = 'block';
    document.getElementById('successMessage').textContent = message;

    console.log('✓ Payment success displayed');
}

/**
 * Show Payment Error State
 */
function showPaymentError(message) {
    document.getElementById('paymentDetails').style.display = 'none';
    document.getElementById('paymentLoading').style.display = 'none';
    document.getElementById('paymentSuccess').style.display = 'none';
    document.getElementById('paymentError').style.display = 'block';
    document.getElementById('errorMessage').textContent = message;

    console.error('✗ Payment error displayed:', message);
}

/**
 * Mark Note as Purchased
 *
 * Records purchase in localStorage for demo
 * In production, backend would handle this
 */
function markNoteAsPurchased(noteId, paymentId) {
    let purchases = JSON.parse(localStorage.getItem('noteshub_purchases') || '[]');

    purchases.push({
        noteId: noteId,
        paymentId: paymentId,
        purchasedAt: new Date().toISOString()
    });

    localStorage.setItem('noteshub_purchases', JSON.stringify(purchases));
    console.log('💾 Purchase recorded:', noteId);
}

/**
 * Check if user has purchased a note
 */
function hasPurchasedNote(noteId) {
    const purchases = JSON.parse(localStorage.getItem('noteshub_purchases') || '[]');
    return purchases.some(p => p.noteId === noteId);
}

// Close payment modal when clicking outside
window.addEventListener('click', (e) => {
    const paymentModal = document.getElementById('paymentModal');
    if (e.target === paymentModal) {
        closePaymentModal();
    }
});
