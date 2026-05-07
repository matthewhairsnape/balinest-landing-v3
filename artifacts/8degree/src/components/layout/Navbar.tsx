import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  LANGUAGE_OPTIONS,
  LANGUAGE_STORAGE_KEY,
  UI_COPY,
  safeLanguage,
  type SiteLanguage,
} from "@/lib/site-language";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [language, setLanguage] = useState<SiteLanguage>("en");
  const [location] = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setLanguage(safeLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const copy = UI_COPY[language];
  const navLinks = [
    { href: "/projects", label: copy.properties },
    { href: "/projects/completed", label: copy.portfolio },
    { href: "/invest", label: copy.invest },
    { href: "/about", label: copy.aboutUs },
    { href: "/blog", label: copy.journal },
  ];

  return (
    <nav
      className={cn(
        "fixed left-0 right-0 top-0 z-50 pt-[env(safe-area-inset-top,0px)] transition-all duration-300",
        isScrolled
          ? "border-b border-border/50 bg-background/90 py-3 backdrop-blur-md md:py-4"
          : "bg-transparent py-4 md:py-6"
      )}
    >
      <div className="container mx-auto flex items-center justify-between px-4 sm:px-6 md:px-12">
        <Link href="/">
          <div className="font-serif text-2xl font-bold tracking-widest cursor-pointer text-foreground">
            8 DEGREE
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center space-x-8">
          <label className="sr-only" htmlFor="language-switcher-desktop">
            Language
          </label>
          <select
            id="language-switcher-desktop"
            value={language}
            onChange={(e) => setLanguage(safeLanguage(e.target.value))}
            className="h-9 rounded border border-border bg-background px-2 text-xs uppercase tracking-wider text-foreground"
            aria-label="Language"
          >
            {LANGUAGE_OPTIONS.map((opt) => (
              <option key={opt.code} value={opt.code}>
                {opt.label}
              </option>
            ))}
          </select>
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <div
                className={cn(
                  "text-sm font-medium tracking-wide uppercase transition-colors cursor-pointer",
                  location === link.href
                    ? "text-primary"
                    : "text-foreground/80 hover:text-primary"
                )}
              >
                {link.label}
              </div>
            </Link>
          ))}
          <Link href="/contact">
            <Button
              variant={isScrolled ? "default" : "outline"}
              className={cn(
                "rounded-none tracking-widest uppercase",
                !isScrolled && "border-foreground text-foreground hover:bg-foreground hover:text-background"
              )}
            >
              {copy.enquire}
            </Button>
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          type="button"
          className="text-foreground flex min-h-11 min-w-11 items-center justify-center md:hidden"
          aria-expanded={isOpen}
          aria-label={isOpen ? "Close menu" : "Open menu"}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full flex max-h-[min(70dvh,calc(100dvh-5rem))] flex-col gap-6 overflow-y-auto border-b border-border bg-background p-6 shadow-xl md:hidden">
          <label className="text-xs uppercase tracking-[0.16em] text-muted-foreground" htmlFor="language-switcher-mobile">
            Language
          </label>
          <select
            id="language-switcher-mobile"
            value={language}
            onChange={(e) => setLanguage(safeLanguage(e.target.value))}
            className="h-11 rounded border border-border bg-background px-3 text-sm text-foreground"
            aria-label="Language"
          >
            {LANGUAGE_OPTIONS.map((opt) => (
              <option key={opt.code} value={opt.code}>
                {opt.label}
              </option>
            ))}
          </select>
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <div
                className="text-lg font-serif tracking-wider cursor-pointer"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </div>
            </Link>
          ))}
          <Link href="/contact">
            <Button
              className="w-full rounded-none tracking-widest uppercase"
              onClick={() => setIsOpen(false)}
            >
              {copy.enquire}
            </Button>
          </Link>
        </div>
      )}
    </nav>
  );
}
