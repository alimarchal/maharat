import React, { useEffect, useState } from "react";
import { usePage } from "@inertiajs/react";
import axios from "axios";

const ViewReceivableDetails = () => {
    const { receivableId } = usePage().props;

    const [transactions, setTransactions] = useState([]);
    const [accountInfo, setAccountInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [finalBalance, setFinalBalance] = useState(0);

    useEffect(() => {
        const fetchAccountDetails = async () => {
            setLoading(true);
            try {
                // Fetch account info and transaction flows
                const [accountResponse, flowsResponse] =
                    await Promise.all([
                        axios.get(`/api/v1/accounts/${receivableId}`),
                        axios.get(`/api/v1/accounts/${receivableId}/transaction-flows`),
                    ]);
                
                // Set account info from the account API call
                setAccountInfo(accountResponse.data.data);
                
                // Set transaction flows from the flows API call
                const flows = flowsResponse.data.data || [];
                
                // Calculate running balance for each transaction
                let runningBalance = 0;
                const flowsWithBalance = flows.map((flow, index) => {
                    if (flow.transaction_type === 'credit') {
                        runningBalance += parseFloat(flow.amount);
                    } else {
                        runningBalance -= parseFloat(flow.amount);
                    }
                    return {
                        ...flow,
                        running_balance: runningBalance
                    };
                });
                
                setTransactions(flowsWithBalance);
                setFinalBalance(runningBalance);
                setError("");
            } catch (error) {
                console.error("Error fetching account details:", error);
                setError("Failed to load account details");
            } finally {
                setLoading(false);
            }
        };

        if (receivableId) {
            fetchAccountDetails();
        }
    }, [receivableId]);

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

        return `${accountName} Details`;
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
                            #
                        </th>
                        <th className="py-3 px-4">Transaction Date</th>
                        <th className="py-3 px-4">Reference</th>
                        <th className="py-3 px-4">Description</th>
                        <th className="py-3 px-4">Credit</th>
                        <th className="py-3 px-4">Debit</th>
                        <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl">
                            Attachment
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
                                <td className="py-3 px-4 text-center">{flow.transaction_date}</td>
                                <td className="py-3 px-4 text-center">{flow.reference_number || 'N/A'}</td>
                                <td className="py-3 px-4 text-center">
                                    <div className="max-w-xs mx-auto">
                                        <div className="font-medium">{flow.description}</div>
                                    </div>
                                </td>
                                <td className="py-3 px-4 text-center">
                                    {flow.transaction_type === 'credit' ? (
                                        <span className="font-semibold text-green-600">
                                            {flow.amount}
                                        </span>
                                    ) : (
                                        ''
                                    )}
                                </td>
                                <td className="py-3 px-4 text-center">
                                    {flow.transaction_type === 'debit' ? (
                                        <span className="font-semibold text-red-600">
                                            {flow.amount}
                                        </span>
                                    ) : (
                                        ''
                                    )}
                                </td>
                                <td className="py-3 px-4 text-center">
                                    {flow.attachment ? (
                                        <div className="flex items-center justify-center">
                                            <img
                                                src="/images/pdf-file.png"
                                                alt="PDF"
                                                className="h-6 w-6 cursor-pointer hover:opacity-80"
                                                onClick={() =>
                                                    flow.attachment &&
                                                    window.open(
                                                        flow.attachment.startsWith('http') 
                                                            ? flow.attachment 
                                                            : `/storage/${flow.attachment}`,
                                                        "_blank"
                                                    )
                                                }
                                            />
                                        </div>
                                    ) : (
                                        'N/A'
                                    )}
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

            {/* Balance section below table */}
            {!loading && !error && (
                <div className="mt-6 pt-4 border-t-2 border-[#D7D8D9]">
                    <div className="flex justify-end">
                        <div className="bg-[#C7E7DE] px-6 py-3 rounded-lg">
                            <span className="text-[#2C323C] text-xl font-medium mr-4">
                                Total:
                            </span>
                            <span className={`text-lg font-bold ${finalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {finalBalance.toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ViewReceivableDetails;
