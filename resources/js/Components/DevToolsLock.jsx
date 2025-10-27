import { useEffect } from 'react';
import { useState, useRef } from 'react';

const DevToolsLock = () => {
    const [showModal, setShowModal] = useState(false);
    const promptShown = useRef(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [devToolsOpen, setDevToolsOpen] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        // Check if user was previously authenticated in this session
        return sessionStorage.getItem('devtools_authenticated') === 'true';
    });
    const originalConsoleRef = useRef({});

    const correctUsername = 'maharat_admin';
    const correctPassword = 'password';

    // Override console methods to block output
    useEffect(() => {
        if (!isAuthenticated) {
            // Store original console methods
            originalConsoleRef.current.log = console.log;
            originalConsoleRef.current.error = console.error;
            originalConsoleRef.current.warn = console.warn;
            originalConsoleRef.current.info = console.info;
            originalConsoleRef.current.debug = console.debug;
            originalConsoleRef.current.table = console.table;
            originalConsoleRef.current.trace = console.trace;
            originalConsoleRef.current.dir = console.dir;
            originalConsoleRef.current.dirxml = console.dirxml;
            originalConsoleRef.current.group = console.group;
            originalConsoleRef.current.groupCollapsed = console.groupCollapsed;
            originalConsoleRef.current.groupEnd = console.groupEnd;
            originalConsoleRef.current.clear = console.clear;
            originalConsoleRef.current.time = console.time;
            originalConsoleRef.current.timeEnd = console.timeEnd;
            originalConsoleRef.current.count = console.count;
            originalConsoleRef.current.assert = console.assert;
            originalConsoleRef.current.profile = console.profile;
            originalConsoleRef.current.profileEnd = console.profileEnd;
            originalConsoleRef.current.timeStamp = console.timeStamp;
            originalConsoleRef.current.context = console.context;

            // Block all console output
            const blockConsole = () => {
                console.log = () => {};
                console.error = () => {};
                console.warn = () => {};
                console.info = () => {};
                console.debug = () => {};
                console.table = () => {};
                console.trace = () => {};
                console.dir = () => {};
                console.dirxml = () => {};
                console.group = () => {};
                console.groupCollapsed = () => {};
                console.groupEnd = () => {};
                console.clear = () => {};
                console.time = () => {};
                console.timeEnd = () => {};
                console.count = () => {};
                console.assert = () => {};
                console.profile = () => {};
                console.profileEnd = () => {};
                console.timeStamp = () => {};
                console.context = () => {};
            };

            blockConsole();

            return () => {
                // Restore original console if component unmounts
                if (originalConsoleRef.current.log) {
                    console.log = originalConsoleRef.current.log;
                    console.error = originalConsoleRef.current.error;
                    console.warn = originalConsoleRef.current.warn;
                    console.info = originalConsoleRef.current.info;
                    console.debug = originalConsoleRef.current.debug;
                    console.table = originalConsoleRef.current.table;
                    console.trace = originalConsoleRef.current.trace;
                    console.dir = originalConsoleRef.current.dir;
                    console.dirxml = originalConsoleRef.current.dirxml;
                    console.group = originalConsoleRef.current.group;
                    console.groupCollapsed = originalConsoleRef.current.groupCollapsed;
                    console.groupEnd = originalConsoleRef.current.groupEnd;
                    console.clear = originalConsoleRef.current.clear;
                    console.time = originalConsoleRef.current.time;
                    console.timeEnd = originalConsoleRef.current.timeEnd;
                    console.count = originalConsoleRef.current.count;
                    console.assert = originalConsoleRef.current.assert;
                    console.profile = originalConsoleRef.current.profile;
                    console.profileEnd = originalConsoleRef.current.profileEnd;
                    console.timeStamp = originalConsoleRef.current.timeStamp;
                    console.context = originalConsoleRef.current.context;
                }
            };
        } else {
            // Restore console when authenticated
            if (originalConsoleRef.current.log) {
                console.log = originalConsoleRef.current.log;
                console.error = originalConsoleRef.current.error;
                console.warn = originalConsoleRef.current.warn;
                console.info = originalConsoleRef.current.info;
                console.debug = originalConsoleRef.current.debug;
                console.table = originalConsoleRef.current.table;
                console.trace = originalConsoleRef.current.trace;
                console.dir = originalConsoleRef.current.dir;
                console.dirxml = originalConsoleRef.current.dirxml;
                console.group = originalConsoleRef.current.group;
                console.groupCollapsed = originalConsoleRef.current.groupCollapsed;
                console.groupEnd = originalConsoleRef.current.groupEnd;
                console.clear = originalConsoleRef.current.clear;
                console.time = originalConsoleRef.current.time;
                console.timeEnd = originalConsoleRef.current.timeEnd;
                console.count = originalConsoleRef.current.count;
                console.assert = originalConsoleRef.current.assert;
                console.profile = originalConsoleRef.current.profile;
                console.profileEnd = originalConsoleRef.current.profileEnd;
                console.timeStamp = originalConsoleRef.current.timeStamp;
                console.context = originalConsoleRef.current.context;
            }
        }
    }, [isAuthenticated]);

    // Function to detect if devtools is opened
    const detectDevTools = () => {
        let devtools = false;
        const threshold = 160;
        let checkCount = 0;

        const checkDevTools = setInterval(() => {
            checkCount++;
            const heightDiff = window.outerHeight - window.innerHeight;
            const widthDiff = window.outerWidth - window.innerWidth;
            
            if (heightDiff > threshold || widthDiff > threshold) {
                if (!devtools && !isAuthenticated) {
                    devtools = true;
                    setDevToolsOpen(true);
                    setShowModal(true);
                    
                    // Lock the entire page - disable all interactions
                    document.body.style.pointerEvents = 'none';
                    document.body.style.userSelect = 'none';
                    document.body.style.webkitUserSelect = 'none';
                    
                    // Block all keyboard input except in our modal
                    document.body.style.overflow = 'hidden';
                }
            } else {
                if (devtools && !isAuthenticated) {
                    setShowModal(false);
                    setDevToolsOpen(false);
                    document.body.style.pointerEvents = '';
                    document.body.style.userSelect = '';
                    document.body.style.webkitUserSelect = '';
                    document.body.style.overflow = '';
                }
                devtools = false;
            }
            
            // Stop checking after 5 minutes to avoid infinite loop
            if (checkCount > 600) {
                clearInterval(checkDevTools);
            }
        }, 500);

        return () => {
            clearInterval(checkDevTools);
        };
    };

    // Block Performance API when dev tools is open (but not authenticated)
    useEffect(() => {
        if (!isAuthenticated && devToolsOpen && window.performance) {
            // Override performance API methods to prevent network viewing
            const originalGetEntries = window.performance.getEntries;
            const originalGetEntriesByType = window.performance.getEntriesByType;
            const originalGetEntriesByName = window.performance.getEntriesByName;
            const originalClearResourceTimings = window.performance.clearResourceTimings;

            // Block network data
            window.performance.getEntries = function() { return []; };
            window.performance.getEntriesByType = function() { return []; };
            window.performance.getEntriesByName = function() { return []; };
            
            // Continuously clear network timing data
            const clearNetworkInterval = setInterval(() => {
                if (window.performance && window.performance.clearResourceTimings) {
                    window.performance.clearResourceTimings();
                }
            }, 100);

            return () => {
                // Stop clearing
                clearInterval(clearNetworkInterval);
                
                // Restore original methods
                if (originalGetEntries) {
                    window.performance.getEntries = originalGetEntries;
                }
                if (originalGetEntriesByType) {
                    window.performance.getEntriesByType = originalGetEntriesByType;
                }
                if (originalGetEntriesByName) {
                    window.performance.getEntriesByName = originalGetEntriesByName;
                }
            };
        }
    }, [devToolsOpen, isAuthenticated]);

    useEffect(() => {
        // Don't run protection if already authenticated
        if (isAuthenticated) {
            return;
        }

        // Function to handle all keyboard shortcuts
        const handleKeyboardShortcuts = (e) => {
            // F12
            if (e.keyCode === 123) {
                e.preventDefault();
                setShowModal(true);
                setDevToolsOpen(true);
                document.body.style.pointerEvents = 'none';
                return false;
            }
            
            // Ctrl+Shift+I, Ctrl+Shift+J
            if (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74)) {
                e.preventDefault();
                setShowModal(true);
                setDevToolsOpen(true);
                document.body.style.pointerEvents = 'none';
                return false;
            }
            
            // Ctrl+Shift+C
            if (e.ctrlKey && e.shiftKey && e.keyCode === 67) {
                e.preventDefault();
                setShowModal(true);
                setDevToolsOpen(true);
                document.body.style.pointerEvents = 'none';
                return false;
            }
            
            // Ctrl+U (view source)
            if (e.ctrlKey && e.keyCode === 85) {
                e.preventDefault();
                return false;
            }
        };

        // Function to disable right-click context menu
        const handleContextMenu = (e) => {
            e.preventDefault();
        };

        // Function to disable text selection shortcuts
        const handleKeyDown = (e) => {
            // Disable Ctrl+S, Ctrl+P
            if (e.ctrlKey && (e.keyCode === 83 || e.keyCode === 80)) {
                e.preventDefault();
                return false;
            }
            
            handleKeyboardShortcuts(e);
        };

        // Disable F12 and other F keys that might open dev tools
        const handleKeyUp = (e) => {
            if (e.keyCode === 123 || [112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122].includes(e.keyCode)) {
                e.preventDefault();
                return false;
            }
        };

        // Prevent ESC from closing if modal is shown
        const handleEsc = (e) => {
            if (e.keyCode === 27 && devToolsOpen && !isAuthenticated) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        };

        // Add event listeners
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
        document.addEventListener('keypress', handleEsc);
        document.addEventListener('contextmenu', handleContextMenu);
        
        // Detect if dev tools is opened
        const cleanupDevTools = detectDevTools();

        // Disable text selection
        const handleSelect = (e) => {
            if (!isAuthenticated) {
                e.preventDefault();
            }
        };
        document.addEventListener('selectstart', handleSelect);

        // Clean up event listeners on unmount
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('keyup', handleKeyUp);
            document.removeEventListener('keypress', handleEsc);
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('selectstart', handleSelect);
            cleanupDevTools();
            document.body.style.pointerEvents = '';
        };
    }, [isAuthenticated, devToolsOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (username === correctUsername && password === correctPassword) {
            setIsAuthenticated(true);
            setShowModal(false);
            setDevToolsOpen(false);
            setError('');
            setUsername('');
            setPassword('');
            // Restore page functionality
            document.body.style.pointerEvents = '';
            document.body.style.overflow = '';
            document.body.style.userSelect = '';
            document.body.style.webkitUserSelect = '';
            // Save authentication state in sessionStorage
            sessionStorage.setItem('devtools_authenticated', 'true');
        } else {
            setError('Invalid username or password');
            setPassword('');
        }
    };

    // No handleClose - users can't close without authentication
    const handleClose = () => {
        // Do nothing - force authentication
    };

    // Show native browser alert when dev tools is opened
    useEffect(() => {
        if (showModal && !isAuthenticated && devToolsOpen && !promptShown.current) {
            promptShown.current = true;
            
            // Lock the entire page - disable all interactions
            document.body.style.pointerEvents = 'none';
            document.body.style.overflow = 'hidden';
            document.body.style.userSelect = 'none';
            document.body.style.webkitUserSelect = 'none';
            
            // Create full screen overlay to gray out everything
            const overlay = document.createElement('div');
            overlay.id = 'devtools-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(0, 0, 0, 0.95);
                z-index: 2147483647;
                pointer-events: auto;
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            document.body.appendChild(overlay);
            
            // Use debugger to pause if they try to interact with anything
            const debuggerInterval = setInterval(() => {
                if (!sessionStorage.getItem('devtools_authenticated')) {
                    debugger;
                }
            }, 200);
            
            // Use native prompt
            const authUsername = prompt('Developer Tools Locked\n\nEnter Username:');
            
            // Stop debugger
            clearInterval(debuggerInterval);
            
            // If user clicks Cancel (null), redirect to login
            if (authUsername === null) {
                const overlay = document.getElementById('devtools-overlay');
                if (overlay) overlay.remove();
                window.location.href = '/login';
                return;
            }
            
            if (authUsername === correctUsername) {
                const authPassword = prompt('Enter Password:');
                
                // If user clicks Cancel on password, redirect to login
                if (authPassword === null) {
                    const overlay = document.getElementById('devtools-overlay');
                    if (overlay) overlay.remove();
                    window.location.href = '/login';
                    return;
                }
                
                if (authPassword === correctPassword) {
                    // Remove overlay
                    const overlay = document.getElementById('devtools-overlay');
                    if (overlay) {
                        overlay.style.display = 'none';
                        overlay.remove();
                    }
                    
                    // Force restore page immediately
                    document.body.style.pointerEvents = '';
                    document.body.style.overflow = '';
                    document.body.style.userSelect = '';
                    document.body.style.webkitUserSelect = '';
                    
                    // Set authentication state
                    sessionStorage.setItem('devtools_authenticated', 'true');
                    setIsAuthenticated(true);
                    setShowModal(false);
                    setDevToolsOpen(false);
                    promptShown.current = false;
                    
                    // Force unlock immediately
                    window.location.reload();
                } else {
                    // Remove overlay
                    const overlay = document.getElementById('devtools-overlay');
                    if (overlay) {
                        overlay.style.display = 'none';
                        overlay.remove();
                    }
                    
                    promptShown.current = false;
                    alert('Invalid password. Redirecting to login...');
                    window.location.href = '/login';
                }
            } else {
                // Remove overlay
                const overlay = document.getElementById('devtools-overlay');
                if (overlay) {
                    overlay.style.display = 'none';
                    overlay.remove();
                }
                
                promptShown.current = false;
                alert('Invalid username. Redirecting to login...');
                window.location.href = '/login';
            }
        }
    }, [showModal, devToolsOpen, isAuthenticated]);

    // Return null - no frontend modal needed, only native prompts
    return null;
};

export default DevToolsLock;

