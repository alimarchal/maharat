import React, { useState, useEffect } from "react";
import { FaChevronDown, FaChevronUp, FaQuestionCircle, FaEdit } from "react-icons/fa";
import InputFloating from "../../Components/InputFloating";
import axios from "axios";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight, faArrowLeft, faGripVertical } from "@fortawesome/free-solid-svg-icons";
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

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
                screenshots: faq.screenshots ? JSON.parse(faq.screenshots) : [],
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
            formDataToSend.append('title', formData.title);
            formDataToSend.append('question', formData.question);
            formDataToSend.append('description', formData.description);
            formDataToSend.append('video_link', formData.video_link);
            formData.screenshots.forEach((file, index) => {
                formDataToSend.append(`screenshots[${index}]`, file);
            });

            if (isEdit) {
                await axios.put(`/api/v1/faqs/${faq.id}`, formDataToSend);
            } else {
                await axios.post('/api/v1/faqs', formDataToSend);
            }

            onSave();
            onClose();
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                setErrors({ submit: error.response?.data?.message || "Failed to save FAQ" });
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
                    <button onClick={onClose} className="text-red-500 hover:text-red-800">
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
                                errors.description ? "border-red-500" : "border-gray-300"
                            }`}
                        ></textarea>
                        {errors.description && (
                            <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                        )}
                    </div>
                    <InputFloating
                        label="Video Link"
                        name="video_link"
                        value={formData.video_link}
                        onChange={handleChange}
                        error={errors.video_link}
                    />
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Screenshots
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
                            {isSaving ? "Saving..." : (isEdit ? "Save" : "Submit")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const FAQ = () => {
    const [expandedIndex, setExpandedIndex] = useState(null);
    const [showHelpForm, setShowHelpForm] = useState(false);
    const [helpFormData, setHelpFormData] = useState({
        name: "",
        email: "",
        question: "",
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
        checkAdminRole();
    }, []);

    const fetchFaqs = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axios.get('/api/v1/faqs');
            setFaqs(response.data);
        } catch (error) {
            console.error('Error fetching FAQs:', error);
            setError('Failed to load FAQs. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const checkAdminRole = () => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            setIsAdmin(user?.roles?.some(role => role.name === 'admin'));
        } catch (error) {
            console.error('Error checking admin role:', error);
            setIsAdmin(false);
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
                order: index
            }));
            await axios.post('/api/v1/faqs/reorder', { items: reorderedItems });
        } catch (error) {
            console.error('Error reordering FAQs:', error);
            fetchFaqs(); // Revert to original order if error occurs
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

    const toggleAccordion = (index) => {
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    const handleHelpFormChange = (e) => {
        const { name, value } = e.target;
        setHelpFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const validateHelpForm = () => {
        const tempErrors = {};
        if (!helpFormData.name) tempErrors.name = "Name is required";
        if (!helpFormData.email) tempErrors.email = "Email is required";
        if (!helpFormData.question) tempErrors.question = "Question is required";
        setErrors(tempErrors);
        return Object.keys(tempErrors).length === 0;
    };

    const handleHelpFormSubmit = async (e) => {
        e.preventDefault();
        if (!validateHelpForm()) return;
        
        setIsSubmitting(true);
        try {
            // In a real application, you would send this to your backend
            // await axios.post("/api/v1/help-requests", helpFormData);
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            setSubmitSuccess(true);
            setHelpFormData({
                name: "",
                email: "",
                question: "",
            });
            
            // Reset success message after 5 seconds
            setTimeout(() => {
                setSubmitSuccess(false);
                setShowHelpForm(false);
            }, 5000);
        } catch (error) {
            console.error("Error submitting help request:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="FAQs" />
            
            <div className="w-full mx-auto p-6">
                <div className="mb-8">
                    <button 
                        onClick={() => router.visit(route('dashboard'))}
                        className="flex items-center text-black text-2xl font-medium hover:text-gray-800 p-2 mb-3"
                    >
                        <FontAwesomeIcon icon={faArrowLeft} className="mr-2 text-2xl" />
                        <span>Back</span>
                    </button>
                    
                    <div className="flex items-center text-[#7D8086] text-lg font-medium space-x-2">
                        <Link href={route('dashboard')} className="hover:text-[#009FDC] text-xl">
                            Dashboard
                        </Link>

                        <FontAwesomeIcon icon={faChevronRight} className="text-xl text-[#9B9DA2]" />
                        <span className="text-[#009FDC] text-xl">FAQs</span>
                    </div>
                </div>
                      
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-[#2C323C]">FAQs</h2>
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
                                {isEditMode ? 'Done Editing' : 'Edit FAQs'}
                            </button>
                        </div>
                    )}
                </div>

                <p className="text-xl text-[#7D8086] mb-6">
                    Find answers to common questions about our application
                </p>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#009FDC]"></div>
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
                                        snapshot.isDraggingOver ? 'bg-gray-50' : ''
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
                                                        snapshot.isDragging ? 'bg-gray-50' : ''
                                                    }`}
                                                >
                                                    <button
                                                        className="w-full flex justify-between items-center p-4 text-left focus:outline-none"
                                                        onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                                                    >
                                                        <div className="flex items-center">
                                                            {isEditMode && (
                                                                <span className="mr-4 text-gray-400">
                                                                    <FontAwesomeIcon icon={faGripVertical} />
                                                                </span>
                                                            )}
                                                            <span className="font-medium text-lg text-[#2C323C]">
                                                                {faq.question}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center">
                                                            {isEditMode && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleEdit(faq);
                                                                    }}
                                                                    className="mr-4 text-[#009FDC] hover:text-[#007BB5]"
                                                                >
                                                                    <FaEdit />
                                                                </button>
                                                            )}
                                                            <span className="text-[#009FDC]">
                                                                {expandedIndex === index ? (
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
                                                                <h3 className="font-semibold mb-2">{faq.title}</h3>
                                                                <p>{faq.description}</p>
                                                            </div>
                                                            {faq.screenshots && JSON.parse(faq.screenshots).length > 0 && (
                                                                <div className="grid grid-cols-2 gap-4 mb-4">
                                                                    {JSON.parse(faq.screenshots).map((screenshot, idx) => (
                                                                        <img
                                                                            key={idx}
                                                                            src={`/storage/${screenshot}`}
                                                                            alt={`Screenshot ${idx + 1}`}
                                                                            className="rounded-lg"
                                                                        />
                                                                    ))}
                                                                </div>
                                                            )}
                                                            {faq.video_link && (
                                                                <div className="mt-4">
                                                                    <a
                                                                        href={faq.video_link}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-[#009FDC] hover:text-[#007BB5]"
                                                                    >
                                                                        Watch Video Tutorial
                                                                    </a>
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
                                    Your question has been submitted. We'll get back to you soon!
                                </div>
                            )}
                            
                            <InputFloating
                                label="Your Name"
                                name="name"
                                value={helpFormData.name}
                                onChange={handleHelpFormChange}
                                error={errors.name}
                            />
                            
                            <InputFloating
                                label="Your Email"
                                name="email"
                                type="email"
                                value={helpFormData.email}
                                onChange={handleHelpFormChange}
                                error={errors.email}
                            />
                            
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Your Question
                                </label>
                                <textarea
                                    name="question"
                                    value={helpFormData.question}
                                    onChange={handleHelpFormChange}
                                    rows="4"
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#009FDC] ${
                                        errors.question ? "border-red-500" : "border-gray-300"
                                    }`}
                                    placeholder="Please describe your question in detail"
                                ></textarea>
                                {errors.question && (
                                    <p className="text-red-500 text-sm mt-1">{errors.question}</p>
                                )}
                            </div>
                            
                            <div className="flex space-x-4">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`px-6 py-2 bg-[#009FDC] text-white rounded-full hover:bg-[#007BB5] transition duration-300 ${
                                        isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                                    }`}
                                >
                                    {isSubmitting ? "Submitting..." : "Submit Question"}
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
            </div>

            <FAQModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSave={handleSave}
                faq={editingFaq}
                isEdit={isEditMode}
            />
        </AuthenticatedLayout>
    );
};

export default FAQ;
