export function PagadaCheckbox({
  checked,
  onChange,
  title,
}: {
  checked: boolean;
  onChange: () => void;
  title?: string;
}) {
  return (
    <button
      onClick={onChange}
      className={`w-6 h-6 rounded-md border-2 inline-flex items-center justify-center cursor-pointer transition shrink-0 ${
        checked
          ? "bg-green-500 border-green-500 text-white"
          : "border-border hover:border-green-400"
      }`}
      title={title}
    >
      {checked && (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3}
            d="M5 13l4 4L19 7"
          />
        </svg>
      )}
    </button>
  );
}
