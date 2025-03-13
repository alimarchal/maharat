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
    const [designations, setDesignations] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [processRes, usersRes, designationsRes] =
                    await Promise.all([
                        axios.get("/api/v1/processes"),
                        axios.get("/api/v1/users"),
                        axios.get("/api/v1/designations"),
                    ]);
                setProcesses(processRes.data.data);
                setUsers(usersRes.data.data);
                console.log("D:", designationsRes.data.data);
                setDesignations(designationsRes.data.data);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchData();
    }, []);

    const handleProcessChange = async (e) => {
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
                            approver_id: step.approver_id || "",
                            designation_id: step.designation_id || "",
                            taskDescription: step.description || "",
                            step_id: step.id,
                        }))
                    );
                } else {
                    setRows([
                        {
                            id: 1,
                            approver_id: "",
                            designation_id: "",
                            taskDescription: "",
                        },
                    ]);
                }
            } catch (error) {
                console.error("Error fetching process steps:", error);
                setRows([
                    {
                        id: 1,
                        approver_id: "",
                        designation_id: "",
                        taskDescription: "",
                    },
                ]);
            }
        } else {
            setRows([]);
        }
    };

    const handleApproverChange = (index, value) => {
        const updatedRows = [...rows];

        if (value.startsWith("user-")) {
            updatedRows[index] = {
                ...updatedRows[index],
                approver_id: Number(value.replace("user-", "")),
                designation_id: "",
            };
        } else if (value.startsWith("designation-")) {
            updatedRows[index] = {
                ...updatedRows[index],
                approver_id: "",
                designation_id: Number(value.replace("designation-", "")),
            };
        } else {
            updatedRows[index] = {
                ...updatedRows[index],
                approver_id: "",
                designation_id: "",
            };
        }

        setRows(updatedRows);
    };

    const handleTaskDescriptionChange = (index, value) => {
        const updatedRows = [...rows];
        updatedRows[index].taskDescription = value;
        setRows(updatedRows);
    };

    const addRow = () => {
        setRows([
            ...rows,
            {
                id: rows.length + 1,
                approver_id: "",
                designation_id: "",
                taskDescription: "",
            },
        ]);
    };

    const removeRow = async (index) => {
        const rowToDelete = rows[index];
        const newRows = rows
            .filter((_, i) => i !== index)
            .map((row, i) => ({ ...row, id: i + 1 }));
        setRows(
            newRows.length > 0
                ? newRows
                : [
                      {
                          id: 1,
                          approver_id: "",
                          designation_id: "",
                          taskDescription: "",
                      },
                  ]
        );

        if (rowToDelete.step_id) {
            try {
                await axios.delete(
                    `/api/v1/process-steps/${rowToDelete.step_id}`
                );
            } catch (error) {
                alert("Failed to delete process step. Please try again.");
            }
        }
    };

    const handleSubmit = async () => {
        if (!selectedProcess) {
            alert("Please select a process type before submitting.");
            return;
        }

        for (const row of rows) {
            if (
                (!row.approver_id && !row.designation_id) ||
                !row.taskDescription
            ) {
                alert("Please fill all fields for each row before submitting.");
                return;
            }
        }

        try {
            const promises = rows.map((row, index) => {
                return axios.post("/api/v1/process-steps", {
                    process_id: selectedProcess.id,
                    order: index + 1,
                    approver_id: row.approver_id || null,
                    designation_id: row.designation_id || null,
                    description: row.taskDescription,
                });
            });

            await Promise.all(promises);
            alert("Process flow updated successfully!");
            handleProcessChange({ target: { value: selectedProcess.id } });
        } catch (error) {
            alert("Failed to update process flow. Please try again.");
        }
    };

    const renderEmptyState = () => (
        <div className="border border-gray-300 rounded-2xl p-8 mt-6 flex flex-col items-center justify-center text-center">
            <div className="bg-[#E6F4F9] p-5 rounded-full mb-4">
                <FaClipboardList className="text-[#009FDC] text-4xl" />
            </div>
            <h3 className="text-3xl font-semibold text-[#2C323C] mb-2">
                No Process Selected
            </h3>
            <p className="text-[#7D8086] text-lg max-w-md mb-6">
                Please select a process type from the dropdown above to view or
                create a new process.
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
                    <div className="flex flex-col gap-4 w-full md:w-2/5">
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
                                        <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                                            Order
                                        </th>
                                        <th className="py-3 px-4">Approver</th>
                                        <th className="py-3 px-4">
                                            Task Description
                                        </th>
                                        <th className="py-3 px-4 text-center rounded-tr-2xl rounded-br-2xl">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row, index) => (
                                        <tr key={index} className="border-b">
                                            <td className="py-3 px-4">
                                                {row.id}
                                            </td>
                                            <td className="py-3 px-4">
                                                <SelectFloating
                                                    label="Approver"
                                                    name="approver"
                                                    value={
                                                        row.approver_id !==
                                                            "" &&
                                                        row.approver_id !== null
                                                            ? `user-${row.approver_id}`
                                                            : row.designation_id !==
                                                                  "" &&
                                                              row.designation_id !==
                                                                  null
                                                            ? `designation-${row.designation_id}`
                                                            : ""
                                                    }
                                                    onChange={(e) =>
                                                        handleApproverChange(
                                                            index,
                                                            e.target.value
                                                        )
                                                    }
                                                    options={[
                                                        {
                                                            id: "",
                                                            label: "Select an approver",
                                                        },
                                                        ...users.map(
                                                            (user) => ({
                                                                id: `user-${user.id}`,
                                                                label: user.name,
                                                            })
                                                        ),
                                                        ...designations.map(
                                                            (des) => ({
                                                                id: `designation-${des.id}`,
                                                                label: des.designation,
                                                            })
                                                        ),
                                                    ]}
                                                />
                                            </td>
                                            <td className="py-3 px-4">
                                                <input
                                                    type="text"
                                                    className="border border-gray-300 rounded-xl px-4 py-5 w-full"
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
                                                            className="text-lg text-[#9B9DA2] hover:text-blue-600"
                                                            onClick={addRow}
                                                            title="Add row"
                                                        >
                                                            <FaPlus />
                                                        </button>
                                                    )}
                                                    {index !== 0 && (
                                                        <button
                                                            type="button"
                                                            className="text-lg text-[#9B9DA2] hover:text-red-500"
                                                            onClick={() =>
                                                                removeRow(index)
                                                            }
                                                            title="Remove row"
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        className="text-xl text-[#009FDC] hover:text-blue-600 cursor-move"
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
                                    className="bg-[#009FDC] text-white px-6 py-2 rounded-lg text-lg font-medium hover:bg-[#007CB8] transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    Submit
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
