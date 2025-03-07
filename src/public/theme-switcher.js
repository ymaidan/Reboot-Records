// Theme Switcher functionality
document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) {
        console.error('Theme toggle button not found');
        return;
    }
    
    const themeIcon = document.getElementById('themeIcon');
    const themeText = document.getElementById('themeText');
    
    // Check for saved theme preference or use device preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Set initial theme
    if (savedTheme === 'light') {
        setLightTheme();
    } else if (savedTheme === 'dark' || prefersDark) {
        setDarkTheme();
    } else {
        // Default to dark theme if no preference
        setDarkTheme();
    }
    
    // Toggle theme when button is clicked
    themeToggle.addEventListener('click', () => {
        const body = document.body;
        const isDark = body.classList.contains('dark-theme');
        
        // Toggle theme class
        body.classList.toggle('dark-theme');
        body.classList.toggle('light-theme');
        
        // Update icon and text
        themeIcon.textContent = isDark ? '☀️' : '🌙';
        themeText.textContent = isDark ? 'Light' : 'Dark';
        
        // Save preference to localStorage
        localStorage.setItem('theme', isDark ? 'light' : 'dark');
        
        // Dispatch theme change event for charts to update
        document.dispatchEvent(new CustomEvent('themeChanged', {
            detail: isDark ? 'light' : 'dark'
        }));
    });
    
    // Function to set dark theme
    function setDarkTheme() {
        document.body.classList.remove('light-theme');
        document.body.classList.add('dark-theme');
        localStorage.setItem('theme', 'dark');
        if (themeIcon) themeIcon.textContent = '🌙'; // Moon emoji
        if (themeText) themeText.textContent = 'Dark';
        
        // Dispatch event that theme has changed
        document.dispatchEvent(new CustomEvent('themeChanged', { detail: 'dark' }));
    }
    
    // Function to set light theme
    function setLightTheme() {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
        localStorage.setItem('theme', 'light');
        if (themeIcon) themeIcon.textContent = '☀️'; // Sun emoji
        if (themeText) themeText.textContent = 'Light';
        
        // Dispatch event that theme has changed
        document.dispatchEvent(new CustomEvent('themeChanged', { detail: 'light' }));
    }
}); 