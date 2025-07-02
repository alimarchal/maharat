import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faChevronRight,
    faChevronDown,
    faChevronUp,
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { Link } from "@inertiajs/react";

const PayablesTable = () => {
    const [allAccounts, setAllAccounts] = useState([]);
    const [payables, setPayables] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);

    // Dropdown state
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedAccounts, setSelectedAccounts] = useState([]);
    const dropdownRef = useRef(null);

    // Get payable accounts
    const getPayableAccounts = (accounts) => {
        return accounts.filter(account => account.name.toLowerCase().includes("payable"));
    };

    // Calculate totals from selected payables
    const calculateTotals = () => {
        return payables.reduce(
            (totals, account) => {
                totals.debit += Number(account.debit_amount) || 0;
                totals.credit += Number(account.credit_amount) || 0;
                return totals;
            },
            { debit: 0, credit: 0 }
        );
    };

    // Fetch all accounts initially
    const fetchAllAccounts = async () => {
        try {
            const response = await axios.get(`/api/v1/accounts`);
            if (response.data && response.data.data) {
                const payableAccounts = getPayableAccounts(response.data.data);
                setAllAccounts(payableAccounts);
            }
        } catch (error) {
            console.error("Error fetching accounts:", error);
            setError(
                "Failed to load accounts. " +
                    (error.response?.data?.message || error.message)
            );
        }
    };

    const fetchPayables = async () => {
        setLoading(true);
        try {
            let url = `/api/v1/accounts`;
            const response = await axios.get(url);
            if (response.data && response.data.data) {
                // Filter to get only payable accounts
                const allPayableAccounts = getPayableAccounts(
                    response.data.data
                );

                // Filter by selected accounts
                let filteredPayables = allPayableAccounts.filter((account) =>
                    selectedAccounts.includes(account.id)
                );

                setPayables(filteredPayables);
                setLastPage(response.data.meta?.last_page || 1);
                setError("");
            }
        } catch (error) {
            console.error("Error fetching payables:", error);
            setError(
                "Failed to load payables. " +
                    (error.response?.data?.message || error.message)
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllAccounts();
    }, []);

    useEffect(() => {
        if (selectedAccounts.length > 0) {
            fetchPayables();
        } else {
            setPayables([]);
            setLoading(false);
        }
    }, [currentPage, selectedAccounts]);

    // Handle clicking outside dropdown to close it
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleAccountSelect = (accountId) => {
        setSelectedAccounts((prev) => {
            if (prev.includes(accountId)) {
                return prev.filter((id) => id !== accountId);
            } else {
                return [...prev, accountId];
            }
        });
    };

    const handleSelectAll = () => {
        if (selectedAccounts.length === allAccounts.length) {
            setSelectedAccounts([]);
        } else {
            setSelectedAccounts(allAccounts.map((account) => account.id));
        }
    };

    const getSelectedAccountNames = () => {
        if (selectedAccounts.length === 0) return "No accounts selected";
        if (selectedAccounts.length === allAccounts.length)
            return "All accounts selected";
        if (selectedAccounts.length === 1) {
            const account = allAccounts.find(
                (acc) => acc.id === selectedAccounts[0]
            );
            return account?.name;
        }
        return `${selectedAccounts.length} accounts selected`;
    };

    const formatAmount = (amount) => {
        const numAmount = Number(amount) || 0;
        return numAmount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const totals = calculateTotals();

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-[#2C323C]">
                    Account Payables
                </h2>
                {/* Account Selection Dropdown */}
                <div className="w-72">
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="w-full px-4 py-3 text-left bg-white border border-[#B9BBBD] rounded-full focus:outline-none focus:ring-2 focus:ring-[#009FDC] focus:border-[#009FDC] flex justify-between items-center"
                        >
                            <span className="text-[#2C323C]">
                                {getSelectedAccountNames()}
                            </span>
                            <FontAwesomeIcon
                                icon={
                                    isDropdownOpen ? faChevronUp : faChevronDown
                                }
                                className="text-[#9B9DA2]"
                            />
                        </button>

                        {isDropdownOpen && (
                            <div className="absolute z-10 w-full max-w-md mt-1 bg-white border border-[#B9BBBD] rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {/* Select All Option */}
                                <div className="px-4 py-3 hover:bg-gray-50 border-b border-gray-200">
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={
                                                selectedAccounts.length ===
                                                    allAccounts.length &&
                                                allAccounts.length > 0
                                            }
                                            onChange={handleSelectAll}
                                            className="mr-3 h-4 w-4 text-[#009FDC] focus:ring-[#009FDC] border-gray-300 rounded flex-shrink-0"
                                        />
                                        <div>
                                            <span className="text-[#2C323C] font-semibold">
                                                Select All
                                            </span>
                                        </div>
                                    </label>
                                </div>
                                {allAccounts.map((account) => (
                                    <div
                                        key={account.id}
                                        className="px-4 py-3 hover:bg-gray-50"
                                    >
                                        <label className="flex items-start cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedAccounts.includes(
                                                    account.id
                                                )}
                                                onChange={() =>
                                                    handleAccountSelect(
                                                        account.id
                                                    )
                                                }
                                                className="mr-3 mt-1 h-4 w-4 text-[#009FDC] focus:ring-[#009FDC] border-gray-300 rounded flex-shrink-0"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <span className="text-[#2C323C] break-words leading-tight">
                                                    {account.name}
                                                </span>
                                            </div>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <table className="w-full border-collapse">
                <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                    <tr>
                        <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                            Account Code
                        </th>
                        <th className="py-3 px-4">Account Name</th>
                        <th className="py-3 px-4">Description</th>
                        <th className="py-3 px-4">Debit Amount</th>
                        <th className="py-3 px-4">Credit Amount</th>
                        <th className="py-3 px-4 text-center rounded-tr-2xl rounded-br-2xl">
                            Action
                        </th>
                    </tr>
                </thead>
                <tbody className="text-[#2C323C] text-base font-medium divide-y divide-[#D7D8D9]">
                    {loading ? (
                        <tr>
                            <td colSpan="6" className="text-center py-12">
                                <div className="w-12 h-12 border-4 border-[#009FDC] border-t-transparent rounded-full animate-spin"></div>
                            </td>
                        </tr>
                    ) : error ? (
                        <tr>
                            <td
                                colSpan="6"
                                className="text-center text-red-500 font-medium py-4"
                            >
                                {error}
                            </td>
                        </tr>
                    ) : payables.length > 0 ? (
                        <>
                            {payables.map((account) => (
                                <tr key={account.id}>
                                    <td className="py-3 px-4">
                                        {account.account_number}
                                    </td>
                                    <td className="py-3 px-4">
                                        {account.name}
                                    </td>
                                    <td
                                        className="py-3 px-4 max-w-xs truncate"
                                        title={account.description}
                                    >
                                        {account.description}
                                    </td>
                                    <td className="py-3 px-4">
                                        {formatAmount(account.debit_amount)} SAR
                                    </td>
                                    <td className="py-3 px-4">
                                        {formatAmount(account.credit_amount)}{" "}
                                        SAR
                                    </td>
                                    <td className="py-3 px-4 flex justify-center items-center text-center space-x-3">
                                        <Link
                                            href={`/account-payables/${account.id}/details`}
                                            className="text-[#9B9DA2] hover:text-gray-500"
                                            title="View Payable Details"
                                        >
                                            <FontAwesomeIcon
                                                icon={faChevronRight}
                                            />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </>
                    ) : selectedAccounts.length === 0 ? (
                        <tr>
                            <td
                                colSpan="6"
                                className="text-center text-[#2C323C] font-medium py-4"
                            >
                                Please select at least one account to view data.
                            </td>
                        </tr>
                    ) : (
                        <tr>
                            <td
                                colSpan="6"
                                className="text-center text-[#2C323C] font-medium py-4"
                            >
                                No Account Payables found for selected accounts.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Totals Summary - Only show when there are payables */}
            {!loading && !error && payables.length > 0 && (
                <div className="mt-6 pt-4 border-t-2 border-[#D7D8D9]">
                    <div className="flex justify-end space-x-4">
                        <div className="bg-[#C7E7DE] px-6 py-3 rounded-lg">
                            <span className="text-[#2C323C] text-xl font-medium mr-4">
                                Total Debit:
                            </span>
                            <span className="text-lg font-bold text-[#009FDC]">
                                {formatAmount(totals.debit)} SAR
                            </span>
                        </div>
                        <div className="bg-[#C7E7DE] px-6 py-3 rounded-lg">
                            <span className="text-[#2C323C] text-xl font-medium mr-4">
                                Total Credit:
                            </span>
                            <span className="text-lg font-bold text-[#009FDC]">
                                {formatAmount(totals.credit)} SAR
                            </span>
                        </div>
                        <div className="bg-[#C7E7DE] px-6 py-3 rounded-lg">
                            <span className="text-[#2C323C] text-xl font-medium mr-4">
                                Net Balance:
                            </span>
                            <span
                                className={`text-lg font-bold ${
                                    totals.credit - totals.debit >= 0
                                        ? "text-green-600"
                                        : "text-red-600"
                                }`}
                            >
                                {formatAmount(totals.credit - totals.debit)} SAR
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Pagination */}
            {!loading && !error && payables.length > 0 && (
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
        </div>
    );
};

export default PayablesTable;
