<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Server Error - Debug Mode</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .error-header { color: #d32f2f; font-size: 24px; margin-bottom: 20px; }
        .debug-info { background: #f8f9fa; padding: 20px; border-radius: 4px; margin: 20px 0; }
        .debug-section { margin: 15px 0; }
        .debug-label { font-weight: bold; color: #333; }
        .debug-value { color: #666; margin-left: 10px; }
        .trace { background: #f1f3f4; padding: 15px; border-radius: 4px; font-family: monospace; font-size: 12px; white-space: pre-wrap; }
        .refresh-btn { background: #1976d2; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; margin-top: 20px; }
        .refresh-btn:hover { background: #1565c0; }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="error-header">🚨 Server Error - Debug Mode Active</h1>
        
        <div class="debug-info">
            <h3>Debug Information:</h3>
            
            <div class="debug-section">
                <span class="debug-label">Error Message:</span>
                <span class="debug-value"><?= htmlspecialchars($exception->getMessage()) ?></span>
            </div>
            
            <div class="debug-section">
                <span class="debug-label">File:</span>
                <span class="debug-value"><?= htmlspecialchars($exception->getFile()) ?></span>
            </div>
            
            <div class="debug-section">
                <span class="debug-label">Line:</span>
                <span class="debug-value"><?= $exception->getLine() ?></span>
            </div>
            
            <div class="debug-section">
                <span class="debug-label">Error Class:</span>
                <span class="debug-value"><?= htmlspecialchars(get_class($exception)) ?></span>
            </div>
            
            <?php if (isset($debug)): ?>
            <div class="debug-section">
                <span class="debug-label">URL:</span>
                <span class="debug-value"><?= htmlspecialchars($debug['url']) ?></span>
            </div>
            
            <div class="debug-section">
                <span class="debug-label">User ID:</span>
                <span class="debug-value"><?= $debug['user_id'] ?? 'Not authenticated' ?></span>
            </div>
            
            <div class="debug-section">
                <span class="debug-label">Session ID:</span>
                <span class="debug-value"><?= htmlspecialchars($debug['session_id']) ?></span>
            </div>
            <?php endif; ?>
            
            <div class="debug-section">
                <span class="debug-label">Timestamp:</span>
                <span class="debug-value"><?= now()->toISOString() ?></span>
            </div>
        </div>
        
        <div class="debug-info">
            <h3>Stack Trace:</h3>
            <div class="trace"><?= htmlspecialchars($exception->getTraceAsString()) ?></div>
        </div>
        
        <div class="debug-info">
            <h3>Instructions for George (ScalaHosting Support):</h3>
            <ul>
                <li>This error page shows the exact PHP error that's causing the 500 error</li>
                <li>Check the Laravel logs for additional context: <code>tail -f storage/logs/laravel.log</code></li>
                <li>Check PHP error logs: <code>tail -f storage/logs/php-errors.log</code></li>
                <li>The error above should help identify the specific code causing the issue</li>
                <li>This debug mode is only active for maharattraining.websoft.asia</li>
            </ul>
        </div>
        
        <button class="refresh-btn" onclick="window.location.reload()">Refresh Page</button>
        
        <p style="margin-top: 30px; color: #666; font-size: 14px;">
            <strong>Note:</strong> This is a debug error page. In production, this should be replaced with a user-friendly error page.
        </p>
    </div>
</body>
</html>
