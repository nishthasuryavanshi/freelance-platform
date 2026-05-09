// Client Dashboard Functions
function loadClientDashboard() {
    document.getElementById('main-content').innerHTML = `
        <div class="container py-5">
            <h2 class="text-white mb-4">Client Dashboard</h2>
            <div class="row">
                <div class="col-md-4">
                    <div class="card dashboard-card">
                        <div class="stat-box">
                            <div class="stat-number" id="client-projects">0</div>
                            <div class="stat-label">Total Projects</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card dashboard-card">
                        <div class="stat-box">
                            <div class="stat-number" id="active-projects">0</div>
                            <div class="stat-label">Active Projects</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card dashboard-card">
                        <div class="stat-box">
                            <div class="stat-number" id="completed-projects">0</div>
                            <div class="stat-label">Completed</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="card dashboard-card mt-4">
                <button class="btn btn-primary-custom mb-3" onclick="showPostProjectForm()">
                    <i class="fas fa-plus"></i> Post New Project
                </button>
                <h4>My Projects</h4>
                <div id="my-projects"></div>
            </div>
        </div>
    `;
    
    loadClientProjects();
}

function loadClientProjects() {
    fetch(`${API_URL}/client/projects`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
    })
    .then(res => res.json())
    .then(data => {
        document.getElementById('client-projects').textContent = data.length;
        const container = document.getElementById('my-projects');
        container.innerHTML = data.map(p => `
            <div class="card project-card mb-3">
                <div class="card-body">
                    <h5>${p.title}</h5>
                    <p><span class="badge badge-status status-${p.status}">${p.status}</span></p>
                    <p>Bids: ${p.bids_count}</p>
                    <button class="btn btn-primary-custom btn-sm" onclick="viewProjectBids(${p.id})">
                        View Bids
                    </button>
                </div>
            </div>
        `).join('');
    });
}

function showPostProjectForm() {
    document.getElementById('main-content').innerHTML = `
        <div class="container py-5">
            <div class="card card-custom p-4">
                <h2>Post New Project</h2>
                <form id="postProjectForm">
                    <div class="mb-3">
                        <label>Project Title</label>
                        <input type="text" class="form-control" id="projectTitle" required>
                    </div>
                    <div class="mb-3">
                        <label>Description</label>
                        <textarea class="form-control" id="projectDescription" rows="5" required></textarea>
                    </div>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label>Minimum Budget</label>
                            <input type="number" class="form-control" id="budgetMin" required>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label>Maximum Budget</label>
                            <input type="number" class="form-control" id="budgetMax" required>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label>Required Skills</label>
                        <input type="text" class="form-control" id="requiredSkills" placeholder="Comma separated">
                    </div>
                    <div class="mb-3">
                        <label>Category</label>
                        <select class="form-control" id="projectCategory">
                            <option>Web Development</option>
                            <option>Mobile App</option>
                            <option>Data Science</option>
                            <option>Machine Learning</option>
                            <option>Design</option>
                            <option>Other</option>
                        </select>
                    </div>
                    <button type="submit" class="btn btn-primary-custom">Post Project</button>
                </form>
            </div>
        </div>
    `;
    
    document.getElementById('postProjectForm').addEventListener('submit', handlePostProject);
}

function handlePostProject(e) {
    e.preventDefault();
    
    const data = {
        title: document.getElementById('projectTitle').value,
        description: document.getElementById('projectDescription').value,
        budget_min: parseFloat(document.getElementById('budgetMin').value),
        budget_max: parseFloat(document.getElementById('budgetMax').value),
        required_skills: document.getElementById('requiredSkills').value,
        category: document.getElementById('projectCategory').value
    };
    
    fetch(`${API_URL}/client/projects`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(result => {
        showNotification('Project posted successfully!', 'success');
        loadClientDashboard();
    });
}

function viewProjectBids(projectId) {
    fetch(`${API_URL}/client/projects/${projectId}/bids`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
    })
    .then(res => res.json())
    .then(bids => {
        document.getElementById('main-content').innerHTML = `
            <div class="container py-5">
                <h2 class="text-white mb-4">Project Bids</h2>
                <div id="bids-list">
                    ${bids.map(b => `
                        <div class="card mb-3">
                            <div class="card-body">
                                <h5>${b.student_name}</h5>
                                <p>Amount: ${formatCurrency(b.amount)}</p>
                                <p>Proposal: ${b.proposal}</p>
                                <p>Rating: ${b.student_rating} ⭐</p>
                                <button class="btn btn-success-custom" onclick="acceptBid(${b.id})">Accept</button>
                                <button class="btn btn-danger-custom" onclick="rejectBid(${b.id})">Reject</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });
}

function acceptBid(bidId) {
    fetch(`${API_URL}/client/bids/${bidId}/accept`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` }
    })
    .then(res => res.json())
    .then(data => {
        showNotification('Bid accepted!', 'success');
        loadClientDashboard();
    });
}

function rejectBid(bidId) {
    fetch(`${API_URL}/client/bids/${bidId}/reject`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` }
    })
    .then(res => res.json())
    .then(data => {
        showNotification('Bid rejected', 'success');
    });
}

function showClientProjects() {
    loadClientDashboard();
}
