const SelectFloating = ({ label, name, value, onChange, options }) => {
    return (
        <div className="relative w-full">
            <select
                name={name}
                value={value}
                onChange={onChange}
                className="peer border border-gray-300 p-5 rounded-2xl w-full bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#009FDC] focus:border-[#009FDC] transition-all duration-300 ease-in-out"
            >
                <option value="" disabled>
                    {`Select ${label}`}
                </option>
                {options.map((option, index) => (
                    <option key={index} value={option.id}>
                        {option.label}
                    </option>
                ))}
            </select>
            <label
                className={`absolute left-3 px-2 bg-white text-gray-500 text-base transition-all
                peer-focus:top-0 peer-focus:text-base peer-focus:text-[#009FDC] peer-focus:px-2
                -translate-y-1/2 ${
                    value
                        ? "top-0 text-base text-[#009FDC] px-2"
                        : "top-1/2 text-base text-gray-400"
                }`}
            >
                {value ? label : `Select ${label}`}
            </label>
        </div>
    );
};

export default SelectFloating;
