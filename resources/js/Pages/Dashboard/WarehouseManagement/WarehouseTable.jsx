import { useEffect, useState } from "react";
import { Link } from "@inertiajs/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";

const WarehouseTable = () => {
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);

    useEffect(() => {
        fetchWarehouses();
    }, [currentPage]);

    const fetchWarehouses = async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                `/api/v1/warehouses?include=manager&page=${currentPage}`
            );
            setWarehouses(response.data.data || []);
            setLastPage(response.data.meta?.last_page || 1);
        } catch (err) {
            setError("Error loading warehouses.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this Warehouse?")) return;
        try {
            await axios.delete(`/api/v1/warehouses/${id}`);
            setWarehouses((prev) =>
                prev.filter((warehouse) => warehouse.id !== id)
            );
        } catch (err) {
            const errorMessage = err.response?.data?.message || "An error occurred while deleting the warehouse.";
            alert(errorMessage);
        }
    };

    return (
        <div className="w-full overflow-hidden">
            <table className="w-full">
                <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                    <tr>
                        <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                            ID
                        </th>
                        <th className="py-3 px-4">Warehouse Name</th>
                        <th className="py-3 px-4">Manager Name</th>
                        <th className="py-3 px-4">Code</th>
                        <th className="py-3 px-4">Address</th>
                        <th className="py-3 px-4 text-center rounded-tr-2xl rounded-br-2xl">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="text-[#2C323C] text-base font-medium divide-y divide-[#D7D8D9]">
                    {loading ? (
                        <tr>
                            <td colSpan="6" className="text-center py-12">
                                <div className="w-12 h-12 border-4 border-[#009FDC] border-t-transparent rounded-full animate-spin"></div>
                            </td>
                        </tr>
                    ) : error ? (
                        <tr>
                            <td
                                colSpan="6"
                                className="text-center text-red-500 font-medium py-4"
                            >
                                {error}
                            </td>
                        </tr>
                    ) : warehouses.length > 0 ? (
                        warehouses.map((warehouse) => {
                            return (
                                <tr key={warehouse.id}>
                                    <td className="py-3 px-4">
                                        {warehouse.id}
                                    </td>
                                    <td className="py-3 px-4">
                                        {warehouse.name}
                                    </td>
                                    <td className="py-3 px-4">
                                        {warehouse.manager?.user.name}
                                    </td>
                                    <td className="py-3 px-4">
                                        {warehouse.code}
                                    </td>
                                    <td className="py-3 px-4">
                                        {warehouse.address}
                                    </td>
                                    <td className="py-3 px-4 flex justify-center text-center space-x-3">
                                        <Link
                                            href={`/warehouse-management/${warehouse.id}/edit`}
                                            className="text-blue-400 hover:text-blue-500"
                                            title="Edit Warehouse"
                                        >
                                            <FontAwesomeIcon icon={faEdit} />
                                        </Link>
                                        <button
                                            onClick={() =>
                                                handleDelete(warehouse.id)
                                            }
                                            className="text-red-600 hover:text-red-800"
                                            title="Delete Warehouse"
                                        >
                                            <FontAwesomeIcon icon={faTrash} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })
                    ) : (
                        <tr>
                            <td
                                colSpan="6"
                                className="text-center text-[#2C323C] font-medium py-4"
                            >
                                No Warehouses found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Pagination */}
            {!loading && !error && warehouses.length > 0 && (
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
                            } rounded-full hover:bg-[#0077B6] hover:text-white transition`}
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
    );
};

export default WarehouseTable;
