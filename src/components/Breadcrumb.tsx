import Link from "next/link";

interface Crumb {
  label: string;
  href?: string;
}

export default function Breadcrumb({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav className="flex items-center gap-2 text-sm mb-6">
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-2">
          {i > 0 && <span className="text-zinc-600">›</span>}
          {crumb.href ? (
            <Link
              href={crumb.href}
              className="text-zinc-400 hover:text-purple-300 transition"
            >
              {crumb.label}
            </Link>
          ) : (
            <span className="text-white font-semibold">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}