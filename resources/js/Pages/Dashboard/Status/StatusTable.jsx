import { useEffect, useState } from "react";
import { Link, router } from "@inertiajs/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";

const StatusTable = () => {
    const [statuses, setStatuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchStatuses = async () => {
            try {
                const response = await fetch("/api/statuses"); // Fetch from API
                const data = await response.json();

                if (response.ok) {
                    setStatuses(data.data || []);
                } else {
                    setError(data.message || "Failed to fetch statuses.");
                }
            } catch (err) {
                console.error("Error fetching statuses:", err);
                setError("Error loading statuses.");
            } finally {
                setLoading(false);
            }
        };

        fetchStatuses();
    }, []);

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this status?")) return;
        
        try {
            const response = await fetch(`/api/statuses/${id}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (response.ok) {
                setStatuses((prevStatuses) => prevStatuses.filter(status => status.id !== id));
            } else {
                const data = await response.json();
                alert(data.message || "Failed to delete status.");
            }
        } catch (err) {
            console.error("Error deleting status:", err);
            alert("An error occurred while deleting the status.");
        }
    };

    return (
        <div className="w-full overflow-hidden">
            {loading ? (
                <p className="text-center text-[#2C323C] font-medium py-4">
                    Loading statuses...
                </p>
            ) : error ? (
                <p className="text-center text-red-500 font-medium py-4">
                    {error}
                </p>
            ) : statuses.length > 0 ? (
                <table className="w-full">
                    <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                        <tr>
                            <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">ID</th>
                            <th className="py-3 px-4">Type</th>
                            <th className="py-3 px-4">Name</th>
                            <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-[#2C323C] text-base font-medium divide-y divide-[#D7D8D9]">
                        {statuses.map((status) => (
                            <tr key={status.id}>
                                <td className="py-3 px-4">{status.id}</td>
                                <td className="py-3 px-4">{status.type}</td>
                                <td className="py-3 px-4">{status.name}</td>
                                <td className="py-3 px-4 flex space-x-3">
                                    <Link href={`/status/${status.id}`} className="text-[#9B9DA2] hover:text-gray-500">
                                        <FontAwesomeIcon icon={faEye} />
                                    </Link>
                                    <Link href={`/status/${status.id}/edit`} className="text-[#9B9DA2] hover:text-gray-500">
                                        <FontAwesomeIcon icon={faEdit} />
                                    </Link>
                                    <button onClick={() => handleDelete(status.id)} className="text-[#9B9DA2] hover:text-gray-500">
                                        <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p className="text-center text-[#2C323C] font-medium py-4">
                    No statuses found.
                </p>
            )}
        </div>
    );
};

export default StatusTable;
