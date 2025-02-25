import { useEffect, useState } from "react";
import { Link } from "@inertiajs/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";

const CategoryTable = () => {
    const [category, setCategory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);

    useEffect(() => {
        const fetchCategory = async () => {
            setLoading(true);
            try {
                const response = await fetch(
                    `/api/v1/product-categories?page=${currentPage}`
                );
                const data = await response.json();

                if (response.ok) {
                    setCategory(data.data || []);
                    setLastPage(data.meta?.last_page || 1);
                } else {
                    setError(data.message || "Failed to fetch category.");
                }
            } catch (err) {
                console.error("Error fetching category:", err);
                setError("Error loading category.");
            } finally {
                setLoading(false);
            }
        };

        fetchCategory();
    }, [currentPage]);

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this Category?")) return;

        try {
            const response = await fetch(`/api/v1/product-categories/${id}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
            });

            if (response.ok) {
                setCategory((prevCategories) =>
                    prevCategories.filter((cat) => cat.id !== id)
                );
            } else {
                const data = await response.json();
                alert(data.message || "Failed to delete category.");
            }
        } catch (err) {
            console.error("Error deleting category:", err);
            alert("An error occurred while deleting the category.");
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
                        <th className="py-3 px-4">Category Name</th>
                        <th className="py-3 px-4 rounded-tr-2xl rounded-br-2xl">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="text-[#2C323C] text-base font-medium divide-y divide-[#D7D8D9]">
                    {loading ? (
                        <tr>
                            <td colSpan="3" className="text-center py-12">
                                <div className="w-12 h-12 border-4 border-[#009FDC] border-t-transparent rounded-full animate-spin"></div>
                            </td>
                        </tr>
                    ) : error ? (
                        <tr>
                            <td
                                colSpan="3"
                                className="text-center text-red-500 font-medium py-4"
                            >
                                {error}
                            </td>
                        </tr>
                    ) : category.length > 0 ? (
                        category.map((cat) => (
                            <tr key={cat.id}>
                                <td className="py-3 px-4">{cat.id}</td>
                                <td className="py-3 px-4">{cat.name}</td>
                                <td className="py-3 px-4 flex space-x-3">
                                    {/* <Link className="text-[#9B9DA2] hover:text-gray-500">
                                        <FontAwesomeIcon icon={faEye} />
                                    </Link> */}
                                    <Link
                                        href={`/category/${cat.id}/edit`}
                                        className="text-[#9B9DA2] hover:text-gray-500"
                                    >
                                        <FontAwesomeIcon icon={faEdit} />
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(cat.id)}
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
                                colSpan="3"
                                className="text-center text-[#2C323C] font-medium py-4"
                            >
                                No Categories found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Pagination */}
            {!loading && !error && category.length > 0 && (
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

export default CategoryTable;
