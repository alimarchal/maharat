import React, { useState, useEffect } from "react";
import { usePage, Link } from "@inertiajs/react";
import { Play, Edit, Trash, AlertCircle } from "lucide-react";
import axios from "axios";
import CreateUserGuide from "./CreateUserGuide";

export default function GuideDetail() {
    const { props } = usePage();
    const { auth } = usePage().props;
    
    // Get ID from props, ensuring we handle numeric IDs properly
    const guideId = props.id || props.section || "create-request";
    
    const [guide, setGuide] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [card, setCard] = useState(null);
    const [error, setError] = useState(null);
    const [debugInfo, setDebugInfo] = useState(null);
    const [imageErrors, setImageErrors] = useState({});

    // For debugging, log the props
    useEffect(() => {
        console.log("Component props:", props);
    }, []);

    useEffect(() => {
        console.log("DEBUG: Component mounted, props:", props);
        
        // Only fetch from API if we have a numeric ID
        if (guideId && !isNaN(parseInt(guideId))) {
            fetchGuideData();
        } else {
            // For non-numeric IDs (hardcoded sections), just set loading to false
            setLoading(false);
        }
    }, [guideId]);

    const fetchGuideData = async () => {
        try {
            setLoading(true);
            const numericId = parseInt(guideId);
            console.log(`DEBUG: Fetching guide data for ID: ${numericId}`);
            
            const response = await axios.get(`/api/v1/user-manuals/${numericId}?include=card,steps,steps.details,steps.screenshots,steps.actions&_=${Date.now()}`);
            
            if (response.data && response.data.data) {
                console.log("DEBUG: Guide data loaded:", response.data.data);
                
                if (response.data.data.steps) {
                    console.log("DEBUG: Steps data:", response.data.data.steps);
                    
                    // Log screenshots data
                    response.data.data.steps.forEach((step, idx) => {
                        console.log(`DEBUG: Step ${idx+1} (ID: ${step.id}) has ${step.screenshots?.length || 0} screenshots`);
                        if (step.screenshots && step.screenshots.length > 0) {
                            step.screenshots.forEach((ss, ssIdx) => {
                                console.log(`DEBUG: Screenshot ${ssIdx+1} data:`, ss);
                            });
                        }
                    });
                }
                
                setGuide(response.data.data);
                setDebugInfo({
                    id: response.data.data.id,
                    title: response.data.data.title,
                    steps: response.data.data.steps?.length || 0,
                    hasScreenshots: response.data.data.steps?.some(step => step.screenshots?.length > 0) || false,
                    apiUrl: response.config?.url
                });
                
                // If guide has a card, fetch card data
                if (response.data.data.card_id) {
                    if (!response.data.data.card) {
                        fetchCardData(response.data.data.card_id);
                    } else {
                        setCard(response.data.data.card);
                    }
                }
            } else {
                console.warn("No guide data in response:", response.data);
                setError("No guide data found for this ID. API returned empty response.");
                
                // Only use hardcoded content as a fallback for specific IDs
                if (guideContent[guideId]) {
                    setDebugInfo({
                        message: "Using hardcoded fallback content",
                        id: guideId,
                        apiUrl: response.config?.url
                    });
                } else {
                    setDebugInfo({
                        message: "No hardcoded content available for this ID",
                        id: guideId,
                        apiUrl: response.config?.url
                    });
                }
            }
        } catch (error) {
            console.error("Error fetching guide:", error);
            setError(`Failed to load guide data: ${error.response?.data?.message || error.message}`);
            setDebugInfo({
                error: true,
                message: error.message,
                status: error.response?.status,
                statusText: error.response?.statusText,
                requestUrl: error.config?.url
            });
        } finally {
            setLoading(false);
        }
    };
    
    const fetchCardData = async (cardId) => {
        try {
            console.log("Fetching card data for ID:", cardId);
            const response = await axios.get(`/api/v1/cards/${cardId}`);
            if (response.data && response.data.data) {
                console.log("Card data loaded:", response.data.data);
                setCard(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching card:", error);
        }
    };

    const handleDelete = async () => {
        if (!guide || !guide.id) return;
        
        try {
            await axios.delete(`/api/v1/user-manuals/${guide.id}`);
            // Redirect to user manual home page after deletion
            window.location.href = '/user-manual';
        } catch (error) {
            console.error("Error deleting guide:", error);
            setError("Failed to delete guide. Please try again.");
        }
    };

    // Define tasks for different guides (hardcoded guides as fallback only)
    const guideContent = {
        "create-request": {
            title: "How to create a material request for warehouses",
            tasks: [
                {
                    number: 1,
                    title: "To create a material request in the Material system, follow these steps:",
                    content: `"1. Login"
                              "2. Open the Material Procurement and Inventory Management System"
                              "3. Enter your credentials (e.g., Zadeem Portal) and login."`,
                    imageUrl: "/images/manuals/request.png",
                    hyperLink: "/user-manual/request",
                },
                {
                    number: 2,
                    title: "Navigate to Tasks",
                    content:
                        "1. On the dashboard, click on Task Center to view assigned tasks.",
                    imageUrl: "/images/manuals/request.png",
                    hyperLink: "/user-manual/request",
                },
                {
                    number: 3,
                    title: "Locate the Material Request",
                    content: `"1. In the My Tasks section, find the new material request."
                              "2. Click on the eye icon under Actions to review the request details."`,
                    imageUrl: "/images/manuals/request.png",
                    hyperLink: "/user-manual/request",
                },
                {
                    number: 4,
                    title: "Review the Request Details",
                    content: `"1. Examine all provided information, including urgency, description, and requested items."`,
                    imageUrl: "/images/manuals/request.png",
                    hyperLink: "/user-manual/request",
                },
                {
                    number: 5,
                    title: "Approve, Reject or Refer",
                    content: `"1. Fill the required fields."
                              "2. Select value from dropdown"`,
                    imageUrl: "/images/manuals/request.png",
                    hyperLink: "/user-manual/request",
                },
                {
                    number: 6,
                    title: "Confirm Action",
                    content: `"1. Click on the respective button to finalize your decision."`,
                    imageUrl: "/images/manuals/request.png",
                    hyperLink: "/user-manual/request",
                },
                { video: "video link" },
            ],
        },
        "track-request": {
            title: "How to track material request status",
            tasks: [
                {
                    number: 1,
                    title: "Access the Request Tracking",
                    content: `"1. Login to the system"
                              "2. Navigate to Request section"
                              "3. Select 'My Requests' from the dropdown."`,
                    imageUrl: "/images/manuals/request.png",
                    hyperLink: "/user-manual/request",
                },
                {
                    number: 2,
                    title: "Filter and Search",
                    content: `"1. Use the search bar to find specific requests"
                              "2. Apply filters to narrow down results"`,
                    imageUrl: "/images/manuals/request.png",
                    hyperLink: "/user-manual/request",
                },
                {
                    number: 3,
                    title: "View Request Details",
                    content: `"1. Click on any request to view its detailed status"
                              "2. Check the timeline for updates on your request"`,
                    imageUrl: "/images/manuals/request.png",
                    hyperLink: "/user-manual/request",
                },
                { video: "video link" },
            ],
        },
        "edit-profile": {
            title: "How to edit your user profile",
            tasks: [
                {
                    number: 1,
                    title: "Access Profile Settings",
                    content: `"1. Click on your profile icon in the top-right corner"
                              "2. Select 'Profile Settings' from the dropdown menu"`,
                    imageUrl: "/images/manuals/user-profile.png",
                    hyperLink: "/user-manual/user-profile",
                },
                {
                    number: 2,
                    title: "Edit Profile Information",
                    content: `"1. Update your personal information in the form"
                              "2. Change profile picture if needed"`,
                    imageUrl: "/images/manuals/user-profile.png",
                    hyperLink: "/user-manual/user-profile",
                },
                {
                    number: 3,
                    title: "Save Changes",
                    content: `"1. Review all changes before submitting"
                              "2. Click the 'Save Changes' button to update your profile"`,
                    imageUrl: "/images/manuals/user-profile.png",
                    hyperLink: "/user-manual/user-profile",
                },
                { video: "video link" },
            ],
        },
        "change-password": {
            title: "How to change your password",
            tasks: [
                {
                    number: 1,
                    title: "Access Account Settings",
                    content: `"1. Click on your profile icon"
                              "2. Select 'Account Settings'"`,
                    imageUrl: "/images/manuals/user-profile.png",
                    hyperLink: "/user-manual/user-profile",
                },
                {
                    number: 2,
                    title: "Navigate to Security",
                    content: `"1. Go to the 'Security' tab"
                              "2. Find the 'Change Password' section"`,
                    imageUrl: "/images/manuals/user-profile.png",
                    hyperLink: "/user-manual/user-profile",
                },
                {
                    number: 3,
                    title: "Update Password",
                    content: `"1. Enter your current password"
                              "2. Enter your new password"
                              "3. Confirm your new password"`,
                    imageUrl: "/images/manuals/user-profile.png",
                    hyperLink: "/user-manual/user-profile",
                },
                {
                    number: 4,
                    title: "Save Changes",
                    content: `"1. Click 'Update Password' button"
                              "2. Confirm the change if prompted"`,
                    imageUrl: "/images/manuals/user-profile.png",
                    hyperLink: "/user-manual/user-profile",
                },
                { video: "video link" },
            ],
        },
    };

    // Function to check if user has permission to edit
    const canEdit = () => {
        if (!auth || !auth.user) return false;
        
        // Check if user is the creator of the guide
        if (guide && guide.creator && guide.creator.id === auth.user.id) {
            return true;
        }
        
        // Check if user has admin permissions
        if (auth.user.permissions && (
            auth.user.permissions.includes('manage_configuration') || 
            auth.user.permissions.includes('edit_permission_settings')
        )) {
            return true;
        }
        
        return false;
    };

    const formatContent = (content) => {
        if (!content) return null;
        
        // Handle API data format (already parsed)
        if (Array.isArray(content)) {
            return content.map((detail, idx) => (
                <p key={idx} className="text-lg font-medium mb-2">
                    {detail.content}
                </p>
            ));
        }
        
        // Handle hardcoded format
        const lines = content.match(/"(.*?)"/g);
        return lines?.map((line, idx) => (
            <p key={idx} className="text-lg font-medium mb-2">
                {line.replace(/"/g, "").trim()}
            </p>
        ));
    };

    // Sort steps by their order or step_number
    const sortedSteps = () => {
        if (!guide || !guide.steps) return [];
        
        return [...guide.steps].sort((a, b) => {
            // First try to sort by order
            if (a.order !== undefined && b.order !== undefined) {
                return a.order - b.order;
            }
            // Then try to sort by step_number
            return (a.step_number || 0) - (b.step_number || 0);
        });
    };

    // Only use hardcoded content if no guide data is loaded from the API
    const usingHardcodedContent = !guide && guideContent[guideId];
    const currentGuide = guide || (usingHardcodedContent ? guideContent[guideId] : null);
    
    // Extract tasks from either API data or hardcoded content
    const tasks = guide ? sortedSteps() : (currentGuide?.tasks || []);

    // Improved video URL handling specifically for YouTube shorts
    const getFormattedVideoUrl = (videoPath, videoType) => {
        if (!videoPath) {
            console.warn("Empty video URL received");
            return null;
        }
        
        // Log for debugging
        console.log(`Processing video URL: ${videoPath}, type: ${videoType}`);
        
        let formattedUrl = videoPath;
        
        if (videoType === 'youtube') {
            // Handle different YouTube URL formats
            if (videoPath.includes('embed')) {
                formattedUrl = videoPath;
                console.log(`Using embed URL as is: ${formattedUrl}`);
            } else if (videoPath.includes('shorts/')) {
                // Handle YouTube shorts format
                const videoId = videoPath.split('shorts/')[1]?.split('?')[0];
                formattedUrl = `https://www.youtube.com/embed/${videoId}`;
                console.log(`Extracted YouTube Shorts ID: ${videoId}, new URL: ${formattedUrl}`);
            } else if (videoPath.includes('v=')) {
                const videoId = videoPath.split('v=')[1]?.split('&')[0];
                formattedUrl = `https://www.youtube.com/embed/${videoId}`;
                console.log(`Extracted YouTube ID from v= parameter: ${videoId}, new URL: ${formattedUrl}`);
            } else if (videoPath.includes('youtu.be/')) {
                const videoId = videoPath.split('youtu.be/')[1];
                formattedUrl = `https://www.youtube.com/embed/${videoId}`;
                console.log(`Extracted YouTube ID from youtu.be URL: ${videoId}, new URL: ${formattedUrl}`);
            } else {
                console.warn(`Unrecognized YouTube URL format: ${videoPath}`);
            }
        }
        
        return formattedUrl;
    };

    // Use the direct URL format that works when clicked
    const getImageUrl = (screenshot) => {
        console.log("DEBUG: Screenshot data received:", screenshot);
        
        // Check if screenshot_path exists and use it as primary source
        if (screenshot.screenshot_path) {
            const path = screenshot.screenshot_path;
            console.log(`DEBUG: Using screenshot_path: ${path}`);
            
            // If it's already a full URL, return it
            if (path.startsWith('http')) {
                console.log(`DEBUG: Path is already a full URL: ${path}`);
                return path;
            }
            
            // Use the direct path format that works when clicking "Try Direct URL"
            // This is a simple /storage/ path without origin
            const directUrl = `/storage/${path}`;
            console.log(`DEBUG: Using direct URL: ${directUrl}`);
            
            return directUrl;
        }
        
        // Fallback to screenshot_url if screenshot_path doesn't exist
        if (screenshot.screenshot_url) {
            console.log(`DEBUG: No screenshot_path found, falling back to screenshot_url: ${screenshot.screenshot_url}`);
            return screenshot.screenshot_url;
        }
        
        console.warn("DEBUG: No screenshot path or URL found");
        return "/images/placeholder.png";
    };

    // Add a function to check if a URL is accessible
    const testUrlAccessibility = async (url, type = "image") => {
        try {
            console.log(`Testing ${type} URL accessibility: ${url}`);
            const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
            console.log(`${type} URL response status:`, response.status);
            return response.ok;
        } catch (error) {
            console.error(`Error checking ${type} URL:`, error);
            return false;
        }
    };

    // Enhanced screenshot error handling with more debugging
    const handleImageError = (screenshotId, url) => {
        console.warn(`DEBUG: Image load failed - ID ${screenshotId}: ${url}`);
        console.log(`DEBUG: Current page URL: ${window.location.href}`);
        console.log(`DEBUG: Image Network request details:`);
        
        // Try to fetch the image to see what's happening
        fetch(url, { method: 'HEAD' })
            .then(response => {
                console.log(`DEBUG: Image fetch status: ${response.status} ${response.statusText}`);
                console.log(`DEBUG: Image response headers:`, Object.fromEntries([...response.headers]));
            })
            .catch(error => {
                console.error(`DEBUG: Image fetch error:`, error);
            });
        
        // Track which images have errored
        setImageErrors(prev => ({
            ...prev,
            [screenshotId]: true
        }));
    };

    // Handle loading state
    if (loading) {
        return (
            <div className="w-full flex justify-center items-center h-64">
                <div className="w-12 h-12 border-4 border-[#009FDC] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    // Handle error state
    if (error) {
        return (
            <div className="w-full flex flex-col items-center justify-center h-64">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 max-w-2xl" role="alert">
                    <div className="flex items-center">
                        <AlertCircle className="mr-2" size={24} />
                        <strong className="font-bold">Error: </strong>
                        <span className="block sm:inline ml-2">{error}</span>
                    </div>
                </div>
                {debugInfo && (
                    <div className="mt-4 bg-gray-100 p-4 rounded max-w-2xl">
                        <h3 className="font-bold mb-2">Debug Information:</h3>
                        <pre className="text-xs overflow-auto">{JSON.stringify(debugInfo, null, 2)}</pre>
                    </div>
                )}
                <div className="mt-4">
                    <button 
                        onClick={fetchGuideData} 
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    >
                        Try Again
                    </button>
                    <Link 
                        href="/user-manual" 
                        className="ml-4 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
                    >
                        Back to User Manual
                    </Link>
                </div>
            </div>
        );
    }

    // Handle case where no guide is found (neither from API nor hardcoded)
    if (!currentGuide) {
        return (
            <div className="w-full flex flex-col items-center justify-center h-64">
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-4 max-w-2xl" role="alert">
                    <strong className="font-bold">Not Found: </strong>
                    <span className="block sm:inline">The requested guide could not be found.</span>
                </div>
                <Link 
                    href="/user-manual" 
                    className="mt-4 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
                >
                    Back to User Manual
                </Link>
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Title Section - Simplified like SimpleGuideDetail */}
            <div className="flex justify-center items-center mb-10">
                <h1 className="text-3xl font-bold text-gray-800 text-center">
                    {currentGuide.title}
                </h1>
            </div>
            
            {/* Edit/Delete Buttons for authenticated users with permissions */}
            {guide && canEdit() && (
                <div className="flex justify-end mb-4">
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setIsEditModalOpen(true)}
                            className="bg-[#009FDC] text-white p-2 rounded-full hover:bg-blue-600 transition duration-150"
                            title="Edit Guide"
                        >
                            <Edit size={20} />
                        </button>
                        <button
                            onClick={() => setShowConfirmDelete(true)}
                            className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition duration-150"
                            title="Delete Guide"
                        >
                            <Trash size={20} />
                        </button>
                    </div>
                </div>
            )}

            {/* Timeline Section */}
            <div className="relative">
                <div className="absolute left-6 top-10 bottom-20 w-0.5 bg-[#93D3EC]"></div>

                <div className="space-y-12">
                {tasks.map((step, index) => {
                    // Render video step separately (no stepper)
                    if (step.video) {
                        return (
                            <div
                                key={index}
                                className="flex flex-col items-center justify-center p-6 border border-[#009FDC] rounded-2xl my-12 mx-auto max-w-4xl"
                            >
                                <div className="h-64 flex items-center justify-center mb-4">
                                    <div className="bg-[#009FDC] rounded-full p-4 cursor-pointer hover:bg-blue-600 transition duration-200">
                                        <Play
                                            size={32}
                                            className="text-white"
                                        />
                                    </div>
                                </div>
                                <a
                                    href={step.video}
                                    className="text-[#009FDC] text-sm mt-2 flex items-center hover:underline"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Open in new window
                                </a>
                            </div>
                        );
                    }

                    // Format step content differently for API vs hardcoded data
                    const stepContent = guide ? 
                        (step.details && step.details.map((detail, idx) => (
                            <p key={idx} className="text-lg font-medium mb-2">
                                {detail.content}
                            </p>
                        ))) : 
                        formatContent(step.content);

                    // Render regular steps with stepper
                    return (
                        <div key={index} className="flex">
                            <div className="relative z-10">
                                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#93D3EC] text-lg font-medium">
                                    {step.step_number || step.number}
                                </div>
                            </div>
                            <div className="ml-4 flex-1">
                                <h3 className="text-xl font-bold mb-2 text-gray-800">
                                    {step.title}
                                </h3>
                                <div className="mb-4">
                                    {guide && step.description && (
                                        <p className="text-lg font-medium mb-2">{step.description}</p>
                                    )}
                                    {stepContent}
                                </div>

                                {/* Screenshots Section - Clean UI without debug info */}
                                {guide && step.screenshots && step.screenshots.length > 0 ? (
                                    <div className="p-2">
                                        <div className="grid grid-cols-1 gap-4">
                                            {step.screenshots.map((screenshot, screenshotIdx) => {
                                                const imageUrl = getImageUrl(screenshot);
                                                
                                                return (
                                                    <div key={screenshotIdx} className="border border-[#009FDC] rounded-lg overflow-hidden shadow-md w-full">
                                                        {imageUrl && !imageErrors[screenshot.id] ? (
                                                            <div className="flex justify-center">
                                                                <img
                                                                    src={imageUrl}
                                                                    alt={screenshot.alt_text || `Screenshot ${screenshotIdx + 1}`}
                                                                    className="w-full h-auto max-h-[600px] object-contain"
                                                                    onLoad={() => console.log(`DEBUG: Successfully loaded image: ${imageUrl}`)}
                                                                    onError={(e) => {
                                                                        console.error(`DEBUG: Image load error for: ${imageUrl}`);
                                                                        e.target.onerror = null;
                                                                        e.target.src = "/images/placeholder.png";
                                                                        handleImageError(screenshot.id, imageUrl);
                                                                    }}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="bg-gray-100 flex flex-col items-center justify-center p-4 text-gray-500 h-48 w-full">
                                                                <p className="text-center">Screenshot not available</p>
                                                            </div>
                                                        )}
                                                        {screenshot.caption && (
                                                            <div className="p-2 bg-gray-50 text-center w-full">
                                                                <p className="text-sm text-gray-700 text-center">
                                                                    {screenshot.caption}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : !guide && step.imageUrl ? (
                                    <div className="p-2">
                                        <div className="border border-[#009FDC] rounded-2xl flex items-center justify-center mb-2 shadow-lg w-full">
                                            <img
                                                src="/api/placeholder/600/300"
                                                alt={`Step ${step.number} illustration`}
                                                className="w-full h-auto object-contain rounded-2xl"
                                                onError={(e) => {
                                                    console.warn("Failed to load placeholder image");
                                                    e.target.onerror = null;
                                                    e.target.style.display = 'none';
                                                }}
                                            />
                                        </div>
                                        {step.hyperLink && (
                                            <div className="flex justify-center">
                                                <a
                                                    href={step.hyperLink}
                                                    className="text-[#009FDC] text-2xl font-bold flex items-center hover:underline text-center"
                                                >
                                                    View detailed instructions
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                ) : null}
                                
                                {/* Actions Section */}
                                {guide && step.actions && step.actions.length > 0 && (
                                    <div className="mt-4 flex justify-center">
                                        <div className="flex flex-wrap justify-center">
                                            {step.actions.map((action, actionIdx) => (
                                                <a
                                                    key={actionIdx}
                                                    href={action.url_or_action || "#"}
                                                    className="text-base font-bold m-2 px-6 py-3 border rounded-lg transition-colors text-[#009FDC] border-[#009FDC] hover:bg-[#009FDC] hover:text-white text-center"
                                                >
                                                    {action.label || "Action"}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                </div>
            </div>

            {/* Display a message if there are no steps */}
            {tasks.length === 0 && (
                <div className="flex justify-center items-center h-40 bg-gray-50 rounded-lg border border-gray-200 mt-8">
                    <p className="text-gray-500 text-lg text-center">No steps available for this guide.</p>
                </div>
            )}
            
            {/* Video Section */}
            {guide && guide.video_path && (
                <div className="flex flex-col items-center justify-center p-6 border border-[#009FDC] rounded-2xl my-12 mx-auto max-w-3xl bg-blue-50">
                    <h3 className="text-xl font-bold mb-4 text-center w-full">Video Tutorial</h3>
                    
                    <div className="w-full flex items-center justify-center mb-2">
                        {guide.video_type === 'youtube' ? (
                            <div className="aspect-video w-full">
                                <div className="relative">
                                    <iframe 
                                        width="100%" 
                                        height="100%" 
                                        src={getFormattedVideoUrl(guide.video_path, guide.video_type)}
                                        frameBorder="0" 
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                        allowFullScreen
                                        className="rounded-xl shadow-lg min-h-[315px]"
                                        onLoad={() => console.log("Video iframe loaded successfully")}
                                        onError={(e) => {
                                            console.error("Error loading video iframe:", e);
                                        }}
                                    ></iframe>
                                </div>
                            </div>
                        ) : (
                            <div 
                                onClick={() => {
                                    if (guide.video_path) {
                                        console.log("Opening video in new tab:", guide.video_path);
                                        window.open(guide.video_path, '_blank');
                                    }
                                }}
                                className="bg-[#009FDC] rounded-full p-6 cursor-pointer hover:bg-blue-600 transition duration-200"
                            >
                                <Play size={48} className="text-white" />
                            </div>
                        )}
                    </div>
                    {guide.video_path && (
                        <div className="flex justify-center w-full">
                            <a
                                href={guide.video_path}
                                className="text-[#009FDC] text-sm flex items-center hover:underline mt-1 text-center"
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => console.log("Opening video link:", guide.video_path)}
                            >
                                Open video in new window
                            </a>
                        </div>
                    )}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showConfirmDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                        <h3 className="text-lg font-semibold mb-4">Confirm Deletion</h3>
                        <p className="mb-6">Are you sure you want to delete this user guide? This action cannot be undone.</p>
                        <div className="flex justify-end space-x-3">
                            <button 
                                onClick={() => setShowConfirmDelete(false)}
                                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleDelete}
                                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {guide && (
                <CreateUserGuide 
                    isOpen={isEditModalOpen} 
                    onClose={() => {
                        setIsEditModalOpen(false);
                        fetchGuideData(); // Refresh data after closing
                    }}
                    editMode={true}
                    guideId={guide.id}
                />
            )}
        </div>
    );
}
