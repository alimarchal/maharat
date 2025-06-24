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
                // Fetch both transactions and account info
                const [transactionsResponse, accountResponse] =
                    await Promise.all([
                        axios.get(`/api/v1/accounts/${accountId}`),
                        axios.get(`/api/v1/accounts/${accountId}/transactions`),
                    ]);
                console.log("Account Details:", accountResponse);
                setAccountInfo(
                    accountResponse.data.data || accountResponse.data
                );
                setTransactions(transactionsResponse.data.data || []);
                setError("");
            } catch (err) {
                setError("Failed to load account details");
            } finally {
                setLoading(false);
            }
        };

        fetchAccountDetails();
    }, [accountId]);

    // Generate dynamic heading based on account name
    const getHeading = () => {
        if (!accountInfo || !accountInfo.name) {
            return "Account Details";
        }
        return `${accountInfo.name} Account Details`;
    };

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-3xl font-bold text-[#2C323C] mb-4">
                    {getHeading()}
                </h2>
            </div>

            <table className="w-full">
                <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                    <tr>
                        <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                            ID
                        </th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Credit Amount</th>
                        <th className="py-3 px-4">Debit Amount</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl text-center">
                            Description
                        </th>
                    </tr>
                </thead>
                <tbody className="text-[#2C323C] text-base font-medium divide-y divide-[#D7D8D9]">
                    {loading ? (
                        <tr>
                            <td colSpan="6" className="text-center py-6">
                                Loading...
                            </td>
                        </tr>
                    ) : error ? (
                        <tr>
                            <td
                                colSpan="6"
                                className="text-center text-red-500 py-6"
                            >
                                {error}
                            </td>
                        </tr>
                    ) : transactions.length > 0 ? (
                        transactions.map((txn) => (
                            <tr key={txn.id}>
                                <td className="py-3 px-4">{txn.id}</td>
                                <td className="py-3 px-4">
                                    {txn.type || "N/A"}
                                </td>
                                <td className="py-3 px-4">
                                    {txn.credit_amount || 0}
                                </td>
                                <td className="py-3 px-4">
                                    {txn.debit_amount || 0}
                                </td>
                                <td className="py-3 px-4">
                                    {txn.date || "N/A"}
                                </td>
                                <td className="py-3 px-4">
                                    {txn.description || "-"}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="6" className="text-center py-4">
                                No Account transaction records found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default AccountDetailsTable;
