import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { toast } from "react-hot-toast";
import InputFloating from "@/Components/InputFloating";

export default function CardForm({ 
    isOpen, 
    onClose, 
    card = null, 
    parentCard = null,
    level = 0 
}) {
    const [formDataState, setFormDataState] = useState({
        name: '',
        description: '',
        icon: null,
        iconPreview: null
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (card) {
            setFormDataState({
                name: card.name || '',
                description: card.description || '',
                icon: null,
                iconPreview: card.icon_path ? `/storage/${card.icon_path}` : null
            });
        } else {
            setFormDataState({
                name: '',
                description: '',
                icon: null,
                iconPreview: null
            });
        }
    }, [card]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append("name", formDataState.name);
            formData.append("description", formDataState.description);
            
            // Get section_id from the current URL or parent card
            const currentPath = window.location.pathname;
            const sectionMatch = currentPath.match(/\/user-manual\/([^\/]+)/);
            const sectionId = sectionMatch ? sectionMatch[1] : (parentCard?.section_id || card?.section_id);
            
            formData.append("section_id", sectionId);
            
            // If we're creating a sub-card, set the parent_id and subsection_id
            if (parentCard) {
                formData.append("parent_id", parentCard.id);
                // For sub-cards, use the parent's section_id and create a subsection_id from the name
                formData.append("subsection_id", formDataState.name.toLowerCase().replace(/\s+/g, '-'));
            } else if (card?.parent_id) {
                // If we're editing a sub-card, maintain its parent_id and subsection_id
                formData.append("parent_id", card.parent_id);
                formData.append("subsection_id", card.subsection_id);
            } else {
                // For main cards, use the name as section_id
                formData.append("section_id", formDataState.name.toLowerCase().replace(/\s+/g, '-'));
            }

            // Always include order - use existing order or default to 0
            formData.append("order", card?.order ?? 0);
            
            if (formDataState.icon) {
                formData.append("icon", formDataState.icon);
            }

            let response;
            if (card) {
                // Use POST for updating
                response = await axios.post(`/api/v1/cards/${card.id}`, formData, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                });
            } else {
                // For new cards, include the level
                formData.append("level", level);
                response = await axios.post("/api/v1/cards", formData, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                });
            }

            if (response.data.success) {
                onClose();
                toast.success(
                    card
                        ? "Card updated successfully!"
                        : "Card created successfully!"
                );
            } else {
                setError(response.data.message || "Failed to save card");
            }
        } catch (error) {
            console.error("Error saving card:", error);
            setError(
                error.response?.data?.message ||
                    "An error occurred while saving the card"
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-8 rounded-2xl w-[70%] max-w-2xl max-h-[90vh] overflow-auto">
                <div className="flex justify-between border-b pb-2 mb-4">
                    <h2 className="text-3xl font-bold text-[#2C323C]">
                        {card ? 'Edit' : 'Create'} {level === 0 ? 'Main' : level === 1 ? 'Sub' : 'Sub-Sub'} Card
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-red-500 hover:text-red-800"
                    >
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <InputFloating
                                label="Card Name"
                                type="text"
                                value={formDataState.name}
                                onChange={(e) => setFormDataState({...formDataState, name: e.target.value})}
                            />
                        </div>
                        <div>
                            <InputFloating
                                label="Description"
                                type="text"
                                value={formDataState.description}
                                onChange={(e) => setFormDataState({...formDataState, description: e.target.value})}
                            />
                        </div>
                        <div className="flex flex-col items-center space-y-4">
                            <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                                {formDataState.iconPreview ? (
                                    <img 
                                        src={formDataState.iconPreview} 
                                        alt="Preview" 
                                        className="w-full h-full object-contain"
                                    />
                                ) : (
                                    <span className="text-gray-400">Icon Preview</span>
                                )}
                            </div>
                            <div className="w-full max-w-xs">
                                <input
                                    type="file"
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            setFormDataState({
                                                ...formDataState,
                                                icon: file,
                                                iconPreview: URL.createObjectURL(file)
                                            });
                                        }
                                    }}
                                    className="block w-full text-sm file:mr-4 file:py-2 file:px-4
                                    file:rounded-full file:border-0 file:text-sm file:font-semibold
                                    file:bg-[#009FDC] file:text-white hover:file:bg-[#007BB5] ml-[18%]"
                                    accept="image/*"
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-500 text-center">{error}</div>
                    )}

                    <div className="mt-6 flex justify-center">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-3 text-xl font-medium bg-[#009FDC] text-white rounded-full transition duration-300 hover:bg-[#007BB5] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Saving...' : (card ? 'Update' : 'Create')} Card
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
} 