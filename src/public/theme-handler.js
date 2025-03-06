// This script ensures graphs are redrawn when theme changes
document.addEventListener('DOMContentLoaded', () => {
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