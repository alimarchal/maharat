import React from 'react';
import PermissionGate from '@/Components/PermissionGate';

/**
 * Example navigation component showing how to use PermissionGate
 * This demonstrates how features are hidden/shown based on permissions
 */
const ExampleNavigation = () => {
    return (
        <nav className="bg-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex justify-between h-16">
                    <div className="flex space-x-8">
                        {/* Requests - only show if user has requests permission */}
                        <PermissionGate permission="requests">
                            <a href="/requests" className="text-gray-700 hover:text-blue-600 px-3 py-2">
                                Requests
                            </a>
                        </PermissionGate>

                        {/* Task Center - only show if user has view_tasks permission */}
                        <PermissionGate permission="view_tasks">
                            <a href="/tasks" className="text-gray-700 hover:text-blue-600 px-3 py-2">
                                Task Center
                            </a>
                        </PermissionGate>

                        {/* Procurement Center - only show if user has view_procurement permission */}
                        <PermissionGate feature="procurement_center">
                            <div className="relative group">
                                <a href="/procurement" className="text-gray-700 hover:text-blue-600 px-3 py-2">
                                    Procurement Center
                                </a>
                                
                                {/* Dropdown menu - only show if procurement center is enabled */}
                                <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                                    <div className="py-1">
                                        {/* RFQs - only show if user has view_rfqs permission */}
                                        <PermissionGate feature="procurement_center" subOption="rfqs">
                                            <a href="/procurement/rfqs" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                                RFQs
                                            </a>
                                        </PermissionGate>

                                        {/* Quotations - only show if user has view_quotations permission */}
                                        <PermissionGate feature="procurement_center" subOption="quotations">
                                            <a href="/procurement/quotations" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                                Quotations
                                            </a>
                                        </PermissionGate>

                                        {/* Purchase Orders - only show if user has view_purchase_orders permission */}
                                        <PermissionGate feature="procurement_center" subOption="purchase_orders">
                                            <a href="/procurement/purchase-orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                                Purchase Orders
                                            </a>
                                        </PermissionGate>

                                        {/* External Invoices - only show if user has view_invoices permission */}
                                        <PermissionGate feature="procurement_center" subOption="external_invoices">
                                            <a href="/procurement/external-invoices" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                                External Invoices
                                            </a>
                                        </PermissionGate>
                                    </div>
                                </div>
                            </div>
                        </PermissionGate>

                        {/* Finance Center - only show if user has view_finance permission */}
                        <PermissionGate feature="finance_center">
                            <a href="/finance" className="text-gray-700 hover:text-blue-600 px-3 py-2">
                                Finance Center
                            </a>
                        </PermissionGate>

                        {/* Warehouse - only show if user has view_warehouse permission */}
                        <PermissionGate feature="warehouse">
                            <a href="/warehouse" className="text-gray-700 hover:text-blue-600 px-3 py-2">
                                Warehouse
                            </a>
                        </PermissionGate>

                        {/* Sidebar features */}
                        <PermissionGate feature="sidebar">
                            <div className="relative group">
                                <a href="/sidebar" className="text-gray-700 hover:text-blue-600 px-3 py-2">
                                    More
                                </a>
                                
                                <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                                    <div className="py-1">
                                        {/* Notification - only show if user has view_notifications permission */}
                                        <PermissionGate feature="sidebar" subOption="notification">
                                            <a href="/notifications" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                                Notifications
                                            </a>
                                        </PermissionGate>

                                        {/* Profile Settings - only show if user has edit_profile permission */}
                                        <PermissionGate feature="sidebar" subOption="profile_settings">
                                            <a href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                                Profile Settings
                                            </a>
                                        </PermissionGate>

                                        {/* User Manual - only show if user has view_user_manual permission */}
                                        <PermissionGate feature="sidebar" subOption="user_manual">
                                            <a href="/user-manual" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                                User Manual
                                            </a>
                                        </PermissionGate>

                                        {/* FAQs - only show if user has view_faqs permission */}
                                        <PermissionGate feature="sidebar" subOption="faqs">
                                            <a href="/faqs" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                                FAQs
                                            </a>
                                        </PermissionGate>
                                    </div>
                                </div>
                            </div>
                        </PermissionGate>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default ExampleNavigation;
