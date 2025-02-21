import { useEffect, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";

const StatusTable = () => {
    const { props } = usePage();
    const [statuses, setStatuses] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchStatuses();
    }, []);

    const fetchStatuses = async () => {
        setLoading(true);
        try {
            router.get(
                "statuses",
                {},
                {
                    headers: {
                        Authorization: `Bearer ${props.auth.token}`,
                    },
                    onSuccess: () => {
                        console.log("Reach");
                    },
                    onError: (err) => {
                        console.error("Error:", err);
                    },
                    onFinish: () => {
                        setLoading(false);
                    },
                }
            );
        } catch (error) {
            console.error("Error fetching statuses:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this status?")) return;

        try {
            await fetch(`/api/v1/statuses/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${props.auth.token}`,
                },
            });
            setStatuses(statuses.filter((status) => status.id !== id));
        } catch (error) {
            console.error("Error deleting status:", error);
        }
    };

    return (
        <div className="w-full overflow-hidden">
            {loading ? (
                <p>Loading statuses...</p>
            ) : (
                <table className="w-full">
                    <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                        <tr>
                            <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                                ID
                            </th>
                            <th className="py-3 px-4">Type</th>
                            <th className="py-3 px-4">Name</th>
                            <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="text-[#2C323C] text-base font-medium divide-y divide-[#D7D8D9]">
                        {statuses.map((status) => (
                            <tr key={status.id}>
                                <td className="py-3 px-4">{status.id}</td>
                                <td className="py-3 px-4">{status.type}</td>
                                <td className="py-3 px-4">{status.name}</td>
                                <td className="py-3 px-4 flex space-x-3">
                                    <Link
                                        href={`/status/${status.id}`}
                                        className="text-[#9B9DA2] hover:text-gray-500"
                                    >
                                        <FontAwesomeIcon icon={faEye} />
                                    </Link>
                                    <Link
                                        href={`/status/${status.id}`}
                                        className="text-[#9B9DA2] hover:text-gray-500"
                                    >
                                        <FontAwesomeIcon icon={faEdit} />
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(status.id)}
                                        className="text-[#9B9DA2] hover:text-gray-500"
                                    >
                                        <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default StatusTable;
