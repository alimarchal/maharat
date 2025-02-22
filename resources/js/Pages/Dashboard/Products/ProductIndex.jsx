import React from "react";
import { Link } from "@inertiajs/react";
import ProductsTable from "./ProductsTable";

const ProductIndex = () => {
    return (
        <div className="min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-[#2C323C] mb-4">
                    Products
                </h2>
                <Link
                    href="/products/create"
                    className="bg-[#009FDC] text-white px-4 py-2 rounded-full text-xl font-medium"
                >
                    Create New Product
                </Link>
            </div>
            <ProductsTable />
        </div>
    );
};

export default ProductIndex;
