import React, { useState, useEffect, useCallback } from "react";
import { Head, Link, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeftLong, faChevronLeft, faEye, faEyeSlash, faPen, faTrash, faChevronRight } from "@fortawesome/free-solid-svg-icons";

const Warehouse = ({ items = []}) => {
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
  const [statuses, setStatuses] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [categories1, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const categories = [
        "Material Requests",
        "Item & Categories",
        "Goods Receiving",
        "Goods Issued",
        "Inventory Tracking"];

  useEffect(() => {
      const fetchStatuses = async () => {
          try {
              const response = await fetch(`/api/statuses`);
              const data = await response.json();
              console.log("Fetched statuses:", data); // Debugging
              if (response.ok) {
                  setStatuses(Array.isArray(data) ? data : []);  
              } else {
                  setError("Failed to fetch statuses.");
              }
          } catch (err) {
              setError("Error loading statuses.");
          } finally {
              setLoading(false);
          }
      };
      fetchStatuses();
  }, []); 

  const applyFilters = useCallback(() => {
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
  }, [filters, items]);

  useEffect(() => {
    applyFilters();
    setCurrentPage(1);
  }, [applyFilters]);

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

  const lastPage = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice(
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
            className="flex items-center text-black text-2xl font-medium hover:text-gray-800 p-2"
        >
            <FontAwesomeIcon icon={faArrowLeftLong} className="mr-2 text-2xl" />
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
          <div className="w-2/3">
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
                        <Link
                            href={`/warehouse/${item.id}`}
                            className="text-[#009FDC] hover:text-[#0077B6]"
                        >
                            <FontAwesomeIcon icon={faEye} />
                        </Link>
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
            <div className="flex justify-center items-center mt-6 space-x-2">
              {Array.from({ length: lastPage }, (_, i) => i + 1).map((page) => (
                  <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 ${
                          currentPage === page
                              ? "bg-[#009FDC] text-white"
                              : "border border-[#B9BBBD] bg-white"
                      } rounded-full hover:bg-gray-100 transition`}
                  >
                      {page}
                  </button>
              ))}
          </div>
          </div>
          <div className="w-1/3 bg-white p-6 rounded-xl shadow-lg text-[95%]">
          {/* Items Section */}
          <h2 className="text-lg font-bold text-black mb-4">Items</h2>
          <div className="grid grid-cols-2 gap-4 mb-6">
              {["All", "Active", "Inactive", "Draft"].map((status, index) => (
                  <button
                      key={index}
                      onClick={() => handleFilterChange("status", status)}
                      className="flex justify-between items-center p-3 border rounded-lg shadow-sm w-full text-black font-medium"
                  >
                      {status}
                      <span className={
                          status === "All" ? "text-blue-500" :
                          status === "Active" ? "text-green-500" :
                          status === "Inactive" ? "text-red-500" : "text-purple-500"
                      }>
                          {Array.isArray(statuses) ? statuses.filter(item => item.status === status).length : 0}
                      </span>
                  </button>
              ))}
          </div>

          {/* Filter Section */}
          <h2 className="text-md font-semibold text-black mb-2">Filters</h2>
          <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Available Input */}
              <input
                  type="text"
                  placeholder="Available"
                  className="w-full p-3 border border-gray-300 rounded-lg placeholder-gray-500 bg-white"
                  readOnly
              />
              {/* Warehouse Input */}
              <input
                  type="text"
                  placeholder="Warehouse#"
                  className="w-full p-3 border border-gray-300 rounded-lg placeholder-gray-500 bg-white"
                  readOnly
              />
          </div>

          {/* Sort By Section */}
          <h2 className="text-md font-semibold text-black mb-2">Sort By</h2>
          <select onChange={(e) => handleFilterChange("sortBy", e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg bg-white text-black focus:ring-2 focus:ring-blue-500">
              <option value="">Select Sorting</option>
              <option value="asc">Ascending (A-Z)</option>
              <option value="desc">Descending (Z-A)</option>
          </select>

          {/* Category Section */}
          <h2 className="text-md font-semibold text-black mt-4 mb-2">Category</h2>
          <select onChange={(e) => handleFilterChange("category", e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg bg-white text-black focus:ring-2 focus:ring-blue-500">
              <option value="">Select Category</option>
              {categories1.map((category, index) => (
                  <option key={index} value={category}>{category}</option>
              ))}
          </select>

          {/* Brand Section */}
          <h2 className="text-md font-semibold text-black mt-4 mb-2">Brand</h2>
          <select onChange={(e) => handleFilterChange("brand", e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg bg-white text-black focus:ring-2 focus:ring-blue-500">
              <option value="">Select Brand</option>
              {brands.map((brand, index) => (
                  <option key={index} value={brand}>{brand}</option>
              ))}
          </select>
      </div>

        </div>
      </div>
    </AuthenticatedLayout>
  );
};

export default Warehouse;