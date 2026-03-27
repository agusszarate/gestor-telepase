export function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-16 text-text-muted">
      {message}
    </div>
  );
}
