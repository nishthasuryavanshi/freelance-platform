const API_URL = 'http://localhost:5000/api';
let currentUser = null;
let authToken = null;
let socket = null;

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    showHome();
});

// Check if user is authenticated
function checkAuth() {
    authToken = localStorage.getItem('authToken');
    if (authToken) {
        fetch(`${API_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.id) {
                currentUser = data;
                updateNavigation(true);
                initializeSocket();
            } else {
                localStorage.removeItem('authToken');
                updateNavigation(false);
            }
        })
        .catch(error => {
            console.error('Auth error:', error);
            localStorage.removeItem('authToken');
            updateNavigation(false);
        });
    } else {
        updateNavigation(false);
    }
}

// Update navigation
function updateNavigation(isAuthenticated) {
    if (isAuthenticated) {
        document.getElementById('nav-login').style.display = 'none';
        document.getElementById('nav-register').style.display = 'none';
        document.getElementById('nav-dashboard').style.display = 'block';
        document.getElementById('nav-projects').style.display = 'block';
        document.getElementById('nav-messages').style.display = 'block';
        document.getElementById('nav-logout').style.display = 'block';
    } else {
        document.getElementById('nav-login').style.display = 'block';
        document.getElementById('nav-register').style.display = 'block';
        document.getElementById('nav-dashboard').style.display = 'none';
        document.getElementById('nav-projects').style.display = 'none';
        document.getElementById('nav-messages').style.display = 'none';
        document.getElementById('nav-logout').style.display = 'none';
    }
}

// Show home page
function showHome() {
    document.getElementById('main-content').innerHTML = `
        <div class="hero-section">
            <div class="container">
                <h1 class="display-4 mb-4 fade-in">Find Your Next Opportunity</h1>
                <p class="lead mb-5 fade-in">Connect with talented freelancers or find your dream project</p>
                <button class="btn btn-light btn-lg me-3" onclick="showRegister()">
                    <i class="fas fa-rocket"></i> Get Started
                </button>
                <button class="btn btn-outline-light btn-lg" onclick="showLogin()">
                    <i class="fas fa-sign-in-alt"></i> Sign In
                </button>
            </div>
        </div>
        
        <div class="container py-5">
            <h2 class="text-center text-white mb-5">Why Choose FreelanceHub?</h2>
            <div class="row">
                <div class="col-md-4 mb-4">
                    <div class="card card-custom text-center p-4 fade-in">
                        <i class="fas fa-search fa-4x text-primary mb-3"></i>
                        <h4>Find Perfect Projects</h4>
                        <p>AI-powered recommendations match you with projects that fit your skills</p>
                    </div>
                </div>
                <div class="col-md-4 mb-4">
                    <div class="card card-custom text-center p-4 fade-in">
                        <i class="fas fa-shield-alt fa-4x text-success mb-3"></i>
                        <h4>Secure Payments</h4>
                        <p>Escrow system ensures safe transactions for both parties</p>
                    </div>
                </div>
                <div class="col-md-4 mb-4">
                    <div class="card card-custom text-center p-4 fade-in">
                        <i class="fas fa-chart-line fa-4x text-info mb-3"></i>
                        <h4>Grow Your Career</h4>
                        <p>Build your portfolio and gain real-world experience</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Show login form
function showLogin() {
    document.getElementById('main-content').innerHTML = `
        <div class="container mt-5">
            <div class="row justify-content-center">
                <div class="col-md-6">
                    <div class="card card-custom p-4 fade-in">
                        <h2 class="text-center mb-4">
                            <i class="fas fa-sign-in-alt text-primary"></i> Login
                        </h2>
                        <form id="loginForm">
                            <div class="mb-3">
                                <label class="form-label">Email Address</label>
                                <input type="email" class="form-control" id="loginEmail" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Password</label>
                                <input type="password" class="form-control" id="loginPassword" required>
                            </div>
                            <button type="submit" class="btn btn-primary-custom w-100 mb-3">
                                <i class="fas fa-sign-in-alt"></i> Login
                            </button>
                        </form>
                        <p class="text-center mt-3">
                            Don't have an account? <a href="#" onclick="showRegister()">Register here</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
}

// Handle login
function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.access_token) {
            localStorage.setItem('authToken', data.access_token);
            authToken = data.access_token;
            currentUser = data.user;
            updateNavigation(true);
            loadDashboard();
            initializeSocket();
            showNotification('Login successful!', 'success');
        } else {
            showNotification('Login failed: ' + (data.error || 'Unknown error'), 'error');
        }
    })
    .catch(error => {
        showNotification('Login error: ' + error.message, 'error');
    });
}

// Show register form
function showRegister() {
    document.getElementById('main-content').innerHTML = `
        <div class="container mt-5">
            <div class="row justify-content-center">
                <div class="col-md-8">
                    <div class="card card-custom p-4 fade-in">
                        <h2 class="text-center mb-4">
                            <i class="fas fa-user-plus text-primary"></i> Create Account
                        </h2>
                        <form id="registerForm">
                            <div class="mb-3">
                                <label class="form-label">I am a:</label>
                                <select class="form-control" id="userRole" onchange="toggleRoleFields()" required>
                                    <option value="">Select your role...</option>
                                    <option value="student">Student/Freelancer</option>
                                    <option value="client">Client/Employer</option>
                                </select>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Email Address</label>
                                <input type="email" class="form-control" id="regEmail" required>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Password</label>
                                <input type="password" class="form-control" id="regPassword" required minlength="6">
                                <small class="text-muted">Minimum 6 characters</small>
                            </div>
                            
                            <!-- Student fields -->
                            <div id="studentFields" style="display:none;">
                                <div class="mb-3">
                                    <label class="form-label">Full Name</label>
                                    <input type="text" class="form-control" id="studentName">
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">College/University</label>
                                    <input type="text" class="form-control" id="studentCollege">
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Academic Year</label>
                                    <select class="form-control" id="studentYear">
                                        <option>1st Year</option>
                                        <option>2nd Year</option>
                                        <option>3rd Year</option>
                                        <option>4th Year</option>
                                        <option>Graduate</option>
                                    </select>
                                </div>
                            </div>
                            
                            <!-- Client fields -->
                            <div id="clientFields" style="display:none;">
                                <div class="mb-3">
                                    <label class="form-label">Company Name</label>
                                    <input type="text" class="form-control" id="clientCompany">
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Company Description</label>
                                    <textarea class="form-control" id="clientDesc" rows="3"></textarea>
                                </div>
                            </div>
                            
                            <button type="submit" class="btn btn-primary-custom w-100">
                                <i class="fas fa-user-plus"></i> Register
                            </button>
                        </form>
                        <p class="text-center mt-3">
                            Already have an account? <a href="#" onclick="showLogin()">Login here</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
}

function toggleRoleFields() {
    const role = document.getElementById('userRole').value;
    document.getElementById('studentFields').style.display = role === 'student' ? 'block' : 'none';
    document.getElementById('clientFields').style.display = role === 'client' ? 'block' : 'none';
}

// Handle registration
function handleRegister(e) {
    e.preventDefault();
    
    const role = document.getElementById('userRole').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    
    let data = { email, password, role };
    
    if (role === 'student') {
        data.name = document.getElementById('studentName').value;
        data.college = document.getElementById('studentCollege').value;
        data.year = document.getElementById('studentYear').value;
    } else if (role === 'client') {
        data.company = document.getElementById('clientCompany').value;
        data.description = document.getElementById('clientDesc').value;
    }
    
    fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.user_id) {
            showNotification('Registration successful! Please login.', 'success');
            showLogin();
        } else {
            showNotification('Registration failed: ' + (data.error || 'Unknown error'), 'error');
        }
    })
    .catch(error => {
        showNotification('Registration error: ' + error.message, 'error');
    });
}

// Load dashboard
function loadDashboard() {
    if (!currentUser) {
        showLogin();
        return;
    }
    
    if (currentUser.role === 'student') {
        loadStudentDashboard();
    } else if (currentUser.role === 'client') {
        loadClientDashboard();
    } else if (currentUser.role === 'admin') {
        loadAdminDashboard();
    }
}

// Initialize Socket.IO
function initializeSocket() {
    if (socket) return;
    
    socket = io('http://localhost:5000');
    
    socket.on('connect', function() {
        console.log('Connected to socket server');
    });
    
    socket.on('receive_message', function(data) {
        console.log('New message received:', data);
    });
}

// Show notification
function showNotification(message, type) {
    const alertClass = type === 'success' ? 'alert-success' : 'alert-danger';
    const iconClass = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    
    const notification = document.createElement('div');
    notification.className = `alert ${alertClass} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 90px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
        <i class="fas ${iconClass} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Logout
function logout() {
    localStorage.removeItem('authToken');
    authToken = null;
    currentUser = null;
    updateNavigation(false);
    showHome();
    if (socket) {
        socket.disconnect();
        socket = null;
    }
    showNotification('Logged out successfully', 'success');
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

// Format currency
function formatCurrency(amount) {
    return '₹' + amount.toLocaleString('en-IN');
}
