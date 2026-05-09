// Student Dashboard Functions
function loadStudentDashboard() {
    document.getElementById('main-content').innerHTML = `
        <div class="container py-5">
            <h2 class="text-white mb-4">Student Dashboard</h2>
            <div class="row">
                <div class="col-md-3">
                    <div class="card dashboard-card">
                        <div class="stat-box">
                            <div class="stat-number" id="student-projects">0</div>
                            <div class="stat-label">Total Projects</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card dashboard-card">
                        <div class="stat-box">
                            <div class="stat-number" id="student-bids">0</div>
                            <div class="stat-label">My Bids</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card dashboard-card">
                        <div class="stat-box">
                            <div class="stat-number" id="student-rating">0.0</div>
                            <div class="stat-label">Avg Rating</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card dashboard-card">
                        <div class="stat-box">
                            <div class="stat-number" id="student-earnings">₹0</div>
                            <div class="stat-label">Total Earnings</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="row mt-4">
                <div class="col-md-6">
                    <div class="card dashboard-card">
                        <h4>Recommended Projects</h4>
                        <div id="recommended-projects"></div>
                        <button class="btn btn-primary-custom mt-3" onclick="showStudentProjects()">
                            View All Projects
                        </button>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card dashboard-card">
                        <h4>My Recent Bids</h4>
                        <div id="recent-bids"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    loadStudentStats();
}

function loadStudentStats() {
    // Load profile
    fetch(`${API_URL}/student/profile`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
    })
    .then(res => res.json())
    .then(data => {
        document.getElementById('student-projects').textContent = data.total_projects || 0;
        document.getElementById('student-rating').textContent = data.avg_rating || 0;
    });
    
    // Load recommendations
    fetch(`${API_URL}/student/recommendations`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
    })
    .then(res => res.json())
    .then(data => {
        const container = document.getElementById('recommended-projects');
        container.innerHTML = data.slice(0, 5).map(p => `
            <div class="border-bottom py-2">
                <strong>${p.title}</strong><br>
                <small>Budget: ${formatCurrency(p.budget_max)}</small>
            </div>
        `).join('');
    });
}

function showStudentProjects() {
    document.getElementById('main-content').innerHTML = `
        <div class="container py-5">
            <h2 class="text-white mb-4">Browse Projects</h2>
            <div id="projects-list"></div>
        </div>
    `;
    
    fetch(`${API_URL}/student/projects/browse`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
    })
    .then(res => res.json())
    .then(data => {
        const container = document.getElementById('projects-list');
        container.innerHTML = data.projects.map(p => `
            <div class="card project-card mb-3">
                <div class="card-body">
                    <h5>${p.title}</h5>
                    <p>${p.description}</p>
                    <p><strong>Budget:</strong> ${formatCurrency(p.budget_min)} - ${formatCurrency(p.budget_max)}</p>
                    <button class="btn btn-primary-custom" onclick="showBidForm(${p.id})">
                        Submit Bid
                    </button>
                </div>
            </div>
        `).join('');
    });
}

function showBidForm(projectId) {
    const modal = `
        <div class="modal fade show" style="display:block;">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5>Submit Bid</h5>
                    </div>
                    <div class="modal-body">
                        <form id="bidForm">
                            <input type="number" class="form-control mb-3" placeholder="Bid Amount" id="bidAmount" required>
                            <textarea class="form-control mb-3" placeholder="Proposal" id="bidProposal" required></textarea>
                            <button type="submit" class="btn btn-primary-custom">Submit</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modal);
    
    document.getElementById('bidForm').addEventListener('submit', (e) => {
        e.preventDefault();
        submitBid(projectId);
    });
}

function submitBid(projectId) {
    const amount = document.getElementById('bidAmount').value;
    const proposal = document.getElementById('bidProposal').value;
    
    fetch(`${API_URL}/student/projects/${projectId}/bid`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount, proposal })
    })
    .then(res => res.json())
    .then(data => {
        showNotification('Bid submitted successfully!', 'success');
        document.querySelector('.modal').remove();
    });
}
