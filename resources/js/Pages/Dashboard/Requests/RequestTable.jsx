import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";

const RequestTable = () => {
    const requests = [
        {
            id: "01234457",
            item: "Computer",
            priority: "High",
            status: "Pending",
            date: "4 Jan 2025",
            time: "10:30 PM",
        },
        {
            id: "01234568",
            item: "Pencils",
            priority: "High",
            status: "Approved",
            date: "4 Jan 2025",
            time: "10:30 PM",
        },
        {
            id: "01234568",
            item: "Laptop",
            priority: "Medium",
            status: "Rejected",
            date: "4 Jan 2025",
            time: "10:30 PM",
        },
        {
            id: "01234568",
            item: "Cables",
            priority: "High",
            status: "Pending",
            date: "4 Jan 2025",
            time: "10:30 PM",
        },
        {
            id: "01234568",
            item: "Mouse",
            priority: "Low",
            status: "Approved",
            date: "4 Jan 2025",
            time: "10:30 PM",
        },
        {
            id: "01234568",
            item: "Software",
            priority: "High",
            status: "Rejected",
            date: "4 Jan 2025",
            time: "10:30 PM",
        },
        {
            id: "01234568",
            item: "Mobile",
            priority: "Medium",
            status: "Pending",
            date: "4 Jan 2025",
            time: "10:30 PM",
        },
        {
            id: "01234568",
            item: "Systems",
            priority: "Low",
            status: "Approved",
            date: "4 Jan 2025",
            time: "10:30 PM",
        },
        {
            id: "01234568",
            item: "Screens",
            priority: "High",
            status: "Rejected",
            date: "4 Jan 2025",
            time: "10:30 PM",
        },
    ];

    const statusColors = {
        Pending: "text-yellow-500",
        Approved: "text-green-500",
        Rejected: "text-red-500",
    };

    const priorityColors = {
        High: "text-red-500",
        Medium: "text-orange-500",
        Low: "text-green-500",
    };

    return (
        <div className="w-full overflow-hidden">
            <table className="w-full">
                <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                    <tr>
                        <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                            Request #
                        </th>
                        <th className="py-3 px-4">Items</th>
                        <th className="py-3 px-4">Priority</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Date & Time</th>
                        <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl">
                            More
                        </th>
                    </tr>
                </thead>

                <tbody className="text-[#2C323C] text-base font-medium divide-y divide-[#D7D8D9]">
                    {requests.map((req, index) => (
                        <tr key={index}>
                            <td className="py-3 px-4">{req.id}</td>
                            <td className="py-3 px-4">{req.item}</td>
                            <td
                                className={`py-3 px-4 ${
                                    priorityColors[req.priority]
                                }`}
                            >
                                {req.priority}
                            </td>
                            <td
                                className={`py-3 px-4 font-semibold ${
                                    statusColors[req.status]
                                }`}
                            >
                                {req.status}
                            </td>
                            <td className="py-3 px-4">
                                <div className="flex flex-col">
                                    {req.date}
                                    <span className="text-gray-400">
                                        at {req.time}
                                    </span>
                                </div>
                            </td>
                            <td className="py-3 px-4 flex space-x-3">
                                <button className="text-[#9B9DA2] hover:text-gray-500">
                                    <FontAwesomeIcon icon={faEye} />
                                </button>
                                <button className="text-[#9B9DA2] hover:text-gray-500">
                                    <FontAwesomeIcon icon={faEdit} />
                                </button>
                                <button className="text-[#9B9DA2] hover:text-gray-500">
                                    <FontAwesomeIcon icon={faTrash} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Pagination */}
            <div className="p-4 flex justify-end space-x-2 font-medium text-sm">
                <button className="px-3 py-1 bg-[#009FDC] text-white rounded-full hover:bg-[#0077B6] transition">
                    1
                </button>
                <button className="px-3 py-1 border border-[#B9BBBD] bg-white rounded-full hover:bg-gray-100 transition">
                    2
                </button>
                <button className="px-3 py-1 border border-[#B9BBBD] bg-white rounded-full hover:bg-gray-100 transition">
                    3
                </button>
                <span className="px-3 py-1 text-[#B9BBBD]">...</span>
                <button className="px-3 py-1 bg-[#009FDC] text-white rounded-full hover:bg-[#0077B6] transition">
                    Next
                </button>
            </div>
        </div>
    );
};

export default RequestTable;
