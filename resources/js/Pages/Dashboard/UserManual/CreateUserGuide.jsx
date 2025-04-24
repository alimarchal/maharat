import React, { useState, useEffect } from "react";
import { useForm } from "@inertiajs/react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faPlus, faTrash, faImage } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-hot-toast";

// Step component for adding multiple steps
const Step = ({ step, index, updateStep, removeStep, addDetail, updateDetail, removeDetail, addScreenshot, updateScreenshot, removeScreenshot, addAction, updateAction, removeAction }) => {
    return (
        <div className="bg-white p-4 rounded-lg shadow-md mb-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Step {index + 1}</h3>
                <button
                    type="button"
                    onClick={() => removeStep(index)}
                    className="text-red-500 hover:text-red-700"
                >
                    <FontAwesomeIcon icon={faTrash} />
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4 mb-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Title</label>
                    <input
                        type="text"
                        value={step.title || ""}
                        onChange={(e) => updateStep(index, { 
                            ...step, 
                            title: e.target.value,
                            // Set default values for hidden fields
                            action_type: step.action_type || "click",
                            description: step.description || `Step ${index + 1} details`
                        })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        placeholder="Step Title"
                    />
                </div>
            </div>

            {/* Step Details */}
            <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                    <h4 className="text-md font-medium">Step Details</h4>
                    <button
                        type="button"
                        onClick={() => addDetail(index)}
                        className="text-[#009FDC] hover:text-blue-700 text-sm"
                    >
                        <FontAwesomeIcon icon={faPlus} className="mr-1" /> Add Detail
                    </button>
                </div>
                {step.details && step.details.map((detail, detailIndex) => (
                    <div key={detailIndex} className="flex mb-2">
                        <input
                            type="text"
                            value={detail.content || ""}
                            onChange={(e) => updateDetail(index, detailIndex, { ...detail, content: e.target.value })}
                            className="flex-grow border border-gray-300 rounded-md shadow-sm p-2 mr-2"
                            placeholder="Detail Content"
                        />
                        <button
                            type="button"
                            onClick={() => removeDetail(index, detailIndex)}
                            className="text-red-500 hover:text-red-700"
                        >
                            <FontAwesomeIcon icon={faTrash} />
                        </button>
                    </div>
                ))}
            </div>

            {/* Step Screenshots */}
            <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                    <h4 className="text-md font-medium">Screenshots</h4>
                    <button
                        type="button"
                        onClick={() => addScreenshot(index)}
                        className="text-[#009FDC] hover:text-blue-700 text-sm"
                    >
                        <FontAwesomeIcon icon={faPlus} className="mr-1" /> Add Screenshot
                    </button>
                </div>
                {step.screenshots && step.screenshots.map((screenshot, screenshotIndex) => (
                    <div key={screenshotIndex} className="grid grid-cols-1 gap-2 mb-2 p-2 border border-gray-200 rounded">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Screenshot</label>
                            {screenshot.screenshot_url && (
                                <div className="mb-2 border rounded p-2 bg-gray-50">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm text-gray-700 flex items-center">
                                            <FontAwesomeIcon icon={faImage} className="text-[#009FDC] mr-2" />
                                            {screenshot.file_name || "Screenshot"}
                                        </span>
                                    </div>
                                    <div className="relative overflow-hidden" style={{ maxHeight: '150px' }}>
                                        <img 
                                            src={screenshot.screenshot_url} 
                                            alt={screenshot.alt_text || "Preview"} 
                                            className="w-full h-auto object-contain border rounded"
                                            onError={(e) => {
                                                console.error("Failed to load image preview");
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'block';
                                            }}
                                        />
                                        <div className="hidden p-2 text-xs text-center text-gray-500">
                                            Image preview not available
                                        </div>
                                    </div>
                                </div>
                            )}
                            <input
                                type="file"
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    const fileName = file ? file.name : "";
                                    updateScreenshot(index, screenshotIndex, { 
                                        ...screenshot, 
                                        file: file,
                                        file_name: fileName,
                                        // Set default alt text based on file name
                                        alt_text: fileName.split('.')[0] || `Step ${index + 1} Screenshot ${screenshotIndex + 1}`
                                    });
                                }}
                                className="mt-1 block w-full text-sm file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0 file:text-sm file:font-semibold
                                file:bg-[#009FDC] file:text-white hover:file:bg-[#007BB5]"
                            />
                        </div>
                        <div>
                            <input
                                type="text"
                                value={screenshot.caption || ""}
                                onChange={(e) => updateScreenshot(index, screenshotIndex, { ...screenshot, caption: e.target.value })}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                placeholder="Caption"
                            />
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={() => removeScreenshot(index, screenshotIndex)}
                                className="text-red-500 hover:text-red-700"
                            >
                                <FontAwesomeIcon icon={faTrash} /> Remove
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Action (limited to one per step) */}
            <div>
                <div className="flex justify-between items-center mb-2">
                    <h4 className="text-md font-medium">Action Button</h4>
                    {(!step.actions || step.actions.length === 0) && (
                        <button
                            type="button"
                            onClick={() => addAction(index)}
                            className="text-[#009FDC] hover:text-blue-700 text-sm"
                        >
                            <FontAwesomeIcon icon={faPlus} className="mr-1" /> Add Action
                        </button>
                    )}
                </div>
                {step.actions && step.actions.map((action, actionIndex) => (
                    <div key={actionIndex} className="grid grid-cols-1 gap-2 mb-2 p-2 border border-gray-200 rounded">
                        <div>
                            <label className="block text-sm text-gray-700">Label</label>
                            <input
                                type="text"
                                value={action.label || ""}
                                onChange={(e) => updateAction(index, actionIndex, { 
                                    ...action, 
                                    label: e.target.value,
                                    // Set default values for hidden fields
                                    action_type: "click",
                                    style: "primary"
                                })}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                placeholder="Action Label"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-700">URL or Action</label>
                            <input
                                type="text"
                                value={action.url_or_action || ""}
                                onChange={(e) => updateAction(index, actionIndex, { ...action, url_or_action: e.target.value })}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                placeholder="e.g., https://example.com or #login"
                            />
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={() => removeAction(index, actionIndex)}
                                className="text-red-500 hover:text-red-700"
                            >
                                <FontAwesomeIcon icon={faTrash} /> Remove
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default function CreateUserGuide({ isOpen, onClose, sectionId, subsectionId, editMode = false, guideId = null }) {
    // For debugging
    useEffect(() => {
        console.log("CreateUserGuide - isOpen prop:", isOpen);
        console.log("CreateUserGuide - sectionId:", sectionId);
        console.log("CreateUserGuide - subsectionId:", subsectionId);
    }, [isOpen, sectionId, subsectionId]);
    
    const [steps, setSteps] = useState([
        {
            step_number: 1,
            title: "",
            description: "",
            action_type: "",
            order: 1,
            is_active: true,
            details: [],
            screenshots: [],
            actions: []
        }
    ]);
    
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingGuide, setIsLoadingGuide] = useState(false);
    const [showVideoField, setShowVideoField] = useState(false);
    const [errors, setErrors] = useState({});
    const [cards, setCards] = useState([]);
    const [parentCards, setParentCards] = useState([]);
    const [childCards, setChildCards] = useState([]);
    const [selectedParentCard, setSelectedParentCard] = useState("");
    const [isLoadingCards, setIsLoadingCards] = useState(false);
    
    const { data, setData, post, processing } = useForm({
        title: "",
        slug: "",
        video_path: "",
        video_type: "",
        is_active: true,
        card_id: "",
        card_name: "",
        parent_card_id: ""
    });

    // Load guide data if in edit mode
    useEffect(() => {
        if (editMode && guideId && isOpen) {
            fetchGuideData();
        }
    }, [editMode, guideId, isOpen]);

    // Load available cards when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchCards();
        }
    }, [isOpen]);

    // When parent card changes, update available child cards
    useEffect(() => {
        if (data.parent_card_id) {
            const selectedId = parseInt(data.parent_card_id);
            const childrenOfSelected = childCards.filter(card => 
                card.parent_id === selectedId
            );
            
            // If no children available, use the parent card ID
            if (childrenOfSelected.length === 0) {
                setData("card_id", data.parent_card_id);
            } else if (editMode && data.card_id) {
                // If in edit mode and card_id exists, check if it's valid within the new parent context
                const isValidChildCard = childrenOfSelected.some(card => card.id.toString() === data.card_id.toString());
                if (!isValidChildCard) {
                    // If not valid, reset to empty to force selection from new children
                    setData("card_id", "");
                }
            } else {
                // Reset selected card when parent changes
                setData("card_id", "");
            }
        }
    }, [data.parent_card_id]);

    // Add a useEffect to properly handle card relationships in edit mode
    useEffect(() => {
        // Only run this effect in edit mode when we have card data loaded and cards available
        if (editMode && cards.length > 0 && data.card_id) {
            console.log("Edit mode card setup - card_id:", data.card_id);
            
            const currentCardId = parseInt(data.card_id);
            // Find selected card in our cards list
            const selectedCard = cards.find(c => parseInt(c.id) === currentCardId);
            
            console.log("Edit mode - found card:", selectedCard);
            
            if (selectedCard) {
                if (selectedCard.parent_id) {
                    // It's a child card, set parent_card_id
                    const parentId = selectedCard.parent_id.toString();
                    console.log(`Edit mode - setting parent card to: ${parentId} for child card: ${currentCardId}`);
                    setData(prevData => ({
                        ...prevData,
                        parent_card_id: parentId
                    }));
                    setSelectedParentCard(parentId);
                } else {
                    // It's a parent card, set parent_card_id to same as card_id
                    console.log(`Edit mode - card ${currentCardId} is a parent card`);
                    setData(prevData => ({
                        ...prevData,
                        parent_card_id: currentCardId.toString()
                    }));
                    setSelectedParentCard(currentCardId.toString());
                }
            }
        }
    }, [editMode, cards, data.card_id]);

    const fetchCards = async () => {
        try {
            setIsLoadingCards(true);
            const response = await axios.get('/api/v1/cards');
            if (response.data && response.data.data) {
                let availableCards = response.data.data;
                
                // Filter cards based on section and subsection if provided
                if (sectionId && subsectionId) {
                    // If we have both section and subsection, filter for the specific subsection card
                    availableCards = availableCards.filter(card => 
                        card.section_id === sectionId && card.subsection_id === subsectionId
                    );
                } else if (sectionId) {
                    // If we only have sectionId, filter for cards in that section
                    availableCards = availableCards.filter(card => 
                        card.section_id === sectionId
                    );
                }
                
                // Store all cards
                setCards(availableCards);
                
                // Separate parent and child cards
                const parents = availableCards.filter(card => 
                    !card.parent_id || card.parent_id === 0 || card.parent_id === null
                );
                const children = availableCards.filter(card => 
                    card.parent_id && card.parent_id !== 0 && card.parent_id !== null
                );
                
                setParentCards(parents);
                setChildCards(children);
                
                console.log("Parent cards:", parents);
                console.log("Child cards:", children);
            }
        } catch (error) {
            console.error("Error loading cards:", error);
            // Provide a fallback with basic cards if the API fails
            const fallbackCards = [
                { id: 0, name: "General Guide (No Specific Card)" },
                { id: 1, name: "Login Details Card" },
                { id: 2, name: "Notification Settings Card" },
                { id: 9, name: "Warehouse Card" },
                { id: 11, name: "Reports & Statues Card" }
            ];
            
            setCards(fallbackCards);
            setParentCards(fallbackCards);
            setChildCards([]);
        } finally {
            setIsLoadingCards(false);
        }
    };

    const fetchGuideData = async () => {
        try {
            setIsLoadingGuide(true);
            const response = await axios.get(`/api/v1/user-manuals/${guideId}`);
            if (response.data && response.data.data) {
                const guide = response.data.data;
                
                // Set form data
                setData({
                    title: guide.title,
                    slug: guide.slug,
                    video_path: guide.video_path || "",
                    video_type: guide.video_type || "",
                    is_active: guide.is_active,
                    card_id: guide.card_id || "",
                    card_name: guide.card_name || ""
                });

                if (guide.video_path) {
                    setShowVideoField(true);
                }
                
                // Set steps data
                if (guide.steps && guide.steps.length > 0) {
                    setSteps(guide.steps.map(step => ({
                        id: step.id,
                        step_number: step.step_number,
                        title: step.title,
                        description: step.description || "",
                        action_type: step.action_type,
                        order: step.order,
                        is_active: step.is_active,
                        details: step.details || [],
                        screenshots: (step.screenshots || []).map(screenshot => {
                            // Extract filename from path if available
                            let fileName = "Existing image";
                            if (screenshot.screenshot_path) {
                                // Get the file name from the path
                                const pathParts = screenshot.screenshot_path.split('/');
                                fileName = pathParts[pathParts.length - 1];
                            }
                            
                            return {
                                ...screenshot,
                                file_name: fileName
                            };
                        }),
                        actions: step.actions || []
                    })));
                }
            }
        } catch (error) {
            console.error("Error fetching guide:", error);
            setErrors({ general: "Failed to load guide data" });
        } finally {
            setIsLoadingGuide(false);
        }
    };

    // Helper to generate slug from title
    useEffect(() => {
        if (data.title) {
            // Generate a slug without timestamp
            const slug = data.title
                .toLowerCase()
                .replace(/[^\w\s-]/g, '')
                .replace(/[\s_-]+/g, '-')
                .replace(/^-+|-+$/g, '');
            setData("slug", slug);
        }
    }, [data.title]);

    const addStep = () => {
        setSteps([
            ...steps,
            {
                step_number: steps.length + 1,
                title: "",
                description: "",
                action_type: "",
                order: steps.length + 1,
                is_active: true,
                details: [],
                screenshots: [],
                actions: []
            }
        ]);
    };

    const updateStep = (index, updatedStep) => {
        const newSteps = [...steps];
        newSteps[index] = updatedStep;
        setSteps(newSteps);
    };

    const removeStep = (index) => {
        if (steps.length > 1) {
            const newSteps = steps.filter((_, i) => i !== index);
            // Update step numbers and order
            const reorderedSteps = newSteps.map((step, i) => ({
                ...step,
                step_number: i + 1,
                order: i + 1
            }));
            setSteps(reorderedSteps);
        }
    };

    // Detail methods
    const addDetail = (stepIndex) => {
        const newSteps = [...steps];
        if (!newSteps[stepIndex].details) {
            newSteps[stepIndex].details = [];
        }
        
        newSteps[stepIndex].details.push({
            content: "",
            order: newSteps[stepIndex].details.length + 1
        });
        setSteps(newSteps);
    };

    const updateDetail = (stepIndex, detailIndex, updatedDetail) => {
        const newSteps = [...steps];
        newSteps[stepIndex].details[detailIndex] = updatedDetail;
        setSteps(newSteps);
    };

    const removeDetail = (stepIndex, detailIndex) => {
        const newSteps = [...steps];
        newSteps[stepIndex].details = newSteps[stepIndex].details.filter(
            (_, i) => i !== detailIndex
        );
        // Update order
        newSteps[stepIndex].details = newSteps[stepIndex].details.map((detail, i) => ({
            ...detail,
            order: i + 1
        }));
        setSteps(newSteps);
    };

    // Screenshot methods
    const addScreenshot = (stepIndex) => {
        const newSteps = [...steps];
        if (!newSteps[stepIndex].screenshots) {
            newSteps[stepIndex].screenshots = [];
        }
        
        newSteps[stepIndex].screenshots.push({
            file: null,
            file_name: "",
            alt_text: "",
            caption: "",
            type: "image",
            order: newSteps[stepIndex].screenshots.length + 1
        });
        setSteps(newSteps);
    };

    const updateScreenshot = (stepIndex, screenshotIndex, updatedScreenshot) => {
        const newSteps = [...steps];
        newSteps[stepIndex].screenshots[screenshotIndex] = updatedScreenshot;
        setSteps(newSteps);
    };

    const removeScreenshot = (stepIndex, screenshotIndex) => {
        const newSteps = [...steps];
        newSteps[stepIndex].screenshots = newSteps[stepIndex].screenshots.filter(
            (_, i) => i !== screenshotIndex
        );
        // Update order
        newSteps[stepIndex].screenshots = newSteps[stepIndex].screenshots.map((screenshot, i) => ({
            ...screenshot,
            order: i + 1
        }));
        setSteps(newSteps);
    };

    // Action methods
    const addAction = (stepIndex) => {
        const newSteps = [...steps];
        if (!newSteps[stepIndex].actions) {
            newSteps[stepIndex].actions = [];
        }
        
        newSteps[stepIndex].actions.push({
            action_type: "",
            label: "",
            url_or_action: "",
            style: null,
            order: newSteps[stepIndex].actions.length + 1
        });
        setSteps(newSteps);
    };

    const updateAction = (stepIndex, actionIndex, updatedAction) => {
        const newSteps = [...steps];
        newSteps[stepIndex].actions[actionIndex] = updatedAction;
        setSteps(newSteps);
    };

    const removeAction = (stepIndex, actionIndex) => {
        const newSteps = [...steps];
        newSteps[stepIndex].actions = newSteps[stepIndex].actions.filter(
            (_, i) => i !== actionIndex
        );
        // Update order
        newSteps[stepIndex].actions = newSteps[stepIndex].actions.map((action, i) => ({
            ...action,
            order: i + 1
        }));
        setSteps(newSteps);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrors({});

        try {
            let userManualId;

            // Transform steps data for API
            const formattedSteps = steps.map(step => ({
                step_number: step.step_number,
                title: step.title,
                description: step.description || `Step ${step.step_number} - ${step.title || 'Details'}`,
                action_type: step.action_type,
                order: step.order,
                is_active: step.is_active,
                // Convert details objects to strings if they exist
                details: (step.details || []).map(detail => typeof detail === 'object' ? detail.content || "" : detail),
                // Add type field to actions
                actions: (step.actions || []).map(action => ({
                    action_type: action.action_type,
                    type: action.action_type || "click", // Default to "click" if not set
                    label: action.label,
                    url_or_action: action.url_or_action || "",
                    style: action.style || "default", // Provide a default style if not set
                    order: action.order
                }))
            }));

            // Include steps data in the main payload
            const fullPayload = {
                ...data,
                steps: formattedSteps
            };

            // Remove card_name if it exists, as it's not needed anymore
            if (fullPayload.card_name !== undefined) {
                delete fullPayload.card_name;
            }
            
            // Handle parent/child card relationship
            if (!fullPayload.card_id && fullPayload.parent_card_id) {
                // If no child card is selected but parent is, use parent as card_id
                fullPayload.card_id = fullPayload.parent_card_id;
            }
            
            // Remove parent_card_id from payload as backend doesn't need it
            if (fullPayload.parent_card_id !== undefined) {
                delete fullPayload.parent_card_id;
            }

            // Ensure required fields are properly formatted
            // Convert card_id to number if it's a string
            if (fullPayload.card_id && typeof fullPayload.card_id === 'string') {
                fullPayload.card_id = parseInt(fullPayload.card_id, 10);
            }

            // Ensure video_path is properly formatted if it's a URL
            if (fullPayload.video_path && !fullPayload.video_path.startsWith('storage/')) {
                // If it's an external URL (contains http or https), leave it as is
                if (!fullPayload.video_path.includes('http://') && !fullPayload.video_path.includes('https://')) {
                    // Otherwise, ensure it has the correct format for storage
                    fullPayload.video_path = fullPayload.video_path.trim();
                }
            }

            console.log("Submitting payload:", JSON.stringify(fullPayload, null, 2));

            if (editMode && guideId) {
                try {
                    // Update the user manual
                    console.log(`Updating user manual with ID ${guideId}:`, fullPayload);
                    const manualResponse = await axios.put(`/api/v1/user-manuals/${guideId}`, fullPayload);
                    console.log("Manual update response:", manualResponse);
                    userManualId = guideId;
                } catch (error) {
                    console.error("Error updating user manual:", error.response?.data || error);
                    setErrors({ general: error.response?.data?.message || "Failed to update the user guide. Please try again." });
                    throw error;
                }
                
                // Check for screenshot uploads
                const hasScreenshots = steps.some(step => 
                    step.screenshots && step.screenshots.some(screenshot => screenshot.file)
                );
                
                if (hasScreenshots) {
                    // Handle file uploads for each step
                    try {
                        await handleStepFileUploads(steps, userManualId);
                    } catch (error) {
                        console.error("Error uploading screenshots:", error);
                        setErrors({ general: "Guide was updated but failed to upload screenshots. Please try again." });
                        throw error;
                    }
                }
            } else {
                try {
                    // Create a new user manual with steps included in the payload
                    console.log("Creating new user manual:", fullPayload);
                    const manualResponse = await axios.post("/api/v1/user-manuals", fullPayload);
                    console.log("Manual creation response:", manualResponse);
                    
                    // Safely extract the ID from the response, checking various possible structures
                    if (manualResponse.data && manualResponse.data.data && manualResponse.data.data.id) {
                        userManualId = manualResponse.data.data.id;
                    } else if (manualResponse.data && manualResponse.data.id) {
                        userManualId = manualResponse.data.id;
                    } else {
                        throw new Error("Could not get user manual ID from response");
                    }
                } catch (error) {
                    console.error("Error creating user manual:", error.response?.data || error);
                    setErrors({ general: error.response?.data?.message || "Failed to create the user guide. Please try again." });
                    throw error;
                }
                
                console.log("Created user manual with ID:", userManualId);
                
                // Check for screenshot uploads
                const hasScreenshots = steps.some(step => 
                    step.screenshots && step.screenshots.some(screenshot => screenshot.file)
                );
                
                if (hasScreenshots) {
                    try {
                        // Handle file uploads for each step
                        await handleStepFileUploads(steps, userManualId);
                    } catch (error) {
                        console.error("Error uploading screenshots:", error);
                        setErrors({ general: "Guide was created but failed to upload screenshots. Please try again." });
                        throw error;
                    }
                }
            }

            // Reset form and close modal
            setData({
                title: "",
                slug: "",
                video_path: "",
                video_type: "",
                is_active: true,
                card_id: "",
                parent_card_id: ""
            });
            setSelectedParentCard("");
            setSteps([
                {
                    step_number: 1,
                    title: "",
                    description: "",
                    action_type: "",
                    order: 1,
                    is_active: true,
                    details: [],
                    screenshots: [],
                    actions: []
                }
            ]);
            setShowVideoField(false);
            onClose();
            
        } catch (error) {
            console.error("Error in form submission:", error);
            // Only set general error if not already set by specific error handlers
            if (!errors.general) {
                setErrors({ general: "An unexpected error occurred. Please try again." });
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Helper function to handle file uploads for steps
    const handleStepFileUploads = async (steps, userManualId) => {
        try {
            console.log("Starting screenshot uploads for user manual ID:", userManualId);
            
            // Get the steps from the backend to have their correct IDs
            const stepsResponse = await axios.get(`/api/v1/user-manuals/${userManualId}/steps`);
            const stepData = stepsResponse.data.data || [];
            
            console.log("Steps from API:", stepData);
            
            // Match steps by step_number to find corresponding IDs
            for (let i = 0; i < steps.length; i++) {
                const step = steps[i];
                const stepNumber = parseInt(step.step_number);
                
                // Find matching step in API response
                const matchingStep = stepData.find(s => parseInt(s.step_number) === stepNumber);
                
                console.log(`Looking for step ${stepNumber}, found:`, matchingStep);
                
                if (matchingStep && step.screenshots && step.screenshots.length > 0) {
                    const stepId = matchingStep.id;
                    
                    for (const screenshot of step.screenshots) {
                        if (screenshot.file) {
                            try {
                                const formData = new FormData();
                                formData.append('screenshot', screenshot.file);
                                formData.append('alt_text', screenshot.alt_text || '');
                                formData.append('caption', screenshot.caption || '');
                                formData.append('type', screenshot.type || 'image');
                                formData.append('order', screenshot.order || 1);

                                // Use the correct API endpoint
                                const uploadUrl = `/api/v1/steps/${stepId}/screenshots`;
                                console.log(`Uploading screenshot to step ${stepId} using URL: ${uploadUrl}`);
                                
                                const response = await axios.post(
                                    uploadUrl,
                                    formData, 
                                    {
                                        headers: {
                                            'Content-Type': 'multipart/form-data'
                                        }
                                    }
                                );
                                console.log("Screenshot upload successful:", response.data);
                            } catch (uploadError) {
                                console.error("Error uploading screenshot:", uploadError.response?.data || uploadError.message);
                                // Add more detailed error logging
                                if (uploadError.response) {
                                    console.error("Server response:", uploadError.response.status, uploadError.response.data);
                                }
                                throw uploadError; // Re-throw to handle in the main function
                            }
                        }
                    }
                } else {
                    console.warn(`Could not find matching step for step_number ${stepNumber} or no screenshots to upload`);
                }
            }
        } catch (error) {
            console.error("Error handling file uploads:", error.response?.data || error.message);
            throw error; // Re-throw to be caught by the parent function
        }
    };

    const retrySubmit = async () => {
        setErrors({});
        setIsSubmitting(true);
        
        try {
            await handleSubmit(new Event('submit'));
            // If we reach here, the submission was successful
            toast.success("Submission successful after retry!");
        } catch (error) {
            console.error("Retry submission failed:", error);
            setErrors(prevErrors => ({
                ...prevErrors,
                general: "Retry failed. Please check your form data and try again."
            }));
        } finally {
            setIsSubmitting(false);
        }
    };

    // If modal is not open, don't render anything
    if (!isOpen) {
        console.log("CreateUserGuide not rendering - isOpen is false");
        return null;
    } else {
        console.log("CreateUserGuide rendering - isOpen is true");
    }

    // Show loading while fetching guide data in edit mode
    if (editMode && isLoadingGuide) {
        return (
            <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="bg-white p-6 rounded-lg shadow-lg flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-[#009FDC] border-t-transparent rounded-full animate-spin"></div>
                    <span className="ml-3 text-lg">Loading guide data...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-8 rounded-2xl w-[90%] max-w-3xl max-h-[90vh] overflow-auto">
                <div className="flex justify-between border-b pb-2 mb-4">
                    <h2 className="text-3xl font-bold text-[#2C323C]">
                        {editMode ? "Edit User Guide" : "Create User Guide"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-red-500 hover:text-red-800"
                    >
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                {errors.general && (
                    <div
                        className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
                        role="alert"
                    >
                        <span className="block sm:inline">{errors.general}</span>
                        <button 
                            onClick={retrySubmit}
                            className="ml-4 bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-sm"
                        >
                            Retry Submission
                        </button>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 gap-4">
                        <div className="relative w-full">
                            <input
                                type="text"
                                value={data.title}
                                onChange={(e) => {
                                    const title = e.target.value;
                                    // Generate slug in the background but don't show it
                                    const slug = title
                                        .toLowerCase()
                                        .replace(/[^\w\s-]/g, '')
                                        .replace(/[\s_-]+/g, '-')
                                        .replace(/^-+|-+$/g, '');
                                    
                                    setData({
                                        ...data,
                                        title: title,
                                        slug: slug
                                    });
                                }}
                                className="peer border border-gray-300 p-5 rounded-2xl w-full bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#009FDC] focus:border-[#009FDC]"
                                placeholder=" "
                                required
                            />
                            <label
                                className="absolute left-3 px-1 bg-white text-gray-500 text-base transition-all
                                    peer-placeholder-shown:top-5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500
                                    peer-focus:-top-2 peer-focus:left-2 peer-focus:text-base peer-focus:text-[#009FDC] peer-focus:px-1
                                    -top-2 left-2 text-base text-[#009FDC] px-1"
                            >
                                Guide Title
                            </label>
                            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                        </div>

                        {/* Card Selection */}
                        <div className="relative w-full">
                            <select
                                value={data.parent_card_id}
                                onChange={(e) => {
                                    const parentId = e.target.value;
                                    setData({
                                        ...data, 
                                        parent_card_id: parentId
                                    });
                                    setSelectedParentCard(parentId);
                                }}
                                className="peer border border-gray-300 p-5 rounded-2xl w-full bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#009FDC] focus:border-[#009FDC]"
                                placeholder=" "
                                required
                            >
                                <option value="">Select a Parent Card (Required)</option>
                                {parentCards.map(card => (
                                    <option key={card.id} value={card.id}>
                                        {card.name}
                                    </option>
                                ))}
                            </select>
                            <label
                                className="absolute left-3 px-1 bg-white text-gray-500 text-base transition-all
                                    -top-2 left-2 text-base text-[#009FDC] px-1"
                            >
                                Main Card
                            </label>
                            {errors.parent_card_id && <p className="text-red-500 text-sm mt-1">{errors.parent_card_id}</p>}
                        </div>

                        {/* Child Card Selection - Only show if parent card is selected and children exist */}
                        {data.parent_card_id && childCards.filter(card => card.parent_id === parseInt(data.parent_card_id)).length > 0 && (
                            <div className="relative w-full mt-2">
                                <select
                                    value={data.card_id}
                                    onChange={(e) => {
                                        setData({
                                            ...data, 
                                            card_id: e.target.value
                                        });
                                    }}
                                    className="peer border border-gray-300 p-5 rounded-2xl w-full bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#009FDC] focus:border-[#009FDC]"
                                    placeholder=" "
                                    required
                                >
                                    <option value="">Select a Specific Card</option>
                                    {childCards
                                        .filter(card => card.parent_id === parseInt(data.parent_card_id))
                                        .map(card => (
                                            <option key={card.id} value={card.id}>
                                                {card.name}
                                            </option>
                                        ))
                                    }
                                </select>
                                <label
                                    className="absolute left-3 px-1 bg-white text-gray-500 text-base transition-all
                                        -top-2 left-2 text-base text-[#009FDC] px-1"
                                >
                                    Sub Card
                                </label>
                                {errors.card_id && <p className="text-red-500 text-sm mt-1">{errors.card_id}</p>}
                            </div>
                        )}

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="hasVideo"
                                checked={showVideoField}
                                onChange={() => setShowVideoField(!showVideoField)}
                                className="mr-2 h-4 w-4 text-[#009FDC] border-gray-300 rounded"
                            />
                            <label htmlFor="hasVideo" className="text-sm font-medium text-gray-700">
                                Add Video Tutorial
                            </label>
                        </div>

                        {showVideoField && (
                            <div className="relative w-full">
                                <input
                                    type="text"
                                    value={data.video_path}
                                    onChange={(e) => {
                                        setData({
                                            ...data, 
                                            video_path: e.target.value,
                                            // Always set YouTube as default type
                                            video_type: "youtube"
                                        });
                                    }}
                                    className="peer border border-gray-300 p-5 rounded-2xl w-full bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#009FDC] focus:border-[#009FDC]"
                                    placeholder=" "
                                />
                                <label
                                    className="absolute left-3 px-1 bg-white text-gray-500 text-base transition-all
                                        peer-placeholder-shown:top-5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500
                                        peer-focus:-top-2 peer-focus:left-2 peer-focus:text-base peer-focus:text-[#009FDC] peer-focus:px-1
                                        -top-2 left-2 text-base text-[#009FDC] px-1"
                                >
                                    YouTube Video URL
                                </label>
                                {errors.video_path && <p className="text-red-500 text-sm mt-1">{errors.video_path}</p>}
                            </div>
                        )}
                    </div>

                    {/* Steps Section */}
                    <div className="mt-8">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h3 className="text-xl font-semibold text-[#2C323C]">Guide Steps</h3>
                            <button
                                type="button"
                                onClick={addStep}
                                className="bg-[#009FDC] text-white px-3 py-1 rounded-full text-sm"
                            >
                                <FontAwesomeIcon icon={faPlus} className="mr-1" /> Add Step
                            </button>
                        </div>

                        {steps.map((step, index) => (
                            <Step
                                key={index}
                                step={step}
                                index={index}
                                updateStep={updateStep}
                                removeStep={removeStep}
                                addDetail={addDetail}
                                updateDetail={updateDetail}
                                removeDetail={removeDetail}
                                addScreenshot={addScreenshot}
                                updateScreenshot={updateScreenshot}
                                removeScreenshot={removeScreenshot}
                                addAction={addAction}
                                updateAction={updateAction}
                                removeAction={removeAction}
                            />
                        ))}
                    </div>

                    {/* Submit Button */}
                    <div className="my-4 flex justify-center w-full">
                        <button
                            type="submit"
                            className="px-6 py-3 text-xl font-medium bg-[#009FDC] text-white rounded-full transition duration-300 hover:bg-[#007BB5] w-full"
                            disabled={isLoading}
                        >
                            {isLoading
                                ? (editMode ? "Updating..." : "Creating...")
                                : (editMode ? "Update Guide" : "Submit")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
} 