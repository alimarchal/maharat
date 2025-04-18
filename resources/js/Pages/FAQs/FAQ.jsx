import React, { useState, useEffect } from "react";
import {
    FaChevronDown,
    FaChevronUp,
    FaQuestionCircle,
    FaEdit,
} from "react-icons/fa";
import InputFloating from "../../Components/InputFloating";
import axios from "axios";
import { Link } from "@inertiajs/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faGripVertical,
    faTimes,
    faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

const FAQModal = ({ isOpen, onClose, onSave, faq = null, isEdit = false }) => {
    const [formData, setFormData] = useState({
        title: "",
        question: "",
        description: "",
        video_link: "",
        screenshots: [],
    });

    const [errors, setErrors] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen && faq && isEdit) {
            setFormData({
                title: faq.title || "",
                question: faq.question || "",
                description: faq.description || "",
                video_link: faq.video_link || "",
                screenshots: [],
            });
        } else if (isOpen && !isEdit) {
            setFormData({
                title: "",
                question: "",
                description: "",
                video_link: "",
                screenshots: [],
            });
        }
    }, [isOpen, faq, isEdit]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setFormData({ ...formData, screenshots: Array.from(e.target.files) });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setErrors({});

        try {
            const formDataToSend = new FormData();
            formDataToSend.append("title", formData.title);
            formDataToSend.append("question", formData.question);
            formDataToSend.append("description", formData.description);

            // Format video link if provided
            if (formData.video_link) {
                let videoLink = formData.video_link.trim();
                // Add https:// if not present
                if (
                    !videoLink.startsWith("http://") &&
                    !videoLink.startsWith("https://")
                ) {
                    videoLink = "https://" + videoLink;
                }
                formDataToSend.append("video_link", videoLink);
            }

            // Handle screenshots
            if (formData.screenshots && formData.screenshots.length > 0) {
                formData.screenshots.forEach((file, index) => {
                    if (file) {
                        formDataToSend.append(`screenshots[${index}]`, file);
                    }
                });
            }

            let response;
            if (isEdit && faq) {
                // For update, use POST
                response = await axios.post(
                    `/api/v1/faqs/${faq.id}`,
                    formDataToSend,
                    {
                        headers: {
                            "Content-Type": "multipart/form-data",
                        },
                    }
                );
            } else {
                // For create, use regular POST
                response = await axios.post("/api/v1/faqs", formDataToSend, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                });
            }

            if (response.data) {
                onSave();
                onClose();
            }
        } catch (error) {
            console.error("Error submitting FAQ:", error);
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                setErrors({
                    submit:
                        error.response?.data?.message || "Failed to save FAQ",
                });
            }
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-8 rounded-2xl w-[90%] max-w-lg">
                <div className="flex justify-between border-b pb-2 mb-4">
                    <h2 className="text-3xl font-bold text-[#2C323C]">
                        {isEdit ? "Edit FAQ" : "Add FAQ"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-red-500 hover:text-red-800"
                    >
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <InputFloating
                        label="Title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        error={errors.title}
                    />
                    <InputFloating
                        label="Question"
                        name="question"
                        value={formData.question}
                        onChange={handleChange}
                        error={errors.question}
                    />
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows="4"
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#009FDC] ${
                                errors.description
                                    ? "border-red-500"
                                    : "border-gray-300"
                            }`}
                        ></textarea>
                        {errors.description && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.description}
                            </p>
                        )}
                    </div>
                    <InputFloating
                        label="Video Link (Optional)"
                        name="video_link"
                        value={formData.video_link}
                        onChange={handleChange}
                        error={errors.video_link}
                    />
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Screenshots (Optional)
                        </label>
                        <input
                            type="file"
                            multiple
                            onChange={handleFileChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            accept="image/*"
                        />
                    </div>
                    <div className="my-4 flex justify-center w-full">
                        <button
                            type="submit"
                            className="px-8 py-3 text-xl font-medium bg-[#009FDC] text-white rounded-full transition duration-300 hover:bg-[#007BB5] w-full"
                            disabled={isSaving}
                        >
                            {isSaving
                                ? "Saving..."
                                : isEdit
                                ? "Save"
                                : "Submit"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const FAQAccordion = () => {
    const [expandedIndex, setExpandedIndex] = useState(null);
    const [showHelpForm, setShowHelpForm] = useState(false);
    const [helpFormData, setHelpFormData] = useState({
        name: "",
        email: "",
        question: "",
        description: "",
        screenshots: null,
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [faqs, setFaqs] = useState([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingFaq, setEditingFaq] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchFaqs();
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            const response = await axios.get("/api/v1/user/current", {
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
            });

            if (response.data && response.data.data) {
                const userData = response.data.data;
                setIsAdmin(userData.roles && userData.roles.includes("Admin"));
            } else {
                console.error("Invalid user data format:", response.data);
                setIsAdmin(false);
            }
        } catch (error) {
            if (error.response) {
                console.error("Response data:", error.response.data);
            }
            setIsAdmin(false);
        }
    };

    const fetchFaqs = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axios.get("/api/v1/faqs");
            setFaqs(response.data);
        } catch (error) {
            console.error("Error fetching FAQs:", error);
            setError("Failed to load FAQs. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const handleDragEnd = async (result) => {
        if (!result.destination) return;

        const items = Array.from(faqs);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        setFaqs(items);

        try {
            const reorderedItems = items.map((item, index) => ({
                id: item.id,
                order: index,
            }));

            await axios.post(
                "/api/v1/faqs/reorder",
                { items: reorderedItems },
                {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                    },
                }
            );
        } catch (error) {
            console.error("Error reordering FAQs:", error);
            fetchFaqs(); // Revert to original order if error occurs
        }
    };

    const handleDelete = async (faqId) => {
        if (window.confirm("Are you sure you want to delete this FAQ?")) {
            try {
                await axios.delete(`/api/v1/faqs/${faqId}`, {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                    },
                });
                await fetchFaqs();
            } catch (error) {
                console.error("Error deleting FAQ:", error);
            }
        }
    };

    const handleEdit = (faq) => {
        setEditingFaq(faq);
        setIsEditMode(true);
        setShowModal(true);
    };

    const handleAdd = () => {
        setEditingFaq(null);
        setIsEditMode(false);
        setShowModal(true);
    };

    const handleSave = () => {
        fetchFaqs();
    };

    const handleHelpFormChange = (e) => {
        const { name, value, files } = e.target;
        setHelpFormData((prev) => ({
            ...prev,
            [name]: files ? files : value,
        }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: null }));
        }
    };

    const handleHelpFormSubmit = async (e) => {
        e.preventDefault();
        if (!helpFormData.question.trim()) {
            setErrors({ question: "Question is required" });
            return;
        }
        if (!helpFormData.description.trim()) {
            setErrors({ description: "Description is required" });
            return;
        }

        setIsSubmitting(true);
        setErrors({});

        try {
            const formData = new FormData();
            formData.append("title", helpFormData.question);
            formData.append("description", helpFormData.description);

            // Handle screenshots if they exist
            if (helpFormData.screenshots) {
                Array.from(helpFormData.screenshots).forEach((file, index) => {
                    formData.append(`screenshots[${index}]`, file);
                });
            }
            const response = await axios.post(
                "/api/v1/faqs/approval",
                formData,
                {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            if (response.data) {
                setSubmitSuccess(true);
                setHelpFormData({
                    name: "",
                    email: "",
                    question: "",
                    description: "",
                    screenshots: null,
                });

                setTimeout(() => {
                    setSubmitSuccess(false);
                    setShowHelpForm(false);
                }, 5000);
            }
        } catch (error) {
            if (error.response) {
                console.error("Response data:", error.response.data);
                console.error("Response status:", error.response.status);
                setErrors({
                    submit:
                        error.response.data.message ||
                        "Failed to submit question",
                });
            } else {
                setErrors({
                    submit: "Failed to submit question. Please try again.",
                });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-6">
                <div className="flex flex-col gap-1">
                    <h2 className="text-3xl font-bold text-[#2C323C]">FAQs</h2>
                    <p className="text-base text-[#7D8086]">
                        Find answers to common questions about our application
                    </p>
                </div>
                {isAdmin && (
                    <div className="flex space-x-4">
                        <button
                            onClick={handleAdd}
                            className="px-6 py-2 bg-[#009FDC] text-white rounded-full hover:bg-[#007BB5] transition duration-300"
                        >
                            Add FAQ
                        </button>
                        <button
                            onClick={() => setIsEditMode(!isEditMode)}
                            className="px-6 py-2 bg-[#009FDC] text-white rounded-full hover:bg-[#007BB5] transition duration-300"
                        >
                            {isEditMode ? "Done Editing" : "Edit FAQs"}
                        </button>
                        <Link
                            href={route("faqs.view")}
                            className="px-6 py-2 bg-[#009FDC] text-white rounded-full hover:bg-[#007BB5] transition duration-300"
                        >
                            View FAQs
                        </Link>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="flex justify-start items-center h-full mb-8">
                    <div className="w-12 h-12 border-4 border-[#009FDC] border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : error ? (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                    {error}
                </div>
            ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="faqs">
                        {(provided, snapshot) => (
                            <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className={`bg-white rounded-lg shadow-md overflow-hidden mb-8 ${
                                    snapshot.isDraggingOver ? "bg-gray-50" : ""
                                }`}
                            >
                                {faqs.map((faq, index) => (
                                    <Draggable
                                        key={faq.id}
                                        draggableId={faq.id.toString()}
                                        index={index}
                                        isDragDisabled={!isEditMode}
                                    >
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                className={`border-b border-gray-200 last:border-b-0 ${
                                                    snapshot.isDragging
                                                        ? "bg-gray-50"
                                                        : ""
                                                }`}
                                            >
                                                <button
                                                    className="w-full flex justify-between items-center p-4 text-left focus:outline-none"
                                                    onClick={() =>
                                                        setExpandedIndex(
                                                            expandedIndex ===
                                                                index
                                                                ? null
                                                                : index
                                                        )
                                                    }
                                                >
                                                    <div className="flex items-center">
                                                        {isEditMode && (
                                                            <span className="mr-4 text-gray-400">
                                                                <FontAwesomeIcon
                                                                    icon={
                                                                        faGripVertical
                                                                    }
                                                                />
                                                            </span>
                                                        )}
                                                        <span className="font-medium text-lg text-[#2C323C]">
                                                            {faq.question}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center">
                                                        {isEditMode && (
                                                            <>
                                                                <button
                                                                    onClick={(
                                                                        e
                                                                    ) => {
                                                                        e.stopPropagation();
                                                                        handleEdit(
                                                                            faq
                                                                        );
                                                                    }}
                                                                    className="mr-4 text-[#009FDC] hover:text-[#007BB5]"
                                                                >
                                                                    <FaEdit />
                                                                </button>
                                                                <button
                                                                    onClick={(
                                                                        e
                                                                    ) => {
                                                                        e.stopPropagation();
                                                                        handleDelete(
                                                                            faq.id
                                                                        );
                                                                    }}
                                                                    className="mr-4 text-red-500 hover:text-red-700"
                                                                >
                                                                    <FontAwesomeIcon
                                                                        icon={
                                                                            faTrash
                                                                        }
                                                                    />
                                                                </button>
                                                            </>
                                                        )}
                                                        <span className="text-[#009FDC]">
                                                            {expandedIndex ===
                                                            index ? (
                                                                <FaChevronUp />
                                                            ) : (
                                                                <FaChevronDown />
                                                            )}
                                                        </span>
                                                    </div>
                                                </button>
                                                {expandedIndex === index && (
                                                    <div className="p-4 bg-gray-50 text-[#4A5568]">
                                                        <div className="mb-4">
                                                            <h3 className="font-semibold mb-2">
                                                                {faq.title}
                                                            </h3>
                                                            <p>
                                                                {
                                                                    faq.description
                                                                }
                                                            </p>
                                                        </div>
                                                        {faq.video_link && (
                                                            <div className="mt-4">
                                                                <a
                                                                    href={
                                                                        faq.video_link
                                                                    }
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-[#009FDC] hover:text-[#007BB5]"
                                                                >
                                                                    Watch Video
                                                                    Tutorial
                                                                </a>
                                                            </div>
                                                        )}
                                                        {faq.screenshots &&
                                                            JSON.parse(
                                                                faq.screenshots
                                                            ).length > 0 && (
                                                                <div className="grid grid-cols-2 gap-4 mb-4">
                                                                    {JSON.parse(
                                                                        faq.screenshots
                                                                    ).map(
                                                                        (
                                                                            screenshot,
                                                                            idx
                                                                        ) => (
                                                                            <img
                                                                                key={
                                                                                    idx
                                                                                }
                                                                                src={`/storage/${screenshot}`}
                                                                                alt={`Screenshot ${
                                                                                    idx +
                                                                                    1
                                                                                }`}
                                                                                className="rounded-lg"
                                                                            />
                                                                        )
                                                                    )}
                                                                </div>
                                                            )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
            )}

            {/* Help Request Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center mb-4">
                    <FaQuestionCircle className="text-[#009FDC] text-2xl mr-2" />
                    <h3 className="text-xl font-semibold text-[#2C323C]">
                        Can't find what you're looking for?
                    </h3>
                </div>

                {!showHelpForm ? (
                    <button
                        onClick={() => setShowHelpForm(true)}
                        className="px-6 py-2 bg-[#009FDC] text-white rounded-full hover:bg-[#007BB5] transition duration-300"
                    >
                        Ask for Help
                    </button>
                ) : (
                    <form onSubmit={handleHelpFormSubmit} className="space-y-4">
                        {submitSuccess && (
                            <div className="p-3 bg-green-100 text-green-700 rounded-md">
                                Your question has been submitted for approval.
                                We'll review it soon!
                            </div>
                        )}

                        <InputFloating
                            label="Your Question"
                            name="question"
                            value={helpFormData.question}
                            onChange={handleHelpFormChange}
                            error={errors.question}
                        />

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <textarea
                                name="description"
                                value={helpFormData.description}
                                onChange={handleHelpFormChange}
                                rows="4"
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#009FDC] ${
                                    errors.description
                                        ? "border-red-500"
                                        : "border-gray-300"
                                }`}
                                placeholder="Please provide additional details about your question"
                            ></textarea>
                            {errors.description && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.description}
                                </p>
                            )}
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Screenshots (Optional)
                            </label>
                            <input
                                type="file"
                                multiple
                                name="screenshots"
                                onChange={handleHelpFormChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                accept="image/*"
                            />
                        </div>

                        {errors.submit && (
                            <div className="text-red-500 text-sm">
                                {errors.submit}
                            </div>
                        )}

                        <div className="flex space-x-4">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`px-6 py-2 bg-[#009FDC] text-white rounded-full hover:bg-[#007BB5] transition duration-300 ${
                                    isSubmitting
                                        ? "opacity-70 cursor-not-allowed"
                                        : ""
                                }`}
                            >
                                {isSubmitting
                                    ? "Submitting..."
                                    : "Submit Question"}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowHelpForm(false)}
                                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-100 transition duration-300"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}
            </div>

            <FAQModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSave={handleSave}
                faq={editingFaq}
                isEdit={isEditMode}
            />
        </div>
    );
};

export default FAQAccordion;
