import React, { useState } from "react";
import { FaEdit, FaGripVertical } from "react-icons/fa";
import SelectFloating from "@/Components/SelectFloating";

const ProcessFlowTable = () => {
    const [formData, setFormData] = useState({ employee: "", type: "" });
    const [errors, setErrors] = useState({});

    const employees = [
        {
            id: 1,
            name: "Mr Nawaz",
            designation: "Supervisor",
            document: "Apple",
        },
        { id: 2, name: "Mr Ahsan", designation: "Manager", document: "Nike" },
        {
            id: 3,
            name: "Mr Waqas",
            designation: "Director",
            document: "Microsoft",
        },
        {
            id: 4,
            name: "Mr Naqash",
            designation: "Secretary",
            document: "Oracle",
        },
        {
            id: 5,
            name: "Mr Abdul Wajid",
            designation: "Manager",
            document: "Logitech",
        },
    ];

    const users = [
        { id: 1, name: "Finance" },
        { id: 2, name: "HR" },
        { id: 3, name: "IT" },
        { id: 4, name: "Marketing" },
    ];

    const handleChange = (e) => {
        setFormData({ ...formData, unit_id: e.target.value });
    };

    return (
        <div className="flex flex-col items-center">
            <div className="w-full">
                <div className="mb-6 flex justify-between items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-[#2C323C]">
                            Normal Purchase Process Flow
                        </h2>
                        <p className="text-[#7D8086] text-xl">
                            Select an approval process flow with specific steps
                        </p>
                    </div>
                    <div className="w-2/5">
                        <div>
                            <SelectFloating
                                label="Type of Process"
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                options={users.map((employee) => ({
                                    id: employee.id,
                                    label: employee.name,
                                }))}
                            />
                        </div>
                    </div>
                </div>

                <div className="w-full overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                            <tr>
                                <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                                    Employees Name
                                </th>
                                <th className="py-3 px-4">Designation</th>
                                <th className="py-3 px-4">
                                    Document to Approve
                                </th>
                                <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl">
                                    More
                                </th>
                            </tr>
                        </thead>
                        <tbody className="text-[#2C323C] text-base font-medium divide-y divide-[#D7D8D9]">
                            {employees.length > 0 ? (
                                employees.map((employee) => (
                                    <tr
                                        key={employee.id}
                                        className="hover:bg-gray-100"
                                    >
                                        <td className="py-3 px-4 flex items-center gap-2">
                                            {employee.name}
                                        </td>
                                        <td className="py-3 px-4">
                                            {employee.designation}
                                        </td>
                                        <td className="py-3 px-4">
                                            {employee.document}
                                        </td>
                                        <td className="py-3 px-4 flex space-x-3">
                                            <button className="text-[#9B9DA2] hover:text-gray-500">
                                                <FaEdit />
                                            </button>
                                            <button className="text-[#9B9DA2] hover:text-gray-500">
                                                <FaGripVertical />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan="5"
                                        className="text-center text-[#2C323C] font-medium py-4"
                                    >
                                        No Employees found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-between items-center gap-4 mt-8">
                    <div>
                        <h2 className="text-3xl font-bold text-[#2C323C]">
                            Add Employees to Process Flow
                        </h2>
                        <p className="text-[#7D8086] text-xl">
                            Add employees based on their level to approve
                            documents
                        </p>
                    </div>

                    <div className="w-2/5">
                        <div>
                            <SelectFloating
                                label="Employee"
                                name="employee"
                                value={formData.employee}
                                onChange={handleChange}
                                options={users.map((employee) => ({
                                    id: employee.id,
                                    label: employee.name,
                                }))}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProcessFlowTable;
