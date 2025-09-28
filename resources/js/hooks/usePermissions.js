import { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Custom hook to manage user permissions
 * @returns {Object} Permission state and methods
 */
export const usePermissions = () => {
    const [permissions, setPermissions] = useState([]);
    const [permissionStructure, setPermissionStructure] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch user's effective permissions
    const fetchPermissions = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/v1/user/effective-permissions');
            setPermissions(response.data.data);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to fetch permissions');
            setPermissions([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch user's permission structure
    const fetchPermissionStructure = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/v1/user/permission-structure');
            setPermissionStructure(response.data.data);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to fetch permission structure');
            setPermissionStructure({});
        } finally {
            setLoading(false);
        }
    };

    // Check if user has specific permission
    const hasPermission = (permission) => {
        return permissions.includes(permission);
    };

    // Check if user has any of the given permissions
    const hasAnyPermission = (permissionList) => {
        return permissionList.some(permission => permissions.includes(permission));
    };

    // Check if user has all of the given permissions
    const hasAllPermissions = (permissionList) => {
        return permissionList.every(permission => permissions.includes(permission));
    };

    // Check if a main feature is enabled
    const isFeatureEnabled = (feature) => {
        return permissionStructure[feature]?.enabled || false;
    };

    // Check if a sub-option is enabled
    const isSubOptionEnabled = (feature, subOption) => {
        return permissionStructure[feature]?.subOptions?.[subOption] || false;
    };

    // Check if user should see a feature (main card enabled AND sub-option enabled)
    const shouldShowFeature = (feature, subOption = null) => {
        if (!isFeatureEnabled(feature)) {
            return false;
        }
        
        if (subOption === null) {
            return true; // Main feature is enabled
        }
        
        return isSubOptionEnabled(feature, subOption);
    };

    // Initialize permissions on mount
    useEffect(() => {
        fetchPermissions();
        fetchPermissionStructure();
    }, []);

    return {
        permissions,
        permissionStructure,
        loading,
        error,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        isFeatureEnabled,
        isSubOptionEnabled,
        shouldShowFeature,
        refetchPermissions: fetchPermissions,
        refetchPermissionStructure: fetchPermissionStructure,
    };
};
