import Link from "next/link";

const navItems = [
  ["Product", "/#product"],
  ["Architecture", "/#architecture"],
  ["Use Cases", "/#usecases"],
  ["Pricing", "/#pricing"],
  ["Docs", "/#docs"]
];

export function Logo() {
  return (
    <Link className="brand" href="/" data-cursor="interactive">
      <span className="brand-mark">
        <span className="brand-dot" />
      </span>
      Grounded
    </Link>
  );
}

export function Header() {
  return (
    <header className="nav">
      <div className="wrap nav-inner">
        <Logo />
        <nav className="nav-links" aria-label="Main navigation">
          {navItems.map(([label, href]) => (
            <Link href={href} key={href}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="nav-actions">
          <Link className="btn btn-ghost" href="/login">
            Log in
          </Link>
          <Link className="btn btn-dark" href="/app">
            Start demo
          </Link>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer-inner">
        <Logo />
        <div className="footer-links">
          {navItems.slice(0, 4).map(([label, href]) => (
            <Link href={href} key={href}>
              {label}
            </Link>
          ))}
          <Link href="/login">Log in</Link>
        </div>
        <span className="mono">2026 · self-hostable</span>
      </div>
    </footer>
  );
}
