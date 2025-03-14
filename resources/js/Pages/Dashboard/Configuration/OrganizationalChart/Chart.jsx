import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faSitemap, faEllipsisV, faChevronDown, faChevronUp, faPlus } from "@fortawesome/free-solid-svg-icons";
import { Tree, TreeNode } from "react-organizational-chart";
import { Card, IconButton, Menu, MenuItem, Typography, Button } from "@mui/material";
import axios from "axios";
import { router } from '@inertiajs/react';
import "./Chart.css";

function OrganizationNode({
    node,
    onRename,
    onDelete,
    onAddPosition,
    isRoot,
    hasChildren,
    isExpanded,
    onToggleExpand,
}) {
    const [anchorEl, setAnchorEl] = useState(null);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleEdit = () => {
        if (node.id) {
            router.visit(`/users?id=${node.id}`);
        }
        handleClose();
    };

    return (
        <Card variant="outlined" className="org-node">
            <div className="node-header">
                {/* Left: Main Icon (Centered) */}
                <div className="avatar">
                    <FontAwesomeIcon icon={isRoot ? faSitemap : faUser} color={isRoot ? "#009FDC" : "black"} />
                </div>

                {/* Right: Three Dots Menu */}
                <IconButton size="small" className="menu-icon" onClick={handleClick}>
                    <FontAwesomeIcon icon={faEllipsisV} />
                </IconButton>
            </div>

            {node.name ? (
                <>
                    <Typography className="node-text font-bold" style={{ color: "#009FDC" }}>
                        {node.department}
                    </Typography>
                    <Typography className="node-text" style={{ color: "red" }}>
                        {node.title}
                    </Typography>
                    <Typography className="node-text" style={{ color: "black" }}>
                        {node.name}
                    </Typography>
                </>
            ) : (
                <Button
                    startIcon={<FontAwesomeIcon icon={faPlus} />}
                    onClick={() => {
                        // Log the data being sent
                        console.log("Sending to Users.jsx:", {
                            hierarchy_level: node.hierarchy_level,
                            parent_id: node.id
                        });
                            
                        // Use query parameters instead of props
                        router.visit(`/users?hierarchy_level=${node.hierarchy_level}&parent_id=${node.id}`);
                    }}
                    sx={{ textTransform: "none", color: "#009FDC", fontSize: "0.85rem" }}
                >
                    Add Employee
                </Button>
            )}

            {hasChildren && (
                <IconButton
                    size="small"
                    className="expand-icon"
                    onClick={onToggleExpand}
                >
                    <FontAwesomeIcon icon={isExpanded ? faChevronUp : faChevronDown} />
                </IconButton>
            )}

            <Menu open={Boolean(anchorEl)} anchorEl={anchorEl} onClose={handleClose}>
                {node.name && (
                    <MenuItem onClick={handleEdit}>
                        Edit
                    </MenuItem>
                )}
                <MenuItem onClick={() => { onAddPosition(); handleClose(); }}>
                    Add Position
                </MenuItem>
                {!isRoot && (
                    <MenuItem onClick={() => { onDelete(); handleClose(); }}>
                        Delete
                    </MenuItem>
                )}
            </Menu>
        </Card>
    );
}

function OrgChartTree({
    node,
    parent,
    onUpdate,
    isRoot,
    parentExpanded = true,
    onMarkForDeletion,
}) {
    const [isExpanded, setIsExpanded] = useState(true);

    const handleDelete = () => {
        if (parent) {
            const index = parent.children.findIndex((child) => child === node);
            if (index !== -1) {
                parent.children.splice(index, 1);
                onUpdate();
                onMarkForDeletion(node.id); // Mark the node for deletion
            }
        }
    };

    const handleAddPosition = async () => {
        try {
            // Ensure the current node has an ID before proceeding
            if (!node.id) {
                console.error("Node ID is missing, cannot fetch parent data.");
                return;
            }
    
            // Fetch parent details from backend
            const response = await axios.get(`/api/v1/users/${node.id}`);
            const parentData = response.data.data;

            if (!parentData || !parentData.id) {
                console.error("Invalid parent data received from API:", parentData);
                return;
            }
    
            // Assign the fetched parent_id and increment hierarchy level
            const parentId = parentData.id;
            const nextLevel = parentData.hierarchy_level + 1;
    
            console.log("Adding position under parent:", {
                parent_id: parentId,
                hierarchy_level: nextLevel,
            });
    
            // Ensure children array exists before pushing new node
            if (!node.children) {
                node.children = [];
            }
    
            // Add a new child position with fetched parent data
            node.children.push({
                department: "",
                title: "",
                name: "",
                id: parentId, // Temporary ID for frontend
                hierarchy_level: nextLevel,
                parent_id: parentId,
                children: [],
            });
    
            // Update the UI state
            onUpdate();
    
        } catch (error) {
            console.error("Error fetching parent data:", error);
        }
    };

    const handleToggleExpand = () => {
        setIsExpanded(!isExpanded);
    };

    if (!parentExpanded) {
        return null;
    }

    return (
        <TreeNode
            label={
                <OrganizationNode
                    node={node}
                    onRename={() => {}}
                    onDelete={handleDelete}
                    onAddPosition={handleAddPosition}
                    isRoot={isRoot}
                    hasChildren={node.children && node.children.length > 0}
                    isExpanded={isExpanded}
                    onToggleExpand={handleToggleExpand}
                />
            }
            className={
                !isExpanded && node.children && node.children.length > 0
                    ? "collapsed-node"
                    : ""
            }
        >
            {node.children &&
                isExpanded &&
                node.children.map((child, index) => (
                    <OrgChartTree
                        key={index}
                        node={child}
                        parent={node}
                        onUpdate={onUpdate}
                        isRoot={false}
                        parentExpanded={isExpanded}
                        onMarkForDeletion={onMarkForDeletion}
                    />
                ))}
        </TreeNode>
    );
}

const Chart = () => {
    const [orgChart, setOrgChart] = useState(null);
    const [rootExpanded, setRootExpanded] = useState(true);
    const [nodesToDelete, setNodesToDelete] = useState([]); // Track nodes marked for deletion

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get('/api/v1/users/organogram');
                const organogramData = response.data.data;
                setOrgChart(organogramData);
            } catch (error) {
                console.error("Error fetching organogram data:", error);
            }
        };

        fetchData();
    }, []);

    const handleSave = async () => {
        try {
            // Delete nodes marked for deletion
            for (const nodeId of nodesToDelete) {
                await axios.delete(`/api/v1/users/${nodeId}`);
            }

            // Clear the list of nodes to delete
            setNodesToDelete([]);

            console.log("Saved Organization Chart:", orgChart);
            alert("Changes saved successfully!");
        } catch (error) {
            console.error("Error saving changes:", error);
        }
    };

    const updateOrgChart = () => {
        setOrgChart({ ...orgChart });
    };

    const handleMarkForDeletion = (nodeId) => {
        setNodesToDelete((prevNodes) => [...prevNodes, nodeId]);
    };

    if (!orgChart) {
        return (
            <div className="w-full flex justify-center items-center h-screen">
                <Button>
                </Button>
            </div>
        );
    }

    return (
        <div className="w-full">
            <h2 className="text-2xl md:text-3xl font-bold text-[#2C323C]">
                Organizational Chart
            </h2>
            <p className="text-lg md:text-xl text-[#7D8086]">
                Manage users and their hierarchy here.
            </p>

            <div className="chart-wrapper">
                <div className="chart-container">
                    <Tree
                        lineWidth={"2px"}
                        lineColor={"#bbc"}
                        lineBorderRadius={"12px"}
                        label={
                            <OrganizationNode
                                node={orgChart}
                                onRename={() => {}}
                                onDelete={() => {}}
                                onAddPosition={() => {
                                    const updated = { ...orgChart };
                                    if (!updated.children) {
                                        updated.children = [];
                                    }
                                    updated.children.push({
                                        department: "",
                                        title: "",
                                        name: "", // Empty to show "Add Employee Details"
                                        children: [],
                                    });
                                    setOrgChart(updated);
                                }}
                                isRoot={true}
                                hasChildren={
                                    orgChart.children &&
                                    orgChart.children.length > 0
                                }
                                isExpanded={rootExpanded}
                                onToggleExpand={() =>
                                    setRootExpanded(!rootExpanded)
                                }
                            />
                        }
                    >
                        {orgChart.children &&
                            orgChart.children.length > 0 &&
                            rootExpanded &&
                            orgChart.children.map((child, index) => (
                                <OrgChartTree
                                    key={index}
                                    node={child}
                                    parent={orgChart}
                                    onUpdate={updateOrgChart}
                                    isRoot={false}
                                    parentExpanded={rootExpanded}
                                    onMarkForDeletion={handleMarkForDeletion}
                                />
                            ))}
                    </Tree>
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    className="bg-[#009FDC] text-white px-6 py-2 rounded-full text-xl font-medium"
                >
                    Save
                </button>
            </div>
        </div>
    );
};

export default Chart;