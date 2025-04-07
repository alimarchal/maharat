import React, { useState } from "react";
import { FaChevronDown, FaChevronUp, FaQuestionCircle } from "react-icons/fa";
import InputFloating from "../../Components/InputFloating";
import axios from "axios";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight, faArrowLeft } from "@fortawesome/free-solid-svg-icons";

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

    // FAQ data
    const faqData = [
        {
            question: "What is an RFQ and how do I create one?",
            answer: "An RFQ (Request for Quotation) is a document that businesses use to request pricing information from suppliers. To create an RFQ in our system, navigate to the RFQ section, click on 'Create New RFQ', fill in the required details including items, quantities, and specifications, and submit. The system will then send this to your selected suppliers for quotation."
        },
        {
            question: "How do I manage quotations received from suppliers?",
            answer: "When suppliers respond to your RFQ, you'll receive notifications. You can view all quotations in the 'Quotations' section. Here you can compare prices, specifications, and delivery terms. You can accept, reject, or request modifications to quotations. Once you've made a decision, you can convert the accepted quotation into a purchase order."
        },
        {
            question: "What is the process for creating and managing purchase orders?",
            answer: "Purchase orders can be created directly or from an accepted quotation. Navigate to the 'Purchase Orders' section and click 'Create New PO'. Fill in the supplier details, items, quantities, prices, and delivery information. Once created, you can track the status of your PO, receive goods, and manage payments all within the system."
        },
        {
            question: "How do I track inventory and manage stock levels?",
            answer: "The inventory management system allows you to track stock levels in real-time. You can view current inventory levels, set minimum stock alerts, and generate inventory reports. When goods are received against a purchase order, the system automatically updates your inventory levels. You can also perform physical stock counts and adjust inventory as needed."
        },
        {
            question: "How do I manage invoices and payments?",
            answer: "Invoices can be created for sales or received from suppliers. Navigate to the 'Invoices' section to create, view, or manage invoices. The system supports various payment methods and can track payment status. You can also set up recurring invoices and payment reminders to ensure timely payments."
        },
        {
            question: "What are Goods Receiving Notes (GRNs) and how do I use them?",
            answer: "A GRN is a document used to confirm the receipt of goods from suppliers. When goods arrive, create a GRN by referencing the purchase order. The system will pre-populate the expected items and quantities. You can then verify the received goods, note any discrepancies, and approve the GRN. This process updates your inventory and can trigger invoice generation."
        },
        {
            question: "How do I generate reports and analyze data?",
            answer: "The system provides various reports including inventory reports, financial reports, supplier performance reports, and more. Navigate to the 'Reports' section to access these. You can customize report parameters, export to various formats, and schedule automatic report generation. The dashboard also provides key metrics and visualizations for quick insights."
        },
        {
            question: "How do I manage user permissions and roles?",
            answer: "Administrators can manage user roles and permissions in the 'User Management' section. You can create roles with specific permissions, assign users to roles, and customize access levels for different modules. This ensures that users only have access to the features they need for their job functions."
        }
    ];

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
                      
                
                <h2 className="text-3xl font-bold text-[#2C323C]">FAQs</h2>
                <p className="text-xl text-[#7D8086] mb-6">
                    Find answers to common questions about our application
                </p>

                {/* FAQ Accordion */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
                    {faqData.map((faq, index) => (
                        <div key={index} className="border-b border-gray-200 last:border-b-0">
                            <button
                                className="w-full flex justify-between items-center p-4 text-left focus:outline-none"
                                onClick={() => toggleAccordion(index)}
                            >
                                <span className="font-medium text-lg text-[#2C323C]">
                                    {faq.question}
                                </span>
                                <span className="text-[#009FDC]">
                                    {expandedIndex === index ? (
                                        <FaChevronUp />
                                    ) : (
                                        <FaChevronDown />
                                    )}
                                </span>
                            </button>
                            {expandedIndex === index && (
                                <div className="p-4 bg-gray-50 text-[#4A5568]">
                                    {faq.answer}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

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
        </AuthenticatedLayout>
    );
};

export default FAQ;
