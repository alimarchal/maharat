import { useEffect, useState } from "react";
import { Link } from "@inertiajs/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";

const UnitTable = () => {
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);

    useEffect(() => {
        const fetchUnits = async () => {
            setLoading(true);
            try {
                const response = await fetch(`/api/units?page=${currentPage}`);
                const data = await response.json();

                if (response.ok) {
                    setUnits(data.data || []);
                    setLastPage(data.meta?.last_page || 1);
                } else {
                    setError(data.message || "Failed to fetch units.");
                }
            } catch (err) {
                console.error("Error fetching units:", err);
                setError("Error loading units.");
            } finally {
                setLoading(false);
            }
        };

        fetchUnits();
    }, [currentPage]);

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this Unit?")) return;

        try {
            const response = await fetch(`/api/units/${id}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
            });

            if (response.ok) {
                setUnits((prevStatuses) =>
                    prevStatuses.filter((status) => status.id !== id)
                );
            } else {
                const data = await response.json();
                alert(data.message || "Failed to delete unit.");
            }
        } catch (err) {
            console.error("Error deleting unit:", err);
            alert("An error occurred while deleting the unit.");
        }
    };

    return (
        <div className="w-full overflow-hidden">
            {loading ? (
                <p className="text-center text-[#2C323C] font-medium py-4">
                    Loading Units...
                </p>
            ) : error ? (
                <p className="text-center text-red-500 font-medium py-4">
                    {error}
                </p>
            ) : statuses.length > 0 ? (
                <>
                    <table className="w-full">
                        <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                            <tr>
                                <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                                    ID
                                </th>
                                <th className="py-3 px-4">Name</th>
                                <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="text-[#2C323C] text-base font-medium divide-y divide-[#D7D8D9]">
                            {units.map((unit) => (
                                <tr key={unit.id}>
                                    <td className="py-3 px-4">{unit.id}</td>
                                    <td className="py-3 px-4">{unit.name}</td>
                                    <td className="py-3 px-4 flex space-x-3">
                                        <Link
                                            href={`/units/${unit.id}`}
                                            className="text-[#9B9DA2] hover:text-gray-500"
                                        >
                                            <FontAwesomeIcon icon={faEye} />
                                        </Link>
                                        <Link
                                            href={`/units/${unit.id}`}
                                            className="text-[#9B9DA2] hover:text-gray-500"
                                        >
                                            <FontAwesomeIcon icon={faEdit} />
                                        </Link>
                                        <button
                                            onClick={() =>
                                                handleDelete(unit.id)
                                            }
                                            className="text-[#9B9DA2] hover:text-gray-500"
                                        >
                                            <FontAwesomeIcon icon={faTrash} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Updated Pagination */}
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
                                } rounded-full hover:bg-gray-100 transition`}
                            >
                                {page}
                            </button>
                        ))}
                        {currentPage < lastPage && (
                            <button
                                onClick={() => setCurrentPage(currentPage + 1)}
                                className="px-3 py-1 bg-[#009FDC] text-white rounded-full hover:bg-[#0077B6] transition"
                            >
                                Next
                            </button>
                        )}
                    </div>
                </>
            ) : (
                <p className="text-center text-[#2C323C] font-medium py-4">
                    No Units found.
                </p>
            )}
        </div>
    );
};

export default UnitTable;
