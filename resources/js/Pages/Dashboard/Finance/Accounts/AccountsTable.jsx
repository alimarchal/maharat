import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash, faPlus, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import AccountsModal from "./AccountsModal";
import SuccessModal from "../../../../Components/SuccessModal";
import { Link } from "@inertiajs/react";

const AccountsTable = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [successModal, setSuccessModal] = useState({
        isOpen: false,
        message: "",
        title: "Success!"
    });

    const [selectedFilter, setSelectedFilter] = useState("All");
    const filters = ["All", "Approved", "Pending"];

    const [accounts, setAccounts] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [costCenters, setCostCenters] = useState([]);
    const [accountTypes, setAccountTypes] = useState([]);

    const fetchAccounts = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await axios.get(
                `/api/v1/accounts?include=costCenter,accountCode&page=${currentPage}`
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
            const [costCentersResponse, accountCodesResponse] = await Promise.all([
                axios.get("/api/v1/cost-centers"),
                axios.get("/api/v1/account-codes"),
            ]);

            setCostCenters(costCentersResponse.data.data || []);
            setAccountTypes(accountCodesResponse.data.data || []);
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
            setSuccessModal({
                isOpen: true,
                message: "Account created successfully!",
                title: "Success!"
            });
        } catch (error) {
            setError(error.response?.data?.message || "Failed to save account");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (account) => {
        const accountToEdit = {
            ...account,
            account_code_id: account.account_code?.id || '',
        };
        setSelectedAccount(accountToEdit);
        setIsEditModalOpen(true);
        setError("");
    };

    const handleUpdate = async (formData) => {
        setLoading(true);
        setError("");
        try {
            const response = await axios.put(`/api/v1/accounts/${selectedAccount.id}`, formData);
            setIsEditModalOpen(false);
            fetchAccounts();
            
            // Check if this was a Cash account update with credit amount
            if (selectedAccount.id === 12 && selectedAccount.name === 'Cash' && formData.credit_amount) {
                const originalCredit = selectedAccount.credit_amount || 0;
                const newCredit = parseFloat(formData.credit_amount);
                const increase = newCredit - originalCredit;
                
                if (increase > 0) {
                    const vatAmount = increase * 0.15;
                    
                    setSuccessModal({
                        isOpen: true,
                        message: `Account updated successfully! Automatic balancing applied.`,
                        title: "Success!"
                    });
                } else {
                    setSuccessModal({
                        isOpen: true,
                        message: "Account updated successfully!",
                        title: "Success!"
                    });
                }
            } 
            // Check if this was a VAT Collected account update with credit amount
            else if (selectedAccount.id === 9 && selectedAccount.name === 'VAT Collected (on Maharat invoices)' && formData.credit_amount) {
                const originalCredit = selectedAccount.credit_amount || 0;
                const newCredit = parseFloat(formData.credit_amount);
                const increase = newCredit - originalCredit;
                
                if (increase > 0) {
                    setSuccessModal({
                        isOpen: true,
                        message: `Account updated successfully! Automatic balancing applied: VAT Receivables debited by ${increase.toFixed(2)}.`,
                        title: "Success!"
                    });
                } else {
                    setSuccessModal({
                        isOpen: true,
                        message: "Account updated successfully!",
                        title: "Success!"
                    });
                }
            } else {
                setSuccessModal({
                    isOpen: true,
                    message: "Account updated successfully!",
                    title: "Success!"
                });
            }
        } catch (error) {
            console.error("Error updating account:", error);
            // Display the actual error message from the API
            const errorMessage = error.response?.data?.message || 
                                error.response?.data?.error || 
                                error.message || 
                                "Failed to update account";
            setError(errorMessage);
            
            // Log detailed error for debugging
            console.error("Detailed error:", {
                status: error.response?.status,
                data: error.response?.data,
                message: errorMessage
            });
            
            // Throw the error so the modal can catch it
            throw error;
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

            <table className="w-full table-fixed">
                <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                    <tr>
                        <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl w-[5%]">
                            ID
                        </th>
                        <th className="py-3 px-4">Name</th>
                        <th className="py-3 px-4">Account Code</th>
                        <th className="py-3 px-4 w-[15%]">Description</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Cost Center</th>
                        <th className="py-3 px-4">Total Credit Amount</th>
                        <th className="py-3 px-4">Total Debit Amount</th>
                        <th className="py-3 px-4 w-[7%]">Status</th>
                        <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl text-center w-[10%]">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="text-[#2C323C] text-base font-medium divide-y divide-[#D7D8D9]">
                    {loading ? (
                        <tr>
                            <td colSpan="10" className="text-center py-12">
                                <div className="w-12 h-12 border-4 border-[#009FDC] border-t-transparent rounded-full animate-spin"></div>
                            </td>
                        </tr>
                    ) : error ? (
                        <tr>
                            <td
                                colSpan="10"
                                className="text-center text-red-500 font-medium py-4"
                            >
                                {error}
                            </td>
                        </tr>
                    ) : accounts.length > 0 ? (
                        accounts.map((account) => (
                            <tr key={account.id}>
                                <td className="py-3 px-4 truncate">{account.id}</td>
                                <td className="py-3 px-4">{account.name}</td>
                                <td className="py-3 px-4 truncate">
                                    {account.account_number || "N/A"}
                                </td>
                                <td className="py-3 px-4">
                                    {account.description}
                                </td>
                                <td className="py-3 px-4 truncate">
                                    {account.account_code?.account_type || "N/A"}
                                </td>
                                <td className="py-3 px-4 truncate">
                                    {account.cost_center
                                        ? account.cost_center.name
                                        : "N/A"}
                                </td>
                                <td className="py-3 px-4 truncate">
                                    {account.credit_amount && parseFloat(account.credit_amount) > 0 ? account.credit_amount : ''}
                                </td>
                                <td className="py-3 px-4 truncate">
                                    {account.debit_amount && parseFloat(account.debit_amount) > 0 ? account.debit_amount : ''}
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
                                <td className="py-3 px-4">
                                    {(() => {
                                        const accountName = account.name;
                                        const isSpecialAccount = accountName === 'Special accounts';
                                        const hasValue = parseFloat(account.credit_amount) > 0 || parseFloat(account.debit_amount) > 0;

                                        // Define accounts that should NOT have an Edit button
                                        const nonEditable = [
                                            'Liabilities', 'Revenue/Income', 'Cost of Purchases', 
                                            'VAT Paid (on purchases)', 'VAT Collected (on Maharat invoices)',
                                            'Account Receivable', 'Revenue', 'VAT Receivables (On Maharat Invoice)'
                                        ];

                                        // Define accounts that should NOT have a Delete button
                                        const nonDeletable = [
                                            'Assets', 'Liabilities', 'Equity', 'Revenue/Income', 
                                            'Cost of Purchases', 'Operating Expenses', 'Non-Operating Expenses',
                                            'VAT Paid (on purchases)', 'VAT Collected (on Maharat invoices)',
                                            'Account Receivable', 'Revenue', 'VAT Receivables (On Maharat Invoice)',
                                            'Accounts Payable'
                                        ];

                                        // Define accounts that can only be edited (no delete)
                                        const editOnly = [
                                            'Cash', 'Asset'
                                        ];

                                        const canEdit = !nonEditable.includes(accountName);
                                        const canDelete = account.id === 2 ? false : (isSpecialAccount ? !hasValue : !nonDeletable.includes(accountName) && !editOnly.includes(accountName));

                                        return (
                                            <div className="flex justify-center items-center space-x-3">
                                                {canEdit && (
                                                    <button
                                                        className="text-blue-400 hover:text-blue-500"
                                                        onClick={() => handleEdit(account)}
                                                    >
                                                        <FontAwesomeIcon icon={faEdit} />
                                                    </button>
                                                )}
                                                {canDelete && (
                                                    <button
                                                        className="text-red-600 hover:text-red-800"
                                                        onClick={() => handleDelete(account.id)}
                                                        disabled={isDeleting}
                                                    >
                                                        <FontAwesomeIcon icon={faTrash} />
                                                    </button>
                                                )}
                                                <Link
                                                    href={`/accounts/${account.id}/details`}
                                                    className="text-[#9B9DA2] hover:text-gray-500"
                                                    title="View Account Details"
                                                >
                                                    <FontAwesomeIcon icon={faChevronRight} />
                                                </Link>
                                            </div>
                                        );
                                    })()}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="10" className="text-center py-4">
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
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setError("");
                    }}
                    onSave={handleUpdate}
                    account={selectedAccount}
                    isEdit={true}
                />
            )}

            {/* Success Modal */}
            {successModal.isOpen && (
                <SuccessModal
                    isOpen={successModal.isOpen}
                    onClose={() => setSuccessModal({ ...successModal, isOpen: false })}
                    title={successModal.title}
                    message={successModal.message}
                />
            )}
        </div>
    );
};

export default AccountsTable;
