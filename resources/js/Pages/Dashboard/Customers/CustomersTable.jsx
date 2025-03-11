import { useEffect, useState } from "react";
import { Link } from "@inertiajs/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";

const CustomersTable = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);

    useEffect(() => {
        fetchCustomers();
    }, [currentPage]);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                `/api/v1/customers?page=${currentPage}`
            );
            setCustomers(response.data.data || []);
            setLastPage(response.data.meta?.last_page || 1);
        } catch (err) {
            setError("Error loading customers.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this customer?")) return;
        try {
            await axios.delete(`/api/v1/customers/${id}`);
            setCustomers((prevData) =>
                prevData.filter((item) => item.id !== id)
            );
        } catch (err) {
            alert("Failed to delete customer.");
        }
    };

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-[#2C323C]">Customers</h2>
                <Link
                    href="/customers/create"
                    className="bg-[#009FDC] text-white px-4 py-2 rounded-full text-xl font-medium"
                >
                    Create New Customer
                </Link>
            </div>
            <div className="w-full overflow-hidden">
                <table className="w-full border-collapse">
                    <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                        <tr>
                            <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                                ID
                            </th>
                            <th className="py-3 px-4">Customer Name</th>
                            <th className="py-3 px-4">Commercial Reg. No.</th>
                            <th className="py-3 px-4">Tax Number</th>
                            <th className="py-3 px-4">Contact Number</th>
                            <th className="py-3 px-4">City</th>
                            <th className="py-3 px-4">Country</th>
                            <th className="py-3 px-4">Account Name</th>
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
                        ) : customers.length > 0 ? (
                            customers.map((item) => (
                                <tr key={item.id}>
                                    <td className="py-3 px-4">{item.id}</td>
                                    <td className="py-3 px-4">{item.name}</td>
                                    <td className="py-3 px-4">
                                        {item.commercial_registration_number}
                                    </td>
                                    <td className="py-3 px-4">
                                        {item.tax_number}
                                    </td>
                                    <td className="py-3 px-4">
                                        {item.contact_number}
                                    </td>
                                    <td className="py-3 px-4">{item.city}</td>
                                    <td className="py-3 px-4">
                                        {item.country_code}
                                    </td>
                                    <td className="py-3 px-4">
                                        {item.account_name}
                                    </td>
                                    <td className="py-3 px-4 flex space-x-3">
                                        <Link
                                            href={`/customers/${item.id}/edit`}
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
                                    No customers found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Pagination */}
                {!loading && !error && customers.length > 0 && (
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

export default CustomersTable;
