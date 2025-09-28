// Permission utility functions for React components

/**
 * Check if user has a specific permission
 * @param {Array} userPermissions - Array of user permissions
 * @param {string} permission - Permission to check
 * @returns {boolean}
 */
export const hasPermission = (userPermissions, permission) => {
    if (!userPermissions || !Array.isArray(userPermissions)) {
        return false;
    }
    return userPermissions.includes(permission);
};

/**
 * Check if user has any of the given permissions
 * @param {Array} userPermissions - Array of user permissions
 * @param {Array} permissions - Array of permissions to check
 * @returns {boolean}
 */
export const hasAnyPermission = (userPermissions, permissions) => {
    if (!userPermissions || !Array.isArray(userPermissions)) {
        return false;
    }
    return permissions.some(permission => userPermissions.includes(permission));
};

/**
 * Check if user has all of the given permissions
 * @param {Array} userPermissions - Array of user permissions
 * @param {Array} permissions - Array of permissions to check
 * @returns {boolean}
 */
export const hasAllPermissions = (userPermissions, permissions) => {
    if (!userPermissions || !Array.isArray(userPermissions)) {
        return false;
    }
    return permissions.every(permission => userPermissions.includes(permission));
};

/**
 * Permission mapping for easy access - using actual database permissions
 */
export const PERMISSIONS = {
    // Main Cards (using actual database permissions)
    REQUESTS: 'requests',
    TASK_CENTER: 'view_tasks',
    PROCUREMENT_CENTER: 'view_procurement',
    FINANCE_CENTER: 'view_finance',
    WAREHOUSE: 'view_warehouse',
    BUDGET_ACCOUNTS: 'view_budget',
    REPORTS: 'view_reports',
    CONFIGURATION_CENTER: 'view_configuration',
    SIDEBAR: 'view_notifications',
    
    // Requests sub-options
    REQUEST_NEW_ITEM: 'request_new_item',
    MAKE_NEW_REQUEST: 'make_new_request',
    
    // Task Center sub-options
    CREATE_TASKS: 'create_tasks',
    ASSIGN_TASKS: 'assign_tasks',
    
    // Procurement Center sub-options
    VIEW_RFQS: 'view_rfqs',
    CREATE_RFQS: 'create_rfqs',
    APPROVE_RFQS: 'approve_rfqs',
    VIEW_QUOTATIONS: 'view_quotations',
    CREATE_QUOTATIONS: 'create_quotations',
    VIEW_PURCHASE_ORDERS: 'view_purchase_orders',
    CREATE_PURCHASE_ORDERS: 'create_purchase_orders',
    APPROVE_PURCHASE_ORDERS: 'approve_purchase_orders',
    VIEW_INVOICES: 'view_invoices',
    CREATE_INVOICES: 'create_invoices',
    EDIT_INVOICES: 'edit_invoices',
    
    // Finance Center sub-options
    VIEW_MAHARAT_INVOICES: 'view_maharat_invoices',
    CREATE_MAHARAT_INVOICES: 'create_maharat_invoices',
    VIEW_PAYMENT_ORDERS: 'view_payment_orders',
    CREATE_PAYMENT_ORDERS: 'create_payment_orders',
    EDIT_PAYMENT_ORDERS: 'edit_payment_orders',
    VIEW_ACCOUNT_RECEIVABLES: 'view_account_receivables',
    VIEW_ACCOUNT_PAYABLES: 'view_account_payables',
    VIEW_ACCOUNTS: 'view_accounts',
    
    // Sub-options permissions
    ADD_SUPPLIER: 'add_supplier',
    ADD_NEW_QUOTATION: 'add_new_quotation',
    ADD_CUSTOMERS: 'add_customers',
    CREATE_NEW_INVOICE: 'create_new_invoice',
    CREATE_NEW_ACCOUNT: 'create_new_account',
    
    // Warehouse sub-options
    STOCK_IN: 'stock_in',
    STOCK_OUT: 'stock_out',
    VIEW_MATERIAL_REQUESTS: 'view_material_requests',
    CREATE_MATERIAL_REQUESTS: 'create_material_requests',
    EDIT_MATERIAL_REQUESTS: 'edit_material_requests',
    VIEW_GOODS_RECEIVING_NOTES: 'view_goods_receiving_notes',
    CREATE_GOODS_RECEIVING_NOTES: 'create_goods_receiving_notes',
    EDIT_GOODS_RECEIVING_NOTES: 'edit_goods_receiving_notes',
    
    // Budget & Accounts sub-options
    MANAGE_BUDGET: 'manage_budget',
    APPROVE_BUDGET: 'approve_budget',
    
    // Reports sub-options
    CREATE_REPORTS: 'create_reports',
    EXPORT_REPORTS: 'export_reports',
    
    // Configuration Center sub-options
    VIEW_PROCESS_FLOW: 'view_process_flow',
    MANAGE_SETTINGS: 'manage_settings',
    
    // Sidebar sub-options
    VIEW_USER_MANUAL: 'view_user_manual',
    CREATE_USER_MANUAL: 'create_user_manual',
    EDIT_USER_MANUAL: 'edit_user_manual',
    DELETE_USER_MANUAL: 'delete_user_manual',
    VIEW_FAQS: 'view_faqs',
    CREATE_FAQS: 'create_faqs',
    EDIT_FAQS: 'edit_faqs',
    DELETE_FAQS: 'delete_faqs',
    
    // Organizational Chart / Employee Management sub-options
    EDIT_EMPLOYEE: 'edit_employee',
    ADD_EMPLOYEE: 'add_employee',
    DELETE_EMPLOYEE: 'delete_employee',
};

/**
 * Permission groups for easy checking
 */
export const PERMISSION_GROUPS = {
    REQUESTS: [PERMISSIONS.REQUESTS, PERMISSIONS.REQUEST_NEW_ITEM, PERMISSIONS.MAKE_NEW_REQUEST],
    TASK_CENTER: [PERMISSIONS.TASK_CENTER],
    PROCUREMENT: [PERMISSIONS.PROCUREMENT_CENTER, PERMISSIONS.RFQS, PERMISSIONS.QUOTATIONS, PERMISSIONS.PURCHASE_ORDER, PERMISSIONS.EXTERNAL_INVOICES, PERMISSIONS.ADD_SUPPLIER, PERMISSIONS.ADD_NEW_QUOTATION],
    FINANCE: [PERMISSIONS.FINANCE_CENTER, PERMISSIONS.VIEW_MAHARAT_INVOICES, PERMISSIONS.VIEW_PAYMENT_ORDERS, PERMISSIONS.VIEW_ACCOUNT_RECEIVABLES, PERMISSIONS.VIEW_ACCOUNT_PAYABLES, PERMISSIONS.VIEW_ACCOUNTS, PERMISSIONS.ADD_CUSTOMERS, PERMISSIONS.CREATE_NEW_INVOICE, PERMISSIONS.CREATE_NEW_ACCOUNT],
    WAREHOUSE: [PERMISSIONS.WAREHOUSE, PERMISSIONS.USER_MATERIAL_REQUESTS, PERMISSIONS.CATEGORIES, PERMISSIONS.ITEMS, PERMISSIONS.GOOD_RECEIVING_NOTES, PERMISSIONS.INVENTORY_TRACKING],
    BUDGET: [PERMISSIONS.BUDGET_ACCOUNTS, PERMISSIONS.COST_CENTERS, PERMISSIONS.INCOME_STATEMENT, PERMISSIONS.BALANCE_SHEET, PERMISSIONS.BUDGET, PERMISSIONS.REQUEST_BUDGET],
    STATUSES: [PERMISSIONS.STATUSES, PERMISSIONS.VIEW_MATERIAL_REQUEST_STATUS, PERMISSIONS.VIEW_RFQ_STATUS, PERMISSIONS.VIEW_PURCHASE_ORDER_STATUS, PERMISSIONS.VIEW_PAYMENT_ORDER_STATUS, PERMISSIONS.VIEW_INVOICE_STATUS, PERMISSIONS.VIEW_BUDGET_REQUEST_STATUS, PERMISSIONS.TOTAL_BUDGET_REQUEST],
    CONFIGURATION: [PERMISSIONS.CONFIGURATION_CENTER, PERMISSIONS.ORGANIZATIONAL_CHART, PERMISSIONS.PROCESS_FLOW, PERMISSIONS.NOTIFICATION_SETTINGS, PERMISSIONS.ROLES_PERMISSIONS],
    SIDEBAR: [PERMISSIONS.SIDEBAR, PERMISSIONS.SIDEBAR_NOTIFICATION, PERMISSIONS.PROFILE_SETTINGS, PERMISSIONS.USER_MANUAL, PERMISSIONS.FAQS],
};
