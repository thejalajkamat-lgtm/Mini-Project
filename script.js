// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    loadNotes();
    setupEventListeners();
    updateNotesCount();
});

// Sample initial data
const sampleNotes = [
    {
        id: 1,
        title: 'Data Structures Complete Notes',
        college: 'IIT-Bombay',
        subject: 'Computer Science',
        semester: '3',
        type: 'free',
        price: 0,
        description: 'Comprehensive notes covering all DS topics with examples',
        author: 'Rahul Sharma'
    },
    {
        id: 2,
        title: 'Advanced Calculus Study Guide',
        college: 'KIT CoEK',
        subject: 'Mathematics',
        semester: '2',
        type: 'premium',
        price: 149,
        description: 'In-depth calculus notes with solved problems',
        author: 'Priya Desai'
    },
    {
        id: 3,
        title: 'Quantum Physics Essentials',
        college: 'VIT Pune',
        subject: 'Physics',
        semester: '4',
        type: 'premium',
        price: 199,
        description: 'Clear explanations of quantum mechanics concepts',
        author: 'Arjun Patel'
    },
    {
        id: 4,
        title: 'Organic Chemistry Reactions',
        college: 'BITS Pilani',
        subject: 'Chemistry',
        semester: '3',
        type: 'free',
        price: 0,
        description: 'Complete reaction mechanisms with practice questions',
        author: 'Sneha Gupta'
    },
    {
        id: 5,
        title: 'Digital Signal Processing Notes',
        college: 'IIT-Bombay',
        subject: 'Electronics',
        semester: '5',
        type: 'premium',
        price: 249,
        description: 'DSP concepts with MATLAB examples',
        author: 'Amit Kumar'
    },
    {
        id: 6,
        title: 'Thermodynamics Fundamentals',
        college: 'NIT Trichy',
        subject: 'Mechanical Engineering',
        semester: '4',
        type: 'free',
        price: 0,
        description: 'Core thermodynamics with solved numericals',
        author: 'Vikram Singh'
    }
];

// Initialize localStorage with sample data if empty
function initializeApp() {
    if (!localStorage.getItem('noteshub_notes')) {
        localStorage.setItem('noteshub_notes', JSON.stringify(sampleNotes));
    }
}

// Get notes from localStorage
function getNotesFromStorage() {
    const notes = localStorage.getItem('noteshub_notes');
    return notes ? JSON.parse(notes) : [];
}

// Save notes to localStorage
function saveNotesToStorage(notes) {
    localStorage.setItem('noteshub_notes', JSON.stringify(notes));
}

// Load and display notes
function loadNotes() {
    const notes = getNotesFromStorage();
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
function filterNotes() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const collegeFilter = document.getElementById('collegeFilter').value;
    const subjectFilter = document.getElementById('subjectFilter').value;
    const semesterFilter = document.getElementById('semesterFilter').value;
    const typeFilter = document.getElementById('typeFilter').value;

    let notes = getNotesFromStorage();

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

// Download note function - triggers real file download
function downloadNote(noteId) {
    const notes = getNotesFromStorage();
    const note = notes.find(n => n.id === noteId);

    if (note) {
        if (note.type === 'premium') {
            showSuccessMessage(`Redirecting to payment for "${note.title}"...`);
            // In a real app, this would redirect to a payment page
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
function handleUploadSubmit(e) {
    e.preventDefault();

    const noteTitle = document.getElementById('noteTitle').value;
    const noteCollege = document.getElementById('noteCollege').value;
    const noteSubject = document.getElementById('noteSubject').value;
    const noteSemester = document.getElementById('noteSemester').value;
    const noteDescription = document.getElementById('noteDescription').value;
    const noteType = document.getElementById('noteType').value;
    const notePrice = noteType === 'premium' ? parseInt(document.getElementById('notePrice').value) : 0;
    const noteFile = document.getElementById('noteFile').files[0];

    if (!noteFile) {
        showSuccessMessage('Please select a file to upload', 'error');
        return;
    }

    // Check file size (max 10MB)
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    if (noteFile.size > maxFileSize) {
        showSuccessMessage('File size must be less than 10MB', 'error');
        return;
    }

    // Read file and convert to base64
    const reader = new FileReader();

    reader.onload = function(event) {
        try {
            // Get base64 string without the data:application/octet-stream;base64, prefix
            const base64String = event.target.result.split(',')[1];

            // Get existing notes
            const notes = getNotesFromStorage();

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

            // Add to notes array
            notes.unshift(newNote);

            // Save to localStorage
            saveNotesToStorage(notes);

            // Reset form
            e.target.reset();
            document.getElementById('fileName').textContent = 'No file chosen';
            document.getElementById('priceGroup').style.display = 'none';

            // Reload notes display
            loadNotes();
            updateNotesCount();

            // Show success message
            showSuccessMessage('Note uploaded successfully! 🎉');

            // Scroll to browse section
            setTimeout(() => {
                document.getElementById('browse').scrollIntoView({ behavior: 'smooth' });
            }, 500);
        } catch (error) {
            console.error('File processing error:', error);
            showSuccessMessage('Error processing file. Please try again.', 'error');
        }
    };

    reader.onerror = function() {
        console.error('File read error');
        showSuccessMessage('Error reading file. Please try again.', 'error');
    };

    // Read file as data URL (which will contain base64)
    reader.readAsDataURL(noteFile);
}

// Update notes count in hero section
function updateNotesCount() {
    const notes = getNotesFromStorage();
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
