import { useEffect, useState } from "react";
import { Link } from "@inertiajs/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";

const ProductsTable = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const response = await fetch(
                    `/api/v1/products?include=category,unit&page=${currentPage}`
                );
                const data = await response.json();
                if (response.ok) {
                    setProducts(data.data || []);
                    setLastPage(data.meta?.last_page || 1);
                } else {
                    setError(data.message || "Failed to fetch items.");
                }
            } catch (err) {
                console.error("Error fetching items:", err);
                setError("Error loading items.");
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [currentPage]);

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this Item?")) return;
        try {
            const response = await fetch(`/api/v1/products/${id}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
            });

            if (response.ok) {
                setProducts((prevProducts) =>
                    prevProducts.filter((product) => product.id !== id)
                );
            } else {
                const data = await response.json();
                alert(data.message || "Failed to delete item.");
            }
        } catch (err) {
            console.error("Error deleting item:", err);
            alert("An error occurred while deleting the item.");
        }
    };

    return (
        <div className="w-full overflow-hidden">
            <table className="w-full">
                <thead className="bg-[#C7E7DE] text-[#2C323C] text-xl font-medium text-left">
                    <tr>
                        <th className="py-3 px-4 rounded-tl-2xl rounded-bl-2xl">
                            ID
                        </th>
                        <th className="py-3 px-4">Item Name</th>
                        <th className="py-3 px-4">Category Name</th>
                        <th className="py-3 px-4">Units</th>
                        <th className="py-3 px-4">Item Code</th>
                        <th className="py-3 px-4">Description</th>
                        <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="text-[#2C323C] text-base font-medium divide-y divide-[#D7D8D9]">
                    {loading ? (
                        <tr>
                            <td colSpan="7" className="text-center py-12">
                                <div className="w-12 h-12 border-4 border-[#009FDC] border-t-transparent rounded-full animate-spin"></div>
                            </td>
                        </tr>
                    ) : error ? (
                        <tr>
                            <td
                                colSpan="7"
                                className="text-center text-red-500 font-medium py-4"
                            >
                                {error}
                            </td>
                        </tr>
                    ) : products.length > 0 ? (
                        products.map((product) => (
                            <tr key={product.id}>
                                <td className="py-3 px-4">{product.id}</td>
                                <td className="py-3 px-4">{product.name}</td>
                                <td className="py-3 px-4">
                                    {product?.category?.name}
                                </td>
                                <td className="py-3 px-4">
                                    {product?.unit?.name}
                                </td>
                                <td className="py-3 px-4">{product.upc}</td>
                                <td className="py-3 px-4">
                                    {product.description}
                                </td>
                                <td className="py-3 px-4 flex space-x-3">
                                    {/* <Link className="text-[#9B9DA2] hover:text-gray-500">
                                        <FontAwesomeIcon icon={faEye} />
                                    </Link> */}
                                    <Link
                                        href={`/items/${product.id}/edit`}
                                        className="text-[#9B9DA2] hover:text-gray-500"
                                    >
                                        <FontAwesomeIcon icon={faEdit} />
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(product.id)}
                                        className="text-[#9B9DA2] hover:text-gray-500"
                                    >
                                        <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td
                                colSpan="7"
                                className="text-center text-[#2C323C] font-medium py-4"
                            >
                                No Items found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Pagination */}
            {!loading && !error && products.length > 0 && (
                <div className="p-4 flex justify-end space-x-2 font-medium text-sm">
                    {Array.from(
                        { length: lastPage },
                        (_, index) => index + 1
                    ).map((page) => (
                        <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-1 ${
                                currentPage === page
                                    ? "bg-[#009FDC] text-white"
                                    : "border border-[#B9BBBD] bg-white"
                            } rounded-full hover:bg-[#0077B6] transition`}
                        >
                            {page}
                        </button>
                    ))}
                    <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        className={`px-3 py-1 bg-[#009FDC] text-white rounded-full hover:bg-[#0077B6] transition ${
                            currentPage >= lastPage
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                        }`}
                        disabled={currentPage >= lastPage}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default ProductsTable;
