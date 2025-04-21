import React, { useState, useEffect } from "react";
import { Link, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeftLong, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";

export default function UserManual({ auth }) {
    const [userDesignation, setUserDesignation] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isManagingDirector, setIsManagingDirector] = useState(false);

    // Fetch user's designation from API
    useEffect(() => {
        const fetchUserDesignation = async () => {
            try {
                setIsLoading(true);
                
                // Get current user's designation_id from auth
                const designationId = auth.user?.designation_id;
                
                if (designationId) {
                    // Fetch designation details from API using the designation_id
                    const response = await axios.get(`/api/v1/designations/${designationId}`);
                    console.log("Full API response:", response.data);
                    
                    // From logs, the structure is: response.data.data.designation
                    let designationName;
                    
                    // Handle different possible API response structures
                    if (response.data.data && response.data.data.designation) {
                        // If response has data.data.designation structure
                        designationName = response.data.data.designation;
                    } else if (response.data.designation) {
                        // If response has data.designation structure
                        designationName = response.data.designation;
                    } else if (response.data.data) {
                        // If response has data.data structure (data might be the designation object)
                        designationName = response.data.data.designation || response.data.data;
                    } else if (typeof response.data === 'object' && response.data.designation) {
                        // Direct response.data has designation property
                        designationName = response.data.designation;
                    }
                    
                    // Check if we found a designation string or if it's an object with a designation property
                    if (typeof designationName === 'object' && designationName !== null) {
                        designationName = designationName.designation || designationName.name || JSON.stringify(designationName);
                    }
                    
                    console.log("Extracted designation:", designationName);
                    
                    if (designationName) {
                        setUserDesignation(designationName);
                        
                        // Check specifically for "Managing Director" designation (exact match)
                        const isManagingDir = designationName === "Managing Director";
                        console.log("Is Managing Director:", isManagingDir);
                        setIsManagingDirector(isManagingDir);
                    } else {
                        console.log("Could not find designation in API response:", response.data);
                        fallbackToAuthUser();
                    }
                } else {
                    console.log("No designation_id found for user");
                    fallbackToAuthUser();
                }
            } catch (error) {
                console.error("Error fetching designation:", error);
                fallbackToAuthUser();
            } finally {
                setIsLoading(false);
            }
        };
        
        // Fallback function if API fails
        const fallbackToAuthUser = () => {
            console.log("Falling back to auth user data for designation");
            
            // Try to get designation from auth user object
            if (auth.user) {
                // Check if designation is available directly in auth user
                if (auth.user.designation) {
                    // This is the case where user object already has designation relation loaded
                    const designationName = auth.user.designation.designation || 
                                           auth.user.designation.name || 
                                           auth.user.designation;
                    
                    console.log("Designation from auth fallback:", designationName);
                    
                    // Check specifically for "Managing Director" designation (exact match)
                    const isManagingDir = designationName === "Managing Director";
                    console.log("Is Managing Director:", isManagingDir);
                    setUserDesignation(designationName);
                    setIsManagingDirector(isManagingDir);
                } else {
                    console.log("No designation data available in auth user");
                    
                    // Since we know the designation from the logs, as a last resort, hardcode the check
                    // for designation_id = 1, which we know is "Managing Director" from the logs
                    if (auth.user.designation_id === 1) {
                        console.log("Using designation_id=1, setting to 'Managing Director'");
                        setUserDesignation("Managing Director");
                        setIsManagingDirector(true);
                    } else {
                        setUserDesignation(null);
                        setIsManagingDirector(false);
                    }
                }
            }
        };

        fetchUserDesignation();
    }, [auth.user]);

    // Define manual sections
    const manualSections = [
        {
            title: "Login Details",
            description: "How to Login Company Details?",
            imageUrl: "/images/manuals/login-details.png",
            route: "/user-manual/login-details"
        },
        {
            title: "Notification Settings",
            description: "How to manage notifications?",
            imageUrl: "/images/manuals/notification-settings.png",
            route: "/user-manual/notification-settings"
        },
        {
            title: "User Profile Settings",
            description: "How to edit user profile in settings?",
            imageUrl: "/images/manuals/user-profile.png",
            route: "/user-manual/user-profile"
        },
        {
            title: "Maharat Info Settings",
            description: "How to set Company profile?",
            imageUrl: "/images/manuals/company-info.png",
            route: "/user-manual/company-info"
        },
        {
            title: "Request",
            description: "How to create Request for Material?",
            imageUrl: "/images/manuals/request.png",
            route: "/user-manual/request"
        },
        {
            title: "Task Center",
            description: "How to check my task?",
            imageUrl: "/images/manuals/task-center.png",
            route: "/user-manual/task-center"
        },
        {
            title: "Procurement Center",
            description: "How to generate RFQ's for Quotation?",
            imageUrl: "/images/manuals/procurement.png",
            route: "/user-manual/procurement"
        },
        {
            title: "Finance Center",
            description: "How to manage Finance?",
            imageUrl: "/images/manuals/finance.png",
            route: "/user-manual/finance"
        },
        {
            title: "Warehouse",
            description: "How to create & manage warehouse?",
            imageUrl: "/images/manuals/warehouse.png",
            route: "/user-manual/warehouse"
        },
        {
            title: "Budget & Accounts",
            description: "How to create and add budget?",
            imageUrl: "/images/manuals/budget.png",
            route: "/user-manual/budget"
        },
        {
            title: "Reports & Statues",
            description: "How to manage reports?",
            imageUrl: "/images/manuals/reports.png",
            route: "/user-manual/reports"
        },
        {
            title: "Configuration Center",
            description: "How to manage configuration center?",
            imageUrl: "/images/manuals/configuration.png",
            route: "/user-manual/configuration"
        }
    ];

    // No longer filtering sections - all cards are visible to all users
    const filteredSections = manualSections;

    // Log debug info to console
    useEffect(() => {
        if (!isLoading) {
            console.log("User Manual Debug Info:");
            console.log("Current User:", auth.user?.name || "Unknown");
            console.log("User ID:", auth.user?.id || "Unknown");
            console.log("User designation_id:", auth.user?.designation_id || "Not set");
            console.log("User Designation:", userDesignation || "Unknown");
            console.log("Is Managing Director:", isManagingDirector);
            console.log("All cards are now visible to all designations");
            console.log("Total cards shown:", filteredSections.length);
        }
    }, [filteredSections, isLoading, userDesignation, isManagingDirector, auth.user]);

    // Group sections into rows of 3
    const rows = [];
    for (let i = 0; i < filteredSections.length; i += 3) {
        rows.push(filteredSections.slice(i, i + 3));
    }

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="User Manual" />
            
            <div className="min-h-screen p-6">
                {/* Back Button */}
                <div className="flex justify-between items-center mb-4">
                    <button
                        onClick={() => router.visit("/dashboard")}
                        className="flex items-center text-black text-2xl font-medium hover:text-gray-800 p-2"
                    >
                        <FontAwesomeIcon
                            icon={faArrowLeftLong}
                            className="mr-2 text-2xl"
                        />
                        Back
                    </button>
                </div>
                
                {/* Breadcrumbs */}
                <div className="flex items-center text-[#7D8086] text-lg font-medium space-x-2 mb-6">
                    <Link
                        href="/dashboard"
                        className="hover:text-[#009FDC] text-xl"
                    >
                        Dashboard
                    </Link>
                    <FontAwesomeIcon
                        icon={faChevronRight}
                        className="text-xl text-[#9B9DA2]"
                    />
                    <span className="text-[#009FDC] text-xl">User Manual</span>
                </div>

                {/* Heading and FAQ Button */}
                <div className="flex justify-between items-center mb-12">
                    <h2 className="text-[32px] font-bold text-[#2C323C]">
                        User Manual
                    </h2>
                    <Link
                        href="/faqs"
                        className="bg-[#009FDC] text-white px-7 py-3 rounded-full text-xl font-medium"
                    >
                        FAQ's
                    </Link>
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#009FDC]"></div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {rows.map((row, rowIndex) => (
                            <div key={rowIndex} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {row.map((section, sectionIndex) => (
                                    <Link 
                                        href={section.route} 
                                        key={sectionIndex}
                                        className="bg-white rounded-lg shadow-md p-6 transition-transform hover:translate-y-[-5px] hover:shadow-lg"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="text-xl font-medium text-gray-800 mb-2">{section.title}</h3>
                                                <p className="text-gray-600">{section.description}</p>
                                            </div>
                                            {section.imageUrl && (
                                                <div className="w-16 h-16 flex-shrink-0">
                                                    <img 
                                                        src={section.imageUrl} 
                                                        alt={section.title} 
                                                        className="w-full h-full object-contain"
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = "/images/placeholder.png";
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
} 