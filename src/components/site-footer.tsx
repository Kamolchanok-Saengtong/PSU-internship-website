import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="bg-navy text-navy-100">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-[1.4fr_1fr_1fr] sm:px-6">
        <div>
          <p className="font-semibold text-white">PSU Phuket Internship Board</p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-navy-200">
            Prince of Songkla University, Phuket Campus
            <br />
            80 Moo 1, Vichitsongkram Rd, Kathu, Phuket 83120
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">For students</p>
          <ul className="mt-2 space-y-1.5 text-sm">
            <li>
              <Link href="/positions" className="hover:text-white hover:underline">
                All positions
              </Link>
            </li>
            <li>
              <Link href="/map" className="hover:text-white hover:underline">
                Find by province
              </Link>
            </li>
            <li>
              <Link href="/compare" className="hover:text-white hover:underline">
                Compare places
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">For staff</p>
          <ul className="mt-2 space-y-1.5 text-sm">
            <li>
              <Link href="/admin" className="hover:text-white hover:underline">
                Manage places
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-navy-200 sm:px-6">
          Draft site. Listings shown are sample data.
        </p>
      </div>
    </footer>
  );
}
