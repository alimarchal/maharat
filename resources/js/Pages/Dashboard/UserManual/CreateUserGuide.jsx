import React, { useState, useEffect } from "react";
import { useForm } from "@inertiajs/react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faTimes,
    faPlus,
    faTrash,
    faImage,
    faArrowsAlt,
    faGripVertical,
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-hot-toast";
import InputFloating from "@/Components/InputFloating";
import SelectFloating from "@/Components/SelectFloating";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

// Step component for adding multiple steps
const Step = ({
    step,
    index,
    updateStep,
    removeStep,
    addDetail,
    updateDetail,
    removeDetail,
    addScreenshot,
    updateScreenshot,
    removeScreenshot,
    addAction,
    updateAction,
    removeAction,
    errors,
    editMode,
    reorderScreenshots,
}) => {
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
                    <label className="block text-sm font-medium text-gray-700">
                        Title
                    </label>
                    <input
                        type="text"
                        value={step.title || ""}
                        onChange={(e) =>
                            updateStep(index, {
                                ...step,
                                title: e.target.value,
                                action_type: step.action_type || "click",
                                description:
                                    step.description ||
                                    `Step ${index + 1} details`,
                            })
                        }
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
                        <FontAwesomeIcon icon={faPlus} className="mr-1" /> Add
                        Detail
                    </button>
                </div>
                {step.details &&
                    step.details.map((detail, detailIndex) => (
                    <div key={detailIndex} className="flex mb-2">
                        <input
                            type="text"
                            value={detail.content || ""}
                                onChange={(e) =>
                                    updateDetail(index, detailIndex, {
                                        ...detail,
                                        content: e.target.value,
                                    })
                                }
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
                        <FontAwesomeIcon icon={faPlus} className="mr-1" /> Add
                        Screenshot
                    </button>
                </div>
                <DragDropContext onDragEnd={(result) => {
                    if (!result.destination) return;
                    const fromIndex = result.source.index;
                    const toIndex = result.destination.index;
                    reorderScreenshots(index, fromIndex, toIndex);
                }}>
                    <Droppable droppableId={`screenshots-${index}`}>
                        {(provided) => (
                            <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className="space-y-2"
                            >
                                {step.screenshots && step.screenshots
                                    .sort((a, b) => a.order - b.order)
                                    .map((screenshot, screenshotIndex) => (
                                        <Draggable
                                            key={screenshotIndex}
                                            draggableId={`screenshot-${index}-${screenshotIndex}`}
                                            index={screenshotIndex}
                                        >
                                            {(provided) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    className="relative group p-4 border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow duration-200"
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center space-x-2">
                                                            <span className="text-sm font-medium text-gray-700">Order: {screenshot.order}</span>
                                                            <div className="text-gray-400">
                                                                <FontAwesomeIcon icon={faGripVertical} />
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeScreenshot(index, screenshotIndex)}
                                                            className="text-red-500 hover:text-red-700"
                                                        >
                                                            <FontAwesomeIcon icon={faTrash} /> Remove
                                                        </button>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Screenshot
                                                        </label>
                                                        <div className="flex items-center">
                                                            {screenshot.file_name || screenshot.file || screenshot.screenshot_path ? (
                                                                <div className="flex items-center w-full">
                                                                    <span className="text-sm font-medium text-[#009FDC] flex-grow">
                                                                        {screenshot.file_name}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <input
                                                                    type="file"
                                                                    onChange={(e) => {
                                                                        const file = e.target.files[0];
                                                                        updateScreenshot(
                                                                            index,
                                                                            screenshotIndex,
                                                                            "file",
                                                                            file
                                                                        );
                                                                    }}
                                                                    className="mt-1 w-auto text-sm file:mr-4 file:py-2 file:px-4
                                                                    file:rounded-full file:border-0 file:text-sm file:font-semibold
                                                                    file:bg-[#009FDC] file:text-white hover:file:bg-[#007BB5]"
                                                                />
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="mt-2">
                                                        <input
                                                            type="text"
                                                            value={screenshot.caption || ""}
                                                            onChange={(e) =>
                                                                updateScreenshot(
                                                                    index,
                                                                    screenshotIndex,
                                                                    "caption",
                                                                    e.target.value
                                                                )
                                                            }
                                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                                            placeholder="Caption"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
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
                            <FontAwesomeIcon icon={faPlus} className="mr-1" />{" "}
                            Add Action
                    </button>
                    )}
                </div>
                {step.actions &&
                    step.actions.map((action, actionIndex) => (
                        <div
                            key={actionIndex}
                            className="grid grid-cols-1 gap-2 mb-2 p-2 border border-gray-200 rounded"
                        >
                        <div>
                                <label className="block text-sm text-gray-700">
                                    Label
                                </label>
                            <input
                                type="text"
                                value={action.label || ""}
                                    onChange={(e) =>
                                        updateAction(index, actionIndex, {
                                            ...action,
                                            label: e.target.value,
                                            // Set default values for hidden fields
                                            action_type: "click",
                                            style: "primary",
                                        })
                                    }
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                placeholder="Action Label"
                            />
                        </div>
                        <div>
                                <label className="block text-sm text-gray-700">
                                    URL or Action
                                </label>
                            <input
                                type="text"
                                value={action.url_or_action || ""}
                                    onChange={(e) =>
                                        updateAction(index, actionIndex, {
                                            ...action,
                                            url_or_action: e.target.value,
                                        })
                                    }
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                placeholder="e.g., https://example.com or #login"
                            />
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="button"
                                    onClick={() =>
                                        removeAction(index, actionIndex)
                                    }
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

export default function CreateUserGuide({
    isOpen,
    onClose,
    sectionId,
    subsectionId,
    editMode = false,
    guideId = null,
}) {
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
            actions: [],
        },
    ]);
    
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
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
        video_path: "",
        video_type: "",
        is_active: true,
        card_id: "",
        card_name: "",
        parent_card_id: "",
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
            const childrenOfSelected = childCards.filter(
                (card) => card.parent_id === selectedId
            );

            // If no children available, use the parent card ID
            if (childrenOfSelected.length === 0) {
                setData("card_id", data.parent_card_id);
            } else if (editMode && data.card_id) {
                // If in edit mode and card_id exists, check if it's valid within the new parent context
                const isValidChildCard = childrenOfSelected.some(
                    (card) => card.id.toString() === data.card_id.toString()
                );
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
            const currentCardId = parseInt(data.card_id);
            // Find selected card in our cards list
            const selectedCard = cards.find(
                (c) => parseInt(c.id) === currentCardId
            );
            if (selectedCard) {
                if (selectedCard.parent_id) {
                    // It's a child card, set parent_card_id
                    const parentId = selectedCard.parent_id.toString();
                    setData((prevData) => ({
                        ...prevData,
                        parent_card_id: parentId,
                    }));
                    setSelectedParentCard(parentId);
                } else {
                    setData((prevData) => ({
                        ...prevData,
                        parent_card_id: currentCardId.toString(),
                    }));
                    setSelectedParentCard(currentCardId.toString());
                }
            }
        }
    }, [editMode, cards, data.card_id]);

    const fetchCards = async () => {
        try {
            setIsLoadingCards(true);
            const response = await axios.get("/api/v1/cards");
            if (response.data && response.data.data) {
                let availableCards = response.data.data;

                // Filter cards based on section and subsection if provided
                if (sectionId && subsectionId) {
                    // If we have both section and subsection, filter for the specific subsection card
                    availableCards = availableCards.filter(
                        (card) =>
                            card.section_id === sectionId &&
                            card.subsection_id === subsectionId
                    );
                } else if (sectionId) {
                    // If we only have sectionId, filter for cards in that section
                    availableCards = availableCards.filter(
                        (card) => card.section_id === sectionId
                    );
                }

                // Store all cards
                setCards(availableCards);

                // Separate parent and child cards
                const parents = availableCards.filter(
                    (card) =>
                        !card.parent_id ||
                        card.parent_id === 0 ||
                        card.parent_id === null
                );
                const children = availableCards.filter(
                    (card) =>
                        card.parent_id &&
                        card.parent_id !== 0 &&
                        card.parent_id !== null
                );

                setParentCards(parents);
                setChildCards(children);
            }
        } catch (error) {
            const fallbackCards = [
                { id: 0, name: "General Guide (No Specific Card)" },
                { id: 1, name: "Login Details Card" },
                { id: 2, name: "Notification Settings Card" },
                { id: 9, name: "Warehouse Card" },
                { id: 11, name: "Reports & Statues Card" },
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
                    video_path: guide.video_path || "",
                    video_type: guide.video_type || "",
                    is_active: guide.is_active,
                    card_id: guide.card_id || "",
                    card_name: guide.card_name || "",
                });

                if (guide.video_path) {
                    setShowVideoField(true);
                }
                
                // Set steps data - ensure we only set the steps that exist in the database
                if (guide.steps && guide.steps.length > 0) {
                    const validSteps = guide.steps.filter(step => step.id); // Only include steps with valid IDs
                    setSteps(
                        validSteps.map((step) => ({
                            id: step.id,
                            step_number: step.step_number,
                            title: step.title,
                            description: step.description || `Step ${step.step_number} - ${step.title || "Details"}`,
                            action_type: step.action_type,
                            order: step.order,
                            is_active: step.is_active,
                            details: step.details || [],
                            screenshots: (step.screenshots || []).map((screenshot) => {
                                return {
                                    ...screenshot,
                                    file_name: screenshot.file_name,
                                    screenshot_url: screenshot.screenshot_path 
                                        ? `/storage/${screenshot.screenshot_path}`
                                        : screenshot.screenshot_url,
                                    manual_step_id: step.id
                                };
                            }),
                            actions: step.actions || [],
                        }))
                    );
                } else {
                    // If no steps exist, initialize with a single empty step
                    setSteps([{
                        step_number: 1,
                        title: "",
                        description: "",
                        action_type: "",
                        order: 1,
                        is_active: true,
                        details: [],
                        screenshots: [],
                        actions: [],
                    }]);
                }
            }
        } catch (error) {
            console.error("Error fetching guide:", error);
            setErrors({ general: "Failed to load guide data" });
        } finally {
            setIsLoadingGuide(false);
        }
    };

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
                actions: [],
            },
        ]);
    };

    const updateStep = (index, updatedStep) => {
        const newSteps = [...steps];
        newSteps[index] = updatedStep;
        setSteps(newSteps);
    };

    const removeStep = (index) => {
        console.log('Attempting to remove step at index:', index);
        console.log('Current steps before removal:', steps);
        
        // Always allow removing a step as long as it's a valid index
        if (index >= 0 && index < steps.length) {
            const newSteps = steps.filter((_, i) => i !== index);
            console.log('New steps after filtering:', newSteps);
            
            // Update step numbers and order
            const reorderedSteps = newSteps.map((step, i) => ({
                ...step,
                step_number: i + 1,
                order: i + 1,
            }));
            console.log('Reordered steps:', reorderedSteps);
            
            setSteps(reorderedSteps);
            console.log('Steps state updated');
        } else {
            console.log('Invalid index for step removal:', index);
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
            order: newSteps[stepIndex].details.length + 1,
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
        newSteps[stepIndex].details = newSteps[stepIndex].details.map(
            (detail, i) => ({
            ...detail,
                order: i + 1,
            })
        );
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
            order: newSteps[stepIndex].screenshots.length + 1,
        });
        setSteps(newSteps);
    };

    const updateScreenshot = async (stepIndex, screenshotIndex, field, value) => {
        const newSteps = [...steps];
        const screenshot = newSteps[stepIndex].screenshots[screenshotIndex];
        
        if (field === "file") {
            if (value) {
                try {
                    const formData = new FormData();
                    formData.append("screenshot", value);
                    if (screenshot.caption) {
                        formData.append("caption", screenshot.caption);
                    }
                    if (screenshot.alt_text) {
                        formData.append("alt_text", screenshot.alt_text);
                    }
                    formData.append("order", screenshot.order || screenshotIndex + 1);
                    formData.append("file_name", value.name);
                    
                    // For new screenshots (no ID yet), just update the local state
                    if (!screenshot.id) {
                        newSteps[stepIndex].screenshots[screenshotIndex] = {
                            ...screenshot,
                            file: value,
                            file_name: value.name,
                            is_edited: true,
                            order: screenshotIndex + 1
                        };
                    } else {
                        // For existing screenshots, update both local state and server
                        await axios.put(
                            `/api/v1/steps/${screenshot.manual_step_id}/screenshots/${screenshot.id}`,
                            formData,
                            {
                                headers: {
                                    "Content-Type": "multipart/form-data",
                                },
                            }
                        );
                        
                        newSteps[stepIndex].screenshots[screenshotIndex] = {
                            ...screenshot,
                            file: value,
                            file_name: value.name,
                            is_edited: true,
                            order: screenshotIndex + 1
                        };
                    }
                } catch (error) {
                    console.error('Error updating screenshot:', error);
                    toast.error('Failed to update screenshot');
                    return;
                }
            }
        } else {
            // For caption and other fields, update both local state and server if it's an existing screenshot
            newSteps[stepIndex].screenshots[screenshotIndex][field] = value;
            
            if (screenshot.id) {
                try {
                    const formData = new FormData();
                    formData.append(field, value);
                    formData.append("order", screenshot.order || screenshotIndex + 1);
                    
                    await axios.put(
                        `/api/v1/steps/${screenshot.manual_step_id}/screenshots/${screenshot.id}`,
                        { [field]: value, order: screenshot.order || screenshotIndex + 1 },
                        {
                            headers: {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json'
                            }
                        }
                    );
                } catch (error) {
                    console.error('Error updating screenshot:', error);
                    toast.error('Failed to update screenshot');
                    return;
                }
            }
        }
        
        setSteps(newSteps);
    };

    const reorderScreenshots = async (stepIndex, fromIndex, toIndex) => {
        if (fromIndex === toIndex) return; // Don't reorder if dropped in same position
        
        const newSteps = [...steps];
        const screenshots = [...newSteps[stepIndex].screenshots];
        
        // Remove the item from its current position
        const [movedScreenshot] = screenshots.splice(fromIndex, 1);
        
        // Insert it at the new position
        screenshots.splice(toIndex, 0, movedScreenshot);
        
        // Update order numbers
        screenshots.forEach((screenshot, index) => {
            screenshot.order = index + 1;
        });
        
        newSteps[stepIndex].screenshots = screenshots;
        setSteps(newSteps);
        
        // Update order on server for existing screenshots
        try {
            const existingScreenshots = screenshots.filter(s => s.id);
            if (existingScreenshots.length > 0) {
                await axios.post(
                    `/api/v1/steps/${screenshots[0].manual_step_id}/screenshots/reorder`,
                    {
                        screenshots: existingScreenshots.map(s => ({
                            id: s.id,
                            order: s.order
                        }))
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        }
                    }
                );
                toast.success('Screenshots reordered successfully');
            }
        } catch (error) {
            console.error('Error reordering screenshots:', error);
            toast.error('Failed to reorder screenshots');
        }
    };

    const removeScreenshot = async (stepIndex, screenshotIndex) => {
        try {
            const screenshot = steps[stepIndex].screenshots[screenshotIndex];
            
            // If the screenshot has an ID (existing screenshot), delete it from the server
            if (screenshot.id) {
                await axios.delete(`/api/v1/steps/${screenshot.manual_step_id}/screenshots/${screenshot.id}`);
            }
            
            // Remove the screenshot from the UI
            const newSteps = [...steps];
            newSteps[stepIndex].screenshots = newSteps[stepIndex].screenshots.filter((_, index) => index !== screenshotIndex);
            
            // Update order numbers
            newSteps[stepIndex].screenshots.forEach((screenshot, index) => {
                screenshot.order = index + 1;
            });
            
            setSteps(newSteps);
            
            toast.success('Screenshot deleted successfully');
        } catch (error) {
            console.error('Error deleting screenshot:', error);
            toast.error('Failed to delete screenshot');
        }
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
            order: newSteps[stepIndex].actions.length + 1,
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
        newSteps[stepIndex].actions = newSteps[stepIndex].actions.map(
            (action, i) => ({
            ...action,
                order: i + 1,
            })
        );
        setSteps(newSteps);
    };

    // Validation function
    const validateForm = () => {
        const newErrors = {};
        if (!data.title.trim()) {
            newErrors.title = "Guide title is required";
        }
        if (!data.parent_card_id) {
            newErrors.parent_card_id = "Main card selection is required";
        }
        if (
            data.parent_card_id &&
            childCards.some(
                (card) => card.parent_id === parseInt(data.parent_card_id)
            ) &&
            !data.card_id
        ) {
            newErrors.card_id = "Sub card selection is required";
        }
        if (showVideoField && !data.video_path.trim()) {
            newErrors.video_path =
                "Video URL is required when adding a video tutorial";
        }
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        console.log('Starting form submission...');

        // Validate form
        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            console.log('Validation errors:', validationErrors);
            setErrors(validationErrors);
            setIsLoading(false);
            return;
        }
        setErrors({});
        try {
            let userManualId;
            console.log('Preparing data for submission...');
            console.log('Current form data:', data);
            console.log('Current steps:', steps);

            const formattedSteps = steps.map((step) => {
                return {
                    step_number: step.step_number,
                    title: step.title,
                    description: step.description || `Step ${step.step_number} - ${step.title || "Details"}`,
                    action_type: step.action_type,
                    order: step.order,
                    is_active: Boolean(step.is_active),
                    details: (step.details || []).map((detail) => 
                        typeof detail === "object" ? detail.content || "" : detail
                    ),
                    actions: (step.actions || []).map((action) => ({
                        action_type: action.action_type || "click",
                        label: action.label,
                        url_or_action: action.url_or_action || "",
                        style: action.style || "default",
                        order: action.order,
                    })),
                };
            });

            console.log('Formatted steps:', formattedSteps);

            const formData = new FormData();
            
            // Add basic fields
            formData.append('title', data.title);
            formData.append('video_path', data.video_path);
            formData.append('video_type', data.video_type);
            formData.append('is_active', data.is_active ? '1' : '0');
            formData.append('card_id', data.card_id);

            // Add steps data without screenshots
            formattedSteps.forEach((step, index) => {
                formData.append(`steps[${index}][step_number]`, step.step_number);
                formData.append(`steps[${index}][title]`, step.title);
                formData.append(`steps[${index}][description]`, step.description);
                formData.append(`steps[${index}][action_type]`, step.action_type);
                formData.append(`steps[${index}][order]`, step.order);
                formData.append(`steps[${index}][is_active]`, step.is_active ? '1' : '0');

                // Add details
                step.details.forEach((detail, detailIndex) => {
                    formData.append(`steps[${index}][details][${detailIndex}]`, detail);
                });

                // Add actions
                step.actions.forEach((action, actionIndex) => {
                    formData.append(`steps[${index}][actions][${actionIndex}][action_type]`, action.action_type);
                    formData.append(`steps[${index}][actions][${actionIndex}][label]`, action.label);
                    formData.append(`steps[${index}][actions][${actionIndex}][url_or_action]`, action.url_or_action);
                    formData.append(`steps[${index}][actions][${actionIndex}][style]`, action.style);
                    formData.append(`steps[${index}][actions][${actionIndex}][order]`, action.order);
                });
            });

            if (editMode && guideId) {
                console.log('Updating existing guide with ID:', guideId);
                try {
                    // First, get all existing steps
                    const existingStepsResponse = await axios.get(`/api/v1/user-manuals/${guideId}/steps`);
                    const existingSteps = existingStepsResponse.data.data || [];
                    
                    // Find steps that need to be deleted
                    const existingStepNumbers = existingSteps.map(step => step.step_number);
                    const newStepNumbers = formattedSteps.map(step => step.step_number);
                    const stepsToDelete = existingStepNumbers.filter(num => !newStepNumbers.includes(num));
                    
                    // Delete steps that are no longer present
                    for (const stepNumber of stepsToDelete) {
                        const stepToDelete = existingSteps.find(s => s.step_number === stepNumber);
                        if (stepToDelete) {
                            await axios.delete(`/api/v1/user-manuals/${guideId}/steps/${stepToDelete.id}`);
                        }
                    }

                    // Update the manual
                    const manualResponse = await axios.post(
                        `/api/v1/user-manuals/${guideId}/update`,
                        formData,
                        {
                            headers: {
                                'Content-Type': 'multipart/form-data',
                            },
                        }
                    );
                    console.log('Update response:', manualResponse.data);
                    userManualId = guideId;
                    
                    // Show success message
                    toast.success("Guide updated successfully!");
                    
                    // Reset form and close modal
                    resetForm();
                    onClose();
                } catch (error) {
                    console.error('Error updating guide:', error.response?.data || error);
                    setErrors({
                        general: error.response?.data?.message || "Failed to update the user guide. Please try again.",
                    });
                    throw error;
                }
            } else {
                try {
                    const manualResponse = await axios.post(
                        "/api/v1/user-manuals",
                        formData
                    );
                    // Safely extract the ID from the response, checking various possible structures
                    if (
                        manualResponse.data &&
                        manualResponse.data.data &&
                        manualResponse.data.data.id
                    ) {
                        userManualId = manualResponse.data.data.id;
                    } else if (manualResponse.data && manualResponse.data.id) {
                        userManualId = manualResponse.data.id;
                    } else {
                        throw new Error(
                            "Could not get user manual ID from response"
                        );
                    }

                    // Show success message
                    toast.success("Guide created successfully!");
                    
                    // Reset form and close modal
                    resetForm();
                    onClose();
                } catch (error) {
                    setErrors({
                        general:
                            error.response?.data?.message ||
                            "Failed to create the user guide. Please try again.",
                    });
                    throw error;
                }
            }

            // Handle screenshot uploads separately
            const hasScreenshots = steps.some(
                (step) =>
                    step.screenshots &&
                    step.screenshots.some((screenshot) => screenshot.file)
            );
            
            if (hasScreenshots) {
                try {
                    // Handle file uploads for each step
                    await handleStepFileUploads(steps, userManualId);
                    toast.success("Screenshots uploaded successfully!");
                } catch (error) {
                    setErrors({
                        general:
                            "Guide was created but failed to upload screenshots. Please try again.",
                    });
                    throw error;
                }
            }
        } catch (error) {
            console.error('Error in handleSubmit:', error);
            if (!errors.general) {
                setErrors({
                    general: "An unexpected error occurred. Please try again.",
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleStepFileUploads = async (steps, userManualId) => {
        console.log('Starting step file uploads...');
        try {
            const stepsResponse = await axios.get(
                `/api/v1/user-manuals/${userManualId}/steps`
            );
            console.log('Fetched steps:', stepsResponse.data);
            const stepData = stepsResponse.data.data || [];
            
            for (let i = 0; i < steps.length; i++) {
                const step = steps[i];
                const stepNumber = parseInt(step.step_number);
                console.log(`Processing step ${stepNumber}...`);
                
                const matchingStep = stepData.find(
                    (s) => parseInt(s.step_number) === stepNumber
                );
                
                if (matchingStep && step.screenshots && step.screenshots.length > 0) {
                    const stepId = matchingStep.id;
                    console.log(`Found matching step with ID ${stepId}`);
                    
                    for (const screenshot of step.screenshots) {
                        if (screenshot && screenshot.file) {
                            console.log('Uploading screenshot:', screenshot);
                            try {
                                const formData = new FormData();
                                // Make sure to append the file directly, not as an object
                                formData.append("screenshot", screenshot.file);
                                formData.append(
                                    "alt_text",
                                    screenshot.alt_text || ""
                                );
                                formData.append(
                                    "caption",
                                    screenshot.caption || ""
                                );
                                formData.append(
                                    "type",
                                    screenshot.type || "image"
                                );
                                formData.append("order", screenshot.order || 1);
                                formData.append("original_name", screenshot.file_name || "");

                                const uploadUrl = `/api/v1/steps/${stepId}/screenshots`;
                                console.log('Uploading to:', uploadUrl);
                                
                                const response = await axios.post(
                                    uploadUrl,
                                    formData, 
                                    {
                                        headers: {
                                            "Content-Type": "multipart/form-data",
                                        },
                                    }
                                );
                                console.log('Screenshot upload response:', response.data);
                            } catch (uploadError) {
                                console.error('Error uploading screenshot:', uploadError.response?.data || uploadError);
                                throw uploadError;
                            }
                        }
                    }
                } else {
                    console.warn(
                        `Could not find matching step for step_number ${stepNumber} or no screenshots to upload`
                    );
                }
            }
        } catch (error) {
            console.error('Error in handleStepFileUploads:', error.response?.data || error);
            throw error;
        }
    };

    const retrySubmit = async () => {
        setErrors({});
        setIsSubmitting(true);
        
        try {
            await handleSubmit(new Event("submit"));
            // If we reach here, the submission was successful
            toast.success("Submission successful after retry!");
        } catch (error) {
            setErrors((prevErrors) => ({
                ...prevErrors,
                general:
                    "Retry failed. Please check your form data and try again.",
            }));
        } finally {
            setIsSubmitting(false);
        }
    };

    // Add this new function to reset the form
    const resetForm = () => {
        setData({
            title: "",
            video_path: "",
            video_type: "",
            is_active: true,
            card_id: "",
            parent_card_id: "",
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
                actions: [],
            },
        ]);
        setShowVideoField(false);
        setErrors({});
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
            <div className="bg-white p-8 rounded-2xl w-[90%] max-w-4xl max-h-[90vh] overflow-auto">
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
                        <span className="block sm:inline">
                            {errors.general}
                        </span>
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
                        {/* Guide Title */}
                        <div>
                            <InputFloating
                                label="Guide title"
                                type="text"
                                value={data.title}
                                onChange={(e) =>
                                    setData("title", e.target.value)
                                }
                            />
                            {errors.title && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.title}
                                </p>
                            )}
                        </div>
                        </div>
                    <div
                        className={`grid gap-4 ${
                            data.parent_card_id &&
                            childCards.some(
                                (card) =>
                                    card.parent_id ===
                                    parseInt(data.parent_card_id)
                            )
                                ? "grid-cols-1 md:grid-cols-2"
                                : "grid-cols-1 md:grid-cols-1"
                        }`}
                    >
                        {/* Main Card Selection */}
                        <div>
                            <SelectFloating
                                label="Main Card"
                                name="main_card"
                                value={data.parent_card_id}
                                onChange={(e) => {
                                    const parentId = e.target.value;
                                    setData({
                                        ...data, 
                                        parent_card_id: parentId,
                                    });
                                    setSelectedParentCard(parentId);
                                }}
                                options={parentCards.map((p) => ({
                                    id: p.id,
                                    label: p.name,
                                }))}
                            />
                            {errors.parent_card_id && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.parent_card_id}
                                </p>
                            )}
                        </div>

                        {/* Sub Card Selection (conditionally shown) */}
                        {data.parent_card_id &&
                            childCards.some(
                                (card) =>
                                    card.parent_id ===
                                    parseInt(data.parent_card_id)
                            ) && (
                                <div>
                                    <SelectFloating
                                        label="Sub Card"
                                        name="sub_card"
                                        value={data.card_id}
                                        onChange={(e) =>
                                            setData({
                                                ...data,
                                                card_id: e.target.value,
                                            })
                                        }
                                        options={childCards
                                            .filter(
                                                (card) =>
                                                    card.parent_id ===
                                                    parseInt(
                                                        data.parent_card_id
                                                    )
                                            )
                                            .map((card) => ({
                                                id: card.id,
                                                label: card.name,
                                            }))}
                                    />
                                    {errors.card_id && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {errors.card_id}
                                        </p>
                                    )}
                                </div>
                            )}
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="hasVideo"
                                checked={showVideoField}
                                onChange={() =>
                                    setShowVideoField(!showVideoField)
                                }
                                className="mr-2 h-4 w-4 text-[#009FDC] border-gray-300 rounded"
                            />
                            <label
                                htmlFor="hasVideo"
                                className="text-sm font-medium text-gray-700"
                            >
                                Add Video Tutorial
                            </label>
                        </div>

                        {showVideoField && (
                            <div>
                                <InputFloating
                                    label="YouTube Video URL"
                                        type="text"
                                        value={data.video_path}
                                    onChange={(e) => {
                                        setData({
                                            ...data,
                                            video_path: e.target.value,
                                            video_type: "youtube",
                                        });
                                    }}
                                />
                                {errors.video_path && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {errors.video_path}
                                    </p>
                                )}
                                </div>
                        )}
                    </div>

                    {/* Steps Section */}
                    <div className="mt-8">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h3 className="text-xl font-semibold text-[#2C323C]">
                                Guide Steps
                            </h3>
                            <button
                                type="button"
                                onClick={addStep}
                                className="bg-[#009FDC] text-white px-4 py-2 rounded-full text-base"
                            >
                                <FontAwesomeIcon
                                    icon={faPlus}
                                    className="mr-1"
                                />
                                Add Step
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
                                editMode={editMode}
                                reorderScreenshots={reorderScreenshots}
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
                                ? editMode
                                    ? "Updating..."
                                    : "Creating..."
                                : editMode
                                ? "Update Guide"
                                : "Submit"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
} 
