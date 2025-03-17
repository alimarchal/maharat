import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash, faPlus } from "@fortawesome/free-solid-svg-icons";
import { Link } from "@inertiajs/react";
import axios from "axios";
import CostCenterModal from "./CostCenterModal";

const CostCenterTable = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [selectedFilter, setSelectedFilter] = useState("All");
    const [costCenters, setCostCenters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCostCenter, setSelectedCostCenter] = useState(null);

    const filters = ["All", "Approved", "Pending"];

    const fetchCostCenters = async () => {
        try {
            setLoading(true);
            const response = await axios.get(
                "/api/v1/cost-centers?include=parent,children,department,manager,budgetOwner"
            );
            setCostCenters(response.data.data);
            setError(null);
        } catch (error) {
            console.error("Error fetching cost centers:", error);
            setError("Failed to load cost centers. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCostCenters();
    }, []);

    const handleDelete = async (id) => {
        if (
            window.confirm("Are you sure you want to delete this Cost Center?")
        ) {
            try {
                await axios.delete(`/api/v1/cost-centers/${id}`);
                fetchCostCenters();
            } catch (error) {
                console.error("Error deleting cost center:", error);
            }
        }
    };

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-3xl font-bold text-[#2C323C] mb-4">
                    Cost Centers
                </h2>
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
                    <Link
                        href="/cost-centers/sub-cost-centers"
                        className="bg-[#009FDC] text-white px-4 py-2 rounded-full text-xl font-medium"
                    >
                        Create Sub Cost Center
                    </Link>
                </div>
            </div>

            <table className="w-full border-collapse">
                <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                    <tr>
                        <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                            ID
                        </th>
                        <th className="py-3 px-4">Name</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Department/Unit</th>
                        <th className="py-3 px-4">Manager</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Description</th>
                        <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl">
                            Action
                        </th>
                    </tr>
                </thead>
                <tbody className="text-[#2C323C] text-base font-medium divide-y divide-[#D7D8D9]">
                    {loading ? (
                        <tr>
                            <td colSpan="8" className="text-center py-12">
                                <div className="w-12 h-12 border-4 border-[#009FDC] border-t-transparent rounded-full animate-spin"></div>
                            </td>
                        </tr>
                    ) : error ? (
                        <tr>
                            <td
                                colSpan="8"
                                className="text-center text-red-500 font-medium py-4"
                            >
                                {error}
                            </td>
                        </tr>
                    ) : costCenters.length > 0 ? (
                        costCenters
                            .filter(
                                (center) =>
                                    selectedFilter === "All" ||
                                    center.status === selectedFilter
                            )
                            .map((center) => (
                                <tr key={center.id}>
                                    <td className="py-3 px-4">{center.id}</td>
                                    <td className="py-3 px-4">{center.name}</td>
                                    <td className="py-3 px-4">
                                        {center.cost_center_type || "N/A"}
                                    </td>
                                    <td className="py-3 px-4">
                                        {center.department?.name || "N/A"}
                                    </td>
                                    <td className="py-3 px-4">
                                        {center.manager?.name || "N/A"}
                                    </td>
                                    <td className="py-3 px-4">
                                        {center.status}
                                    </td>
                                    <td className="py-3 px-4">
                                        {center.description}
                                    </td>
                                    <td className="py-3 px-4 flex space-x-3">
                                        <button
                                            onClick={() => {
                                                setSelectedCostCenter(center);
                                                setIsModalOpen(true);
                                            }}
                                            className="text-[#9B9DA2] hover:text-gray-500"
                                        >
                                            <FontAwesomeIcon icon={faEdit} />
                                        </button>

                                        <button
                                            className="text-[#9B9DA2] hover:text-gray-500"
                                            onClick={() =>
                                                handleDelete(center.id)
                                            }
                                        >
                                            <FontAwesomeIcon icon={faTrash} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                    ) : (
                        <tr>
                            <td
                                colSpan="8"
                                className="text-center text-[#2C323C] font-medium py-4"
                            >
                                No Cost Centers found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            <div className="flex justify-center items-center relative w-full my-8">
                <div
                    className="absolute top-1/2 left-0 w-[45%] h-[3px] max-sm:w-[35%] flex-grow"
                    style={{
                        background:
                            "linear-gradient(to right, #9B9DA2, #9B9DA200)",
                    }}
                ></div>
                <button
                    type="button"
                    className="p-2 text-base sm:text-lg flex items-center bg-white rounded-full border border-[#B9BBBD] text-[#9B9DA2] transition-all duration-300 hover:border-[#009FDC] hover:bg-[#009FDC] hover:text-white hover:scale-105"
                    onClick={() => setIsModalOpen(true)}
                >
                    <FontAwesomeIcon icon={faPlus} className="mr-2" /> Add a
                    Cost Center
                </button>
                <div
                    className="absolute top-1/2 right-0 w-[45%] h-[3px] max-sm:w-[35%] flex-grow"
                    style={{
                        background:
                            "linear-gradient(to left, #9B9DA2, #9B9DA200)",
                    }}
                ></div>
            </div>

            {/* Render the modal */}
            <CostCenterModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedCostCenter(null);
                }}
                costCenterData={selectedCostCenter}
                fetchCostCenters={fetchCostCenters}
            />
        </div>
    );
};

export default CostCenterTable;
