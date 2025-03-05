import React, { useEffect, useState } from "react";

const IncomeStatementTable = () => {
    const [incomeData, setIncomeData] = useState([]);

    const staticIncomeData = {
        revenues: [
            {
                category: "Individual Donations",
                unrestricted: 150000,
                restricted: 50000,
            },
            { category: "Grants", unrestricted: 50000, restricted: 100000 },
            {
                category: "Investment Income",
                unrestricted: 75000,
                restricted: 0,
            },
            { category: "Other", unrestricted: 0, restricted: 0 },
        ],
        expenses: [
            {
                category: "Program Services",
                unrestricted: 160000,
                restricted: 0,
            },
            {
                category: "General and Administrative",
                unrestricted: 37000,
                restricted: 0,
            },
            { category: "Fundraising", unrestricted: 38000, restricted: 0 },
        ],
        netAssets: {
            changeInNetAssets: { unrestricted: 40000, restricted: 150000 },
            beginningOfYear: { unrestricted: 4300, restricted: 0 },
            endOfYear: { unrestricted: 44300, restricted: 150000 },
        },
    };

    useEffect(() => {
        setIncomeData(staticIncomeData);
    }, []);

    return (
        <div className="w-full">
            <h2 className="text-2xl md:text-3xl font-bold text-[#2C323C] mb-6">
                Income Statement Details
            </h2>
            <div className="flex items-center gap-4 w-full">
                <p className="text-[#6E66AC] text-lg md:text-2xl">
                    01 Nov - 30 Nov, 2024
                </p>
                <div
                    className="h-[3px] flex-grow"
                    style={{
                        background:
                            "linear-gradient(to right, #9B9DA200, #9B9DA2)",
                    }}
                ></div>
            </div>

            <div className="my-8 overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium">
                        <tr>
                            <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl w-[30%]">
                                Revenues
                            </th>
                            <th className="py-3 px-4 w-[20%]">Unrestricted</th>
                            <th className="py-3 px-4 w-[20%]">
                                Temporarily Restricted
                            </th>
                            <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl w-[30%]">
                                Total
                            </th>
                        </tr>
                    </thead>
                    <tbody className="text-[#2C323C] text-center items-start text-base font-medium divide-y divide-[#D7D8D9]">
                        {incomeData.revenues?.map((item, index) => (
                            <tr key={index}>
                                <td className="py-3 px-4">{item.category}</td>
                                <td className="py-3 px-4">
                                    {item.unrestricted.toLocaleString()}
                                </td>
                                <td className="py-3 px-4">
                                    {item.restricted.toLocaleString()}
                                </td>
                                <td className="py-3 px-4">
                                    {(
                                        item.unrestricted + item.restricted
                                    ).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                        <tr className="font-bold text-xl bg-[#DCECF2] border-none">
                            <td className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                                Total Revenues
                            </td>
                            <td className="py-3 px-4">275,000.00</td>
                            <td className="py-3 px-4">150,000.00</td>
                            <td className="py-3 px-4 rounded-tr-2xl rounded-br-2xl">
                                425,000.00
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <table className="w-full border-collapse">
                <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium">
                    <tr>
                        <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl w-[30%]">
                            Expenses
                        </th>
                        <th className="py-3 px-4 w-[20%]">Unrestricted</th>
                        <th className="py-3 px-4 w-[20%]">
                            Temporarily Restricted
                        </th>
                        <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl w-[30%]">
                            Total
                        </th>
                    </tr>
                </thead>
                <tbody className="text-[#2C323C] text-center items-start text-base font-medium divide-y divide-[#D7D8D9]">
                    {incomeData.expenses?.map((item, index) => (
                        <tr key={index}>
                            <td className="py-3 px-4">{item.category}</td>
                            <td className="py-3 px-4">
                                {item.unrestricted.toLocaleString()}
                            </td>
                            <td className="py-3 px-4">
                                {item.restricted.toLocaleString()}
                            </td>
                            <td className="py-3 px-4">
                                {(
                                    item.unrestricted + item.restricted
                                ).toLocaleString()}
                            </td>
                        </tr>
                    ))}
                    <tr className="font-bold text-xl bg-[#DCECF2] border-none">
                        <td className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                            Total Expenses
                        </td>
                        <td className="py-3 px-4">235,000.00</td>
                        <td className="py-3 px-4">0.00</td>
                        <td className="py-3 px-4 rounded-tr-2xl rounded-br-2xl">
                            235,000.00
                        </td>
                    </tr>
                    <tr className="border-none">
                        <td className="py-3 px-4">Change in Net Assets</td>
                        <td className="py-3 px-4">40,000.00</td>
                        <td className="py-3 px-4">150,000.00</td>
                        <td className="py-3 px-4">190,000.00</td>
                    </tr>
                    <tr>
                        <td className="py-3 px-4">
                            Net Assets, Beginning of Year
                        </td>
                        <td className="py-3 px-4">4,300.00</td>
                        <td className="py-3 px-4">0.00</td>
                        <td className="py-3 px-4">4,300.00</td>
                    </tr>
                    <tr className="font-bold text-xl bg-[#DCECF2] border-none">
                        <td className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                            Net Assets, End of Period
                        </td>
                        <td className="py-3 px-4">44,300.00</td>
                        <td className="py-3 px-4">150,000.00</td>
                        <td className="py-3 px-4 rounded-tr-2xl rounded-br-2xl">
                            194,300.00
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

export default IncomeStatementTable;
