import Link from "next/link";

export default function SortableTh({
  label,
  sortKey,
  currentSort,
  currentDir,
  searchParams,
}: {
  label: string;
  sortKey: string;
  currentSort?: string;
  currentDir?: string;
  searchParams: Record<string, string | undefined>;
}) {
  const isActive = currentSort === sortKey;
  const nextDir = isActive && currentDir === "asc" ? "desc" : "asc";

  const params = new URLSearchParams();
  Object.entries(searchParams).forEach(([k, v]) => {
    if (v && k !== "sort" && k !== "dir") params.set(k, v);
  });
  params.set("sort", sortKey);
  params.set("dir", nextDir);

  return (
    <th className="px-4 py-3 font-medium">
      <Link href={`?${params.toString()}`} className="inline-flex items-center gap-1 hover:text-slate-800">
        {label}
        <span className={`text-[10px] leading-none ${isActive ? "text-brand-600" : "text-slate-300"}`}>
          {isActive ? (currentDir === "asc" ? "▲" : "▼") : "▲▼"}
        </span>
      </Link>
    </th>
  );
}
