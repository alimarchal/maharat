import { useEffect, useState } from "react";
import { Link } from "@inertiajs/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";

const SuppliersTable = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);

    useEffect(() => {
        fetchSuppliers();
    }, [currentPage]);

    const fetchSuppliers = async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                `/api/v1/suppliers?page=${currentPage}`
            );
            setSuppliers(response.data.data || []);
            setLastPage(response.data.meta?.last_page || 1);
        } catch (err) {
            setError("Error loading suppliers.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this supplier?")) return;
        try {
            await axios.delete(`/api/v1/suppliers/${id}`);
            setSuppliers((prevData) =>
                prevData.filter((item) => item.id !== id)
            );
        } catch (err) {
            alert("Failed to delete supplier.");
        }
    };

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-[#2C323C]">Suppliers</h2>
                <Link
                    href="/suppliers/create"
                    className="bg-[#009FDC] text-white px-4 py-2 rounded-full text-xl font-medium"
                >
                    Create New Supplier
                </Link>
            </div>
            <div className="w-full overflow-hidden">
                <table className="w-full border-collapse">
                    <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                        <tr>
                            <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                                ID
                            </th>
                            <th className="py-3 px-4">Supplier Name</th>
                            <th className="py-3 px-4">Supplier Code</th>
                            <th className="py-3 px-4">Email</th>
                            <th className="py-3 px-4">Phone</th>
                            <th className="py-3 px-4">Tax Number</th>
                            <th className="py-3 px-4">Payment Terms</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="text-[#2C323C] text-left text-base font-medium divide-y divide-[#D7D8D9]">
                        {loading ? (
                            <tr>
                                <td colSpan="9" className="text-center py-12">
                                    <div className="w-12 h-12 border-4 border-[#009FDC] border-t-transparent rounded-full animate-spin"></div>
                                </td>
                            </tr>
                        ) : error ? (
                            <tr>
                                <td
                                    colSpan="9"
                                    className="text-center text-red-500 font-medium py-4"
                                >
                                    {error}
                                </td>
                            </tr>
                        ) : suppliers.length > 0 ? (
                            suppliers.map((item) => (
                                <tr key={item.id}>
                                    <td className="py-3 px-4">{item.id}</td>
                                    <td className="py-3 px-4">{item.name}</td>
                                    <td className="py-3 px-4">{item.code}</td>
                                    <td className="py-3 px-4">{item.email}</td>
                                    <td className="py-3 px-4">{item.phone}</td>
                                    <td className="py-3 px-4">
                                        {item.tax_number}
                                    </td>
                                    <td className="py-3 px-4">
                                        {item.payment_terms}
                                    </td>
                                    <td className="py-3 px-4">
                                        {item.is_approved ? (
                                            <span className="text-green-500 font-semibold">
                                                Approved
                                            </span>
                                        ) : (
                                            <span className="text-red-500 font-semibold">
                                                Pending
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 flex space-x-3">
                                        <Link
                                            href={`/suppliers/${item.id}/edit`}
                                            className="text-blue-500"
                                        >
                                            <FontAwesomeIcon icon={faEdit} />
                                        </Link>
                                        <button
                                            onClick={() =>
                                                handleDelete(item.id)
                                            }
                                            className="text-red-500"
                                        >
                                            <FontAwesomeIcon icon={faTrash} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="9" className="text-center py-4">
                                    No suppliers found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Pagination */}
                {!loading && !error && suppliers.length > 0 && (
                    <div className="p-4 flex justify-end space-x-2 font-medium text-sm">
                        {Array.from(
                            { length: lastPage },
                            (_, index) => index + 1
                        ).map((page) => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`px-3 py-1 ${
                                    currentPage === page
                                        ? "bg-[#009FDC] text-white"
                                        : "border border-[#B9BBBD] bg-white"
                                } rounded-full hover:bg-[#0077B6] transition`}
                            >
                                {page}
                            </button>
                        ))}
                        <button
                            onClick={() => setCurrentPage(currentPage + 1)}
                            className={`px-3 py-1 bg-[#009FDC] text-white rounded-full hover:bg-[#0077B6] transition ${
                                currentPage >= lastPage
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                            }`}
                            disabled={currentPage >= lastPage}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SuppliersTable;
