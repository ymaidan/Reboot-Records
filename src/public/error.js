document.addEventListener('DOMContentLoaded', () => {
    // Get error details from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const errorCode = urlParams.get('code') || '404';
    const errorTitle = getErrorTitle(errorCode);
    const errorMessage = urlParams.get('message') || getDefaultErrorMessage(errorCode);
    
    // Update DOM elements with error information
    document.getElementById('errorCode').textContent = errorCode;
    document.getElementById('errorTitle').textContent = errorTitle;
    document.getElementById('errorMessage').textContent = errorMessage;
    
    // Update page title
    document.title = `${errorCode} - ${errorTitle} | Reboot Records`;
    
    // Update SVG illustration based on error type
    updateErrorIllustration(errorCode);
    
    // Theme toggling functionality
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    const themeText = document.getElementById('themeText');
    
    // Check for saved theme preference or use default
    const savedTheme = localStorage.getItem('theme') || 'dark';
    
    // Apply saved theme
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        themeIcon.textContent = '☀️';
        themeText.textContent = 'Light';
    }
    
    // Theme toggle event listener
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        
        if (document.body.classList.contains('light-theme')) {
            localStorage.setItem('theme', 'light');
            themeIcon.textContent = '☀️';
            themeText.textContent = 'Light';
        } else {
            localStorage.setItem('theme', 'dark');
            themeIcon.textContent = '🌙';
            themeText.textContent = 'Dark';
        }
    });
});

// Helper functions
function getErrorTitle(code) {
    const titles = {
        '400': 'Bad Request',
        '401': 'Unauthorized',
        '403': 'Forbidden',
        '404': 'Page Not Found',
        '500': 'Server Error',
        '503': 'Service Unavailable'
    };
    
    return titles[code] || 'Error Occurred';
}

function getDefaultErrorMessage(code) {
    const messages = {
        '400': 'The server cannot process the request due to a client error.',
        '401': 'Authentication is required to access this resource.',
        '403': 'You don\'t have permission to access this resource.',
        '404': 'The page you\'re looking for doesn\'t exist or has been moved.',
        '500': 'Something went wrong on our server. We\'re working to fix it!',
        '503': 'The service is temporarily unavailable due to maintenance or high load.'
    };
    
    return messages[code] || 'An unexpected error occurred. Please try again later.';
}

function updateErrorIllustration(code) {
    const svg = document.getElementById('errorSvg');
    const scene = svg.querySelector('.error-scene');
    
    // Clear existing scene
    scene.innerHTML = '';
    
    if (code === '404') {
        // 404 illustration - "Page not found" with magnifying glass
        scene.innerHTML = `
            <path class="ground" d="M0,350 L600,350" stroke-width="2" />
            <path class="search-path" d="M150,200 Q300,100 450,200" stroke-dasharray="10,10" />
            <circle class="search-dot" cx="300" cy="150" r="50" />
            <circle class="search-handle" cx="220" cy="250" r="15" />
            <rect class="search-handle-stem" x="230" y="250" width="15" height="70" rx="5" transform="rotate(45, 230, 250)" />
            <text x="300" y="380" text-anchor="middle" fill="var(--text-secondary)" font-size="16">Searching for the page...</text>
        `;
    } else if (code === '500' || code === '503') {
        // 500/503 illustration - "Server error" with broken server
        scene.innerHTML = `
            <path class="ground" d="M0,350 L600,350" stroke-width="2" />
            <rect class="server" x="200" y="150" width="200" height="150" rx="10" />
            <line class="server-flash" x1="250" y1="180" x2="350" y2="180" />
            <line class="server-flash" x1="250" y1="210" x2="350" y2="210" />
            <line class="server-flash" x1="250" y1="240" x2="320" y2="240" />
            <path class="server-flash" d="M320,120 L350,150 L380,120" />
            <path class="server-flash" d="M220,120 L250,150 L280,120" />
            <text x="300" y="380" text-anchor="middle" fill="var(--text-secondary)" font-size="16">Our servers are having a moment...</text>
        `;
    } else {
        // 400 and other errors - "Bad Request" with broken data
        scene.innerHTML = `
            <path class="ground" d="M0,350 L600,350" stroke-width="2" />
            <path class="bad-data" d="M150,200 L280,200 L280,150 L400,250 L400,200 L450,200" />
            <rect class="corrupt-file" x="200" y="250" width="200" height="80" rx="5" />
            <line x1="220" y1="270" x2="380" y2="270" stroke="var(--text-muted)" />
            <line x1="220" y1="290" x2="380" y2="290" stroke="var(--text-muted)" />
            <line x1="220" y1="310" x2="300" y2="310" stroke="var(--text-muted)" />
            <path class="bad-data" d="M150,180 L150,220 M450,180 L450,220" />
            <text x="300" y="380" text-anchor="middle" fill="var(--text-secondary)" font-size="16">Oops! Something's not right...</text>
        `;
    }
} 