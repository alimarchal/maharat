import React, { useState, useEffect } from 'react';
import { PlusCircleIcon } from '@heroicons/react/24/outline';
import { Link, router, Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeftLong, faEdit, faTrash, faCheck, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";

export default function NewQuotation({ auth }) {
    const [rfqs, setRfqs] = useState([]);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(0);
    const [companies, setCompanies] = useState([]);

    const fetchRfqs = async () => {
        setLoading(true);
        setProgress(0);
    
        const interval = setInterval(() => {
            setProgress((oldProgress) => (oldProgress >= 90 ? 90 : oldProgress + 10));
        }, 300);
    
        try {
            const response = await axios.get(`/api/v1/rfqs?page=${currentPage}`);
            const rfqsData = response.data.data;
    
            const rfqsWithDetails = await Promise.all(
                rfqsData.map(async (rfq) => {
                    const categoryResponse = await axios.get(`/api/v1/rfq-categories/${rfq.id}`);
                    return {
                        ...rfq,
                        category_name: categoryResponse.data.data.category_name
                    };
                })
            );
    
            setRfqs(rfqsWithDetails);
            setLastPage(response.data.meta.last_page);
            setError("");
    
            setProgress(100);
            setTimeout(() => setLoading(false), 500);
        } catch (error) {
            console.error('API Error:', error);
            setError("Failed to load RFQs");
            setRfqs([]);
            setProgress(100);
            setTimeout(() => setLoading(false), 500);
        } finally {
            clearInterval(interval);
        }
    };

    const fetchCompanies = async () => {
        try {
            const response = await axios.get('/api/v1/companies');
            setCompanies(response.data.data);
        } catch (error) {
            console.error('Error fetching companies:', error);
        }
    };

    useEffect(() => {
        fetchRfqs();
        fetchCompanies();
    }, [currentPage]);

    return (
        <AuthenticatedLayout user={auth.user}>
            <div className="min-h-screen p-6">
                <div className="flex justify-between items-center mb-4">
                    <button
                        onClick={() => router.visit("/quotation")}
                        className="flex items-center text-black text-2xl font-medium hover:text-gray-800 p-2"
                    >
                        <FontAwesomeIcon icon={faArrowLeftLong} className="mr-2 text-2xl" />
                        Back
                    </button>
                </div>
                <div className="flex items-center text-[#7D8086] text-lg font-medium space-x-2 mb-6">
                    <Link href="/dashboard" className="hover:text-[#009FDC] text-xl">Home</Link>
                    <FontAwesomeIcon icon={faChevronRight} className="text-xl text-[#9B9DA2]" />
                    <Link href="/quotation" className="hover:text-[#009FDC] text-xl">Quotations</Link>
                    <FontAwesomeIcon icon={faChevronRight} className="text-xl text-[#9B9DA2]" />
                    <span className="text-[#009FDC] text-xl"> Add Quotation </span>
                </div>
                <Head title="New Quotation" />

                <div className="w-full overflow-hidden">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-[32px] font-bold text-[#2C323C]">New Quotation</h2>
                    </div>

                    <div className="w-full overflow-hidden">
                        {error && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                                <span className="block sm:inline">{error}</span>
                            </div>
                        )}
                        
                        <table className="w-full">
                            <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                                <tr>
                                    <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl text-center">RFQ#</th>
                                    <th className="py-3 px-4 text-center">Date</th>
                                    <th className="py-3 px-4 text-center">Category</th>
                                    <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl text-center">Action</th>
                                </tr>
                            </thead>

                            {loading && (
                            <div className="absolute left-[55%] transform -translate-x-1/2 mt-12 w-2/3">
                                <div className="relative w-full h-12 bg-gray-300 rounded-full flex items-center justify-center text-xl font-bold text-white">
                                    <div
                                        className="absolute left-0 top-0 h-12 bg-[#009FDC] rounded-full transition-all duration-500"
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                    <span className="absolute text-white">
                                        {progress < 60 ? "Please Wait, Fetching Details..." : `${progress}%`}
                                    </span>
                                </div>
                            </div>
                        )}

                        {!loading && (
                            <tbody className="bg-transparent divide-y divide-gray-200">
                                {rfqs.map((rfq) => (
                                    <tr key={rfq.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            {rfq.id}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            {rfq.created_at ? new Date(rfq.created_at).toLocaleDateString('en-GB', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric'
                                            }) : ''}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            {rfq.category_name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <Link href={`/quotation-to-rfq?rfq_id=${rfq.id}`}>
                                                <PlusCircleIcon className="h-6 w-6 text-gray-400 hover:text-gray-600 cursor-pointer mx-auto" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        )}
                        </table>

                        {!loading && !error && rfqs.length > 0 && (
                        <div className="p-4 flex justify-end space-x-2 font-medium text-sm">
                            <button
                                onClick={() => setCurrentPage(currentPage - 1)}
                                className={`px-3 py-1 bg-[#009FDC] text-white rounded-full ${
                                    currentPage <= 1 ? "opacity-50 cursor-not-allowed" : ""
                                }`}
                                disabled={currentPage <= 1}
                            >
                                Previous
                            </button>
                            {Array.from({ length: Math.ceil(rfqs.length / 10) }, (_, index) => index + 1).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`px-3 py-1 ${
                                        currentPage === page
                                            ? "bg-[#009FDC] text-white"
                                            : "border border-[#B9BBBD] bg-white text-black"
                                    } rounded-full`}
                                >
                                    {page}
                                </button>
                            ))}
                            <button
                                onClick={() => setCurrentPage(currentPage + 1)}
                                className={`px-3 py-1 bg-[#009FDC] text-white rounded-full ${
                                    currentPage >= Math.ceil(rfqs.length / 10) ? "opacity-50 cursor-not-allowed" : ""
                                }`}
                                disabled={currentPage >= Math.ceil(rfqs.length / 10)}
                            >
                                Next
                            </button>
                        </div>
                    )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}