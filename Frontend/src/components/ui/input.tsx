import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

type InputProps = {
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
};

export function Input({label, type = "text", placeholder, value, onChange,required = false,}: InputProps) {

  const  [showPassword, setShowPassword] = useState(false);
  const isPasswordType = type === "password";

  const inputType = isPasswordType ? (showPassword ? "text" : "password") : type;
  
  return (
    <div className="block">
      <span className="mb-2 block text-sm font-medium text-gray-700">
        {label}
      </span>

      <div className="relative w-full">
        <input
        type={inputType}
        placeholder={placeholder}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-gray-300 bg-white pl-4 pr-12 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20"
      />
      {isPasswordType && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            // 4. Centered mathematically relative only to this div container
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        )}
      </div>
      
    </div>
  );
}