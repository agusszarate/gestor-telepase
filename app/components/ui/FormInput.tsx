export function FormInput({
  id,
  label,
  type,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-text-secondary mb-1"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-lg border border-border bg-bg-surface focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-text-primary"
        placeholder={placeholder}
      />
    </div>
  );
}
