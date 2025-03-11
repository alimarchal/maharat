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
                <Typography className="node-text font-bold">{node.department}</Typography>
                <Typography className="node-text">{node.title}</Typography>
                <Typography className="node-text">{node.name}</Typography>
            </>
        ) : (
            <Button
                startIcon={<FontAwesomeIcon icon={faPlus} />}
                onClick={() => router.visit('/users', { state: { nodeId: node.id } })}
                sx={{ textTransform: "none", color: "#009FDC", fontSize: "0.85rem" }}
            >
                Add Employee Details
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
}) {
    const [isExpanded, setIsExpanded] = useState(true);

    const handleDelete = () => {
        if (parent) {
            const index = parent.children.findIndex((child) => child === node);
            if (index !== -1) {
                parent.children.splice(index, 1);
                onUpdate();
            }
        }
    };

    const handleAddPosition = () => {
        if (!node.children) {
            node.children = [];
        }
        node.children.push({
            department: "",  
            title: "",       
            name: "",        
            id: `temp-${Date.now()}`, 
            children: [],
        });
        onUpdate();
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
                    />
                ))}
        </TreeNode>
    );
}

const Chart = () => {
    const [orgChart, setOrgChart] = useState(null);
    const [rootExpanded, setRootExpanded] = useState(true);

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

    const handleSave = () => {
        console.log("Saved Organization Chart:", orgChart);
    };

    const updateOrgChart = () => {
        setOrgChart({ ...orgChart });
    };

    if (!orgChart) {
        return (
            <div className="w-full flex justify-center items-center h-screen">
                <Button
                    startIcon={<FontAwesomeIcon icon={faPlus} />}
                    onClick={() => router.visit('/users')}
                >
                    Add Details
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
                                />
                            ))}
                    </Tree>
                </div>
            </div>
        </div>
    );
};

export default Chart;