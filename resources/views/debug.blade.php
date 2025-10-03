<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Debug Information - Maharat Training</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px; }
        .header { color: #1976d2; font-size: 24px; margin-bottom: 20px; }
        .section { margin: 20px 0; }
        .section h3 { color: #333; border-bottom: 2px solid #1976d2; padding-bottom: 5px; }
        .info-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 10px; margin: 10px 0; }
        .label { font-weight: bold; color: #555; }
        .value { color: #666; font-family: monospace; background: #f8f9fa; padding: 5px; border-radius: 3px; }
        .log-content { background: #f1f3f4; padding: 15px; border-radius: 4px; font-family: monospace; font-size: 12px; white-space: pre-wrap; max-height: 400px; overflow-y: auto; }
        .error-line { color: #d32f2f; font-weight: bold; }
        .warning-line { color: #f57c00; }
        .info-line { color: #1976d2; }
        .btn { background: #1976d2; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; margin: 5px; text-decoration: none; display: inline-block; }
        .btn:hover { background: #1565c0; }
        .btn-danger { background: #d32f2f; }
        .btn-danger:hover { background: #b71c1c; }
        .status { padding: 5px 10px; border-radius: 3px; font-weight: bold; }
        .status-success { background: #c8e6c9; color: #2e7d32; }
        .status-warning { background: #fff3e0; color: #f57c00; }
        .status-error { background: #ffcdd2; color: #d32f2f; }
        .refresh-info { background: #e3f2fd; padding: 15px; border-radius: 4px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="header">🔍 Debug Information</h1>
        
        <div class="refresh-info">
            <strong>Instructions:</strong> 
            <ol>
                <li>Reproduce the error (login → close tab → return to website)</li>
                <li>Come back to this page and refresh to see new errors</li>
                <li>Look for lines with 🔴, ERROR, or CRITICAL in the logs below</li>
            </ol>
        </div>

        <div class="section">
            <h3>Current Request Info</h3>
            <div class="info-grid">
                <div class="label">Timestamp:</div>
                <div class="value">{{ $debugInfo['timestamp'] }}</div>
                
                <div class="label">URL:</div>
                <div class="value">{{ $debugInfo['url'] }}</div>
                
                <div class="label">User ID:</div>
                <div class="value">{{ $debugInfo['user_id'] ?? 'Not authenticated' }}</div>
                
                <div class="label">Session ID:</div>
                <div class="value">{{ $debugInfo['session_id'] }}</div>
                
                <div class="label">Is Returning User:</div>
                <div class="value">{{ $debugInfo['is_returning_user'] }}</div>
            </div>
        </div>

        @if(isset($debugInfo['session_data']) && !empty($debugInfo['session_data']))
        <div class="section">
            <h3>Current Session Data</h3>
            <div class="info-grid">
                <div class="label">Session ID:</div>
                <div class="value">{{ $debugInfo['session_data']['session_id'] }}</div>
                
                <div class="label">Auth Guard:</div>
                <div class="value">{{ $debugInfo['session_data']['auth_guard'] }}</div>
                
                <div class="label">Auth User ID:</div>
                <div class="value">{{ $debugInfo['session_data']['auth_user_id'] ?? 'Not authenticated' }}</div>
                
                <div class="label">Auth User Email:</div>
                <div class="value">{{ $debugInfo['session_data']['auth_user_email'] ?? 'Not authenticated' }}</div>
            </div>
            <div class="section">
                <h4>Session Data Contents:</h4>
                <div class="log-content">{{ json_encode($debugInfo['session_data']['session_data'], JSON_PRETTY_PRINT) }}</div>
            </div>
        </div>
        @endif

        @if(isset($debugInfo['cookie_session_data']) && $debugInfo['cookie_session_data'])
        <div class="section">
            <h3>Cookie Session Data (from Database)</h3>
            <div class="info-grid">
                <div class="label">Session ID:</div>
                <div class="value">{{ $debugInfo['cookie_session_data']->id }}</div>
                
                <div class="label">User ID:</div>
                <div class="value">{{ $debugInfo['cookie_session_data']->user_id ?? 'NULL' }}</div>
                
                <div class="label">IP Address:</div>
                <div class="value">{{ $debugInfo['cookie_session_data']->ip_address }}</div>
                
                <div class="label">Last Activity:</div>
                <div class="value">{{ date('Y-m-d H:i:s', $debugInfo['cookie_session_data']->last_activity) }}</div>
            </div>
            <div class="section">
                <h4>Session Payload (Decrypted):</h4>
                <div class="log-content">{{ $debugInfo['cookie_session_data']->payload }}</div>
            </div>
        </div>
        @endif

        <div class="section">
            <h3>PHP Debug Settings</h3>
            <div class="info-grid">
                <div class="label">Error Reporting:</div>
                <div class="value">{{ $phpDebugInfo['error_reporting'] }}</div>
                
                <div class="label">Display Errors:</div>
                <div class="value">{{ $phpDebugInfo['display_errors'] }}</div>
                
                <div class="label">Log Errors:</div>
                <div class="value">{{ $phpDebugInfo['log_errors'] }}</div>
                
                <div class="label">Error Log Path:</div>
                <div class="value">{{ $phpDebugInfo['error_log'] }}</div>
                
                <div class="label">Memory Limit:</div>
                <div class="value">{{ $phpDebugInfo['memory_limit'] }}</div>
                
                <div class="label">Max Execution Time:</div>
                <div class="value">{{ $phpDebugInfo['max_execution_time'] }}</div>
            </div>
        </div>

        <div class="section">
            <h3>Log File Status</h3>
            <div class="info-grid">
                <div class="label">Laravel Log:</div>
                <div class="value">
                    <span class="status {{ File::exists($laravelLogPath) ? 'status-success' : 'status-error' }}">
                        {{ File::exists($laravelLogPath) ? 'EXISTS' : 'NOT FOUND' }}
                    </span>
                    <br><small>{{ $laravelLogPath }}</small>
                </div>
                
                <div class="label">PHP Error Log:</div>
                <div class="value">
                    <span class="status {{ File::exists($phpErrorLogPath) ? 'status-success' : 'status-warning' }}">
                        {{ File::exists($phpErrorLogPath) ? 'EXISTS' : 'NOT FOUND' }}
                    </span>
                    <br><small>{{ $phpErrorLogPath }}</small>
                </div>
            </div>
        </div>

        <div class="section">
            <h3>Recent Laravel Logs (Last 50 lines)</h3>
            <div class="log-content">
                @if(!empty($recentLaravelLogs))
                    @foreach($recentLaravelLogs as $line)
                        @if(str_contains($line, 'ERROR') || str_contains($line, 'CRITICAL') || str_contains($line, '🔴'))
                            <div class="error-line">{{ $line }}</div>
                        @elseif(str_contains($line, 'WARNING') || str_contains($line, '⚠️'))
                            <div class="warning-line">{{ $line }}</div>
                        @elseif(str_contains($line, 'INFO') || str_contains($line, '✅') || str_contains($line, '🔍'))
                            <div class="info-line">{{ $line }}</div>
                        @else
                            {{ $line }}
                        @endif
                    @endforeach
                @else
                    No Laravel logs found or log file is empty.
                @endif
            </div>
        </div>

        <div class="section">
            <h3>Recent PHP Errors (Last 50 lines)</h3>
            <div class="log-content">
                @if(!empty($recentPhpErrors))
                    @foreach($recentPhpErrors as $line)
                        @if(str_contains($line, 'Fatal error') || str_contains($line, 'Parse error'))
                            <div class="error-line">{{ $line }}</div>
                        @elseif(str_contains($line, 'Warning') || str_contains($line, 'Notice'))
                            <div class="warning-line">{{ $line }}</div>
                        @else
                            {{ $line }}
                        @endif
                    @endforeach
                @else
                    No PHP errors found or error log is empty.
                @endif
            </div>
        </div>

        <div class="section">
            <h3>Actions</h3>
            <a href="{{ route('debug.show') }}" class="btn">Refresh Debug Info</a>
            <a href="{{ route('debug.errors') }}" class="btn">Show Recent Errors Only</a>
            <a href="{{ route('debug.clear') }}" class="btn btn-danger" onclick="return confirm('Are you sure you want to clear all logs?')">Clear Logs</a>
            <a href="{{ route('dashboard') }}" class="btn">Go to Dashboard</a>
        </div>

        <div class="section">
            <h3>Instructions for George (ScalaHosting Support)</h3>
            <ol>
                <li><strong>Reproduce the error:</strong> Login → Close tab → Return to website</li>
                <li><strong>Check this page:</strong> Refresh this debug page to see new errors</li>
                <li><strong>Look for:</strong> Lines with 🔴, ERROR, CRITICAL, Fatal error, or Parse error</li>
                <li><strong>Copy the error:</strong> The exact error message, file, and line number</li>
                <li><strong>Check both logs:</strong> Laravel logs and PHP error logs</li>
            </ol>
        </div>
    </div>

    <script>
        // Auto-refresh every 30 seconds
        setTimeout(function() {
            window.location.reload();
        }, 30000);
    </script>
</body>
</html>
