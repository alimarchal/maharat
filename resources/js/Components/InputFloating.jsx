const InputFloating = ({ label, name, value, onChange, type = "text", error, readOnly = false, placeholder }) => {
    return (
        <div className="relative w-full">
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                readOnly={readOnly}
                placeholder={placeholder || (type === "date" ? "DD/MM/YYYY" : " ")}
                className={`peer border ${error ? 'border-red-500' : 'border-gray-300'} p-5 rounded-2xl w-full bg-white appearance-none focus:outline-none focus:ring-2 ${error ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-[#009FDC] focus:border-[#009FDC]'} transition-all duration-300 ease-in-out ${readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            />

            <label
                className={`absolute left-4 px-1 bg-white text-gray-500 text-base transition-all
                peer-placeholder-shown:top-5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400
                peer-focus:-top-2 peer-focus:left-4 peer-focus:text-sm peer-focus:text-[#009FDC] peer-focus:px-2
                ${
                    value
                        ? "-top-2 left-4 text-sm text-[#009FDC] px-2"
                        : "top-5 text-base text-gray-400"
                }`}
            >
                {label}
            </label>
            
            {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
        </div>
    );
};

export default InputFloating;
