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
    hasSecretary,
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

    // Secretary detection
    const isSecretaryNode = node.designation_id === 23 || (node.title && node.title.toLowerCase().includes('secretary'));

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
                    {!isSecretaryNode && (
                        <Typography className="node-text font-bold" style={{ color: "#009FDC" }}>
                            {node.department}
                        </Typography>
                    )}
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
                        } else {
                            parentId = currentLevel === 0 ? null : node.id ?? null;
                        }
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

    // Store all children in state to handle updates
    const [allChildren, setAllChildren] = useState(node.children || []);

    // Get regular children and secretary separately
    const regularChildren = allChildren.filter(child => 
        !(child.designation_id === 23 || 
          (child.title && child.title.toLowerCase().includes('secretary')))
    );
    const secretaryChild = allChildren.find(child => 
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
        regularChildrenCount: regularChildren.length,
        allChildrenCount: allChildren.length
    });

    const handleDelete = (nodeToDelete = node) => {
        if (parent) {
            try {
                if (!nodeToDelete || !nodeToDelete.id) {
                    // For newly added empty nodes, just remove from UI
                    const updatedChildren = allChildren.filter(child => 
                        child !== nodeToDelete && 
                        // Also check for empty nodes with matching parent_id
                        !(child.parent_id === nodeToDelete.parent_id && !child.name)
                    );
                    setAllChildren(updatedChildren);
                    parent.children = updatedChildren;
                    onUpdate();
                    return;
                }

                // First mark the node for deletion in DB
                onMarkForDeletion(nodeToDelete.id);

                // Then update the UI
                const updatedChildren = allChildren.filter(child => child.id !== nodeToDelete.id);
                setAllChildren(updatedChildren);
                parent.children = updatedChildren;
                onUpdate();

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
            
            // Special case for id=1: always add as direct child
            const parentId = parentData.id === 1 ? 1 : node.id;
            
            // Check if there's already an empty node for this parent
            const hasEmptyNode = allChildren.some(child => 
                child.parent_id === parentId && !child.name
            );

            if (hasEmptyNode) {
                console.log("Empty node already exists for this parent");
                return;
            }

            // Create new empty node
            const newNode = {
                department: "",
                title: "",
                name: "",
                id: null,
                hierarchy_level: nextLevel,
                parent_id: parentId,
                children: [],
                // Add position data to handle secretary overlap
                position: {
                    x: secretaryChild ? -200 : 0, // Offset if there's a secretary
                    y: (allChildren.length * 100) // Vertical spacing
                }
            };
    
            setAllChildren([...allChildren, newNode]);
            if (!node.children) {
                node.children = [];
            }
            node.children.push(newNode);
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
                        hasSecretary={!!secretaryChild}
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
                    key={child.id || index}
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

    // Secretary detection
    const isSecretaryNode = node.designation_id === 23 || (node.title && node.title.toLowerCase().includes('secretary'));

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
            {/* Hide department for secretary node */}
            {!isSecretaryNode && (
                <Typography 
                    className="node-text font-bold" 
                    style={{ color: "#009FDC" }}
                >
                    {node.department}
                </Typography>
            )}
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
            console.log("Nodes to delete:", nodesToDelete);
            
            // Delete all marked nodes
            for (const nodeId of nodesToDelete) {
                try {
                    await axios.delete(`/api/v1/users/${nodeId}`);
                    console.log(`Successfully deleted node ${nodeId}`);
                } catch (error) {
                    console.error(`Error deleting node ${nodeId}:`, error);
                    // Continue with other deletions even if one fails
                }
            }
            
            setNodesToDelete([]); // Clear the deletion list
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
        console.log("Marking node for deletion:", nodeId);
        setNodesToDelete(prevNodes => {
            const newNodes = [...prevNodes, nodeId];
            console.log("Updated nodes to delete:", newNodes);
            return newNodes;
        });
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

            <div className="save-button">
                <button
                    onClick={handleSave}
                    className="bg-[#009FDC] text-white px-6 py-2 rounded-full text-xl font-medium hover:bg-[#007CB8] transition-colors"
                >
                    Save
                </button>
            </div>
        </div>
    );
};

export default Chart;