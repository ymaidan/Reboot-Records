// Helper function to format XP
function formatXP(xp) {
    if (!xp) return '0';
    return Math.round(xp / 1000);
}

export function createProfileHeader(userData) {
    console.log('Creating profile header with:', userData); // Debug log
    
    const profileSection = document.querySelector('.profile-section');
    if (!profileSection) {
        console.error('Profile section not found');
        return;
    }
    
    // Create profile header HTML
    const headerHTML = `
        <div class="profile-header">
            <div class="profile-image">
                <img src="${userData.image || '/assets/default-avatar.png'}" alt="Profile Picture">
            </div>
            <div class="profile-info">
                <div class="info-row">
                    <div class="info-item">
                        <span class="label">Name:</span>
                        <span class="value">${userData.login || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Audit Ratio:</span>
                        <span class="value highlight">${userData.auditRatio?.toFixed(2) || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">XP:</span>
                        <span class="value highlight">${formatXP(userData.totalXP)} KB</span>
                    </div>
                </div>
                <div class="info-row">
                    <div class="info-item">
                        <span class="label">Email:</span>
                        <span class="value">${userData.email || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Campus:</span>
                        <span class="value">${userData.campus || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Level:</span>
                        <span class="value">${userData.level || 'N/A'}</span>
                    </div>
                </div>
                <div class="info-row">
                    <div class="info-item">
                        <span class="label">Cohort:</span>
                        <span class="value">${userData.cohort || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Latest Project:</span>
                        <span class="value highlight">${userData.latestProject || 'N/A'}</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    profileSection.innerHTML = headerHTML;
}

// Export other graph functions we'll create later
export function createXPGraph(transactions) {
    // We'll implement this next
}

export function createProgressGraph(progress) {
    // We'll implement this next
} 