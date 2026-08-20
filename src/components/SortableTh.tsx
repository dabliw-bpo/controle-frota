import Link from "next/link";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

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
        <span className={isActive ? "text-brand-600" : "text-slate-300"}>
          {isActive ? (
            currentDir === "asc" ? (
              <ChevronUp size={14} strokeWidth={2.5} />
            ) : (
              <ChevronDown size={14} strokeWidth={2.5} />
            )
          ) : (
            <ChevronsUpDown size={14} strokeWidth={2} />
          )}
        </span>
      </Link>
    </th>
  );
}
