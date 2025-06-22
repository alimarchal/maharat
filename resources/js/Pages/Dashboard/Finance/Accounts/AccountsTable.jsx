import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash, faPlus } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import AccountsModal from "./AccountsModal";

const AccountsTable = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    const [selectedFilter, setSelectedFilter] = useState("All");
    const filters = ["All", "Approved", "Pending"];

    const [accounts, setAccounts] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [costCenters, setCostCenters] = useState([]);
    const [accountTypes, setAccountTypes] = useState([]);

    const fetchAccounts = async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                `/api/v1/accounts?include=costCenter,chartOfAccount,chartOfAccount.accountCode&page=${currentPage}`
            );
            console.log("API Response for accounts:", response.data);
            if (response.data && response.data.data) {
                let filteredAccounts = response.data.data;
                if (selectedFilter !== "All") {
                    filteredAccounts = response.data.data.filter(
                        (account) =>
                            account.status.toLowerCase() ===
                            selectedFilter.toLowerCase()
                    );
                }
                setAccounts(filteredAccounts);
                setLastPage(response.data.meta?.last_page || 1);
                setError("");
            }
        } catch (error) {
            setError("Failed to load accounts");
        } finally {
            setLoading(false);
        }
    };

    const fetchFormData = async () => {
        try {
            const [costCentersResponse, chartOfAccountsResponse] =
                await Promise.all([
                    axios.get("/api/v1/cost-centers"),
                    axios.get("/api/v1/chart-of-accounts?include=accountCode"),
                ]);

            setCostCenters(costCentersResponse.data.data || []);

            const uniqueTypes = new Map();
            chartOfAccountsResponse.data.data.forEach((item) => {
                if (
                    item.account_code &&
                    !uniqueTypes.has(item.account_code.id)
                ) {
                    uniqueTypes.set(item.account_code.id, {
                        id: item.id,
                        name: item.account_code.account_type,
                    });
                }
            });
            setAccountTypes(Array.from(uniqueTypes.values()));
        } catch (error) {
            console.error("Error fetching form data:", error);
        }
    };

    useEffect(() => {
        fetchAccounts();
        fetchFormData();
    }, [selectedFilter, currentPage]);

    const handleFilterChange = (filter) => {
        setSelectedFilter(filter);
    };

    const handleSave = async (formData) => {
        setLoading(true);
        try {
            await axios.post("/api/v1/accounts", formData);
            fetchAccounts();
            setIsModalOpen(false);
        } catch (error) {
            setError(error.response?.data?.message || "Failed to save account");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (account) => {
        let chartOfAccountId = "";
        if (account.chart_of_account && account.chart_of_account.account_code) {
            chartOfAccountId = String(account.chart_of_account.account_code.id);
        }
        setSelectedAccount({
            ...account,
            chart_of_account_id: chartOfAccountId,
            cost_center_id: account.cost_center_id,
            status: account.status,
            credit_amount: account.credit_amount,
            debit_amount: account.debit_amount,
        });
        setIsEditModalOpen(true);
    };

    const handleUpdate = async (formData) => {
        setLoading(true);
        try {
            await axios.put(`/api/v1/accounts/${selectedAccount.id}`, formData);
            setIsEditModalOpen(false);
            fetchAccounts();
        } catch (error) {
            console.error("Error updating account:", error);
            setError("Failed to update account");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this account?")) return;
        if (isDeleting) return;

        setIsDeleting(true);
        try {
            await axios.delete(`/api/v1/accounts/${id}`);
            fetchAccounts();
        } catch (error) {
            console.error("Error deleting account:", error);
            setError(
                "Failed to delete account: " +
                    (error.response?.data?.message || error.message)
            );
        } finally {
            setIsDeleting(false);
        }
    };

    const getStatusClass = (status) => {
        switch (status?.toLowerCase()) {
            case "approved":
                return "bg-green-100 text-green-800";
            case "pending":
                return "bg-yellow-100 text-yellow-800";
            default:
                return "bg-gray-100 text-gray-800";
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
                                onClick={() => handleFilterChange(filter)}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                    <button
                        type="button"
                        className="bg-[#009FDC] text-white px-4 py-2 rounded-full text-xl font-medium"
                        onClick={() => setIsModalOpen(true)}
                    >
                        Create a new Account
                    </button>
                </div>
            </div>

            <table className="w-full">
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
                        <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl text-center">
                            Action
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
                    ) : accounts.length > 0 ? (
                        accounts.map((account) => (
                            <tr key={account.id}>
                                <td className="py-3 px-4">{account.id}</td>
                                <td className="py-3 px-4">{account.name}</td>
                                <td className="py-3 px-4">
                                    {account.description}
                                </td>
                                <td className="py-3 px-4">
                                    {account.chart_of_account?.account_code
                                        ?.account_type || "N/A"}
                                </td>
                                <td className="py-3 px-4">
                                    {account.cost_center
                                        ? account.cost_center.name
                                        : "N/A"}
                                </td>
                                <td className="py-3 px-4">
                                    <span
                                        className={`px-3 py-1 inline-flex text-sm leading-6 font-semibold rounded-full ${getStatusClass(
                                            account.status
                                        )}`}
                                    >
                                        {account.status}
                                    </span>
                                </td>
                                <td className="py-3 px-4 flex justify-center space-x-3">
                                    <button
                                        className="text-blue-400 hover:text-blue-500"
                                        onClick={() => handleEdit(account)}
                                    >
                                        <FontAwesomeIcon icon={faEdit} />
                                    </button>
                                    <button
                                        className="text-red-600 hover:text-red-800"
                                        onClick={() => handleDelete(account.id)}
                                        disabled={isDeleting}
                                    >
                                        <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="7" className="text-center py-4">
                                No accounts found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Pagination */}
            {!loading && !error && accounts.length > 0 && (
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

            {/* Add Account Modal */}
            {isModalOpen && (
                <AccountsModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                />
            )}

            {/* Edit Account Modal */}
            {isEditModalOpen && selectedAccount && (
                <AccountsModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    onSave={handleUpdate}
                    account={selectedAccount}
                    isEdit={true}
                />
            )}
        </div>
    );
};

export default AccountsTable;
