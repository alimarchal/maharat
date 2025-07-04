import React, { useState, useEffect } from "react";
import axios from "axios";

const documentTypes = [
    "RFQs",
    "Quotations",
    "Goods Receiving Notes",
    "Material Requests",
    "Invoices",
    "Payment Orders",
];

const documentTypeKeys = {
    RFQs: "rfq_document",
    Quotations: "quotations_document",
    "Goods Receiving Notes": "goods_receiving_notes",
    "Material Requests": "mrs_documents",
    Invoices: "invoices_documents",
    "Payment Orders": "pmntos_documents",
};

const channelKeys = {
    systems: "system",
    email: "email",
    sms: "sms",
};

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
    const [notificationTypes, setNotificationTypes] = useState([]);
    const [notificationChannels, setNotificationChannels] = useState([]);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const userResponse = await axios.get("/api/v1/user/current");
                setCurrentUser(userResponse.data.data);

                const typesResponse = await axios.get(
                    "/api/v1/notification-types"
                );
                setNotificationTypes(typesResponse.data.data);

                const channelsResponse = await axios.get(
                    "/api/v1/notification-channels"
                );
                setNotificationChannels(channelsResponse.data.data);

                const settingsResponse = await axios.get(
                    `/api/v1/users/${userResponse.data.data.id}/notification-settings`
                );

                const settings = settingsResponse.data.settings || {};
                const newPermissions = documentTypes.map((docType) => {
                    const docKey = documentTypeKeys[docType];
                    const docSettings = settings[docKey] || {};

                    return {
                        systems: docSettings.system || false,
                        email: docSettings.email || false,
                        sms: docSettings.sms || false,
                    };
                });
                setPermissions(newPermissions);
                setLoading(false);
            } catch (error) {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    const togglePermission = async (index, type) => {
        const toggleId = `${index}-${type}`;
        setToggleLoading((prev) => ({ ...prev, [toggleId]: true }));

        try {
            const docType = documentTypes[index];
            const docTypeKey = documentTypeKeys[docType];
            const channelKey = channelKeys[type];

            const newEnabled = !permissions[index][type];

            const newPermissions = [...permissions];
            newPermissions[index][type] = newEnabled;
            setPermissions(newPermissions);

            const notificationType = notificationTypes.find(
                (t) => t.key === docTypeKey
            );
            const notificationChannel = notificationChannels.find(
                (c) => c.key === channelKey
            );

            if (!notificationType || !notificationChannel) {
                throw new Error(
                    `Notification type or channel not found for ${docTypeKey} and ${channelKey}`
                );
            }

            const response = await axios.put(
                `/api/v1/users/${currentUser.id}/notification-settings`,
                {
                    settings: [
                        {
                            type_id: notificationType.id,
                            channel_id: notificationChannel.id,
                            enabled: newEnabled,
                        },
                    ],
                }
            );

            if (
                response.data.message !==
                "Notification settings updated successfully"
            ) {
                newPermissions[index][type] = !newEnabled;
                setPermissions(newPermissions);
            }
        } catch (error) {
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
            <h2 className="text-2xl md:text-3xl font-bold text-[#2C323C]">
                Notification Settings
            </h2>
            <p className="text-lg md:text-xl text-[#7D8086]">
                Allows where users will receive notifications
            </p>

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
                                    e.preventDefault();
                                    togglePermission(index, type);
                                }}
                            >
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={permissions[index][type]}
                                    onChange={() => {}}
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
        </div>
    );
};

export default Notification;
