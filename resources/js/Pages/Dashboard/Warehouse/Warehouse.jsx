import React, { useState, useEffect } from "react";
import { Head, Link, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeftLong, faChevronLeft, faEye, faEyeSlash, faPen, faTrash, faChevronRight } from "@fortawesome/free-solid-svg-icons";

const Warehouse = ({ items = [], brands = [], warehouses = [] }) => {
  const [filteredItems, setFilteredItems] = useState(items);
  const [filters, setFilters] = useState({
    status: "All",
    available: "",
    warehouse: "",
    sortBy: "asc",
    category: "",
    brand: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [selectedCategory, setSelectedCategory] = useState("Material Requests");

    const categories = [
        "Material Requests",
        "Item & Categories",
        "Goods Receiving",
        "Goods Issued",
        "Inventory Tracking"
    ];

  useEffect(() => {
    applyFilters();
  }, [filters, items]);

  const applyFilters = () => {
    let filtered = items;

    if (filters.status !== "All") {
      filtered = filtered.filter(item => item.status === filters.status);
    }

    if (filters.available) {
      filtered = filtered.filter(item => item.available === filters.available);
    }

    if (filters.warehouse) {
      filtered = filtered.filter(item => item.manager_id === filters.warehouse);
    }

    if (filters.category) {
      filtered = filtered.filter(item => item.name === filters.category);
    }

    if (filters.brand) {
      filtered = filtered.filter(item => item.code === filters.brand);
    }

    if (filters.sortBy === "asc") {
      filtered.sort((a, b) => a.id - b.id);
    } else {
      filtered.sort((a, b) => b.id - a.id);
    }

    setFilteredItems(filtered);
  };

  const handleFilterChange = (filter, value) => {
    setFilters({ ...filters, [filter]: value });
  };

  const handleEdit = (item) => {
    if (window.confirm("Are you sure you want to edit this item?")) {
      // Implement edit logic here
    }
  };

  const handleDelete = (item) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      // Implement delete logic here
    }
  };

  const paginatedItems = (filteredItems || []).slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <AuthenticatedLayout>
      <Head title="Warehouse" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
        <button
            onClick={() => router.visit("/dashboard")}
            className="flex items-center text-black text-lg font-medium hover:text-gray-800"
        >
            <FontAwesomeIcon icon={faArrowLeftLong} className="mr-2 text-xl" />
            Back
        </button>
          <button
            onClick={() => router.visit("/warehouse/new-item")}
            className="bg-[#009FDC] text-white px-6 py-2 rounded-full hover:bg-[#0077B6] transition-all"
          >
            Add New Item
          </button>
        </div>
        <div className="flex items-center text-[#7D8086] text-lg font-medium space-x-2 mb-6">
            <Link href="/dashboard" className="hover:text-[#009FDC] text-xl">Home</Link>
            <FontAwesomeIcon icon={faChevronRight} className="text-xl text-[#9B9DA2]" />
            <span className="text-[#009FDC] text-xl">Warehouse</span>
        </div>
        <div className="flex justify-between items-center mb-12">
        <h2 className="text-[32px] font-bold text-[#2C323C] whitespace-nowrap">Warehouse</h2>
        <div className="flex justify-between items-center gap-2 overflow-x-auto">
            <div className="p-1 border border-[#B9BBBD] bg-white rounded-full flex flex-nowrap">
                {categories.map((category) => (
                    <button
                        key={category}
                        className={`px-5 py-2 rounded-full text-lg transition whitespace-nowrap ${
                            selectedCategory === category
                                ? "bg-[#009FDC] text-white"
                                : "text-[#9B9DA2]"
                        }`}
                        onClick={() => setSelectedCategory(category)}
                    >
                        {category}
                    </button>
                ))}
            </div>
        </div>
    </div>
        <div className="flex gap-6">
          <div className="w-3/4">
            <table className="w-full bg-white rounded-xl shadow-lg overflow-hidden">
              <thead>
                <tr className="bg-[#C7E7DE]">
                  <th className="p-4 text-left text-[#2C323C]">Item ID</th>
                  <th className="p-4 text-left text-[#2C323C]">Category</th>
                  <th className="p-4 text-left text-[#2C323C]">Brand</th>
                  <th className="p-4 text-left text-[#2C323C]">Available</th>
                  <th className="p-4 text-left text-[#2C323C]">Warehouse#</th>
                  <th className="p-4 text-left text-[#2C323C]">More</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((item, index) => (
                  <tr key={index} className="border-b border-[#E5E7EB]">
                    <td className="p-4 text-[#7D8086]">{item.id}</td>
                    <td className="p-4 text-[#7D8086]">{item.name}</td>
                    <td className="p-4 text-[#7D8086]">{item.code}</td>
                    <td className="p-4 text-[#7D8086]">{item.available}</td>
                    <td className="p-4 text-[#7D8086]">{item.manager_id}</td>
                    <td className="p-4">
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-[#009FDC] hover:text-[#0077B6]"
                        >
                          <FontAwesomeIcon icon={faPen} />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="text-[#FF4D4D] hover:text-[#CC0000]"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-between items-center mt-6">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="text-[#009FDC] hover:text-[#0077B6] disabled:text-[#B9BBBD]"
              >
                Previous
              </button>
              <span className="text-[#7D8086]">Page {currentPage}</span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage * itemsPerPage >= filteredItems.length}
                className="text-[#009FDC] hover:text-[#0077B6] disabled:text-[#B9BBBD]"
              >
                Next
              </button>
            </div>
          </div>
          <div className="w-1/4 bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-lg font-bold text-[#2C323C] mb-6">Filters</h2>
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#7D8086] mb-2">Items</label>
              {["All", "Active", "Inactive", "Draft"].map((status, index) => (
                <div key={index} className="flex justify-between items-center mb-2">
                  <button
                    onClick={() => handleFilterChange("status", status)}
                    className="text-[#009FDC] hover:text-[#0077B6]"
                  >
                    {status}
                  </button>
                  <span className="text-[#7D8086]">{items.filter(item => item.status === status).length}</span>
                </div>
              ))}
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#7D8086] mb-2">Available</label>
              <select
                onChange={(e) => handleFilterChange("available", e.target.value)}
                className="w-full p-2 border border-[#B9BBBD] rounded-lg focus:outline-none focus:border-[#009FDC]"
              >
                <option value="">Select</option>
                {[...new Set(items.map(item => item.available))].map((available, index) => (
                  <option key={index} value={available}>{available}</option>
                ))}
              </select>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#7D8086] mb-2">Warehouse#</label>
              <select
                onChange={(e) => handleFilterChange("warehouse", e.target.value)}
                className="w-full p-2 border border-[#B9BBBD] rounded-lg focus:outline-none focus:border-[#009FDC]"
              >
                <option value="">Select</option>
                {warehouses.map((warehouse, index) => (
                  <option key={index} value={warehouse.id}>{warehouse.name}</option>
                ))}
              </select>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#7D8086] mb-2">Sort By</label>
              <select
                onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                className="w-full p-2 border border-[#B9BBBD] rounded-lg focus:outline-none focus:border-[#009FDC]"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#7D8086] mb-2">Category</label>
              <select
                onChange={(e) => handleFilterChange("category", e.target.value)}
                className="w-full p-2 border border-[#B9BBBD] rounded-lg focus:outline-none focus:border-[#009FDC]"
              >
                <option value="">Select</option>
                {categories.map((category, index) => (
                  <option key={index} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#7D8086] mb-2">Brand</label>
              <select
                onChange={(e) => handleFilterChange("brand", e.target.value)}
                className="w-full p-2 border border-[#B9BBBD] rounded-lg focus:outline-none focus:border-[#009FDC]"
              >
                <option value="">Select</option>
                {brands.map((brand, index) => (
                  <option key={index} value={brand}>{brand}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
};

export default Warehouse;