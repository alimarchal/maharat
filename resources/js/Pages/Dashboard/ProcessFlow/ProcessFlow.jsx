import React, { useState, useEffect } from "react";
import { FaEdit, FaGripVertical } from "react-icons/fa";
import SelectFloating from "@/Components/SelectFloating";
import { Link } from "@inertiajs/react";
import axios from "axios";

const ProcessFlow = () => {
    const [formData, setFormData] = useState({ employee: "", type: "" });
    const [users, setUsers] = useState([]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get("/api/v1/users");
                setUsers(response.data.data);
            } catch (error) {
                console.error("Error fetching users:", error);
            }
        };
        fetchUsers();
    }, []);

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

    const processTypes = [
        { id: 1, name: "Finance" },
        { id: 2, name: "HR" },
        { id: 3, name: "IT" },
        { id: 4, name: "Marketing" },
    ];

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="flex flex-col items-center">
            <div className="w-full">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                    <div className="mb-4 md:mb-0">
                        <h2 className="text-3xl font-bold text-[#2C323C]">
                            Normal Purchase Process Flow
                        </h2>
                        <p className="text-[#7D8086] text-xl">
                            Select an approval process flow with specific steps
                        </p>
                    </div>
                    <div className="flex flex-col gap-2 w-full md:w-2/5">
                        <SelectFloating
                            label="Type of Process"
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            options={processTypes.map((type) => ({
                                id: type.id,
                                label: type.name,
                            }))}
                            className="w-full"
                        />
                        <div className="flex justify-end">
                            <Link
                                href="/process-flow/create"
                                className="bg-[#009FDC] text-white px-4 py-2 rounded-full text-xl font-medium text-center w-full sm:w-auto"
                            >
                                Create Process Flow
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="w-full overflow-x-auto">
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
                                        <td className="py-3 px-4">
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
                                        colSpan="4"
                                        className="text-center text-[#2C323C] font-medium py-4"
                                    >
                                        No Employees found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mt-8">
                    <div className="mb-4 md:mb-0">
                        <h2 className="text-3xl font-bold text-[#2C323C]">
                            Add Employees to Process Flow
                        </h2>
                        <p className="text-[#7D8086] text-xl">
                            Add employees based on their level to approve
                            documents
                        </p>
                    </div>
                    <div className="w-full md:w-2/5">
                        <SelectFloating
                            label="Employee"
                            name="employee"
                            value={formData.employee}
                            onChange={handleChange}
                            options={users.map((user) => ({
                                id: user.id,
                                label: user.name,
                            }))}
                            className="w-full"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProcessFlow;
