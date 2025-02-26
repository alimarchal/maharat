import React from "react";
import InputFloating from "../../../Components/InputFloating";

const CreateProcessFlow = () => {
    return (
        <>
            <h2 className="text-3xl font-bold text-[#2C323C]">
                Make a New Process Flow
            </h2>

            <form className="space-y-6 mt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <InputFloating label="Name" name="name" />
                    </div>
                </div>
                <div className="flex justify-end">
                    <button
                        type="submit"
                        className="bg-[#009FDC] text-white text-lg font-medium px-6 py-3 rounded-lg hover:bg-[#007CB8] disabled:opacity-50"
                    >
                        Create Process Flow
                    </button>
                </div>
            </form>
        </>
    );
};

export default CreateProcessFlow;
