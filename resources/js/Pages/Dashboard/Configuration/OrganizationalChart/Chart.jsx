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
    hasSecretaryParent,
    extraClass,
    onMarkForDeletion
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

    const handleDeleteClick = () => {
        onDelete();
        onMarkForDeletion(node.id);
        handleClose();
    };

    // Secretary detection
    const isSecretaryNode = node.designation_id === 23 || (node.title && node.title.toLowerCase().includes('secretary'));

    return (
        <Card 
            variant="outlined" 
            className={`org-node ${hasSecretaryParent ? 'has-secretary-parent' : ''} ${extraClass ? extraClass : ''}`}
        >
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
                    <MenuItem onClick={handleDeleteClick}>
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
    extraClass = '',
    expandedStates,
    onExpansionChange,
    isDummy
}) {
    // If this is a dummy node, render a TreeNode with the dummy-spacing-node class
    if (node.isDummy) {
        return (
            <TreeNode
                label={<div className="dummy-spacing-node">&nbsp;</div>}
                className="dummy-spacing-node-container hide-branch"
            />
        );
    }

    // Initialize expanded state from the Map, defaulting to false if not set
    const [isExpanded, setIsExpanded] = useState(() => {
        return expandedStates.get(node.id) ?? false;
    });

    const handleToggleExpand = () => {
        const newExpandedState = !isExpanded;
        setIsExpanded(newExpandedState);
        onExpansionChange(node.id, newExpandedState);
    };

    const [allChildren, setAllChildren] = useState(node.children || []);

    // Check if node is secretary
    const isSecretary = node.designation_id === 23 || 
        (node.title && node.title.toLowerCase().includes('secretary'));

    // Get regular children and secretary separately
    let regularChildren = allChildren.filter(child => 
        !(child.designation_id === 23 || 
          (child.title && child.title.toLowerCase().includes('secretary')))
    );
    const secretaryChild = allChildren.find(child => 
        child.designation_id === 23 || 
        (child.title && child.title.toLowerCase().includes('secretary'))
    );

    // Debug: Log children structure for this node
    if (node && node.id) {
        console.log('[OrgChartTree] node.id:', node.id, {
            allChildren: allChildren.map(c => c && {id: c.id, title: c.title}),
            regularChildren: regularChildren.map(c => c && {id: c && c.id, title: c && c.title}),
            secretaryChild: secretaryChild && {id: secretaryChild.id, title: secretaryChild.title}
        });
    }

    // Check if parent has a secretary
    const hasSecretaryParent = parent?.children?.some(child => 
        child.designation_id === 23 || 
        (child.title && child.title.toLowerCase().includes('secretary'))
    );

    const handleDelete = (nodeToDelete = node) => {
        if (parent) {
            console.log('=== Delete Process Start ===');
            console.log('Node to delete:', nodeToDelete);
            
            // Remove the node from parent's children
            const index = parent.children.findIndex(child => child.id === nodeToDelete.id);
            if (index !== -1) {
                parent.children.splice(index, 1);
                // Force a complete re-render
                onUpdate(true);
            }
            
            console.log('=== Delete Process End ===');
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
            const parentId = parentData.id === 1 ? 1 : parentData.id;
            
            // Create new node with unique temporary ID
            const tempId = Date.now();
            const newNode = {
                department: "",
                title: "",
                name: "",
                id: tempId,
                hierarchy_level: nextLevel,
                parent_id: parentId,
                children: [],
            };

            // Update local state
            if (!node.children) {
                node.children = [];
            }

            node.children.push(newNode);
            setAllChildren([...node.children]);
            
            onUpdate();
    
        } catch (error) {
            console.error("Error fetching parent data:", error);
        }
    };

    if (!parentExpanded) {
        return null;
    }

    // Add class if parent has secretary
    const nodeClassName = hasSecretaryParent ? 'has-secretary-parent' : '';

    // Build children array: secretary first (if present), then regular children
    let childrenArray = [];
    if (secretaryChild) {
        childrenArray.push(secretaryChild);
    }
    childrenArray = [...childrenArray, ...regularChildren];

    return (
        <TreeNode
            label={
                <div className={`org-node-container ${nodeClassName} ${extraClass}`}>
                    <OrganizationNode
                        node={node}
                        onRename={() => {}}
                        onDelete={() => handleDelete(node)}
                        onAddPosition={handleAddPosition}
                        isRoot={isRoot}
                        hasChildren={regularChildren.length > 0}
                        isExpanded={isExpanded}
                        onToggleExpand={handleToggleExpand}
                        hasSecretaryParent={hasSecretaryParent}
                        onMarkForDeletion={onMarkForDeletion}
                    />
                    {secretaryChild && (
                        <div className="secretary-container">
                            <div className="connecting-line"></div>
                            <SecretaryNode 
                                node={secretaryChild}
                                onDelete={() => handleDelete(secretaryChild)}
                                onMarkForDeletion={onMarkForDeletion}
                            />
                        </div>
                    )}
                </div>
            }
            className={`${nodeClassName} ${isExpanded ? 'expanded' : 'collapsed'} ${regularChildren.length === 0 ? 'leaf' : ''}`}
        >
            {(() => {
                // Insert dummy node as a sibling after any child that has a secretary
                let childrenToRender = [];
                for (let i = 0; i < regularChildren.length; i++) {
                    const child = regularChildren[i];
                    childrenToRender.push(child);
                    // If this child has a secretary, insert a dummy node after it
                    const hasSecretary = (child.children || []).some(
                        c => c.designation_id === 23 ||
                            (c.title && c.title.toLowerCase().includes('secretary'))
                    );
                    if (hasSecretary) {
                        childrenToRender.push({
                            id: `dummy-${child.id}`,
                            isDummy: true,
                            name: 'spacer',
                            title: '',
                            department: '',
                            children: []
                        });
                    }
                }
                return childrenToRender.length > 0 && isExpanded
                    ? childrenToRender.map((child, index) => {
                        if (child.isDummy) {
                            return (
                                <OrgChartTree
                                    key={child.id}
                                    node={child}
                                    parent={node}
                                    onUpdate={onUpdate}
                                    isRoot={false}
                                    parentExpanded={isExpanded}
                                    onMarkForDeletion={onMarkForDeletion}
                                    extraClass={'dummy-spacing-node'}
                                    expandedStates={expandedStates}
                                    onExpansionChange={onExpansionChange}
                                    isDummy
                                />
                            );
                        }
                        return (
                            <OrgChartTree
                                key={child.id || index}
                                node={child}
                                parent={node}
                                onUpdate={onUpdate}
                                isRoot={false}
                                parentExpanded={isExpanded}
                                onMarkForDeletion={onMarkForDeletion}
                                extraClass={''}
                                expandedStates={expandedStates}
                                onExpansionChange={onExpansionChange}
                            />
                        );
                    })
                    : null;
            })()}
        </TreeNode>
    );
}

// Add this new component for Secretary Node
function SecretaryNode({ node, onDelete, onMarkForDeletion }) {
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
        onMarkForDeletion(node.id);
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
    const [key, setKey] = useState(0);
    // Add a Map to store expansion states for each node
    const [expandedStates, setExpandedStates] = useState(new Map());

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

    const updateOrgChart = (forceUpdate = false) => {
        if (forceUpdate) {
            // Force a complete re-render by incrementing the key
            setKey(prev => prev + 1);
        } else {
            // Normal update
            setOrgChart(prev => ({ ...prev }));
        }
    };

    const handleMarkForDeletion = (nodeId) => {
        console.log('=== Mark For Deletion Start ===');
        console.log('Node ID to mark:', nodeId);
        console.log('Current nodes to delete:', nodesToDelete);
        setNodesToDelete(prevNodes => {
            const newNodes = [...prevNodes, nodeId];
            console.log('New nodes to delete:', newNodes);
            return newNodes;
        });
        console.log('=== Mark For Deletion End ===');
    };

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
                }
            }
            
            // Clear the deletion list
            setNodesToDelete([]);
            
            // Refresh the chart data
            const response = await axios.get('/api/v1/users/organogram');
            setOrgChart(response.data.data);
            
            alert("Changes saved successfully!");
        } catch (error) {
            console.error("Error saving changes:", error);
        }
    };

    // Add function to handle expansion state changes
    const handleExpansionChange = (nodeId, isExpanded) => {
        setExpandedStates(prev => {
            const newMap = new Map(prev);
            newMap.set(nodeId, isExpanded);
            return newMap;
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
        <div className="chart-page-container" key={key}>
            <h2 className="text-2xl md:text-3xl font-bold text-[#2C323C] mb-2">
                Organizational Chart
            </h2>
            <p className="text-lg md:text-xl text-[#7D8086] mb-6">
                Manage users and their hierarchy here.
            </p>

            {/* Wrap chart and save button in a flex column container */}
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <div className="chart-wrapper bg-white rounded-lg shadow-sm">
                    <div className="chart-container">
                        <Tree
                            lineWidth={"2px"}
                            lineColor={"#bbc"}
                            lineBorderRadius={"12px"}
                            label={<div className="org-node-container"></div>}
                        >
                            {orgChart && (
                                <OrgChartTree
                                    node={orgChart}
                                    onUpdate={updateOrgChart}
                                    isRoot={true}
                                    parentExpanded={true}
                                    onMarkForDeletion={handleMarkForDeletion}
                                    expandedStates={expandedStates}
                                    onExpansionChange={handleExpansionChange}
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
        </div>
    );
};

export default Chart;