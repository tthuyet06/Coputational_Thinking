import React from "react";

const InputField = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  name,
  error,
}) => {
  return (
    <div className="flex flex-col w-full">
      {label && <label className="text-sm mb-1 font-medium">{label}</label>}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2
          ${error ? "border-red-400 focus:ring-red-300" : "border-gray-300 focus:ring-blue-300"}
        `}
      />
      {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
    </div>
  );
};

export default InputField;
