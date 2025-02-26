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

    const fetchRfqs = async () => {
        try {
            const response = await axios.get(`/api/v1/rfqs?page=${currentPage}`);
            const rfqsData = response.data.data;
            
            // Fetch category details for each RFQ
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
        } catch (error) {
            console.error('API Error:', error);
            setError("Failed to load RFQs");
            setRfqs([]);
        }
    };

    useEffect(() => {
        fetchRfqs();
    }, [currentPage]);

    return (
        <AuthenticatedLayout user={auth.user}>
         <div className="min-h-screen p-6">
                         {/* Back Button and Breadcrumbs */}
                         <div className="flex justify-between items-center mb-4">
                             <button
                                 onClick={() => router.visit("/dashboard")}
                                 className="flex items-center text-black text-2xl font-medium hover:text-gray-800 p-2"
                             >
                                 <FontAwesomeIcon icon={faArrowLeftLong} className="mr-2 text-2xl" />
                                 Back
                             </button>
                         </div>
                         <div className="flex items-center text-[#7D8086] text-lg font-medium space-x-2 mb-6">
                             <Link href="/dashboard" className="hover:text-[#009FDC] text-xl">Home</Link>
                             <FontAwesomeIcon icon={faChevronRight} className="text-xl text-[#9B9DA2]" />
                             <Link href="/purchase" className="hover:text-[#009FDC] text-xl">Purchases</Link>
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
                                        <Link href={`/quotation-to-rfq`}>
                                            <PlusCircleIcon className="h-6 w-6 text-gray-400 hover:text-gray-600 cursor-pointer mx-auto" />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {!error && rfqs.length > 0 && (
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
                            {Array.from({ length: lastPage }, (_, index) => index + 1).map((page) => (
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
                                    currentPage >= lastPage ? "opacity-50 cursor-not-allowed" : ""
                                }`}
                                disabled={currentPage >= lastPage}
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