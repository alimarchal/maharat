import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faPlus } from "@fortawesome/free-solid-svg-icons";
import { Link } from "@inertiajs/react";
import { usePage } from "@inertiajs/react";
import ViewTaskModal from "./ViewTaskModal";

const TasksTable = () => {
    const user_id = usePage().props.auth.user.id;
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);

    const [selectedFilter, setSelectedFilter] = useState("All");
    const filters = ["All", "Pending", "Approved", "Referred", "Rejected"];

    useEffect(() => {
        const fetchTasks = async () => {
            setLoading(true);
            try {
                const response = await fetch(
                    `/api/v1/tasks?include=processStep,process,assignedFromUser,assignedToUser,descriptions,material_request,material_request.items,material_request.items.product,material_request.items.unit,material_request.items.category,material_request.items.urgencyStatus,material_request.requester,material_request.warehouse,material_request.department,material_request.costCenter,rfq,rfq.items,rfq.items.product,rfq.items.unit,rfq.items.category,rfq.items.brand,rfq.items.status,rfq.requester,rfq.warehouse,rfq.department,rfq.costCenter,purchase_order,purchase_order.supplier,purchase_order.user,payment_order,payment_order.supplier,payment_order.user,payment_order.purchase_order,invoice,invoice.items,invoice.client,invoice.representative,budget,budget.department,budget.costCenter,budget_approval_transaction,request_budget,request_budget.department,request_budget.costCenter,request_budget.fiscalPeriod&page=${currentPage}&filter[assigned_to_user_id]=${user_id}`
                );
                const data = await response.json();
                if (response.ok) {
                    setTasks(data.data || []);
                    setLastPage(data.meta?.last_page || 1);
                } else {
                    setError(data.message || "Failed to fetch tasks.");
                }
            } catch (err) {
                console.error("Error fetching tasks:", err);
                setError("Error loading tasks.");
            } finally {
                setLoading(false);
            }
        };
        fetchTasks();
    }, [currentPage]);

    const statusColors = {
        Pending: "text-yellow-500",
        Approved: "text-green-500",
        Rejected: "text-red-500",
        Referred: "text-blue-500",
    };

    const handleViewTask = (task) => {
        setSelectedTask(task);
        setIsViewModalOpen(true);
    };

    return (
        <div className="w-full overflow-hidden">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-[#2C323C]">My Tasks</h2>
                <div className="flex justify-between items-center gap-4">
                    <div className="p-1 space-x-2 border border-[#B9BBBD] bg-white rounded-full">
                        {filters.map((filter) => (
                            <button
                                key={filter}
                                className={`px-6 py-2 rounded-full text-xl transition ${
                                    selectedFilter === filter
                                        ? "bg-[#009FDC] text-white"
                                        : "text-[#9B9DA2]"
                                }`}
                                onClick={() => setSelectedFilter(filter)}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <table className="w-full border-collapse">
                <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                    <tr>
                        <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                            Task Name
                        </th>
                        <th className="py-3 px-4">Created At</th>
                        <th className="py-3 px-4">Urgency</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">From</th>
                        <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl text-center">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="text-[#2C323C] text-base font-medium divide-y divide-[#D7D8D9]">
                    {loading ? (
                        <tr>
                            <td colSpan="7" className="text-center py-12">
                                <div className="w-12 h-12 border-4 border-[#009FDC] border-t-transparent rounded-full animate-spin"></div>
                            </td>
                        </tr>
                    ) : error ? (
                        <tr>
                            <td
                                colSpan="7"
                                className="text-center text-red-500 font-medium py-4"
                            >
                                {error}
                            </td>
                        </tr>
                    ) : tasks.length > 0 ? (
                        tasks
                            .filter(
                                (req) =>
                                    selectedFilter === "All" ||
                                    req.status === selectedFilter
                            )
                            .map((req) => (
                                <tr
                                    key={req}
                                    className="border-b border-gray-200"
                                >
                                    <td className="py-3 px-4">
                                        {req.process?.title}
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex flex-col">
                                            {req.assigned_at
                                                ? new Date(
                                                      req.assigned_at
                                                  ).toLocaleDateString()
                                                : "N/A"}
                                            <span className="text-gray-400">
                                                {req.assigned_at
                                                    ? new Date(
                                                          req.assigned_at
                                                      ).toLocaleTimeString()
                                                    : ""}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">{req.urgency}</td>
                                    <td
                                        className={`py-3 px-4 ${
                                            statusColors[req.status] ||
                                            "text-gray-500"
                                        }`}
                                    >
                                        {req.status}
                                    </td>

                                    <td className="py-3 px-4">
                                        {req.assigned_from_user?.name}
                                    </td>
                                    <td className="py-3 px-4 flex justify-center text-center space-x-3">
                                        <button 
                                            onClick={() => handleViewTask(req)}
                                            className="text-[#9B9DA2] hover:text-gray-500"
                                            title="View Task"
                                        >
                                            <FontAwesomeIcon icon={faEye} />
                                        </button>
                                        {req.status !== "Approved" && (
                                            <Link
                                                href={`/tasks/${req.id}/new`}
                                                className="flex items-center justify-center w-6 h-6 border border-[#9B9DA2] rounded-full text-[#9B9DA2] hover:text-gray-800 hover:border-gray-800 cursor-pointer transition duration-200"
                                            >
                                                <FontAwesomeIcon
                                                    icon={faPlus}
                                                />
                                            </Link>
                                        )}
                                    </td>
                                </tr>
                            ))
                    ) : (
                        <tr>
                            <td
                                colSpan="7"
                                className="text-center text-gray-700 font-medium py-4"
                            >
                                No tasks found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Pagination */}
            {!loading && !error && tasks.length > 0 && (
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

            {/* View Task Modal */}
            {isViewModalOpen && (
                <ViewTaskModal
                    isOpen={isViewModalOpen}
                    onClose={() => setIsViewModalOpen(false)}
                    task={selectedTask}
                />
            )}
        </div>
    );
};

export default TasksTable;
