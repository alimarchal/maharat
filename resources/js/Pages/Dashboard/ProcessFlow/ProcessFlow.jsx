import React, { useState, useEffect } from "react";
import {
    FaPlus,
    FaTrash,
    FaGripVertical,
    FaClipboardList,
} from "react-icons/fa";
import SelectFloating from "@/Components/SelectFloating";
import { Link } from "@inertiajs/react";
import axios from "axios";

const ProcessFlow = () => {
    const [rows, setRows] = useState([]);
    const [processes, setProcesses] = useState([]);
    const [selectedProcess, setSelectedProcess] = useState(null);
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchProcesses = async () => {
            try {
                const response = await axios.get("/api/v1/processes");
                setProcesses(response.data.data);
            } catch (error) {
                console.error("Error fetching processes:", error);
            }
        };

        const fetchUsers = async () => {
            try {
                const response = await axios.get("/api/v1/users");
                setUsers(response.data.data);
            } catch (error) {
                console.error("Error fetching users:", error);
            }
        };

        fetchProcesses();
        fetchUsers();
    }, []);

    const handleProcessChange = async (e) => {
        setIsLoading(true);
        const processId = Number(e.target.value);
        const process = processes.find((p) => p.id === processId);
        setSelectedProcess(process || null);

        if (process) {
            try {
                const response = await axios.get(
                    `/api/v1/process-steps?filter[process_id]=${processId}`
                );
                const processSteps = response.data.data;

                if (processSteps.length > 0) {
                    setRows(
                        processSteps.map((step, index) => ({
                            id: index + 1,
                            employee: step.user_id,
                            designation: step.user_designation || "N/A",
                            taskDescription: step.description || "",
                            step_id: step.id,
                        }))
                    );
                } else {
                    setRows([
                        {
                            id: 1,
                            employee: "",
                            designation: "",
                            taskDescription: "",
                        },
                    ]);
                }
            } catch (error) {
                console.error("Error fetching process steps:", error);
                setRows([
                    {
                        id: 1,
                        employee: "",
                        designation: "",
                        taskDescription: "",
                    },
                ]);
            } finally {
                setIsLoading(false);
            }
        } else {
            setRows([]);
            setIsLoading(false);
        }
    };

    const handleEmployeeChange = async (index, employeeId) => {
        if (!employeeId) return;

        try {
            const response = await axios.get(`/api/v1/users/${employeeId}`);
            const updatedRows = [...rows];
            updatedRows[index] = {
                ...updatedRows[index],
                employee: Number(employeeId),
                designation: response.data.designation || "N/A",
            };
            setRows(updatedRows);
        } catch (error) {
            console.error("Error fetching employee designation:", error);
        }
    };

    const handleTaskDescriptionChange = (index, value) => {
        const updatedRows = [...rows];
        updatedRows[index] = { ...updatedRows[index], taskDescription: value };
        setRows(updatedRows);
    };

    const addRow = () => {
        setRows([
            ...rows,
            {
                id: rows.length + 1,
                employee: "",
                designation: "",
                taskDescription: "",
            },
        ]);
    };

    const removeRow = (index) => {
        if (rows.length === 1) {
            setRows([
                {
                    id: 1,
                    employee: "",
                    designation: "",
                    taskDescription: "",
                },
            ]);
            return;
        }

        const newRows = rows.filter((_, i) => i !== index);
        const reorderedRows = newRows.map((row, i) => ({
            ...row,
            id: i + 1,
        }));
        setRows(reorderedRows);
    };

    const handleSubmit = async () => {
        if (!selectedProcess) {
            alert("Please select a process type before submitting.");
            return;
        }

        for (const row of rows) {
            if (!row.employee || !row.taskDescription) {
                alert("Please fill all fields for each row before submitting.");
                return;
            }
        }

        setIsLoading(true);
        try {
            if (rows.some((row) => row.step_id)) {
                await axios.delete(
                    `/api/v1/process-steps/${selectedProcess.id}`
                );
            }

            const promises = rows.map((row, index) => {
                return axios.post("/api/v1/process-steps", {
                    process_id: selectedProcess.id,
                    order: index + 1,
                    user_id: row.employee,
                    description: row.taskDescription,
                });
            });

            await Promise.all(promises);
            alert("Process flow updated successfully!");
            handleProcessChange({ target: { value: selectedProcess.id } });
        } catch (error) {
            alert("Failed to update process flow. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const renderEmptyState = () => (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 mt-6 flex flex-col items-center justify-center text-center">
            <div className="bg-[#E6F4F9] p-5 rounded-full mb-4">
                <FaClipboardList className="text-[#009FDC] text-4xl" />
            </div>
            <h3 className="text-2xl font-semibold text-[#2C323C] mb-2">
                No Process Selected
            </h3>
            <p className="text-[#7D8086] text-lg max-w-md mb-6">
                Please select a process type from the dropdown above to view or
                create a process flow.
            </p>
        </div>
    );

    return (
        <div className="flex flex-col items-center">
            <div className="w-full">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                    <div className="mb-4 md:mb-0">
                        <h2 className="text-3xl font-bold text-[#2C323C]">
                            {selectedProcess
                                ? `${selectedProcess.title} Process Flow`
                                : "Process Flow Management"}
                        </h2>
                        <p className="text-[#7D8086] text-xl">
                            Select an approval process flow with specific steps
                        </p>
                    </div>
                    <div className="flex flex-col gap-2 w-full md:w-2/5">
                        <SelectFloating
                            label="Type of Process"
                            name="type"
                            value={selectedProcess ? selectedProcess.id : ""}
                            onChange={handleProcessChange}
                            options={processes.map((process) => ({
                                id: process.id,
                                label: process.title,
                            }))}
                            className="w-full"
                        />
                        <div className="flex justify-end">
                            <Link
                                href="/process-flow/create"
                                className="bg-[#009FDC] text-white px-4 py-2 rounded-full text-xl font-medium text-center w-full sm:w-auto"
                            >
                                Create a New Process
                            </Link>
                        </div>
                    </div>
                </div>
                <>
                    {selectedProcess ? (
                        <div className="w-full overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                                    <tr>
                                        <th className="py-3 px-4 text-center rounded-tl-2xl rounded-bl-2xl">
                                            ID
                                        </th>
                                        <th className="py-3 px-4 text-center">
                                            Employee
                                        </th>
                                        <th className="py-3 px-4 text-center">
                                            Designation
                                        </th>
                                        <th className="py-3 px-4 text-center">
                                            Task Description
                                        </th>
                                        <th className="py-3 px-4 text-center rounded-tr-2xl rounded-br-2xl">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row, index) => (
                                        <tr
                                            key={index}
                                            className="text-center border-b"
                                        >
                                            <td className="py-3 px-4">
                                                {row.id}
                                            </td>
                                            <td className="py-3 px-4">
                                                <SelectFloating
                                                    name={`employee-${index}`}
                                                    value={row.employee}
                                                    onChange={(e) =>
                                                        handleEmployeeChange(
                                                            index,
                                                            Number(
                                                                e.target.value
                                                            )
                                                        )
                                                    }
                                                    options={users.map(
                                                        (user) => ({
                                                            id: user.id,
                                                            label: user.name,
                                                        })
                                                    )}
                                                />
                                            </td>
                                            <td className="py-3 px-4 text-gray-700">
                                                {row.designation || "N/A"}
                                            </td>
                                            <td className="py-3 px-4">
                                                <input
                                                    type="text"
                                                    className="border border-gray-400 rounded-2xl p-4 w-full"
                                                    value={row.taskDescription}
                                                    onChange={(e) =>
                                                        handleTaskDescriptionChange(
                                                            index,
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="Enter task description"
                                                />
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex justify-center items-center space-x-3">
                                                    {index ===
                                                        rows.length - 1 && (
                                                        <button
                                                            type="button"
                                                            className="text-[#009FDC] hover:text-blue-600 transition-all"
                                                            onClick={addRow}
                                                            title="Add row"
                                                        >
                                                            <FaPlus />
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        className="text-[#9B9DA2] hover:text-red-500 transition-all"
                                                        onClick={() =>
                                                            removeRow(index)
                                                        }
                                                        title="Remove row"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="text-[#009FDC] hover:text-blue-600 transition-all cursor-move"
                                                        title="Drag to reorder"
                                                    >
                                                        <FaGripVertical />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="flex justify-end mt-6">
                                <button
                                    onClick={handleSubmit}
                                    disabled={isLoading}
                                    className="bg-[#009FDC] text-white px-6 py-2 rounded-lg text-lg font-medium hover:bg-[#007CB8] transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? "Saving..." : "Submit"}
                                </button>
                            </div>
                        </div>
                    ) : (
                        renderEmptyState()
                    )}
                </>
            </div>
        </div>
    );
};

export default ProcessFlow;
