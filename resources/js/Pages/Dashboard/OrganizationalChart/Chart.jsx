import React, { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeftLong, faChevronRight, faFileCsv, faUser, faSitemap, faEllipsisV, faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import { Tree, TreeNode } from "react-organizational-chart";
import { Card, CardHeader, Avatar, IconButton, Menu, MenuItem, Typography, Button, TextField } from "@mui/material";
import { makeStyles } from "@mui/styles";

const useStyles = makeStyles((theme) => ({
  root: {
    background: "white",
    display: "inline-block",
    borderRadius: 16,
    margin: "10px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    padding: "15px",
    minWidth: "200px",
    textAlign: "center",
    position: "relative",
  },
  avatar: {
    backgroundColor: "transparent",
    border: "none",
    width: "40px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  actionButton: {
    margin: "10px",
  },
  nodeHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
  },
  nodeText: {
    fontSize: "16px",
    fontWeight: "bold",
    marginTop: "10px",
  },
  chartContainer: {
    overflowX: "auto",
    width: "100%",
    padding: "20px",
    backgroundColor: "transparent",
    borderRadius: "12px",
  },
  menuIcon: {
    position: "relative",
    top: "5px",
    right: "-80px",
    zIndex: 10,
  },  
  expandIcon: {
    position: "relative",
    bottom: "0px",
    left: "8%",
    transform: "translateX(-50%)",
    cursor: "pointer",
  },
  collapsedNode: {
    marginBottom: "-40px", // Negative margin to pull up and hide lines
  },
}));

function OrganizationNode({ node, onRename, onDelete, onAddEmployee, isRoot, hasChildren, isExpanded, onToggleExpand }) {
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(node.name);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleRename = () => {
    onRename(newName);
    setIsEditing(false);
    handleClose();
  };

  return (
    <Card variant="outlined" className={classes.root}>
      {/* Three Dots Menu */}
      <IconButton size="small" className={classes.menuIcon} onClick={handleClick}>
        <FontAwesomeIcon icon={faEllipsisV} />
      </IconButton>

      {/* Node Content */}
      <div className={classes.nodeHeader}>
        <Avatar className={classes.avatar} style={{ backgroundColor: "transparent" }}>
          <FontAwesomeIcon
            icon={isRoot ? faSitemap : node.type === "employee" ? faUser : faSitemap}
            color={isRoot ? "#009FDC" : "black"}
          />
        </Avatar>
        {isEditing ? (
          <TextField
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onBlur={handleRename}
            autoFocus
            fullWidth
          />
        ) : (
          <Typography className={classes.nodeText} onClick={() => setIsEditing(true)}>
            {node.name}
          </Typography>
        )}
      </div>

      {/* Expand/Collapse Arrow */}
      {hasChildren && (
        <IconButton size="small" className={classes.expandIcon} onClick={onToggleExpand}>
          <FontAwesomeIcon icon={isExpanded ? faChevronUp : faChevronDown} />
        </IconButton>
      )}

      {/* Menu Options */}
      <Menu open={Boolean(anchorEl)} anchorEl={anchorEl} onClose={handleClose}>
        <MenuItem onClick={() => { onAddEmployee(); handleClose(); }}>Add Employee</MenuItem>
        {!isRoot && <MenuItem onClick={() => { onDelete(); handleClose(); }}>Delete</MenuItem>}
      </Menu>
    </Card>
  );
}

function OrgChartTree({ node, parent, onUpdate, isRoot, parentExpanded = true }) {
  const classes = useStyles();
  const [isExpanded, setIsExpanded] = useState(true);

  const handleRename = (newName) => {
    node.name = newName;
    onUpdate();
  };

  const handleDelete = () => {
    if (parent) {
      const index = parent.children.findIndex(child => child === node);
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
    node.children.push({ name: "New Employee", type: "employee", children: [] });
    onUpdate();
  };

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // If parent isn't expanded, don't render this branch
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
      className={!isExpanded && node.children && node.children.length > 0 ? classes.collapsedNode : ""}
    >
      {node.children && isExpanded && 
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
  name: "Managing Director",
  type: "position",
  children: [],
};

const Chart = () => {
  const [orgChart, setOrgChart] = useState(initialOrgChart);
  const classes = useStyles();
  const [rootExpanded, setRootExpanded] = useState(true);

  const handleSave = () => {
    console.log("Saved Organization Chart:", orgChart);
    // Here you can add logic to save the orgChart to your backend or state management
  };

  // Force re-render by creating a new copy
  const updateOrgChart = () => {
    setOrgChart({...orgChart});
  };

  // Create a separate Tree component for the root when collapsed
  const renderRoot = () => {
    return (
      <Tree
        lineWidth={"2px"}
        lineColor={"#bbc"}
        lineBorderRadius={"12px"}
        label={
          <OrganizationNode
            node={orgChart}
            onRename={(newName) => {
              const updated = {...orgChart, name: newName};
              setOrgChart(updated);
            }}
            onDelete={() => {}}
            onAddEmployee={() => {
              const updated = {...orgChart};
              if (!updated.children) {
                updated.children = [];
              }
              updated.children.push({ name: "New Employee", type: "employee", children: [] });
              setOrgChart(updated);
              setRootExpanded(true); // Auto-expand when adding children
            }}
            isRoot={true}
            hasChildren={orgChart.children && orgChart.children.length > 0}
            isExpanded={rootExpanded}
            onToggleExpand={() => setRootExpanded(!rootExpanded)}
          />
        }
      />
    );
  };

  // Render the full tree when expanded
  const renderFullTree = () => {
    return (
      <Tree
        lineWidth={"2px"}
        lineColor={"#bbc"}
        lineBorderRadius={"12px"}
        label={
          <OrganizationNode
            node={orgChart}
            onRename={(newName) => {
              const updated = {...orgChart, name: newName};
              setOrgChart(updated);
            }}
            onDelete={() => {}}
            onAddEmployee={() => {
              const updated = {...orgChart};
              if (!updated.children) {
                updated.children = [];
              }
              updated.children.push({ name: "New Employee", type: "employee", children: [] });
              setOrgChart(updated);
            }}
            isRoot={true}
            hasChildren={orgChart.children && orgChart.children.length > 0}
            isExpanded={rootExpanded}
            onToggleExpand={() => setRootExpanded(!rootExpanded)}
          />
        }
      >
        {orgChart.children && orgChart.children.length > 0 && rootExpanded && 
          orgChart.children.map((child, index) => (
            <OrgChartTree
              key={index}
              node={child}
              parent={orgChart}
              onUpdate={updateOrgChart}
              isRoot={false}
              parentExpanded={rootExpanded}
            />
          ))
        }
      </Tree>
    );
  };

  return (
    <AuthenticatedLayout>
      <Head title="Chart" />
      <div className="min-h-screen p-6" style={{ backgroundColor: "inherit" }}>
        {/* Back Button and Breadcrumbs */}
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => router.visit("/dashboard")}
            className="flex items-center text-black text-2xl font-medium hover:text-gray-800 p-2"
          >
            <FontAwesomeIcon icon={faArrowLeftLong} className="mr-2 text-2xl" />
            Back
          </button>
        </div>
        <div className="flex items-center text-[#7D8086] text-lg font-medium space-x-2 mb-6">
          <Link href="/dashboard" className="hover:text-[#009FDC] text-xl">Home</Link>
          <FontAwesomeIcon icon={faChevronRight} className="text-xl text-[#9B9DA2]" />
          <span className="text-[#009FDC] text-xl">Organizational Chart</span>
        </div>

        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-[#2C323C]">Organizational Chart</h1>
          <div className="flex space-x-4">
          </div>
        </div>

        <p className="text-[#7D8086] text-xl mb-6">
          Manage users and their hierarchy here.
        </p>

        <div className={classes.chartContainer}>
          {rootExpanded ? renderFullTree() : renderRoot()}
        </div>

        <div className="flex justify-end gap-4 mt-6" style={{ position: "sticky", bottom: "20px" }}>
        <Button
        disableElevation
        sx={{
            backgroundColor: "#009FDC",
            color: "white",
            padding: "8px 16px", // Equivalent to px-4 py-2
            borderRadius: "9999px", // Fully rounded
            fontSize: "1.25rem", // Equivalent to text-xl
            fontWeight: 500, // Equivalent to font-medium
            textTransform: "none", // Prevents capitalization
            "&:hover": {
            backgroundColor: "#0086C9",
            },
        }}
        onClick={handleSave}
        >
        Save
        </Button>
        </div>
      </div>
    </AuthenticatedLayout>
  );
};

export default Chart;