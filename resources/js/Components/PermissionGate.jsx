import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';

/**
 * PermissionGate component - hides/shows content based on user permissions
 * 
 * Usage:
 * <PermissionGate permission="view_rfqs">
 *   <RFQComponent />
 * </PermissionGate>
 * 
 * <PermissionGate feature="procurement_center" subOption="rfqs">
 *   <RFQComponent />
 * </PermissionGate>
 * 
 * <PermissionGate permissions={["view_rfqs", "create_rfqs"]} requireAll={false}>
 *   <RFQComponent />
 * </PermissionGate>
 */
const PermissionGate = ({ 
    permission, 
    permissions, 
    feature,
    subOption,
    children, 
    fallback = null,
    requireAll = false 
}) => {
    const { 
        hasPermission, 
        hasAnyPermission, 
        hasAllPermissions, 
        shouldShowFeature,
        loading 
    } = usePermissions();
    
    // Show loading state
    if (loading) {
        return fallback;
    }
    
    // Check single permission
    if (permission) {
        const hasAccess = hasPermission(permission);
        return hasAccess ? children : fallback;
    }
    
    // Check multiple permissions
    if (permissions && Array.isArray(permissions)) {
        const hasAccess = requireAll 
            ? hasAllPermissions(permissions)
            : hasAnyPermission(permissions);
        return hasAccess ? children : fallback;
    }
    
    // Check feature-based permissions
    if (feature) {
        const shouldShow = shouldShowFeature(feature, subOption);
        return shouldShow ? children : fallback;
    }
    
    // If no permission criteria provided, show children
    return children;
};

export default PermissionGate;