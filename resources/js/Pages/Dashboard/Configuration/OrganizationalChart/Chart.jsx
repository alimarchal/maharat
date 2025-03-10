import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faUser,
    faSitemap,
    faEllipsisV,
    faChevronDown,
    faChevronUp,
} from "@fortawesome/free-solid-svg-icons";
import { Tree, TreeNode } from "react-organizational-chart";
import {
    Card,
    IconButton,
    Menu,
    MenuItem,
    Typography,
    Button,
    TextField,
} from "@mui/material";
import "./Chart.css";

function OrganizationNode({
    node,
    onRename,
    onDelete,
    onAddEmployee,
    isRoot,
    hasChildren,
    isExpanded,
    onToggleExpand,
}) {
    const [anchorEl, setAnchorEl] = useState(null);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);
    const [newTitle, setNewTitle] = useState(node.title);
    const [newName, setNewName] = useState(node.name);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleRenameTitle = () => {
        onRename(newTitle, newName);
        setIsEditingTitle(false);
        handleClose();
    };

    const handleRenameName = () => {
        onRename(newTitle, newName);
        setIsEditingName(false);
        handleClose();
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
                        icon={
                            isRoot
                                ? faSitemap
                                : node.type === "employee"
                                ? faUser
                                : faSitemap
                        }
                        color={isRoot ? "#009FDC" : "black"}
                    />
                </div>
                {isEditingTitle ? (
                    <TextField
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        onBlur={handleRenameTitle}
                        autoFocus
                        fullWidth
                        placeholder="Department/Title"
                        size="small"
                    />
                ) : (
                    <Typography
                        className="node-text"
                        onClick={() => setIsEditingTitle(true)}
                    >
                        {node.title}
                    </Typography>
                )}
                {isEditingName ? (
                    <TextField
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onBlur={handleRenameName}
                        autoFocus
                        fullWidth
                        placeholder="Name"
                        size="small"
                    />
                ) : (
                    <Typography
                        className="node-text"
                        onClick={() => setIsEditingName(true)}
                    >
                        {node.name}
                    </Typography>
                )}
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
                        onAddEmployee();
                        handleClose();
                    }}
                >
                    Add Employee
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

    const handleRename = (newTitle, newName) => {
        node.title = newTitle;
        node.name = newName;
        onUpdate();
    };

    const handleDelete = () => {
        if (parent) {
            const index = parent.children.findIndex((child) => child === node);
            if (index !== -1) {
                parent.children.splice(index, 1);
                onUpdate();
            }
        }
    };

    const handleAddEmployee = () => {
        if (!node.children) {
            node.children = [];
        }
        node.children.push({
            title: "New Title",
            name: "New Employee",
            type: "employee",
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
                    onRename={handleRename}
                    onDelete={handleDelete}
                    onAddEmployee={handleAddEmployee}
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

const initialOrgChart = {
    title: "Managing Director",
    name: "John Doe",
    type: "position",
    children: [],
};

const Chart = () => {
    const [orgChart, setOrgChart] = useState(initialOrgChart);
    const [rootExpanded, setRootExpanded] = useState(true);

    const handleSave = () => {
        console.log("Saved Organization Chart:", orgChart);
    };

    const updateOrgChart = () => {
        setOrgChart({ ...orgChart });
    };

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
                                onRename={(newTitle, newName) => {
                                    const updated = {
                                        ...orgChart,
                                        title: newTitle,
                                        name: newName,
                                    };
                                    setOrgChart(updated);
                                }}
                                onDelete={() => {}}
                                onAddEmployee={() => {
                                    const updated = { ...orgChart };
                                    if (!updated.children) {
                                        updated.children = [];
                                    }
                                    updated.children.push({
                                        title: "New Title",
                                        name: "New Employee",
                                        type: "employee",
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
