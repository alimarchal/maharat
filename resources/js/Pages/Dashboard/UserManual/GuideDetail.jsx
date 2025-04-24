import React, { useState, useEffect } from "react";
import { usePage, Link } from "@inertiajs/react";
import { Play, Edit, Trash, AlertCircle, Construction } from "lucide-react";
import axios from "axios";
import CreateUserGuide from "./CreateUserGuide";

export default function GuideDetail() {
    const { props } = usePage();
    const { auth } = usePage().props;

    // Get ID from props, ensuring we handle numeric IDs properly
    const guideId = props.id || props.section || "create-request";
    const sectionId = props.section;
    const subsectionId = props.subsection;

    const [guide, setGuide] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [card, setCard] = useState(null);
    const [error, setError] = useState(null);
    const [debugInfo, setDebugInfo] = useState(null);
    const [imageErrors, setImageErrors] = useState({});
    const [isUnderConstruction, setIsUnderConstruction] = useState(false);

    useEffect(() => {
        // Only fetch from API if we have a numeric ID
        if (guideId && !isNaN(parseInt(guideId))) {
            fetchGuideData();
        } else {
            // For non-numeric IDs, just set loading to false
            setLoading(false);
            setIsUnderConstruction(true);
        }
    }, [guideId]);

    const fetchGuideData = async () => {
        try {
            setLoading(true);
            const numericId = parseInt(guideId);
            const response = await axios.get(
                `/api/v1/user-manuals/${numericId}?include=card,steps,steps.details,steps.screenshots,steps.actions&_=${Date.now()}`
            );

            if (response.data && response.data.data) {

                setGuide(response.data.data);
                setDebugInfo({
                    id: response.data.data.id,
                    title: response.data.data.title,
                    steps: response.data.data.steps?.length || 0,
                    hasScreenshots:
                        response.data.data.steps?.some(
                            (step) => step.screenshots?.length > 0
                        ) || false,
                    apiUrl: response.config?.url,
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
                setError(
                    "No guide data found for this ID. API returned empty response."
                );
                setIsUnderConstruction(true);

                setDebugInfo({
                    message: "No content available for this ID",
                    id: guideId,
                    apiUrl: response.config?.url,
                });
            }
        } catch (error) {
            console.error("Error fetching guide:", error);
            setError(
                `Failed to load guide data: ${
                    error.response?.data?.message || error.message
                }`
            );
            setIsUnderConstruction(true);
            setDebugInfo({
                error: true,
                message: error.message,
                status: error.response?.status,
                statusText: error.response?.statusText,
                requestUrl: error.config?.url,
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
            window.location.href = "/user-manual";
        } catch (error) {
            console.error("Error deleting guide:", error);
            setError("Failed to delete guide. Please try again.");
        }
    };

    // Function to check if user has permission to edit
    const canEdit = () => {
        if (!auth || !auth.user) return false;

        // Check if user is the creator of the guide
        if (guide && guide.creator && guide.creator.id === auth.user.id) {
            return true;
        }

        // Check if user has admin permissions
        if (
            auth.user.permissions &&
            (auth.user.permissions.includes("manage_configuration") ||
                auth.user.permissions.includes("edit_permission_settings"))
        ) {
            return true;
        }

        return false;
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

    // Extract tasks from API data
    const tasks = guide ? sortedSteps() : [];

    // Improved video URL handling specifically for YouTube shorts
    const getFormattedVideoUrl = (videoPath, videoType) => {
        if (!videoPath) {
            console.warn("Empty video URL received");
            return null;
        }
        let formattedUrl = videoPath;

        if (videoType === "youtube") {
            // Handle different YouTube URL formats
            if (videoPath.includes("embed")) {
                formattedUrl = videoPath;
            } else if (videoPath.includes("shorts/")) {
                // Handle YouTube shorts format
                const videoId = videoPath.split("shorts/")[1]?.split("?")[0];
                formattedUrl = `https://www.youtube.com/embed/${videoId}`;
            } else if (videoPath.includes("v=")) {
                const videoId = videoPath.split("v=")[1]?.split("&")[0];
                formattedUrl = `https://www.youtube.com/embed/${videoId}`;
            } else if (videoPath.includes("youtu.be/")) {
                const videoId = videoPath.split("youtu.be/")[1];
                formattedUrl = `https://www.youtube.com/embed/${videoId}`;
            } else {
                console.warn(`Unrecognized YouTube URL format: ${videoPath}`);
            }
        }

        return formattedUrl;
    };

    // Use the direct URL format that works when clicked
    const getImageUrl = (screenshot) => {
        // Check if screenshot_path exists and use it as primary source
        if (screenshot.screenshot_path) {
            const path = screenshot.screenshot_path;
            // If it's already a full URL, return it
            if (path.startsWith("http")) {
                console.log(`DEBUG: Path is already a full URL: ${path}`);
                return path;
            }

            // Use the direct path format
            const directUrl = `/storage/${path}`;
            return directUrl;
        }

        // Fallback to screenshot_url if screenshot_path doesn't exist
        if (screenshot.screenshot_url) {
            return screenshot.screenshot_url;
        }

        console.warn("DEBUG: No screenshot path or URL found");
        return "/images/placeholder.png";
    };

    // Enhanced screenshot error handling with more debugging
    const handleImageError = (screenshotId, url) => {

        // Track which images have errored
        setImageErrors((prev) => ({
            ...prev,
            [screenshotId]: true,
        }));
    };

    // Add rendering for the under construction page
    const renderUnderConstruction = () => {
        // Get section/subsection name for display
        let pageName = "";
        if (subsectionId) {
            pageName = formatSectionName(subsectionId);
        } else if (sectionId) {
            pageName = formatSectionName(sectionId);
        } else {
            pageName = "This page";
        }

        // Instead of toggling a modal, navigate to User Manual page with a special query param
        const handleCreateGuide = () => {
            window.location.href = `/user-manual?openCreateGuide=true&sectionId=${
                sectionId || ""
            }&subsectionId=${subsectionId || ""}`;
        };

        return (
            <>
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <div className="p-8 max-w-2xl mx-auto my-4">
                        <div className="flex items-center justify-center mb-6">
                            <Construction className="h-16 w-16 text-blue-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">
                            Page Under Construction
                        </h2>
                        <p className="text-gray-600 mb-6">
                            {pageName} is currently under construction. Our team
                            is working on creating comprehensive documentation
                            for this section.
                        </p>
                        <div className="mt-8">
                            <button
                                onClick={handleCreateGuide}
                                className="bg-[#009FDC] hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
                            >
                                Create This Guide
                            </button>
                            <Link
                                href="/user-manual"
                                className="ml-4 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md font-medium transition-colors"
                            >
                                Return to Manual Home
                            </Link>
                        </div>
                    </div>
                </div>
            </>
        );
    };

    const formatSectionName = (id) => {
        return id
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
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
                <div
                    className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 max-w-2xl"
                    role="alert"
                >
                    <div className="flex items-center">
                        <AlertCircle className="mr-2" size={24} />
                        <strong className="font-bold">Error: </strong>
                        <span className="block sm:inline ml-2">{error}</span>
                    </div>
                </div>
                {debugInfo && (
                    <div className="mt-4 bg-gray-100 p-4 rounded max-w-2xl">
                        <h3 className="font-bold mb-2">Debug Information:</h3>
                        <pre className="text-xs overflow-auto">
                            {JSON.stringify(debugInfo, null, 2)}
                        </pre>
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

    // Handle case where no guide is found
    if (!guide) {
        return renderUnderConstruction();
    }

    return (
        <>
            <div className="max-w-full mx-auto py-4">
                {loading ? (
                    <div className="flex justify-center my-12">
                        <div className="w-12 h-12 border-4 border-[#009FDC] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : isUnderConstruction ? (
                    renderUnderConstruction()
                ) : (
                    <div className="w-full">
                        {/* Title Section */}
                        <div className="flex justify-center items-center mb-10">
                            <h1 className="text-3xl font-bold text-gray-800 text-center">
                                {guide.title}
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
                                        onClick={() =>
                                            setShowConfirmDelete(true)
                                        }
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
                                                    Open in New Window
                                                </a>
                                            </div>
                                        );
                                    }

                                    // Updated stepContent to use ul/li structure for better readability
                                    const stepContent =
                                        step.details &&
                                        step.details.length > 0 ? (
                                            <ul className="list-disc list-inside space-y-2 pl-4">
                                                {step.details.map(
                                                    (detail, idx) => (
                                                        <li
                                                            key={idx}
                                                            className="text-lg font-medium"
                                                        >
                                                            {detail.content}
                                                        </li>
                                                    )
                                                )}
                                            </ul>
                                        ) : null;

                                    // Render regular steps with stepper
                                    return (
                                        <div key={index} className="flex">
                                            <div className="relative z-10">
                                                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#93D3EC] text-lg font-medium">
                                                    {step.step_number}
                                                </div>
                                            </div>
                                            <div className="ml-4 flex-1">
                                                <h3 className="text-xl font-bold mb-2 text-gray-800">
                                                    {step.title}
                                                </h3>
                                                <div className="mb-4">
                                                    {step.description && (
                                                        <p className="text-lg font-medium mb-2">
                                                            {step.description}
                                                        </p>
                                                    )}
                                                    {stepContent}
                                                </div>

                                                {/* Screenshots Section */}
                                                {step.screenshots &&
                                                    step.screenshots.length >
                                                        0 && (
                                                        <div className="p-2">
                                                            <div className="grid grid-cols-1 gap-4">
                                                                {step.screenshots.map(
                                                                    (
                                                                        screenshot,
                                                                        screenshotIdx
                                                                    ) => {
                                                                        const imageUrl =
                                                                            getImageUrl(
                                                                                screenshot
                                                                            );

                                                                        return (
                                                                            <div
                                                                                key={
                                                                                    screenshotIdx
                                                                                }
                                                                                className="border border-[#009FDC] rounded-lg overflow-hidden shadow-md w-full"
                                                                            >
                                                                                {imageUrl &&
                                                                                !imageErrors[
                                                                                    screenshot
                                                                                        .id
                                                                                ] ? (
                                                                                    <div className="flex justify-center">
                                                                                        <img
                                                                                            src={
                                                                                                imageUrl
                                                                                            }
                                                                                            alt={
                                                                                                screenshot.alt_text ||
                                                                                                `Screenshot ${
                                                                                                    screenshotIdx +
                                                                                                    1
                                                                                                }`
                                                                                            }
                                                                                            className="p-2 w-full h-auto object-contain"
                                                                                            onError={(
                                                                                                e
                                                                                            ) => {
                                                                                                e.target.onerror =
                                                                                                    null;
                                                                                                e.target.src =
                                                                                                    "/images/placeholder.png";
                                                                                                handleImageError(
                                                                                                    screenshot.id,
                                                                                                    imageUrl
                                                                                                );
                                                                                            }}
                                                                                        />
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="bg-gray-100 flex flex-col items-center justify-center p-4 text-gray-500 h-48 w-full">
                                                                                        <p className="text-center">
                                                                                            Screenshot not available
                                                                                        </p>
                                                                                    </div>
                                                                                )}
                                                                                {screenshot.caption && (
                                                                                    <div className="p-2 bg-gray-50 text-center w-full">
                                                                                        <p className="text-sm text-gray-700 text-center">
                                                                                            {
                                                                                                screenshot.caption
                                                                                            }
                                                                                        </p>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    }
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                {/* Actions Section */}
                                                {step.actions &&
                                                    step.actions.length > 0 && (
                                                        <div className="mt-4 flex justify-center">
                                                            <div className="flex flex-wrap justify-center">
                                                                {step.actions.map(
                                                                    (
                                                                        action,
                                                                        actionIdx
                                                                    ) => (
                                                                        <a
                                                                            key={
                                                                                actionIdx
                                                                            }
                                                                            href={
                                                                                action.url_or_action ||
                                                                                "#"
                                                                            }
                                                                            className="text-base font-bold m-2 px-6 py-3 border rounded-lg transition-colors text-[#009FDC] border-[#009FDC] hover:bg-[#009FDC] hover:text-white text-center"
                                                                        >
                                                                            {action.label ||
                                                                                "Action"}
                                                                        </a>
                                                                    )
                                                                )}
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
                                <p className="text-gray-500 text-lg text-center">
                                    No steps available for this guide.
                                </p>
                            </div>
                        )}

                        {/* Video Section */}
                        {guide.video_path && (
                            <div className="flex flex-col items-center justify-center p-6 border border-[#009FDC] rounded-2xl my-12 mx-auto max-w-3xl bg-blue-50">
                                <h3 className="text-xl font-bold mb-4 text-center w-full">
                                    Video Tutorial
                                </h3>

                                <div className="w-full flex items-center justify-center mb-2">
                                    {guide.video_type === "youtube" ? (
                                        <div className="aspect-video w-full">
                                            <div className="relative">
                                                <iframe
                                                    width="100%"
                                                    height="100%"
                                                    src={getFormattedVideoUrl(
                                                        guide.video_path,
                                                        guide.video_type
                                                    )}
                                                    frameBorder="0"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    allowFullScreen
                                                    className="rounded-xl shadow-lg min-h-[315px]"
                                                ></iframe>
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            onClick={() => {
                                                if (guide.video_path) {
                                                    window.open(
                                                        guide.video_path,
                                                        "_blank"
                                                    );
                                                }
                                            }}
                                            className="bg-[#009FDC] rounded-full p-6 cursor-pointer hover:bg-blue-600 transition duration-200"
                                        >
                                            <Play
                                                size={48}
                                                className="text-white"
                                            />
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
                                        >
                                            Open Video in New Window
                                        </a>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {showConfirmDelete && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                            <h3 className="text-lg font-semibold mb-4">
                                Confirm Deletion
                            </h3>
                            <p className="mb-6">
                                Are you sure you want to delete this user guide?
                                This action cannot be undone.
                            </p>
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
            </div>

            {/* CreateUserGuide modal */}
            <CreateUserGuide
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);

                    // Refresh or reload
                    if (!isNaN(parseInt(guideId))) {
                        console.log("Refreshing guide data for ID:", guideId);
                        fetchGuideData();
                    } else {
                        window.location.reload();
                    }
                }}
                editMode={guide && guide.id ? true : false}
                guideId={guide && guide.id ? guide.id : null}
                sectionId={sectionId}
                subsectionId={subsectionId}
            />
        </>
    );
}
