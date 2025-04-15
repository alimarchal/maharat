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
    RFQs: "rfqs",
    Quotations: "quotations",
    "Goods Receiving Notes": "goods_receiving_notes",
    "Material Requests": "material_requests",
    Invoices: "invoices",
    "Payment Orders": "payment_orders",
};

const displayNames = {
    rfqs: "RFQs",
    quotations: "Quotations",
    goods_receiving_notes: "Goods Receiving Notes",
    material_requests: "Material Requests",
    invoices: "Invoices",
    payment_orders: "Payment Orders",
};

const RolesPermissions = () => {
    const [permissions, setPermissions] = useState(
        documentTypes.map(() => ({
            read: false,
            create: false,
            modify: false,
            delete: false,
        }))
    );
    const [currentUserRole, setCurrentUserRole] = useState(null);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const userResponse = await axios.get(
                    "/api/v1/user/current-role"
                );
                setCurrentUserRole(userResponse.data.role);

                const usersResponse = await axios.get("/api/v1/users");
                setUsers(usersResponse.data.data);
                setLoading(false);
            } catch (error) {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (selectedUser) {
            fetchUserPermissions(selectedUser);
        }
    }, [selectedUser]);

    const fetchUserPermissions = async (userId) => {
        try {
            const response = await axios.get(`/api/v1/users/${userId}`);
            const userPermissions = response.data.data.permissions || [];

            const newPermissions = documentTypes.map((docType) => {
                const docTypeKey = documentTypeKeys[docType];
                return {
                    read: userPermissions.includes(`view_${docTypeKey}`),
                    create: userPermissions.includes(`create_${docTypeKey}`),
                    modify: userPermissions.includes(`edit_${docTypeKey}`),
                    delete: userPermissions.includes(`delete_${docTypeKey}`),
                };
            });
            setPermissions(newPermissions);
        } catch (error) {
            console.error("Failed to fetch user permissions:", error);
        }
    };

    const togglePermission = async (index, type) => {
        if (!selectedUser || !canManageUser(selectedUser)) return;
        try {
            const permissionMapping = {
                read: "view",
                create: "create",
                modify: "edit",
                delete: "delete",
            };

            const docType = documentTypes[index];
            const docTypeKey = documentTypeKeys[docType];
            const permissionName = `${permissionMapping[type]}_${docTypeKey}`;
            const currentValue = permissions[index][type];

            const newPermissions = [...permissions];
            newPermissions[index][type] = !currentValue;
            setPermissions(newPermissions);

            const response = await axios.post(
                `/api/v1/users/${selectedUser}/toggle-permission`,
                {
                    permission: permissionName,
                    value: !currentValue,
                }
            );

            if (response.data.success) {
                fetchUserPermissions(selectedUser);
            }
        } catch (error) {
            const newPermissions = [...permissions];
            newPermissions[index][type] = currentValue;
            setPermissions(newPermissions);
        }
    };

    const canManageUser = (userId) => {
        return currentUserRole?.name === "Admin";
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
                User Permissions
            </h2>
            <p className="text-lg md:text-xl text-[#7D8086]">
                Manage permissions for individual users
            </p>

            <div className="mb-6">
                <select
                    value={selectedUser || ""}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="mt-4 p-2 border rounded-md bg-white text-[#2C323C] w-1/3"
                >
                    <option value="">Select a user</option>
                    {users.map((user) => (
                        <option
                            key={user.id}
                            value={user.id}
                            disabled={!canManageUser(user.id)}
                        >
                            {user.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="bg-[#DCECF2] p-4 md:p-6 my-6 rounded-2xl grid grid-cols-2 md:grid-cols-5 items-center text-lg md:text-xl font-medium text-[#2C323C]">
                <span className="text-xl md:text-2xl font-bold">CRUD :</span>
                <span className="flex items-center justify-center">Read</span>
                <span className="flex items-center justify-center">Create</span>
                <span className="flex items-center justify-center">Modify</span>
                <span className="flex items-center justify-center">Delete</span>
            </div>

            <div className="p-2 grid grid-cols-2 md:grid-cols-5 gap-4 items-center text-lg md:text-xl font-medium text-[#0086B9]">
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
                <span className="flex items-center justify-center">
                    Turn On/Off
                </span>
            </div>

            <div className="bg-white p-4 mt-4 rounded-2xl shadow-md">
                {documentTypes.map((doc, index) => (
                    <div
                        key={index}
                        className="grid grid-cols-2 md:grid-cols-5 gap-4 items-center py-4"
                    >
                        <span className="text-lg md:text-xl font-medium text-[#000000]">
                            {doc}
                        </span>
                        {["read", "create", "modify", "delete"].map((type) => (
                            <label
                                key={type}
                                className={`flex items-center cursor-pointer justify-center ${
                                    !selectedUser ||
                                    !canManageUser(selectedUser)
                                        ? "opacity-50 cursor-not-allowed"
                                        : ""
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={permissions[index][type]}
                                    onChange={() =>
                                        togglePermission(index, type)
                                    }
                                    disabled={
                                        !selectedUser ||
                                        !canManageUser(selectedUser)
                                    }
                                />
                                <div
                                    className={`w-14 h-7 flex items-center rounded-full border border-[#2C323C33] p-1 shadow-md transition duration-300`}
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

export default RolesPermissions;
