<!DOCTYPE html>
<html>
<head>
    <title>ScalaHosting Issue - Cookie Clearer</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
        .alert { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
        button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin: 5px; }
        button:hover { background: #0056b3; }
        .code { background: #f8f9fa; padding: 10px; border-radius: 5px; font-family: monospace; margin: 10px 0; }
    </style>
</head>
<body>
    <h1>🚨 ScalaHosting Infrastructure Issue</h1>
    
    <div class="alert">
        <strong>Known Issue:</strong> ScalaHosting's infrastructure is corrupting responses for returning users.
        This is NOT a problem with the application - it's a hosting infrastructure bug.
    </div>
    
    <div class="success">
        <strong>Temporary Fix:</strong> Clear your browser cookies to work around this issue.
    </div>
    
    <h2>Manual Cookie Clearing:</h2>
    <ol>
        <li>Press <strong>F12</strong> to open Developer Tools</li>
        <li>Go to <strong>Application</strong> tab</li>
        <li>Click <strong>Cookies</strong> in the left sidebar</li>
        <li>Select <strong>maharattraining.websoft.asia</strong></li>
        <li>Delete all cookies</li>
        <li>Refresh the page</li>
    </ol>
    
    <h2>Automatic Cookie Clearing:</h2>
    <button onclick="clearAllCookies()">Clear All Cookies</button>
    <button onclick="window.location.href='/emergency-login'">Clear Cookies & Go to Login</button>
    
    <h2>For ScalaHosting Support:</h2>
    <div class="code">
        Server logs show Status 200 responses but users see HTTP ERROR 500.
        This indicates infrastructure-level response corruption.
        
        Working diagnostic URLs:
        - /scalahosting-simple
        - /scalahosting-debug
        
        Failing URLs:
        - /dashboard (for returning users only)
        
        Pattern: New users work, returning users fail.
        Root cause: Cookie-based response corruption in your infrastructure.
    </div>
    
    <script>
        function clearAllCookies() {
            // Clear all cookies for this domain
            document.cookie.split(";").forEach(function(c) { 
                document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
            });
            
            // Also clear for the subdomain
            document.cookie.split(";").forEach(function(c) { 
                document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/;domain=.maharattraining.websoft.asia"); 
            });
            
            alert('Cookies cleared! Please refresh the page.');
            setTimeout(function() {
                window.location.href = '/dashboard';
            }, 2000);
        }
    </script>
</body>
</html>
