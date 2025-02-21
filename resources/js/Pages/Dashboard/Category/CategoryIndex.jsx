import React from "react";
import { Link } from "@inertiajs/react";
import CategoryTable from "./CategoryTable";

const CategoryIndex = () => {
    return (
        <div className="min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-[#2C323C] mb-4">
                    Categories
                </h2>
                <Link
                    href="/new-category"
                    className="bg-[#009FDC] text-white px-4 py-2 rounded-full text-xl font-medium"
                >
                    Create New Category
                </Link>
            </div>
            <CategoryTable />
        </div>
    );
};

export default CategoryIndex;
