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
    isSecretary = false,
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
                        const currentLevel = node.hierarchy_level ?? 0; // Default to 0 if undefined
                        const newHierarchyLevel = currentLevel === 0 ? 1 : currentLevel + 1;
                        
                        // Special case for id=1 and its children
                        let parentId;
                        if (node.id === 1 || node.parent_id === 1) {
                            parentId = 1;  // Force parent_id to be 1 for this special case
                            console.log("DEBUG - Special case for id=1:", {
                                nodeId: node.id,
                                parentId: parentId,
                                currentLevel,
                                newHierarchyLevel
                            });
                        } else {
                            parentId = currentLevel === 0 ? null : node.id ?? null;
                            console.log("DEBUG - Using default case");
                        }

                        console.log("DEBUG - Final parentId:", parentId);

                        console.log("Sending to Users.jsx:", {
                            hierarchy_level: newHierarchyLevel,
                            parent_id: parentId,
                            node_details: {
                                id: node.id,
                                level: currentLevel,
                                has_secretary: node.children?.some(child => 
                                    child.designation_id === 23 || 
                                    (child.title && child.title.toLowerCase().includes('secretary'))
                                ) ?? false
                            }
                        });

                        // Use query parameters instead of props
                        router.visit(`/users?hierarchy_level=${newHierarchyLevel}&parent_id=${parentId}`);
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

    // Check if node is secretary
    const isSecretary = node.designation_id === 23 || 
        (node.title && node.title.toLowerCase().includes('secretary'));

    console.log('SECRETARY CHECK:', {
        nodeId: node.id,
        nodeName: node.name,
        isSecretary,
        designationId: node.designation_id,
        title: node.title,
        parentId: node.parent_id
    });

    // Get regular children and secretary separately
    const children = node.children || [];
    const regularChildren = children.filter(child => 
        !(child.designation_id === 23 || 
          (child.title && child.title.toLowerCase().includes('secretary')))
    );
    const secretaryChild = children.find(child => 
        child.designation_id === 23 || 
        (child.title && child.title.toLowerCase().includes('secretary'))
    );

    console.log('NODE STRUCTURE:', {
        nodeId: node.id,
        nodeName: node.name,
        hasSecretary: !!secretaryChild,
        secretaryDetails: secretaryChild ? {
            id: secretaryChild.id,
            name: secretaryChild.name,
            title: secretaryChild.title,
            designationId: secretaryChild.designation_id
        } : null,
        regularChildrenCount: regularChildren.length
    });

    const handleDelete = (nodeToDelete = node) => {
        if (parent) {
            try {
                if (!nodeToDelete || !nodeToDelete.id) {
                    console.error("Invalid node or node ID");
                    return;
                }

                const index = parent.children.findIndex((child) => child.id === nodeToDelete.id);
                if (index !== -1) {
                    parent.children.splice(index, 1);
                    onUpdate();
                    onMarkForDeletion(nodeToDelete.id);
                }
            } catch (error) {
                console.error("Error in handleDelete:", error);
            }
        }
    };

    const handleAddPosition = async () => {
        try {
            if (!node.id) {
                console.error("Node ID is missing, cannot fetch parent data.");
                return;
            }
    
            const response = await axios.get(`/api/v1/users/${node.id}`);
            const parentData = response.data.data;

            if (!parentData || !parentData.id) {
                console.error("Invalid parent data received from API:", parentData);
                return;
            }
    
            const nextLevel = parentData.hierarchy_level === 0 ? 1 : parentData.hierarchy_level + 1;
            
            // Special case for id=1
            const parentId = parentData.id === 1 ? 1 : parentData.id;
    
            if (!node.children) {
                node.children = [];
            }
    
            node.children.push({
                department: "",
                title: "",
                name: "",
                id: parentId,  // Set this to the parent's id
                hierarchy_level: nextLevel,
                parent_id: parentId,
                children: [],
            });
    
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
                <div className="org-node-container">
                    <OrganizationNode
                        node={node}
                        onRename={() => {}}
                        onDelete={handleDelete}
                        onAddPosition={handleAddPosition}
                        isRoot={isRoot}
                        hasChildren={regularChildren.length > 0}
                        isExpanded={isExpanded}
                        onToggleExpand={handleToggleExpand}
                    />
                    {secretaryChild && (
                        <div className="secretary-container">
                            <div className="connecting-line"></div>
                            <SecretaryNode 
                                node={secretaryChild}
                                onDelete={() => handleDelete(secretaryChild)}
                            />
                        </div>
                    )}
                </div>
            }
        >
            {isExpanded && regularChildren.map((child, index) => (
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

// Add this new component for Secretary Node
function SecretaryNode({ node, onDelete }) {
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

    const handleDeleteClick = () => {
        onDelete();
        handleClose();
    };

    return (
        <Card 
            variant="outlined" 
            className="org-node secretary-node"
            sx={{
                borderColor: '#009FDC',
                backgroundColor: '#f8f9fa',
                '&:hover': {
                    borderColor: '#007cb8',
                    backgroundColor: '#f0f0f0'
                }
            }}
        >
            <div className="node-header">
                <div className="avatar">
                    <FontAwesomeIcon 
                        icon={faUser} 
                        color="#009FDC"
                    />
                </div>
                <IconButton 
                    size="small" 
                    className="menu-icon" 
                    onClick={handleClick}
                >
                    <FontAwesomeIcon icon={faEllipsisV} />
                </IconButton>
            </div>
            <Typography 
                className="node-text font-bold" 
                style={{ color: "#009FDC" }}
            >
                {node.department}
            </Typography>
            <Typography 
                className="node-text" 
                style={{ color: "red" }}
            >
                {node.title}
            </Typography>
            <Typography 
                className="node-text" 
                style={{ color: "black" }}
            >
                {node.name}
            </Typography>

            <Menu
                open={Boolean(anchorEl)}
                anchorEl={anchorEl}
                onClose={handleClose}
            >
                <MenuItem onClick={handleEdit}>
                    Edit
                </MenuItem>
                <MenuItem onClick={handleDeleteClick}>
                    Delete
                </MenuItem>
            </Menu>
        </Card>
    );
}

const Chart = () => {
    const [orgChart, setOrgChart] = useState(null);
    const [rootExpanded, setRootExpanded] = useState(true);
    const [nodesToDelete, setNodesToDelete] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get('/api/v1/users/organogram');
                const organogramData = response.data.data;
                
                // Log the root node check
                console.log('ROOT NODE CHECK:', {
                    nodeId: organogramData.id,
                    nodeName: organogramData.name,
                    children: organogramData.children?.map(c => ({
                        id: c.id,
                        name: c.name,
                        title: c.title,
                        designation_id: c.designation_id
                    }))
                });

                setOrgChart(organogramData);
            } catch (error) {
                console.error("Error fetching organogram data:", error);
            }
        };

        fetchData();
    }, []);

    const handleSave = async () => {
        try {
            for (const nodeId of nodesToDelete) {
                await axios.delete(`/api/v1/users/${nodeId}`);
            }
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
            <div className="chart-page-container">
                <div className="w-full flex justify-center items-center h-screen">
                    <Button></Button>
                </div>
            </div>
        );
    }

    return (
        <div className="chart-page-container">
            <div className="w-full max-w-[1400px] mx-auto">
                <h2 className="text-2xl md:text-3xl font-bold text-[#2C323C] mb-2">
                    Organizational Chart
                </h2>
                <p className="text-lg md:text-xl text-[#7D8086] mb-6">
                    Manage users and their hierarchy here.
                </p>

                <div className="chart-wrapper bg-white rounded-lg shadow-sm">
                    <div className="chart-container">
                        <Tree
                            lineWidth={"2px"}
                            lineColor={"#bbc"}
                            lineBorderRadius={"12px"}
                        >
                            {orgChart && (
                                <OrgChartTree
                                    node={orgChart}
                                    onUpdate={updateOrgChart}
                                    isRoot={true}
                                    parentExpanded={true}
                                    onMarkForDeletion={handleMarkForDeletion}
                                />
                            )}
                        </Tree>
                    </div>
                </div>

                <div className="flex justify-end mt-6">
                    <button
                        onClick={handleSave}
                        className="bg-[#009FDC] text-white px-6 py-2 rounded-full text-xl font-medium hover:bg-[#007CB8] transition-colors"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Chart;