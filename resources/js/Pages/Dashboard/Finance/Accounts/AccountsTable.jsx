import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash, faPlus, faCheck } from "@fortawesome/free-solid-svg-icons";
import { Link } from "@inertiajs/react";
import axios from "axios";
import AccountsModal from "./AccountsModal";

const AccountsTable = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [progress, setProgress] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [selectedFilter, setSelectedFilter] = useState("All");
    const filters = ["All", "Approved", "Pending"];

    const [accounts, setAccounts] = useState([]);
    const [costCenters, setCostCenters] = useState([]);
    const [accountTypes, setAccountTypes] = useState([]);
    const [accountTypeMap, setAccountTypeMap] = useState({});
    const [newAccount, setNewAccount] = useState({
        name: "",
        description: "",
        chart_of_account_id: "",
        cost_center_id: "",
        status: "Pending"
    });

    // Fetch accounts data
    const fetchAccounts = async () => {
        setLoading(true);
        setProgress(0);
        let progressInterval;
        
        try {
            progressInterval = setInterval(() => {
                setProgress((prev) => prev >= 90 ? 90 : prev + 10);
            }, 200);

            // Get all accounts with basic relationships
            const response = await axios.get(`/api/v1/accounts?include=costCenter,chartOfAccount,chartOfAccount.accountCode`);
            
            if (response.data && response.data.data) {
                // Log the response to see the structure
                console.log('Accounts response:', response.data.data);
                
                // Filter accounts based on selected filter
                let filteredAccounts = response.data.data;
                if (selectedFilter !== "All") {
                    filteredAccounts = response.data.data.filter(account => 
                        account.status.toLowerCase() === selectedFilter.toLowerCase()
                    );
                }
                
                setAccounts(filteredAccounts);
                setError("");
            }
        } catch (error) {
            console.error('Error fetching accounts:', error);
            setError("Failed to load accounts");
        } finally {
            if (progressInterval) clearInterval(progressInterval);
            setProgress(100);
            setTimeout(() => setLoading(false), 500);
        }
    };

    // Fetch cost centers and account types
    const fetchFormData = async () => {
        try {
            const [costCentersResponse, chartOfAccountsResponse] = await Promise.all([
                axios.get('/api/v1/cost-centers'),
                axios.get('/api/v1/chart-of-accounts?include=accountCode')
            ]);
            
            setCostCenters(costCentersResponse.data.data || []);
            
            // Extract unique account types from chart of accounts
            const uniqueTypes = new Map();
            chartOfAccountsResponse.data.data.forEach(item => {
                if (item.account_code && !uniqueTypes.has(item.account_code.id)) {
                    uniqueTypes.set(item.account_code.id, {
                        id: item.id,
                        name: item.account_code.account_type
                    });
                }
            });
            
            setAccountTypes(Array.from(uniqueTypes.values()));
        } catch (error) {
            console.error('Error fetching form data:', error);
        }
    };

    useEffect(() => {
        fetchAccounts();
        fetchFormData();
    }, [selectedFilter]);

    const handleFilterChange = (filter) => {
        setSelectedFilter(filter);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewAccount({
            ...newAccount,
            [name]: value
        });
    };

    const handleEditInputChange = (e) => {
        const { name, value } = e.target;
        setSelectedAccount({
            ...selectedAccount,
            [name]: value
        });
    };

    const handleSave = async (formData) => {
        console.log('handleSave called with data:', formData);
        setIsSaving(true);
        setError("");
        try {
            // The data is already properly formatted in the modal
            console.log('Sending POST request to /api/v1/accounts with data:', formData);
            const response = await axios.post('/api/v1/accounts', formData);
            console.log('Account created successfully:', response.data);
            fetchAccounts();
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error saving account:", error);
            setError(error.response?.data?.message || "Failed to save account");
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (account) => {
        setSelectedAccount({
            ...account,
            chart_of_account_id: account.chart_of_account_id,
            cost_center_id: account.cost_center_id,
            status: account.status
        });
        setIsEditModalOpen(true);
    };

    const handleUpdate = async (formData) => {
        setIsSaving(true);
        try {
            await axios.put(`/api/v1/accounts/${selectedAccount.id}`, formData);
            setIsEditModalOpen(false);
            fetchAccounts();
        } catch (error) {
            console.error("Error updating account:", error);
            setError("Failed to update account");
        } finally {
            setIsSaving(false);
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
            console.error('Error deleting account:', error);
            setError('Failed to delete account: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsDeleting(false);
        }
    };

    const getStatusClass = (status) => {
        switch (status?.toLowerCase()) {
            case 'approved':
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
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
                </div>
            </div>

            {/* Loading Bar */}
            {loading && (
                <div className="absolute left-[55%] transform -translate-x-1/2 mt-12 w-2/3">
                    <div className="relative w-full h-12 bg-gray-300 rounded-full flex items-center justify-center text-xl font-bold text-white">
                        <div
                            className="absolute left-0 top-0 h-12 bg-[#009FDC] rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        ></div>
                        <span className="absolute text-white">
                            {progress < 60 ? "Please Wait, Fetching Details..." : `${progress}%`}
                        </span>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-center" role="alert">
                    <span className="block sm:inline">{error}</span>
                </div>
            )}

            {!loading && (
            <table className="w-full border-collapse">
                    <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-center">
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
                        {accounts.length > 0 ? (
                            accounts.map((account) => (
                            <tr key={account.id}>
                                    <td className="py-3 px-4 text-center">{account.id}</td>
                                    <td className="py-3 px-4 text-center">{account.name}</td>
                                    <td className="py-3 px-4 text-center">
                                    {account.description}
                                </td>
                                    <td className="py-3 px-4 text-center">
                                        {account.chart_of_account?.account_code?.account_type || 'N/A'}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        {account.cost_center ? account.cost_center.name : 'N/A'}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <span className={`px-3 py-1 inline-flex text-sm leading-6 font-semibold rounded-full ${getStatusClass(account.status)}`}>
                                            {account.status}
                                        </span>
                                </td>
                                    <td className="py-3 px-4 flex justify-center space-x-3">
                                        <button 
                                            className="text-gray-600 hover:text-gray-800"
                                            onClick={() => handleEdit(account)}
                                        >
                                        <FontAwesomeIcon icon={faEdit} />
                                        </button>
                                        <button 
                                            className="text-red-600 hover:text-red-900"
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
            )}

            {!loading && (
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
                        <FontAwesomeIcon icon={faPlus} className="mr-2" /> Add an Account
                </button>
                <div
                    className="absolute top-1/2 right-0 w-[45%] h-[3px] max-sm:w-[35%] flex-grow"
                    style={{
                        background:
                            "linear-gradient(to left, #9B9DA2, #9B9DA200)",
                    }}
                ></div>
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
