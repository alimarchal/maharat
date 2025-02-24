import { useEffect, useState } from "react";
import { Link } from "@inertiajs/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";

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
            const response = await fetch(
                `/api/v1/warehouses?include=manager&page=${currentPage}`
            );
            const data = await response.json();
            if (response.ok) {
                setWarehouses(data.data || []);
                setLastPage(data.meta?.last_page || 1);
            } else {
                setError(data.message || "Failed to fetch warehouse.");
            }
        } catch (err) {
            console.error("Error fetching warehouses:", err);
            setError("Error loading warehouses.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this Warehouse?")) return;
        try {
            const response = await fetch(`/api/v1/warehouses/${id}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
            });

            if (response.ok) {
                setWarehouses((prev) =>
                    prev.filter((warehouse) => warehouse.id !== id)
                );
            } else {
                const data = await response.json();
                alert(data.message || "Failed to delete warehouse.");
            }
        } catch (err) {
            console.error("Error deleting warehouse:", err);
            alert("An error occurred while deleting the warehouse.");
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
                        <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl">
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
                        warehouses.map((warehouse) => (
                            <tr key={warehouse.id}>
                                <td className="py-3 px-4">{warehouse.id}</td>
                                <td className="py-3 px-4">{warehouse.name}</td>
                                <td className="py-3 px-4">
                                    {warehouse.manager.name}
                                </td>
                                <td className="py-3 px-4">{warehouse.code}</td>
                                <td className="py-3 px-4">
                                    {warehouse.address}
                                </td>
                                <td className="py-3 px-4 flex space-x-3">
                                    {/* <button
                                        className="text-[#9B9DA2] hover:text-gray-500"
                                    >
                                        <FontAwesomeIcon icon={faEye} />
                                    </button> */}
                                    <Link
                                        href={`/warehouse-management/${warehouse.id}/edit`}
                                        className="text-[#9B9DA2] hover:text-gray-500"
                                    >
                                        <FontAwesomeIcon icon={faEdit} />
                                    </Link>
                                    <button
                                        onClick={() =>
                                            handleDelete(warehouse.id)
                                        }
                                        className="text-[#9B9DA2] hover:text-gray-500"
                                    >
                                        <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                </td>
                            </tr>
                        ))
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
    );
};

export default WarehouseTable;
