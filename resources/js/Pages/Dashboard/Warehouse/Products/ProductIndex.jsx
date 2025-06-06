import React from "react";
import { Link } from "@inertiajs/react";
import ProductsTable from "./ProductsTable";
import { useRequestItems } from "@/Components/RequestItemsContext";

const ProductIndex = () => {
    const { pendingCount } = useRequestItems();

    return (
        <div className="min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-[#2C323C] mb-4">
                    Items
                </h2>
                <Link
                    href="/items/create"
                    className="relative bg-[#009FDC] text-white px-4 py-2 rounded-full text-xl font-medium"
                >
                    Create New Item
                    {pendingCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-sm h-6 w-6 rounded-full flex items-center justify-center">
                            {pendingCount}
                        </span>
                    )}
                </Link>
            </div>
            <ProductsTable />
        </div>
    );
};

export default ProductIndex;
