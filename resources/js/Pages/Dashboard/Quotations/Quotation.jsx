import { useState } from 'react';
import { Head } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import QuotationTable from './QuotationTable';

export default function Quotation({ auth, quotations }) {
    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="RFQ Management" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header Section */}
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-2xl font-semibold text-gray-900">RFQ Management</h2>
                            <p className="mt-1 text-sm text-gray-600">
                                Manage and track all Request for Quotations
                            </p>
                        </div>
                        <div className="flex space-x-4">
                            <button
                                onClick={() => router.get(route('dashboard.quotations.create'))}
                                className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-blue-700"
                            >
                                Make New RFQ
                            </button>
                        </div>
                    </div>

                    {/* Filters Section */}
                    <div className="bg-white rounded-lg shadow p-6 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    RFQ Number
                                </label>
                                <input
                                    type="text"
                                    className="w-full rounded-md border-gray-300"
                                    placeholder="Search RFQ number..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Status
                                </label>
                                <select className="w-full rounded-md border-gray-300">
                                    <option value="">All Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="approved">Approved</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Date Range
                                </label>
                                <input
                                    type="date"
                                    className="w-full rounded-md border-gray-300"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Category
                                </label>
                                <select className="w-full rounded-md border-gray-300">
                                    <option value="">All Categories</option>
                                    <option value="furniture">Furniture</option>
                                    <option value="electronics">Electronics</option>
                                    <option value="supplies">Supplies</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Quotation Table */}
                    <div className="bg-white rounded-lg shadow">
                        <QuotationTable quotations={quotations} />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
} 