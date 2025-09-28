import React, { useState, useEffect } from "react";
import axios from "axios";
import SelectFloating from "@/Components/SelectFloating";

// Main cards with sub-options permission system - using actual database permissions
const permissionCategories = {
    "Requests": {
        base: "view_requests",
        description: "Request management system",
        subOptions: {
            "Request New Item": {
                base: "request_new_item",
                description: "Allow users to request new items"
            },
            "Make New Request": {
                base: "make_new_request", 
                description: "Allow users to create new requests"
            }
        }
    },
    "Task Center": {
        base: "view_tasks",
        description: "Task management and approval system",
        subOptions: {}
    },
    "Procurement Center": {
        base: "view_procurement",
        description: "Procurement management system",
        subOptions: {
            "RFQs": {
                base: "view_rfqs",
                description: "Request for Quotations management",
                subOptions: {
                    "Make New RFQ": {
                        base: "make_new_rfq",
                        description: "Create new Request for Quotations"
                    }
                }
            },
            "Quotations": {
                base: "view_quotations",
                description: "Quotation management with supplier addition",
                subOptions: {
                    "Add Supplier": {
                        base: "add_supplier",
                        description: "Add new suppliers to the system"
                    },
                    "Add New Quotation": {
                        base: "add_new_quotation",
                        description: "Create new quotations"
                    }
                }
            },
            "Purchase Orders": {
                base: "view_purchase_orders",
                description: "Purchase order management",
                subOptions: {
                    "Create New Purchase Order": {
                        base: "create_new_purchase_order",
                        description: "Create new purchase orders"
                    }
                }
            },
            "External Invoices": {
                base: "view_invoices",
                description: "External invoice management",
                subOptions: {
                    "Add Invoice": {
                        base: "add_invoice",
                        description: "Add new external invoices"
                    }
                }
            }
        }
    },
    "Finance Center": {
        base: "view_finance",
        description: "Financial management system",
        subOptions: {
            "Maharat Invoices": {
                base: "view_maharat_invoices",
                description: "Maharat invoice management with customer addition",
                subOptions: {
                    "Add Customers": {
                        base: "add_customers",
                        description: "Add new customers to the system"
                    },
                    "Create New Invoice": {
                        base: "create_new_invoice",
                        description: "Create new Maharat invoices"
                    }
                }
            },
            "Accounts": {
                base: "view_accounts",
                description: "General accounts management",
                subOptions: {
                    "Create New Account": {
                        base: "create_new_account",
                        description: "Create new accounts in the system"
                    }
                }
            },
            "Payment Orders": {
                base: "view_payment_orders",
                description: "Payment order management",
                subOptions: {
                    "Create Payment Order": {
                        base: "create_payment_order",
                        description: "Create new payment orders"
                    }
                }
            },
            "Account Receivables": {
                base: "view_account_receivables",
                description: "Account receivables management"
            },
            "Account Payables": {
                base: "view_account_payables",
                description: "Account payables management"
            }
        }
    },
    "Warehouse": {
        base: "view_warehouse",
        description: "Warehouse and inventory management",
        subOptions: {
            "User Material Requests": {
                base: "view_material_requests",
                description: "User material request management"
            },
            "Categories": {
                base: "view_categories",
                description: "Category management",
                subOptions: {
                    "Create New Category": {
                        base: "create_categories",
                        description: "Create new categories"
                    }
                }
            },
            "Items": {
                base: "view_items",
                description: "Item management",
                subOptions: {
                    "Create New Item": {
                        base: "create_items",
                        description: "Create new items"
                    }
                }
            },
            "Goods Receiving Notes": {
                base: "view_goods_receiving_notes",
                description: "Goods receiving notes management",
                subOptions: {
                    "Create Good Receiving Notes": {
                        base: "create_goods_receiving_notes",
                        description: "Create new goods receiving notes"
                    }
                }
            },
            "Inventory Tracking": {
                base: "view_inventory_tracking",
                description: "Inventory tracking and monitoring",
                subOptions: {
                    "Add Inventory": {
                        base: "add_inventory",
                        description: "Add new inventory items"
                    }
                }
            },
            "Create Warehouse": {
                base: "create_warehouse",
                description: "Create new warehouses"
            }
        }
    },
    "Budget & Accounts": {
        base: "view_budget",
        description: "Budget and accounting management",
        subOptions: {
            "Manage Budget": {
                base: "manage_budget",
                description: "Full budget management access"
            },
            "Approve Budget": {
                base: "approve_budget",
                description: "Budget approval authority"
            }
        }
    },
    "Status": {
        base: "view_statuses",
        description: "Status management and viewing",
        subOptions: {}
    },
    "Configuration Center": {
        base: "view_configuration",
        description: "System configuration management",
        subOptions: {
            "Process Flow": {
                base: "view_process_flow",
                description: "Process flow management and creation"
            },
            "Notification Settings": {
                base: "manage_settings",
                description: "Notification settings management"
            }
        }
    },
    "Sidebar": {
        base: "view_notifications",
        description: "Sidebar navigation and features",
        subOptions: {
            "Notification": {
                base: "view_notifications",
                description: "Notification access"
            },
            "Profile Settings": {
                base: "edit_profile",
                description: "Profile settings access"
            },
            "User Manual": {
                base: "view_user_manual",
                description: "User manual with creation, editing, and deletion capabilities",
                subFeatures: {
                    "Create Manual": "create_user_manual",
                    "Edit Manual": "edit_user_manual",
                    "Delete Manual": "delete_user_manual"
                }
            },
            "FAQs": {
                base: "view_faqs",
                description: "FAQs with full CRUD capabilities",
                subFeatures: {
                    "Create FAQ": "create_faqs",
                    "View FAQ": "view_faqs",
                    "Edit FAQ": "edit_faqs",
                    "Delete FAQ": "delete_faqs"
                }
            }
        }
    }
};

const RolesPermissions = () => {
    const [permissions, setPermissions] = useState({});
    const [currentUserRole, setCurrentUserRole] = useState(null);
    const [roles, setRoles] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedRole, setSelectedRole] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [permissionMode, setPermissionMode] = useState("role"); // "role" or "user"

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [userResponse, rolesResponse, usersResponse] = await Promise.all([
                    axios.get("/api/v1/user/current-role"),
                    axios.get("/api/v1/roles"),
                    axios.get("/api/v1/users?per_page=1000000000")
                ]);
                
                setCurrentUserRole(userResponse.data.role);
                setRoles(rolesResponse.data.data);
                setUsers(usersResponse.data.data);
                
                // Set Admin role as default selected role (or first role if Admin doesn't exist)
                const adminRole = rolesResponse.data.data.find(role => role.name === "Admin");
                const defaultRole = adminRole || rolesResponse.data.data[0];
                setSelectedRole(defaultRole);
                
                // Load default role's permissions
                if (defaultRole) {
                    await fetchRolePermissions(defaultRole.id);
                }
                
                setLoading(false);
            } catch (error) {
                console.error("Failed to fetch initial data:", error);
                setLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    useEffect(() => {
        if (selectedRole && permissionMode === "role") {
            fetchRolePermissions(selectedRole.id);
        }
    }, [selectedRole, permissionMode]);

    useEffect(() => {
        if (selectedUser && permissionMode === "user") {
            fetchCombinedUserPermissions(selectedUser.id);
        }
    }, [selectedUser, permissionMode]);

    const fetchRolePermissions = async (roleId) => {
        try {
            const response = await axios.get(`/api/v1/roles/${roleId}/permissions`);
            const rolePermissions = response.data.data || [];
            const permissionNames = rolePermissions.map(perm => perm.name);
            
            const newPermissions = {};
            Object.keys(permissionCategories).forEach(category => {
                const categoryConfig = permissionCategories[category];
                newPermissions[category] = {
                    main: permissionNames.includes(categoryConfig.base),
                    subOptions: {}
                };
                
                // Check sub-options
                Object.keys(categoryConfig.subOptions).forEach(subOption => {
                    const subOptionConfig = categoryConfig.subOptions[subOption];
                    newPermissions[category].subOptions[subOption] = {
                        enabled: permissionNames.includes(subOptionConfig.base),
                        subOptions: {}
                    };
                    
                    // Check nested sub-options if they exist
                    if (subOptionConfig.subOptions) {
                        Object.keys(subOptionConfig.subOptions).forEach(nestedSubOption => {
                            const nestedSubOptionConfig = subOptionConfig.subOptions[nestedSubOption];
                            newPermissions[category].subOptions[subOption].subOptions[nestedSubOption] = {
                                enabled: permissionNames.includes(nestedSubOptionConfig.base)
                            };
                        });
                    }
                });
            });
            setPermissions(newPermissions);
        } catch (error) {
            console.error("Failed to fetch role permissions:", error);
        }
    };

    const fetchUserPermissions = async (userId) => {
        try {
            const response = await axios.get(`/api/v1/users/${userId}/permissions`);
            const userPermissions = response.data.data || [];
            const permissionNames = userPermissions.map(perm => perm.name);
            
            const newPermissions = {};
            Object.keys(permissionCategories).forEach(category => {
                const categoryConfig = permissionCategories[category];
                newPermissions[category] = {
                    main: permissionNames.includes(categoryConfig.base),
                    subOptions: {}
                };
                
                // Check sub-options
                Object.keys(categoryConfig.subOptions).forEach(subOption => {
                    const subOptionConfig = categoryConfig.subOptions[subOption];
                    newPermissions[category].subOptions[subOption] = {
                        enabled: permissionNames.includes(subOptionConfig.base),
                        subOptions: {}
                    };
                    
                    // Check nested sub-options if they exist
                    if (subOptionConfig.subOptions) {
                        Object.keys(subOptionConfig.subOptions).forEach(nestedSubOption => {
                            const nestedSubOptionConfig = subOptionConfig.subOptions[nestedSubOption];
                            newPermissions[category].subOptions[subOption].subOptions[nestedSubOption] = {
                                enabled: permissionNames.includes(nestedSubOptionConfig.base)
                            };
                        });
                    }
                });
            });
            setPermissions(newPermissions);
        } catch (error) {
            console.error("Failed to fetch user permissions:", error);
        }
    };

    const fetchCombinedUserPermissions = async (userId) => {
        try {
            console.log('🔍 Fetching combined permissions for user:', userId);
            const response = await axios.get(`/api/v1/users/${userId}/combined-permissions`);
            console.log('📥 Combined permissions response:', response.data);
            console.log('📊 Permissions data:', response.data.data);
            setPermissions(response.data.data || {});
        } catch (error) {
            console.error("❌ Failed to fetch combined user permissions:", error);
        }
    };

    const togglePermission = async (category, subOption = null, nestedSubOption = null) => {
        const categoryConfig = permissionCategories[category];
        const isMainCard = subOption === null;
        const isNestedSubOption = nestedSubOption !== null;
        
        if (isMainCard) {
            // Toggle main card
            const currentValue = permissions[category]?.main || false;
            const newValue = !currentValue;
            console.log('🔄 Toggling main card:', { category, currentValue, newValue, permissionMode });
            
            if (permissionMode === "role") {
                if (!selectedRole || !canManageRole(selectedRole)) return;
                
                try {
                    // Update UI immediately
                    const newPermissions = { ...permissions };
                    if (!newPermissions[category]) newPermissions[category] = { main: false, subOptions: {} };
                    newPermissions[category].main = newValue;
                    
                    setPermissions(newPermissions);

                    // Toggle main permission only
                    const permissionsToToggle = [{ permission: categoryConfig.base, value: newValue }];

                    // Handle special cases for linked permissions
                    if (categoryConfig.base === 'notification_settings') {
                        permissionsToToggle.push({ permission: 'sidebar_notification', value: newValue });
                    } else if (categoryConfig.base === 'sidebar') {
                        permissionsToToggle.push({ permission: 'notification_settings', value: newValue });
                    }

                    // Toggle all permissions
                    const promises = permissionsToToggle.map(({ permission, value }) =>
                        axios.post(`/api/v1/roles/${selectedRole.id}/toggle-permission`, {
                            permission,
                            value,
                        })
                    );

                    const results = await Promise.all(promises);
                    const allSuccessful = results.every(result => result.data.message === 'Permission toggled successfully');

                    if (!allSuccessful) {
                        console.log('❌ Some API calls failed, reverting...');
                        // Revert on failure
                        fetchRolePermissions(selectedRole.id);
                    }
                } catch (error) {
                    console.error("Failed to toggle role permission:", error);
                    // Revert on error
                    fetchRolePermissions(selectedRole.id);
                }
            } else {
        if (!selectedUser || !canManageUser(selectedUser)) return;
                
                try {
                    // Update UI immediately
                    const newPermissions = { ...permissions };
                    if (!newPermissions[category]) newPermissions[category] = { main: false, subOptions: {} };
                    newPermissions[category].main = newValue;
                    
                    setPermissions(newPermissions);

                    // Toggle main permission only
                    const permissionsToToggle = [{ permission: categoryConfig.base, value: newValue }];

                    // Handle special cases for linked permissions
                    if (categoryConfig.base === 'notification_settings') {
                        permissionsToToggle.push({ permission: 'sidebar_notification', value: newValue });
                    } else if (categoryConfig.base === 'sidebar') {
                        permissionsToToggle.push({ permission: 'notification_settings', value: newValue });
                    }

                    // Toggle all permissions
                    const promises = permissionsToToggle.map(({ permission, value }) =>
                        axios.post(`/api/v1/users/${selectedUser.id}/toggle-permission`, {
                            permission,
                            value,
                        })
                    );

                    const results = await Promise.all(promises);
                    console.log('📥 API responses:', results);
                    const allSuccessful = results.every(result => result.data.success === true);
                    console.log('✅ All successful:', allSuccessful);

                    if (!allSuccessful) {
                        console.log('❌ Some API calls failed, reverting...');
                        // Revert on failure
                        fetchCombinedUserPermissions(selectedUser.id);
                    }
                } catch (error) {
                    console.error("Failed to toggle user permission:", error);
                    // Revert on error
                    fetchCombinedUserPermissions(selectedUser.id);
                }
            }
        } else if (!isNestedSubOption) {
            // Toggle sub-option
            const currentValue = permissions[category]?.subOptions?.[subOption]?.enabled || false;
            const newValue = !currentValue;
            
            if (permissionMode === "role") {
                if (!selectedRole || !canManageRole(selectedRole)) return;
                
                try {
                    // Update UI immediately
                    const newPermissions = { ...permissions };
                    if (!newPermissions[category]) newPermissions[category] = { main: false, subOptions: {} };
                    if (!newPermissions[category].subOptions) newPermissions[category].subOptions = {};
                    if (!newPermissions[category].subOptions[subOption]) newPermissions[category].subOptions[subOption] = { enabled: false };
                    newPermissions[category].subOptions[subOption].enabled = newValue;
                    
                    
                    setPermissions(newPermissions);

                    // Toggle sub-option permission
                    const permissionsToToggle = [{ 
                        permission: categoryConfig.subOptions[subOption].base, 
                        value: newValue 
                    }];
                    

                    // Handle special cases for linked permissions
                    if (categoryConfig.subOptions[subOption].base === 'sidebar_notification') {
                        permissionsToToggle.push({ permission: 'notification_settings', value: newValue });
                    } else if (categoryConfig.subOptions[subOption].base === 'notification_settings') {
                        permissionsToToggle.push({ permission: 'sidebar_notification', value: newValue });
                    }

                    // Toggle all permissions
                    const promises = permissionsToToggle.map(({ permission, value }) =>
                        axios.post(`/api/v1/roles/${selectedRole.id}/toggle-permission`, {
                            permission,
                            value,
                        })
                    );

                    const results = await Promise.all(promises);
                    const allSuccessful = results.every(result => result.data.message === 'Permission toggled successfully');

                    if (!allSuccessful) {
                        console.log('❌ Some API calls failed, reverting...');
                        // Revert on failure
                        fetchRolePermissions(selectedRole.id);
                    }
                } catch (error) {
                    console.error("Failed to toggle role permission:", error);
                    // Revert on error
                    fetchRolePermissions(selectedRole.id);
                }
            } else {
                if (!selectedUser || !canManageUser(selectedUser)) return;
                
                try {
                    // Update UI immediately
                    const newPermissions = { ...permissions };
                    if (!newPermissions[category]) newPermissions[category] = { main: false, subOptions: {} };
                    if (!newPermissions[category].subOptions) newPermissions[category].subOptions = {};
                    if (!newPermissions[category].subOptions[subOption]) newPermissions[category].subOptions[subOption] = { enabled: false };
                    newPermissions[category].subOptions[subOption].enabled = newValue;
                    
                    
                    setPermissions(newPermissions);

                    // Toggle sub-option permission
                    const permissionsToToggle = [{ 
                        permission: categoryConfig.subOptions[subOption].base, 
                        value: newValue 
                    }];
                    

                    // Handle special cases for linked permissions
                    if (categoryConfig.subOptions[subOption].base === 'sidebar_notification') {
                        permissionsToToggle.push({ permission: 'notification_settings', value: newValue });
                    } else if (categoryConfig.subOptions[subOption].base === 'notification_settings') {
                        permissionsToToggle.push({ permission: 'sidebar_notification', value: newValue });
                    }

                    // Toggle all permissions
                    const promises = permissionsToToggle.map(({ permission, value }) =>
                        axios.post(`/api/v1/users/${selectedUser.id}/toggle-permission`, {
                            permission,
                            value,
                        })
                    );

                    const results = await Promise.all(promises);
                    console.log('📥 API responses:', results);
                    const allSuccessful = results.every(result => result.data.success === true);
                    console.log('✅ All successful:', allSuccessful);

                    if (!allSuccessful) {
                        console.log('❌ Some API calls failed, reverting...');
                        // Revert on failure
                        fetchCombinedUserPermissions(selectedUser.id);
                    }
                } catch (error) {
                    console.error("Failed to toggle user permission:", error);
                    // Revert on error
                    fetchCombinedUserPermissions(selectedUser.id);
                }
            }
        } else if (isNestedSubOption) {
            // Toggle nested sub-option
            const currentValue = permissions[category]?.subOptions?.[subOption]?.subOptions?.[nestedSubOption]?.enabled || false;
            const newValue = !currentValue;
            
            if (permissionMode === "role") {
                if (!selectedRole || !canManageRole(selectedRole)) return;
                
                try {
                    // Update UI immediately
                    const newPermissions = { ...permissions };
                    if (!newPermissions[category]) newPermissions[category] = { main: false, subOptions: {} };
                    if (!newPermissions[category].subOptions) newPermissions[category].subOptions = {};
                    if (!newPermissions[category].subOptions[subOption]) newPermissions[category].subOptions[subOption] = { enabled: false, subOptions: {} };
                    if (!newPermissions[category].subOptions[subOption].subOptions) newPermissions[category].subOptions[subOption].subOptions = {};
                    if (!newPermissions[category].subOptions[subOption].subOptions[nestedSubOption]) newPermissions[category].subOptions[subOption].subOptions[nestedSubOption] = { enabled: false };
                    newPermissions[category].subOptions[subOption].subOptions[nestedSubOption].enabled = newValue;
                    
                    
                    setPermissions(newPermissions);

                    // Toggle nested sub-option permission
                    const permissionsToToggle = [{ 
                        permission: categoryConfig.subOptions[subOption].subOptions[nestedSubOption].base, 
                        value: newValue 
                    }];
                    

                    // Toggle all permissions
                    const promises = permissionsToToggle.map(({ permission, value }) =>
                        axios.post(`/api/v1/roles/${selectedRole.id}/toggle-permission`, {
                            permission,
                            value,
                        })
                    );

                    const results = await Promise.all(promises);
                    const allSuccessful = results.every(result => result.data.message === 'Permission toggled successfully');

                    if (!allSuccessful) {
                        fetchRolePermissions(selectedRole.id);
                    }
                } catch (error) {
                    console.error("Failed to toggle role permission:", error);
                    fetchRolePermissions(selectedRole.id);
                }
            } else {
                if (!selectedUser || !canManageUser(selectedUser)) return;
                
                try {
                    // Update UI immediately
                    const newPermissions = { ...permissions };
                    if (!newPermissions[category]) newPermissions[category] = { main: false, subOptions: {} };
                    if (!newPermissions[category].subOptions) newPermissions[category].subOptions = {};
                    if (!newPermissions[category].subOptions[subOption]) newPermissions[category].subOptions[subOption] = { enabled: false, subOptions: {} };
                    if (!newPermissions[category].subOptions[subOption].subOptions) newPermissions[category].subOptions[subOption].subOptions = {};
                    if (!newPermissions[category].subOptions[subOption].subOptions[nestedSubOption]) newPermissions[category].subOptions[subOption].subOptions[nestedSubOption] = { enabled: false };
                    newPermissions[category].subOptions[subOption].subOptions[nestedSubOption].enabled = newValue;
                    
                    
                    setPermissions(newPermissions);

                    // Toggle nested sub-option permission
                    const permissionsToToggle = [{ 
                        permission: categoryConfig.subOptions[subOption].subOptions[nestedSubOption].base, 
                        value: newValue 
                    }];
                    

                    // Toggle all permissions
                    const promises = permissionsToToggle.map(({ permission, value }) =>
                        axios.post(`/api/v1/users/${selectedUser.id}/toggle-permission`, {
                            permission,
                            value,
                        })
                    );

                    const results = await Promise.all(promises);
                    console.log('📥 API responses:', results);
                    const allSuccessful = results.every(result => result.data.success === true);
                    console.log('✅ All successful:', allSuccessful);

                    if (!allSuccessful) {
                        fetchCombinedUserPermissions(selectedUser.id);
                    }
                } catch (error) {
                    console.error("Failed to toggle user permission:", error);
                    fetchCombinedUserPermissions(selectedUser.id);
                }
            }
        }
    };

    const canManageRole = (role) => {
        return currentUserRole?.name === "Admin" || currentUserRole?.name === "Managing Director";
    };

    const canManageUser = (user) => {
        return currentUserRole?.name === "Admin" || currentUserRole?.name === "Managing Director";
    };

    if (loading) {
        return (
            <div className="w-full">
                <div className="flex justify-center items-center h-64">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-[#009FDC] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-[#7D8086]">Loading permissions...</p>
                    </div>
                </div>
            </div>
        );
    }

    const handleApproverChange = (value) => {
        if (value.startsWith("role-")) {
            const roleId = parseInt(value.replace("role-", ""), 10);
            const role = roles.find(r => r.id === roleId);
            setSelectedRole(role);
            setSelectedUser(null);
            setPermissionMode("role");
            if (role) {
                fetchRolePermissions(role.id);
            }
        } else if (value.startsWith("user-")) {
            const userId = parseInt(value.replace("user-", ""), 10);
            const user = users.find(u => u.id === userId);
            setSelectedUser(user);
            setSelectedRole(null);
            setPermissionMode("user");
            if (user) {
                fetchUserPermissions(user.id);
            }
        } else {
            setSelectedRole(null);
            setSelectedUser(null);
            setPermissions({});
        }
    };

    return (
        <div className="flex flex-col items-center">
            <div className="w-full">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                    <div className="mb-4 md:mb-0">
                        <h2 className="text-3xl font-bold text-[#2C323C]">
                            Roles & Permissions Management
                    </h2>
                        <p className="text-[#7D8086] text-xl">
                            Manage permissions for roles and individual users
                    </p>
                </div>
                    <div className="flex flex-col gap-4 w-full md:w-2/5">
                        <SelectFloating
                            label="Select Role or User"
                            name="approver"
                            value={
                                selectedRole
                                    ? `role-${selectedRole.id}`
                                    : selectedUser
                                    ? `user-${selectedUser.id}`
                                    : ""
                            }
                            onChange={(e) => handleApproverChange(e.target.value)}
                            options={[
                                ...(roles.length > 0 ? [{
                                    id: "roles-separator",
                                    label: "ROLES",
                                    disabled: true,
                                    isSeparator: true,
                                    className: "border-t border-gray-300 my-1 py-1 text-center text-gray-500 text-sm font-medium"
                                }] : []),
                                ...roles
                                    .sort((a, b) => a.name.localeCompare(b.name))
                                    .map((role) => ({
                                        id: `role-${role.id}`,
                                        label: role.name,
                                    })),
                                ...(roles.length > 0 && users.length > 0 ? [{
                                    id: "separator-divider",
                                    label: "USERS (Override)",
                                    disabled: true,
                                    isSeparator: true,
                                    className: "border-t border-gray-300 my-1 py-1 text-center text-gray-500 text-sm font-medium"
                                }] : []),
                                ...users
                                    .filter(user => ![2, 3, 4].includes(user.id))
                                    .sort((a, b) => a.name.localeCompare(b.name))
                                    .map((user) => ({
                                        id: `user-${user.id}`,
                                        label: user.name,
                                    })),
                            ]}
                            className="w-full"
                        />
                    </div>
                </div>

                {/* Current Selection Info */}
                {(selectedRole || selectedUser) && (
                    <div className="bg-[#DCECF2] p-4 md:p-6 my-6 rounded-2xl">
                        <div className="flex flex-col sm:flex-row gap-4 items-center">
                            <div className="flex items-center gap-2">
                                <span className="text-lg font-medium text-[#2C323C]">Currently Managing:</span>
                                <span className="text-lg font-medium text-[#2C323C]">
                                    {permissionMode === "role" ? selectedRole?.name : selectedUser?.name}
                                </span>
                            </div>
                            {permissionMode === "user" && (
                                <div className="text-sm text-[#7D8086]">
                                    User permissions override role permissions
                                </div>
                    )}
                </div>
                    </div>
                )}

                {/* Permission Categories */}
                {Object.keys(permissionCategories).map((category) => {
                    const categoryConfig = permissionCategories[category];
                    const mainEnabled = permissions[category]?.main || false;
                    const canEdit = permissionMode === "role" 
                        ? canManageRole(selectedRole) 
                        : canManageUser(selectedUser);
                    
                    return (
                        <div key={category} className="mb-8">
                            {/* Main Card */}
                            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200 hover:shadow-lg transition-shadow mb-4">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-[#2C323C] mb-2">
                                            {category}
                                        </h3>
                                        <p className="text-sm text-[#7D8086]">
                                            {categoryConfig.description}
                                        </p>
                    </div>
                                    <label
                                        className={`flex items-center cursor-pointer ${
                                            !canEdit ? "opacity-50 cursor-not-allowed" : ""
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={mainEnabled}
                                            onChange={() => togglePermission(category)}
                                            disabled={!canEdit}
                                        />
                                        <div
                                            className={`w-14 h-7 flex items-center rounded-full border border-[#2C323C33] p-1 shadow-md transition duration-300 ${
                                                mainEnabled ? "bg-[#009FDC]" : "bg-[#D7D8D9]"
                                            }`}
                                        >
                                            <div
                                                className={`w-5 h-5 rounded-full shadow-md transform transition duration-300 ${
                                                    mainEnabled
                                                        ? "translate-x-7 bg-white"
                                                        : "bg-white"
                                                }`}
                                            ></div>
                                        </div>
                                    </label>
                                </div>
                                
                                {/* Sub-options - only show if main card is enabled */}
                                {mainEnabled && Object.keys(categoryConfig.subOptions).length > 0 && (
                                    <div className="border-t border-gray-200 pt-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {Object.keys(categoryConfig.subOptions).map((subOption) => {
                                                const subOptionConfig = categoryConfig.subOptions[subOption];
                                                const subEnabled = permissions[category]?.subOptions?.[subOption]?.enabled || false;
                                                const subFeatures = subOptionConfig.subFeatures || {};
                                                
                                                return (
                                                    <div key={subOption} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <h4 className="text-sm font-semibold text-[#2C323C]">
                                                                {subOption}
                                                            </h4>
                                                            <label
                                                                className={`flex items-center cursor-pointer ${
                                                                    !canEdit ? "opacity-50 cursor-not-allowed" : ""
                                                                }`}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    className="hidden"
                                                                    checked={subEnabled}
                                                                    onChange={() => togglePermission(category, subOption)}
                                                                    disabled={!canEdit}
                                                                />
                                                                <div
                                                                    className={`w-10 h-5 flex items-center rounded-full border border-[#2C323C33] p-0.5 shadow-md transition duration-300 ${
                                                                        subEnabled ? "bg-[#28a745]" : "bg-[#D7D8D9]"
                                                                    }`}
                                                                >
                                                                    <div
                                                                        className={`w-4 h-4 rounded-full shadow-md transform transition duration-300 ${
                                                                            subEnabled
                                                                                ? "translate-x-5 bg-white"
                                                                                : "bg-white"
                                                                        }`}
                                                                    ></div>
                                                                </div>
                                                            </label>
                                                        </div>
                                                        <p className="text-xs text-[#7D8086] mb-2">
                                                            {subOptionConfig.description}
                                                        </p>
                                                        
                                                        {/* Nested sub-options - only show if sub-option is enabled */}
                                                        {subEnabled && subOptionConfig.subOptions && Object.keys(subOptionConfig.subOptions).length > 0 && (
                                                            <div className="mt-2 pt-2 border-t border-gray-300">
                                                                <div className="text-xs font-medium text-[#555] mb-1">
                                                                    Features:
                                                                </div>
                                                                <div className="space-y-1">
                                                                    {Object.keys(subOptionConfig.subOptions).map((nestedSubOption) => {
                                                                        const nestedSubOptionConfig = subOptionConfig.subOptions[nestedSubOption];
                                                                        const nestedEnabled = permissions[category]?.subOptions?.[subOption]?.subOptions?.[nestedSubOption]?.enabled || false;
                                                                        return (
                                                                            <div key={nestedSubOption} className="flex items-center justify-between">
                                                                                <span className="text-xs text-[#666]">
                                                                                    {nestedSubOption}
                                                                                </span>
                                                                                <label className="flex items-center cursor-pointer">
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        className="sr-only"
                                                                                        checked={nestedEnabled}
                                                                                        onChange={() => togglePermission(category, subOption, nestedSubOption)}
                                                                                        disabled={!canEdit}
                                                                                    />
                                                                                    <div
                                                                                        className={`w-6 h-3 rounded-full border border-[#2C323C33] p-0.5 shadow-sm transition duration-300 ${
                                                                                            nestedEnabled ? "bg-[#28a745]" : "bg-[#D7D8D9]"
                                                                                        }`}
                                                                                    >
                                                                                        <div
                                                                                            className={`w-2 h-2 rounded-full shadow-sm transform transition duration-300 ${
                                                                                                nestedEnabled
                                                                                                    ? "translate-x-3 bg-white"
                                                                                                    : "bg-white"
                                                                                            }`}
                                                                                        ></div>
                                                                                    </div>
                                                                                </label>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                    </div>
        </div>
    );
};

export default RolesPermissions;