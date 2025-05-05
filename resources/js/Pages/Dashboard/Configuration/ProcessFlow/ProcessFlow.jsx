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
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

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

                console.log('Fetched process steps:', processSteps);

                if (processSteps.length > 0) {
                    // Sort steps by order before setting them
                    const sortedSteps = [...processSteps].sort((a, b) => a.order - b.order);
                    console.log('Sorted process steps:', sortedSteps);

                    setRows(
                        sortedSteps.map((step) => ({
                            id: step.order, // Use the actual order from the database
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
                approver_id: parseInt(value.replace("user-", ""), 10),
                designation_id: null,
            };
        } else if (value.startsWith("designation-")) {
            updatedRows[index] = {
                ...updatedRows[index],
                designation_id: parseInt(value.replace("designation-", ""), 10),
                approver_id: null,
            };
        } else {
            updatedRows[index] = {
                ...updatedRows[index],
                approver_id: null,
                designation_id: null,
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

    const onDragEnd = async (result) => {
        if (!result.destination) return;

        console.log('Drag ended:', {
            source: result.source,
            destination: result.destination,
            draggableId: result.draggableId
        });

        const items = Array.from(rows);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        // Update the order numbers
        const updatedItems = items.map((item, index) => ({
            ...item,
            id: index + 1 // This will be the new order
        }));

        console.log('Updated items after drag:', updatedItems);

        // Only make API call if we have step_ids (existing steps)
        const stepsWithIds = updatedItems.filter(item => item.step_id);
        if (stepsWithIds.length > 0) {
            try {
                console.log('Sending reorder request with data:', {
                    process_id: selectedProcess.id,
                    steps: stepsWithIds.map((item, index) => ({
                        id: item.step_id,
                        order: index + 1
                    }))
                });

                const response = await axios.post('/api/v1/process-steps/reorder', {
                    process_id: selectedProcess.id,
                    steps: stepsWithIds.map((item, index) => ({
                        id: item.step_id,
                        order: index + 1
                    }))
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                });

                console.log('Reorder API response:', response.data);

                // Only update the state if the API call was successful
                if (response.data.message === 'Process steps reordered successfully') {
                    // Update the local state with the new order
                    setRows(updatedItems);
                    
                    // Fetch fresh data from the server to ensure we have the latest order
                    const freshResponse = await axios.get(
                        `/api/v1/process-steps?filter[process_id]=${selectedProcess.id}`
                    );
                    const freshSteps = freshResponse.data.data;
                    
                    if (freshSteps.length > 0) {
                        const sortedSteps = [...freshSteps].sort((a, b) => a.order - b.order);
                        setRows(
                            sortedSteps.map((step) => ({
                                id: step.order, // Use the actual order from the database
                                approver_id: step.approver_id || "",
                                designation_id: step.designation_id || "",
                                taskDescription: step.description || "",
                                step_id: step.id,
                            }))
                        );
                    }
                }
            } catch (error) {
                console.error('Error reordering steps:', {
                    message: error.message,
                    response: error.response?.data,
                    status: error.response?.status
                });
                // Revert to original order if API call fails
                handleProcessChange({ target: { value: selectedProcess.id } });
            }
        } else {
            // If no step_ids, just update the local state
            setRows(updatedItems);
        }
    };

    const handleSubmit = async () => {
        if (!selectedProcess) {
            alert("Please select a process type before submitting.");
            return;
        }

        const isFirstRowEmpty =
            !rows[0].approver_id &&
            !rows[0].designation_id &&
            !rows[0].taskDescription;

        if (isFirstRowEmpty) {
            alert("Please enter at least one valid process step.");
            return;
        }

        try {
            console.log('Starting save process with rows:', rows);

            const createPromises = [];
            const updatePromises = [];

            // Use the current order of rows as displayed in the UI
            rows.forEach((row, index) => {
                const payload = {
                    process_id: selectedProcess.id,
                    order: row.id, // Use the current row.id which reflects the UI order
                    description: row.taskDescription,
                };

                if (row.approver_id) {
                    payload.approver_id = row.approver_id;
                } else if (row.designation_id) {
                    payload.designation_id = row.designation_id;
                }

                console.log(`Preparing ${row.step_id ? 'update' : 'create'} payload for row ${index}:`, payload);

                if (row.step_id) {
                    updatePromises.push(
                        axios.put(
                            `/api/v1/process-steps/${row.step_id}`,
                            payload
                        ).then(response => {
                            console.log(`Update response for step ${row.step_id}:`, response.data);
                            return response;
                        }).catch(error => {
                            console.error(`Error updating step ${row.step_id}:`, {
                                message: error.message,
                                response: error.response?.data,
                                status: error.response?.status
                            });
                            throw error;
                        })
                    );
                } else {
                    createPromises.push(
                        axios.post("/api/v1/process-steps", payload)
                        .then(response => {
                            console.log('Create response:', response.data);
                            return response;
                        }).catch(error => {
                            console.error('Error creating step:', {
                                message: error.message,
                                response: error.response?.data,
                                status: error.response?.status
                            });
                            throw error;
                        })
                    );
                }
            });

            console.log('Waiting for all promises to resolve...');
            const results = await Promise.all([...createPromises, ...updatePromises]);
            console.log('All promises resolved:', results);

            if (createPromises.length && updatePromises.length) {
                alert(
                    "Process flow updated and new steps created successfully!"
                );
            } else if (createPromises.length) {
                alert("New process flow steps created successfully!");
            } else if (updatePromises.length) {
                alert("Process flow updated successfully!");
            }

            // Refresh the data after successful save
            await handleProcessChange({ target: { value: selectedProcess.id } });

        } catch (error) {
            console.error('Error in handleSubmit:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
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
                            <DragDropContext onDragEnd={onDragEnd}>
                                <Droppable droppableId="process-steps">
                                    {(provided) => (
                                        <table className="w-full border-collapse" {...provided.droppableProps} ref={provided.innerRef}>
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
                                                    <Draggable
                                                        key={row.id.toString()}
                                                        draggableId={row.id.toString()}
                                                        index={index}
                                                    >
                                                        {(provided, snapshot) => (
                                                            <tr
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                className={`border-b ${snapshot.isDragging ? 'bg-gray-50' : ''}`}
                                                            >
                                                                <td className="py-3 px-4">
                                                                    {row.id}
                                                                </td>
                                                                <td className="py-3 px-4">
                                                                    <SelectFloating
                                                                        label="Approver"
                                                                        name="approver"
                                                                        value={
                                                                            row.approver_id !== "" &&
                                                                            row.approver_id !== null
                                                                                ? `user-${row.approver_id}`
                                                                                : row.designation_id !== "" &&
                                                                                  row.designation_id !== null
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
                                                                        {index === rows.length - 1 && (
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
                                                                        <div {...provided.dragHandleProps}>
                                                                            <button
                                                                                type="button"
                                                                                className="text-xl text-[#009FDC] hover:text-blue-600 cursor-move"
                                                                                title="Drag to reorder"
                                                                            >
                                                                                <FaGripVertical />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}
                                            </tbody>
                                        </table>
                                    )}
                                </Droppable>
                            </DragDropContext>

                            <div className="flex justify-end mt-6">
                                <button
                                    onClick={handleSubmit}
                                    className="bg-[#009FDC] text-white px-6 py-2 rounded-lg text-lg font-medium hover:bg-[#007CB8] transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    Save
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
