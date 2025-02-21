const InputFloating = ({ label, name, value, onChange, type = "text" }) => {
    return (
        <div className="relative w-full">
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                placeholder=" "
                className="peer border border-gray-300 p-5 rounded-2xl w-full bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#009FDC] focus:border-[#009FDC] transition-all duration-300 ease-in-out"
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
        </div>
    );
};

export default InputFloating;
