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

const displayNames = {
    'rfqs': 'RFQ Document',
    'quotations': 'Quotations Document',
    'goods_receiving_notes': 'Goods Receiving Notes Documents',
    'material_requests': 'MRs Documents',
    'invoices': 'Invoices Documents',
    'payment_orders': 'PMNTOs Documents'
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
    const [managedRoles, setManagedRoles] = useState([]);
    const [selectedRole, setSelectedRole] = useState(null);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch initial data when component mounts
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // Get current user's role
                const userResponse = await axios.get('/api/v1/user/current-role');
                console.log('Current user role:', userResponse.data); // Debug log
                setCurrentUserRole(userResponse.data.role);

                // Get all roles
                const rolesResponse = await axios.get('/api/v1/roles');
                console.log('All roles:', rolesResponse.data); // Debug log
                setRoles(rolesResponse.data.data);

                // Get manageable roles based on hierarchy
                const subordinatesResponse = await axios.get(`/api/v1/roles/${userResponse.data.role.id}/subordinates`);
                console.log('Subordinate roles:', subordinatesResponse.data); // Debug log
                setManagedRoles(subordinatesResponse.data.data);

                setLoading(false);
            } catch (error) {
                console.error("Failed to fetch initial data:", error);
                setLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    // Fetch role permissions when a role is selected
    useEffect(() => {
        if (selectedRole) {
            fetchRolePermissions(selectedRole);
        }
    }, [selectedRole]);

    const fetchRolePermissions = async (roleId) => {
        try {
            console.log('Fetching permissions for role:', roleId);
            const response = await axios.get(`/api/v1/roles/${roleId}/permissions`);
            console.log('Raw permissions:', response.data.data);
            const rolePermissions = response.data.data;
            
            const newPermissions = documentTypes.map((docType) => ({
                read: rolePermissions.some(p => p.name === `view_${docType.toLowerCase().replace(/\s+/g, '_')}`),
                create: rolePermissions.some(p => p.name === `create_${docType.toLowerCase().replace(/\s+/g, '_')}`),
                modify: rolePermissions.some(p => p.name === `edit_${docType.toLowerCase().replace(/\s+/g, '_')}`),
                delete: rolePermissions.some(p => p.name === `delete_${docType.toLowerCase().replace(/\s+/g, '_')}`)
            }));

            console.log('Mapped permissions:', newPermissions);
            setPermissions(newPermissions);
        } catch (error) {
            console.error("Failed to fetch role permissions:", error);
        }
    };

    const togglePermission = async (index, type) => {
        if (!selectedRole || !canManageRole(selectedRole)) return;

        try {
            const permissionMapping = {
                'read': 'view',
                'create': 'create',
                'modify': 'edit',
                'delete': 'delete'
            };

            const docType = documentTypes[index].toLowerCase().replace(/\s+/g, '_');
            const permissionName = `${permissionMapping[type]}_${docType}`;
            
            console.log('Toggling permission:', permissionName);
            
            const response = await axios.post(`/api/v1/roles/${selectedRole}/toggle-permission`, {
                permission: permissionName,
                value: !permissions[index][type]
            });

            if (response.data.data) {
                const newPermissions = [...permissions];
                newPermissions[index][type] = !permissions[index][type];
                setPermissions(newPermissions);
            }
        } catch (error) {
            console.error("Failed to toggle permission:", error);
        }
    };

    const canManageRole = (roleId) => {
        // Admin can manage all roles
        if (currentUserRole?.name === 'Admin') return true;
        
        // Other roles can manage their subordinates
        return managedRoles.some(role => role.id === parseInt(roleId));
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="w-full mx-auto p-4">
            <h2 className="text-2xl md:text-3xl font-bold text-[#2C323C]">
                Roles & Permissions
            </h2>
            <p className="text-lg md:text-xl text-[#7D8086]">
                Manage role permissions for different document types
            </p>

            {/* Role Selection */}
            <div className="mb-6">
                <select 
                    value={selectedRole || ''} 
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="mt-4 p-2 border rounded-md bg-white text-[#2C323C]"
                >
                    <option value="">Select a role</option>
                    {roles.map(role => (
                        <option 
                            key={role.id} 
                            value={role.id}
                            disabled={!canManageRole(role.id)}
                        >
                            {role.name} {!canManageRole(role.id) ? '(No access)' : ''}
                        </option>
                    ))}
                </select>
            </div>

            {/* CRUD Header */}
            <div className="bg-[#DCECF2] p-4 md:p-6 my-6 rounded-2xl grid grid-cols-2 md:grid-cols-5 items-center text-lg md:text-xl font-medium text-[#2C323C]">
                <span className="text-xl md:text-2xl font-bold">CRUD :</span>
                <span className="flex items-center justify-center">Read</span>
                <span className="flex items-center justify-center">Create</span>
                <span className="flex items-center justify-center">Modify</span>
                <span className="flex items-center justify-center">Delete</span>
            </div>

            {/* Document Types Header */}
            <div className="p-2 grid grid-cols-2 md:grid-cols-5 gap-4 items-center text-lg md:text-xl font-medium text-[#0086B9]">
                <span className="text-[#6E66AC] text-xl md:text-2xl">
                    Document Types
                </span>
                <span className="flex items-center justify-center">Turn On/Off</span>
                <span className="flex items-center justify-center">Turn On/Off</span>
                <span className="flex items-center justify-center">Turn On/Off</span>
                <span className="flex items-center justify-center">Turn On/Off</span>
            </div>

            {/* Document List */}
            <div className="bg-white p-4 mt-4 rounded-2xl shadow-md">
                {documentTypes.map((doc, index) => (
                    <div key={index} className="grid grid-cols-2 md:grid-cols-5 gap-4 items-center py-4">
                        <span className="text-lg md:text-xl font-medium text-[#000000]">
                            {doc}
                        </span>
                        {["read", "create", "modify", "delete"].map((type) => (
                            <label
                                key={type}
                                className={`flex items-center cursor-pointer justify-center ${
                                    !selectedRole || !canManageRole(selectedRole) ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={permissions[index][type]}
                                    onChange={() => togglePermission(index, type)}
                                    disabled={!selectedRole || !canManageRole(selectedRole)}
                                />
                                <div className={`w-14 h-7 flex items-center rounded-full border border-[#2C323C33] p-1 shadow-md transition duration-300`}>
                                    <div className={`w-5 h-5 rounded-full shadow-md transform transition duration-300 ${
                                        permissions[index][type] ? "translate-x-6 bg-[#009FDC]" : "bg-[#D7D8D9]"
                                    }`}></div>
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
