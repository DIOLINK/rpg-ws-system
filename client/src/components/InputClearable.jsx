import { useRef } from 'react';

export function InputClearable({
  value,
  onChange,
  placeholder = '',
  className = '',
  ...props
}) {
  const inputRef = useRef();
  return (
    <div className={`relative w-full ${className}`}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-gray-700 rounded-lg pr-8 text-sm sm:text-base"
        {...props}
      />
      {value && (
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-400 text-lg font-bold focus:outline-none"
          aria-label="Limpiar"
          onClick={() => {
            onChange({ target: { value: '' } });
            inputRef.current?.focus();
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}
