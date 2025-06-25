import React, { useEffect, useState } from "react";
import { usePage } from "@inertiajs/react";
import axios from "axios";

const AccountDetailsTable = () => {
    const { accountId } = usePage().props;

    const [transactions, setTransactions] = useState([]);
    const [accountInfo, setAccountInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchAccountDetails = async () => {
            setLoading(true);
            try {
                // Fetch account info and transaction flows
                const [accountResponse, flowsResponse] =
                    await Promise.all([
                        axios.get(`/api/v1/accounts/${accountId}`),
                        axios.get(`/api/v1/accounts/${accountId}/transaction-flows`),
                    ]);
                
                // Set account info from the account API call
                setAccountInfo(accountResponse.data.data);
                
                // Set transaction flows from the flows API call
                setTransactions(flowsResponse.data.data || []);
                
                setError("");
            } catch (error) {
                console.error("Error fetching account details:", error);
                setError("Failed to load account details");
            } finally {
                setLoading(false);
            }
        };

        if (accountId) {
            fetchAccountDetails();
        }
    }, [accountId]);

    // Generate dynamic heading based on account name
    const getHeading = () => {
        if (!accountInfo || !accountInfo.name) {
            return "Account Details";
        }

        let accountName = accountInfo.name;

        // Remove text in parentheses (including the parentheses)
        accountName = accountName.replace(/\s*\([^)]*\)/g, '');

        // Remove account-related words at the end (case insensitive)
        const accountWords = ['account', 'accounts', 'Account', 'Accounts'];
        const words = accountName.trim().split(' ');
        const lastWord = words[words.length - 1];
        
        if (accountWords.includes(lastWord)) {
            words.pop(); // Remove the last word
            accountName = words.join(' ').trim();
        }

        // If accountName is empty after processing, use a default
        if (!accountName) {
            return "Account Details";
        }

        return `${accountName} Account Details`;
    };

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-3xl font-bold text-[#2C323C] mb-4">
                    {getHeading()}
                </h2>
            </div>

            <table className="w-full">
                <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-center">
                    <tr>
                        <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                            ID
                        </th>
                        <th className="py-3 px-4">Transaction Type</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Balance</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Reference</th>
                        <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl">
                            Description
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
                    ) : transactions.length > 0 ? (
                        transactions.map((flow, index) => (
                            <tr key={flow.id}>
                                <td className="py-3 px-4 text-center">{index + 1}</td>
                                <td className="py-3 px-4 text-center">
                                    <span className={`px-3 py-1 inline-flex text-sm leading-6 font-semibold rounded-full ${
                                        flow.transaction_type === 'credit' 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                                        {flow.transaction_type.toUpperCase()}
                                    </span>
                                </td>
                                <td className="py-3 px-4 text-center">
                                    <span className={`font-semibold ${
                                        flow.transaction_type === 'credit' 
                                            ? 'text-green-600' 
                                            : 'text-red-600'
                                    }`}>
                                        {flow.transaction_type === 'credit' ? '+' : '-'}{flow.amount}
                                    </span>
                                </td>
                                <td className="py-3 px-4 text-center font-semibold">{flow.balance_after}</td>
                                <td className="py-3 px-4 text-center">{flow.transaction_date}</td>
                                <td className="py-3 px-4 text-center">{flow.reference_number || 'N/A'}</td>
                                <td className="py-3 px-4 text-center">
                                    <div className="max-w-xs mx-auto">
                                        <div className="font-medium">{flow.description}</div>
                                    </div>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="7" className="text-center py-4">
                                No transaction flows found for this account.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default AccountDetailsTable;
