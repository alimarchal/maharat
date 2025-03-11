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
            <IconButton
                size="small"
                className="menu-icon"
                onClick={handleClick}
            >
                <FontAwesomeIcon icon={faEllipsisV} />
            </IconButton>

            <div className="node-header">
                <div className="avatar">
                    <FontAwesomeIcon
                        icon={isRoot ? faSitemap : faUser}
                        color={isRoot ? "#009FDC" : "black"}
                    />
                </div>
                <Typography className="node-text">
                    {node.department || "Add Employee Details"}
                </Typography>
                <Typography className="node-text">
                    {node.designation || "Add Employee Details"}
                </Typography>
                <Typography className="node-text">
                    {node.full_name || (
                        <Button
                            startIcon={<FontAwesomeIcon icon={faPlus} />}
                            onClick={() => router.visit('/users')}
                            style={{ textTransform: "none" }}
                        >
                            Add Employee Details
                        </Button>
                    )}
                </Typography>
            </div>

            {hasChildren && (
                <IconButton
                    size="small"
                    className="expand-icon"
                    onClick={onToggleExpand}
                >
                    <FontAwesomeIcon
                        icon={isExpanded ? faChevronUp : faChevronDown}
                    />
                </IconButton>
            )}

            <Menu
                open={Boolean(anchorEl)}
                anchorEl={anchorEl}
                onClose={handleClose}
            >
                <MenuItem
                    onClick={() => {
                        onAddPosition();
                        handleClose();
                    }}
                >
                    Add Position
                </MenuItem>
                {!isRoot && (
                    <MenuItem
                        onClick={() => {
                            onDelete();
                            handleClose();
                        }}
                    >
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
            department: "New Department",
            designation: "New Position",
            full_name: "", // Empty to show "Add Employee Details"
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
                    onAddPosition={handleAddPosition} // Updated to handleAddPosition
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
                const [usersResponse, departmentsResponse] = await Promise.all([
                    axios.get('/api/v1/users'),
                    axios.get('/api/v1/departments'),
                ]);

                console.log("Users API Response:", usersResponse.data);
                console.log("Departments API Response:", departmentsResponse.data);

                const users = usersResponse.data.data;
                const departments = departmentsResponse.data.data;

                // Create a map of department IDs to department names
                const departmentMap = {};
                departments.forEach(dept => {
                    departmentMap[dept.id] = dept.name;
                });

                // Build the hierarchy
                const hierarchy = buildHierarchy(users, departmentMap);
                setOrgChart(hierarchy);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchData();
    }, []);

    const buildHierarchy = (users, departmentMap) => {
        const userMap = {};
        users.forEach(user => {
            user.children = [];
            user.department = departmentMap[user.department_id] || "Unknown Department";
            user.full_name = `${user.firstname || ""} ${user.lastname || ""}`.trim();
            userMap[user.id] = user;
        });

        const rootNodes = [];
        users.forEach(user => {
            if (user.parent_id && userMap[user.parent_id]) {
                userMap[user.parent_id].children.push(user);
            } else {
                rootNodes.push(user);
            }
        });

        return rootNodes.length > 0 ? rootNodes[0] : null;
    };

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
                                        department: "New Department",
                                        designation: "New Position",
                                        full_name: "", // Empty to show "Add Employee Details"
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

            <div className="save-button">
                <Button onClick={handleSave}>Save</Button>
            </div>
        </div>
    );
};

export default Chart;