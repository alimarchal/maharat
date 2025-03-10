import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash, faPlus } from "@fortawesome/free-solid-svg-icons";
import { Link } from "@inertiajs/react";
import AccountsModal from "./AccountsModal";

const AccountsTable = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [selectedFilter, setSelectedFilter] = useState("All");
    const filters = ["All", "Approved", "Pending"];

    const [accounts, setAccounts] = useState([
        {
            id: "01",
            name: "Sales",
            description: "All type of income, sales, and revenues",
            type: "assets",
            costCenter: "Management",
            status: "Approved",
        },
        {
            id: "02",
            name: "Purchase",
            description: "All Purchases through POs and petty cash",
            type: "liablities",
            costCenter: "IT",
            status: "Pending",
        },
        {
            id: "03",
            name: "Cash",
            description: "All cash in hand",
            type: "expenses",
            costCenter: "Marketing",
            status: "Approved",
        },
        {
            id: "04",
            name: "Bank",
            description: "Amount in all banks",
            type: "equity",
            costCenter: "Training",
            status: "Pending",
        },
        {
            id: "05",
            name: "Inventory",
            description: "Stock in all warehouses",
            type: "assets",
            costCenter: "Maintenance",
            status: "Pending",
        },
        {
            id: "06",
            name: "Fixed Assets",
            description: "All tangible assets",
            type: "liabilities",
            costCenter: "HR",
            status: "Approved",
        },
        {
            id: "07",
            name: "VAT",
            description: "Total VAT paid and received",
            type: "assets",
            costCenter: "OPR",
            status: "Pending",
        },
    ]);

    const handleSave = async (newAccount) => {
        try {
            const response = await axios.post("/api/v1/accounts", newAccount);
            setAccounts([...accounts, response.data]);
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error saving accounts:", error);
        }
    };

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-3xl font-bold text-[#2C323C] mb-4">
                    Accounts
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
                </div>
            </div>

            <table className="w-full border-collapse">
                <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                    <tr>
                        <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                            ID
                        </th>
                        <th className="py-3 px-4">Name</th>
                        <th className="py-3 px-4">Description</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Cost Center</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl">
                            Action
                        </th>
                    </tr>
                </thead>
                <tbody className="text-[#2C323C] text-base font-medium divide-y divide-[#D7D8D9]">
                    {accounts
                        .filter(
                            (account) =>
                                selectedFilter === "All" ||
                                account.status === selectedFilter
                        )
                        .map((account) => (
                            <tr key={account.id}>
                                <td className="py-3 px-4">{account.id}</td>
                                <td className="py-3 px-4">{account.name}</td>
                                <td className="py-3 px-4">
                                    {account.description}
                                </td>
                                <td className="py-3 px-4">{account.type}</td>
                                <td className="py-3 px-4">
                                    {account.costCenter}
                                </td>
                                <td className="py-3 px-4">{account.status}</td>
                                <td className="py-3 px-4 flex space-x-3">
                                    <Link className="text-[#9B9DA2] hover:text-gray-500">
                                        <FontAwesomeIcon icon={faEdit} />
                                    </Link>
                                    <button className="text-[#9B9DA2] hover:text-gray-500">
                                        <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                </td>
                            </tr>
                        ))}
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
                    Account
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
            {isModalOpen && (
                <AccountsModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                />
            )}
        </div>
    );
};

export default AccountsTable;
