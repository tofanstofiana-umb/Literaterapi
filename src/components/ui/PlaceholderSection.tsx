export default function PlaceholderSection({
  title,
  note,
}: {
  title: string;
  note: string;
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-sakti-gold">
        Segera hadir
      </p>
      <h1 className="mt-2 font-display text-2xl font-semibold text-sakti-forestDark">
        {title}
      </h1>
      <p className="mt-3 text-sm text-sakti-forestDark/70">{note}</p>
    </div>
  );
}
