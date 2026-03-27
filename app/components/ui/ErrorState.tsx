export function ErrorState({
  message,
  actionLabel,
  onAction,
}: {
  message: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-bg-error text-text-error px-6 py-4 rounded-xl max-w-md text-center">
        <p className="font-medium">{message}</p>
        <button
          onClick={onAction}
          className="mt-4 text-sm text-text-error underline cursor-pointer"
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
