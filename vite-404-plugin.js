export default function custom404Plugin() {
  return {
    name: 'custom-404',
    configureServer(server) {
      // Add middleware to handle 404s
      server.middlewares.use((req, res, next) => {
        // Save original res.end to intercept it
        const originalEnd = res.end;
        
        // Override res.end to check status before ending response
        res.end = function(...args) {
          // If this is a 404 response and not for a static asset
          if (res.statusCode === 404 && 
              !req.url.match(/\.(js|css|svg|jpg|png|ico|json|woff|woff2|ttf)$/)) {
            
            console.log(`404 detected for ${req.url} - Serving custom 404 page`);
            
            // Reset status and headers
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/html');
            
            // Read the 404 page
            try {
              const fs = require('fs');
              const path = require('path');
              const notFoundHtml = fs.readFileSync(
                path.resolve('./views/404.html'), 
                'utf8'
              );
              
              // Call the original end with our 404 content
              return originalEnd.call(this, notFoundHtml);
            } catch (err) {
              console.error('Error serving 404 page:', err);
              // If there's an error, just proceed with original response
              return originalEnd.apply(this, args);
            }
          }
          
          // For non-404 responses, proceed normally
          return originalEnd.apply(this, args);
        };
        
        next();
      });
    }
  };
} 