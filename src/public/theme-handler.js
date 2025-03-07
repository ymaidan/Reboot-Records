// This script ensures graphs are redrawn when theme changes
document.addEventListener('DOMContentLoaded', () => {
    // Check for saved theme preference or use preferred color scheme
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const defaultTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    
    const body = document.body;
    const themeIcon = document.getElementById('themeIcon');
    const themeText = document.getElementById('themeText');
    
    // Apply theme
    if (defaultTheme === 'light') {
        body.classList.remove('dark-theme');
        body.classList.add('light-theme');
        if (themeIcon) themeIcon.textContent = '☀️';
        if (themeText) themeText.textContent = 'Light';
    } else {
        body.classList.remove('light-theme');
        body.classList.add('dark-theme');
        if (themeIcon) themeIcon.textContent = '🌙';
        if (themeText) themeText.textContent = 'Dark';
    }
    
    // Dispatch initial theme event for charts
    document.dispatchEvent(new CustomEvent('themeChanged', {
        detail: defaultTheme
    }));

    // Listen for theme changes
    document.addEventListener('themeChanged', (e) => {
        console.log('Theme changed to:', e.detail);
        
        // Wait for CSS transitions to complete
        setTimeout(() => {
            // Redraw all graphs with the new theme colors
            if (window.fetchAuditRatio) {
                window.fetchAuditRatio();
            }
            
            if (window.fetchSkills) {
                window.fetchSkills();
            }
            
            if (window.fetchXPProgress) {
                window.fetchXPProgress();
            }
            
            // If there are any other graphs or charts that need redrawing
            if (window.audits) {
                window.audits().then(data => {
                    if (window.auditsFiller) {
                        window.auditsFiller(data);
                    }
                });
            }
        }, 300);
    });
}); 