import React, { useState, useEffect } from "react";
import axios from "axios";

const documentTypes = [
    "RFQ document",
    "Quotations document",
    "Goods Receiving Notes documents",
    "MRs documents",
    "Invoices documents",
    "PMNTOs documents",
];

const Notification = () => {
    const [permissions, setPermissions] = useState(
        documentTypes.map(() => ({
            systems: false,
            email: false,
            sms: false,
        }))
    );
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [toggleLoading, setToggleLoading] = useState({});

    // Fetch initial data when component mounts
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // Get current user
                const userResponse = await axios.get('/api/v1/user/current');
                console.log('Current user:', userResponse.data);
                setCurrentUser(userResponse.data.data);

                // Get user's notifications
                const notificationsResponse = await axios.get(`/api/v1/users/${userResponse.data.data.id}/notifications`, {
                    params: {
                        per_page: 100
                    }
                });
                console.log('Raw notifications:', notificationsResponse.data);

                // Map notifications to permissions
                const notifications = notificationsResponse.data.data || [];
                const newPermissions = documentTypes.map(docType => {
                    const docKey = docType.toLowerCase().replace(/\s+/g, '_');
                    
                    // Find notifications for this document type
                    const docNotifications = notifications.filter(n => 
                        n.data?.additional_data?.document_type === docKey
                    );
                    
                    // Check if there are enabled notifications for each channel
                    const systemsEnabled = docNotifications.some(n => 
                        n.data?.type === 'system_alert' && 
                        n.data?.additional_data?.enabled === true
                    );
                    
                    const emailEnabled = docNotifications.some(n => 
                        n.data?.type === 'email_notification' && 
                        n.data?.additional_data?.enabled === true
                    );
                    
                    const smsEnabled = docNotifications.some(n => 
                        n.data?.type === 'sms_notification' && 
                        n.data?.additional_data?.enabled === true
                    );
                    
                    return {
                        systems: systemsEnabled,
                        email: emailEnabled,
                        sms: smsEnabled
                    };
                });

                console.log('Mapped permissions:', newPermissions);
                setPermissions(newPermissions);
                setLoading(false);
            } catch (error) {
                console.error("Failed to fetch initial data:", error);
                setLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    const togglePermission = async (index, type) => {
        const toggleId = `${index}-${type}`;
        setToggleLoading(prev => ({ ...prev, [toggleId]: true }));
        
        try {
            const docType = documentTypes[index].toLowerCase().replace(/\s+/g, '_');
            const notificationType = type === 'systems' ? 'system_alert' : 
                                   type === 'email' ? 'email_notification' : 'sms_notification';

            // Get the new state
            const newEnabled = !permissions[index][type];

            // Update UI immediately for better UX
            const newPermissions = [...permissions];
            newPermissions[index][type] = newEnabled;
            setPermissions(newPermissions);

            // Check if a notification already exists for this document type and channel
            const existingNotifications = await axios.get(`/api/v1/users/${currentUser.id}/notifications`, {
                params: {
                    per_page: 100
                }
            });
            
            const existingNotification = existingNotifications.data.data.find(
                n => n.data?.type === notificationType && 
                n.data?.additional_data?.document_type === docType
            );
            
            let response;
            
            if (existingNotification) {
                // Update existing notification
                response = await axios.patch(`/api/v1/notifications/${existingNotification.id}`, {
                    data: {
                        ...existingNotification.data,
                        additional_data: {
                            ...existingNotification.data.additional_data,
                            enabled: newEnabled
                        }
                    }
                });
            } else {
                // Create new notification
                response = await axios.post('/api/v1/notifications', {
                    user_ids: [currentUser.id],
                    title: `${docType} Notification Setting`,
                    message: `${type} notifications ${newEnabled ? 'enabled' : 'disabled'} for ${documentTypes[index]}`,
                    type: notificationType,
                    data: {
                        document_type: docType,
                        enabled: newEnabled,
                        notification_channel: type
                    }
                });
            }

            console.log('Toggle response:', response.data);

            if (response.data.status !== 'success') {
                // Revert if not successful
                newPermissions[index][type] = !newEnabled;
                setPermissions(newPermissions);
                console.error('Failed to toggle notification:', response.data);
            }
        } catch (error) {
            console.error("Toggle error:", error.response?.data || error);
            // Revert on error
            const newPermissions = [...permissions];
            newPermissions[index][type] = !newPermissions[index][type];
            setPermissions(newPermissions);
        } finally {
            setToggleLoading(prev => ({ ...prev, [toggleId]: false }));
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#009FDC]"></div>
            </div>
        );
    }

    return (
        <div className="w-full mx-auto p-4">
            <h2 className="text-2xl md:text-3xl font-bold text-[#2C323C]">
                Notification Settings
            </h2>
            <p className="text-lg md:text-xl text-[#7D8086]">
                Allows where users will receive notifications
            </p>

            {/* Notification Header */}
            <div className="bg-[#DCECF2] p-4 md:p-6 my-6 rounded-2xl grid grid-cols-2 md:grid-cols-4 items-center text-lg md:text-xl font-medium text-[#2C323C]">
                <span className="text-xl md:text-2xl font-bold">
                    Notify via:
                </span>
                <span className="flex items-center justify-center">System</span>
                <span className="flex items-center justify-center">Email</span>
                <span className="flex items-center justify-center">SMS</span>
            </div>

            {/* Document Types Header */}
            <div className="p-2 grid grid-cols-2 md:grid-cols-4 gap-4 items-center text-lg md:text-xl font-medium text-[#0086B9]">
                <span className="text-[#6E66AC] text-xl md:text-2xl">
                    Document Types
                </span>
                <span className="flex items-center justify-center">
                    Turn On/Off
                </span>
                <span className="flex items-center justify-center">
                    Turn On/Off
                </span>
                <span className="flex items-center justify-center">
                    Turn On/Off
                </span>
            </div>

            {/* Document List */}
            <div className="bg-white p-4 mt-4 rounded-2xl shadow-md">
                {documentTypes.map((doc, index) => (
                    <div
                        key={index}
                        className="grid grid-cols-2 md:grid-cols-4 gap-4 items-center py-4"
                    >
                        <span className="text-lg md:text-xl font-medium text-[#000000]">
                            {doc}
                        </span>
                        {["systems", "email", "sms"].map((type) => (
                            <label
                                key={type}
                                className="flex items-center cursor-pointer justify-center"
                                onClick={(e) => {
                                    e.preventDefault(); // Prevent double-toggle
                                    togglePermission(index, type);
                                }}
                            >
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={permissions[index][type]}
                                    onChange={() => {}} // Empty onChange to avoid React warning
                                />
                                <div 
                                    className={`w-14 h-7 flex items-center rounded-full border border-[#2C323C33] p-1 shadow-md transition duration-300 ${
                                        permissions[index][type] ? "bg-[#E8F3FF]" : "bg-white"
                                    } ${toggleLoading[`${index}-${type}`] ? "opacity-50" : ""}`}
                                >
                                    <div 
                                        className={`w-5 h-5 rounded-full shadow-md transform transition duration-300 ${
                                            permissions[index][type] ? "translate-x-6 bg-[#009FDC]" : "bg-[#D7D8D9]"
                                        } ${toggleLoading[`${index}-${type}`] ? "animate-pulse" : ""}`}
                                    ></div>
                                </div>
                            </label>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Notification;
