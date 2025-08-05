import React, { useState, useEffect } from "react";
import axios from "axios";

const processTypes = [
    "Material Request",
    "RFQ Approval", 
    "Purchase Order Approval",
    "Maharat Invoice Approval",
    "Payment Order Approval",
    "Budget Request Approval",
    "Total Budget Approval",
];

const processTypeKeys = {
    "Material Request": "material_request",
    "RFQ Approval": "rfq_approval",
    "Purchase Order Approval": "purchase_order_approval", 
    "Maharat Invoice Approval": "maharat_invoice_approval",
    "Payment Order Approval": "payment_order_approval",
    "Budget Request Approval": "budget_request_approval",
    "Total Budget Approval": "total_budget_approval",
};

const channelKeys = {
    systems: "system",
    email: "email",
    sms: "sms",
};

const Notification = () => {
    const [permissions, setPermissions] = useState(
        processTypes.map(() => ({
            systems: true, // Always ON, non-toggleable
            email: true,   // Default ON, toggleable
            sms: false,    // Always OFF, non-toggleable
        }))
    );
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [users, setUsers] = useState([]);
    const [toggleLoading, setToggleLoading] = useState({});
    const [notificationTypes, setNotificationTypes] = useState([]);
    const [notificationChannels, setNotificationChannels] = useState([]);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const userResponse = await axios.get("/api/v1/user/current");
                setCurrentUser(userResponse.data.data);
                setSelectedUser(userResponse.data.data);

                const [typesResponse, channelsResponse, usersResponse] = await Promise.all([
                    axios.get("/api/v1/notification-types"),
                    axios.get("/api/v1/notification-channels"),
                    axios.get("/api/v1/users?per_page=1000")
                ]);

                setNotificationTypes(typesResponse.data.data);
                setNotificationChannels(channelsResponse.data.data);
                setUsers(usersResponse.data.data);

                await loadUserNotificationSettings(userResponse.data.data.id);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching initial data:", error);
                setLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    const loadUserNotificationSettings = async (userId) => {
        try {
            const settingsResponse = await axios.get(
                `/api/v1/users/${userId}/notification-settings`
            );

            const settings = settingsResponse.data.settings || {};
            
            // Check if user has any notification settings
            const hasAnySettings = Object.keys(settings).length > 0;
            
            // If no settings exist, create default settings for all process types
            if (!hasAnySettings) {
                await createDefaultNotificationSettings(userId);
                
                // Reload settings after creating defaults
                const updatedSettingsResponse = await axios.get(
                    `/api/v1/users/${userId}/notification-settings`
                );
                const updatedSettings = updatedSettingsResponse.data.settings || {};
                
                const newPermissions = processTypes.map((processType) => {
                    const processKey = processTypeKeys[processType];
                    const processSettings = updatedSettings[processKey] || {};

                    return {
                        systems: true, // Always ON, non-toggleable
                        email: processSettings.email !== undefined ? processSettings.email : true,
                        sms: false, // Always OFF, non-toggleable
                    };
                });
                setPermissions(newPermissions);
            } else {
                const newPermissions = processTypes.map((processType) => {
                    const processKey = processTypeKeys[processType];
                    const processSettings = settings[processKey] || {};

                    return {
                        systems: true, // Always ON, non-toggleable
                        email: processSettings.email !== undefined ? processSettings.email : true,
                        sms: false, // Always OFF, non-toggleable
                    };
                });
                setPermissions(newPermissions);
            }
        } catch (error) {
            console.error("Error loading notification settings:", error);
        }
    };

    const createDefaultNotificationSettings = async (userId) => {
        try {
            // Use the correct API endpoint that exists
            await axios.post(`/api/v1/users/${userId}/notification-settings/setup-defaults`);
        } catch (error) {
            console.error("Error creating default notification settings:", error);
        }
    };

    const handleUserSelect = async (user) => {
        setSelectedUser(user);
        setDropdownOpen(false);
        if (user) {
            await loadUserNotificationSettings(user.id);
        }
    };

    const togglePermission = async (index, type) => {
        if (!selectedUser) return;
        
        // Prevent toggling system and SMS notifications
        if (type === 'systems' || type === 'sms') {
            return;
        }

        const toggleId = `${index}-${type}`;
        setToggleLoading((prev) => ({ ...prev, [toggleId]: true }));

        try {
            const processType = processTypes[index];
            const processTypeKey = processTypeKeys[processType];
            const channelKey = channelKeys[type];

            const newEnabled = !permissions[index][type];

            const newPermissions = [...permissions];
            newPermissions[index][type] = newEnabled;
            setPermissions(newPermissions);

            const notificationType = notificationTypes.find(
                (t) => t.key === processTypeKey
            );
            const notificationChannel = notificationChannels.find(
                (c) => c.key === channelKey
            );

            if (!notificationType || !notificationChannel) {
                throw new Error(
                    `Notification type or channel not found for ${processTypeKey} and ${channelKey}`
                );
            }

            // Use the correct PUT endpoint that accepts an array of settings
            const response = await axios.put(
                `/api/v1/users/${selectedUser.id}/notification-settings`,
                {
                    settings: [{
                        type_id: notificationType.id,
                        channel_id: notificationChannel.id,
                        enabled: newEnabled,
                    }]
                }
            );

            if (response.data.message !== "Notification settings updated successfully") {
                newPermissions[index][type] = !newEnabled;
                setPermissions(newPermissions);
            }
        } catch (error) {
            console.error("Error toggling permission:", error);
            const newPermissions = [...permissions];
            newPermissions[index][type] = !newPermissions[index][type];
            setPermissions(newPermissions);
        } finally {
            setToggleLoading((prev) => ({ ...prev, [toggleId]: false }));
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <div className="w-12 h-12 border-4 border-[#009FDC] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="w-full mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-[#2C323C]">
                        Notification Settings
                    </h2>
                    <p className="text-lg md:text-xl text-[#7D8086]">
                        Manage notification preferences for users
                    </p>
                </div>
                
                {/* User Selection Dropdown */}
                <div className="relative">
                    <button 
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="bg-white text-[#2C323C] border border-gray-300 px-6 py-3 rounded-lg text-lg font-medium hover:bg-gray-50 transition-colors duration-200 flex items-center gap-2 min-w-[200px] justify-between"
                    >
                        <span className="truncate">{selectedUser ? selectedUser.name : 'Select User'}</span>
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {dropdownOpen && (
                        <>
                            <div 
                                className="fixed inset-0 z-40" 
                                onClick={() => setDropdownOpen(false)}
                            />
                            <div className="absolute z-50 right-0 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                                {users.map((user) => (
                                    <button
                                        key={user.id}
                                        onClick={() => handleUserSelect(user)}
                                        className="w-full px-4 py-3 text-left text-sm leading-5 text-gray-700 transition duration-150 ease-in-out hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                                    >
                                        <span className="font-medium text-[#2C323C]">{user.name}</span>
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {selectedUser && (
                <>
                    <div className="bg-[#DCECF2] p-4 md:p-6 my-6 rounded-2xl grid grid-cols-2 md:grid-cols-4 items-center text-lg md:text-xl font-medium text-[#2C323C]">
                        <span className="text-xl md:text-2xl font-bold">
                            Notify via:
                        </span>
                        <span className="flex items-center justify-center">System</span>
                        <span className="flex items-center justify-center">Email</span>
                        <span className="flex items-center justify-center">SMS</span>
                    </div>

                    <div className="p-2 grid grid-cols-2 md:grid-cols-4 gap-4 items-center text-lg md:text-xl font-medium text-[#0086B9]">
                        <span className="text-[#6E66AC] text-xl md:text-2xl">
                            Process Types
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

                    <div className="bg-white p-4 mt-4 rounded-2xl shadow-md">
                        {processTypes.map((process, index) => (
                            <div
                                key={index}
                                className="grid grid-cols-2 md:grid-cols-4 gap-4 items-center py-4"
                            >
                                <span className="text-lg md:text-xl font-medium text-[#000000]">
                                    {process}
                                </span>
                                {["systems", "email", "sms"].map((type) => (
                                    <label
                                        key={type}
                                        className={`flex items-center justify-center ${
                                            type === 'systems' || type === 'sms' 
                                                ? 'cursor-not-allowed opacity-80' 
                                                : 'cursor-pointer'
                                        }`}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            if (type === 'systems' || type === 'sms') {
                                                return; // Prevent toggling
                                            }
                                            togglePermission(index, type);
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={permissions[index][type]}
                                            onChange={() => {}}
                                            disabled={type === 'systems' || type === 'sms'}
                                        />
                                        <div
                                            className={`w-14 h-7 flex items-center rounded-full border border-[#2C323C33] p-1 shadow-md transition duration-300 ${
                                                permissions[index][type]
                                                    ? "bg-[#E8F3FF]"
                                                    : "bg-white"
                                            } ${
                                                toggleLoading[`${index}-${type}`]
                                                    ? "opacity-50"
                                                    : ""
                                            } ${
                                                type === 'systems' || type === 'sms'
                                                    ? "opacity-80"
                                                    : ""
                                            }`}
                                        >
                                            <div
                                                className={`w-5 h-5 rounded-full shadow-md transform transition duration-300 ${
                                                    permissions[index][type]
                                                        ? "translate-x-6 bg-[#009FDC]"
                                                        : "bg-[#D7D8D9]"
                                                } ${
                                                    toggleLoading[`${index}-${type}`]
                                                        ? "animate-pulse"
                                                        : ""
                                                }`}
                                            ></div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default Notification;
