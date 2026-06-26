import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: {
    default: "Documentation — Proxoria",
    template: "%s — Proxoria Docs",
  },
};

const NAV = [
  {
    group: "Getting Started",
    links: [
      { href: "/docs", label: "Overview" },
      { href: "/docs/quickstart", label: "Quickstart" },
    ],
  },
  {
    group: "Reference",
    links: [
      { href: "/docs/providers", label: "Provider Reference" },
      { href: "/docs/cost-management", label: "Cost Management" },
      { href: "/docs/team-management", label: "Team Management" },
    ],
  },
];

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      {/* Top nav */}
      <nav className="border-b border-gray-100 sticky top-0 bg-white z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-base font-bold text-gray-900">
              Proxoria
            </Link>
            <span className="text-gray-300">/</span>
            <Link href="/docs" className="text-sm text-gray-600 hover:text-gray-900">
              Docs
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              Pricing
            </Link>
            <Link
              href="/sign-up"
              className="text-sm font-medium bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex">
        {/* Sidebar */}
        <aside className="hidden md:block w-56 shrink-0 pt-8 pr-8 sticky top-14 self-start max-h-[calc(100vh-3.5rem)] overflow-y-auto pb-8">
          {NAV.map((section) => (
            <div key={section.group} className="mb-6">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                {section.group}
              </p>
              <ul className="space-y-1">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="block text-sm text-gray-600 hover:text-gray-900 py-1 rounded hover:bg-gray-50 px-2 -mx-2 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 pt-8 pb-16 pl-0 md:pl-8 border-l border-gray-100">
          {children}
        </main>
      </div>
    </div>
  );
}
