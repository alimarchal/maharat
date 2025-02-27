import React, { useState } from "react";
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

    const togglePermission = async (index, type) => {
        const newPermissions = [...permissions];
        newPermissions[index][type] = !newPermissions[index][type];
        setPermissions(newPermissions);

        // try {
        //     await axios.post("/api/v1/notifications", {
        //         document: documentTypes[index],
        //         permissionType: type,
        //         status: newPermissions[index][type],
        //     });
        //     console.log("API call successful");
        // } catch (error) {
        //     console.error("API call failed:", error);
        // }
    };

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
                            >
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={permissions[index][type]}
                                    onChange={() =>
                                        togglePermission(index, type)
                                    }
                                />
                                <div
                                    className={`w-14 h-7 flex items-center rounded-full border border-[#2C323C33] p-1 shadow-md transition duration-300 ${
                                        permissions[index][type]
                                            ? "bg-white"
                                            : "bg-white"
                                    }`}
                                >
                                    <div
                                        className={`w-5 h-5 rounded-full shadow-md transform transition duration-300 ${
                                            permissions[index][type]
                                                ? "translate-x-6 bg-[#009FDC]"
                                                : "bg-[#D7D8D9]"
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
