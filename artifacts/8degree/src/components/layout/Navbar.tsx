import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { ArrowRight, ChevronDown, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SITE_MEDIA } from "@/lib/site-assets";
import {
  LANGUAGE_OPTIONS,
  LANGUAGE_STORAGE_KEY,
  UI_COPY,
  safeLanguage,
  type SiteLanguage,
} from "@/lib/site-language";
import {
  CURRENCY_CHANGE_EVENT,
  CURRENCY_STORAGE_KEY,
} from "@/lib/site-currency";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [language, setLanguage] = useState<SiteLanguage>("en");
  const [currency, setCurrency] = useState("USD");
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [isCurrencyMenuOpen, setIsCurrencyMenuOpen] = useState(false);
  const [isPropertyMenuOpen, setIsPropertyMenuOpen] = useState(false);
  const [isServicesMenuOpen, setIsServicesMenuOpen] = useState(false);
  const [isGuidesMenuOpen, setIsGuidesMenuOpen] = useState(false);
  const languageMenuRef = useRef<HTMLDivElement | null>(null);
  const currencyMenuRef = useRef<HTMLDivElement | null>(null);
  const propertyMenuRef = useRef<HTMLDivElement | null>(null);
  const servicesMenuRef = useRef<HTMLDivElement | null>(null);
  const guidesMenuRef = useRef<HTMLDivElement | null>(null);
  const [location] = useLocation();
  const languageFlagMap: Record<SiteLanguage, string> = {
    id: "🇮🇩",
    en: "🇬🇧",
    fr: "🇫🇷",
    zh: "🇨🇳",
    tr: "🇹🇷",
  };
  const languageCodeMap: Record<SiteLanguage, string> = {
    id: "ID",
    en: "EN",
    fr: "FR",
    zh: "ZH",
    tr: "TR",
  };

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
    setCurrency(window.localStorage.getItem(CURRENCY_STORAGE_KEY) ?? "USD");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    document.documentElement.lang = language;
    window.dispatchEvent(new Event("site-language-change"));
  }, [language]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
    window.dispatchEvent(new Event(CURRENCY_CHANGE_EVENT));
  }, [currency]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        languageMenuRef.current &&
        !languageMenuRef.current.contains(event.target as Node)
      ) {
        setIsLanguageMenuOpen(false);
      }
      if (
        currencyMenuRef.current &&
        !currencyMenuRef.current.contains(event.target as Node)
      ) {
        setIsCurrencyMenuOpen(false);
      }
      const clickNode = event.target as Node;
      const clickEl =
        clickNode.nodeType === Node.TEXT_NODE ? clickNode.parentElement : (clickNode as Element | null);

      if (isPropertyMenuOpen) {
        const inTrigger = propertyMenuRef.current?.contains(clickNode);
        const inMega = clickEl?.closest("[data-navbar-mega='properties']");
        if (!inTrigger && !inMega) setIsPropertyMenuOpen(false);
      }
      if (isServicesMenuOpen) {
        const inTrigger = servicesMenuRef.current?.contains(clickNode);
        const inMega = clickEl?.closest("[data-navbar-mega='services']");
        if (!inTrigger && !inMega) setIsServicesMenuOpen(false);
      }
      if (isGuidesMenuOpen) {
        const inTrigger = guidesMenuRef.current?.contains(clickNode);
        const inMega = clickEl?.closest("[data-navbar-mega='guides']");
        if (!inTrigger && !inMega) setIsGuidesMenuOpen(false);
      }
    }

    function handleEsc(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsLanguageMenuOpen(false);
        setIsCurrencyMenuOpen(false);
        setIsPropertyMenuOpen(false);
        setIsServicesMenuOpen(false);
        setIsGuidesMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [isPropertyMenuOpen, isServicesMenuOpen, isGuidesMenuOpen]);

  const copy = UI_COPY[language] ?? UI_COPY.en;
  const isPropertySectionActive =
    location === "/projects" ||
    location.startsWith("/projects/") ||
    location.startsWith("/properties/") ||
    location === "/long-term-rentals";
  const navLinks = [
    { href: "/invest", label: copy.invest },
    { href: "/about", label: copy.aboutUs },
    { href: "/blog", label: copy.journal },
  ];

  return (
    <nav
      className={cn(
        "fixed left-0 right-0 top-0 z-50 pt-[env(safe-area-inset-top,0px)] transition-all duration-300",
        isScrolled
          ? "border-b border-white/20 bg-[#01514E]/70 py-3 backdrop-blur-md md:py-4"
          : "border-b border-white/15 bg-[#01514E]/40 py-4 backdrop-blur-sm md:py-5"
      )}
    >
      <div className="w-full flex items-center justify-between pl-[1cm] pr-4 sm:pr-6 md:pr-8">
        <Link href="/">
          <div className="cursor-pointer text-white shrink-0 ml-[1cm]">
            <img
              src="/brand/8degree-logotype-white-transparent.png"
              alt="8 Degree Real Estate"
              className="h-7 w-auto max-w-[190px] object-contain"
              data-testid="navbar-logo-img"
            />
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="ml-auto hidden flex-nowrap items-center gap-5 lg:gap-7 xl:gap-8 md:flex">
          <div className="relative" ref={propertyMenuRef}>
            <button
              type="button"
              className={cn(
                "flex items-center gap-1 whitespace-nowrap text-xs font-medium tracking-wide uppercase transition-colors lg:text-sm",
                isPropertySectionActive || isPropertyMenuOpen
                  ? "text-white"
                  : "text-white/85 hover:text-white",
              )}
              aria-haspopup="menu"
              aria-expanded={isPropertyMenuOpen}
              onClick={() => {
                setIsPropertyMenuOpen((prev) => {
                  const next = !prev;
                  if (next) {
                    setIsServicesMenuOpen(false);
                    setIsGuidesMenuOpen(false);
                  }
                  return next;
                });
              }}
            >
              {copy.properties}
              <ChevronDown size={14} className={cn("transition-transform", isPropertyMenuOpen && "rotate-180")} />
            </button>
          </div>
          <div className="relative" ref={servicesMenuRef}>
            <button
              type="button"
              className="flex items-center gap-1 whitespace-nowrap text-xs font-medium tracking-wide uppercase text-white/85 transition-colors hover:text-white lg:text-sm"
              aria-haspopup="menu"
              aria-expanded={isServicesMenuOpen}
              onClick={() => {
                setIsServicesMenuOpen((prev) => {
                  const next = !prev;
                  if (next) {
                    setIsPropertyMenuOpen(false);
                    setIsGuidesMenuOpen(false);
                  }
                  return next;
                });
              }}
            >
              {copy.services}
              <ChevronDown size={14} className={cn("transition-transform", isServicesMenuOpen && "rotate-180")} />
            </button>
          </div>
          <Link href={navLinks[0].href}>
            <div
              className={cn(
                "cursor-pointer whitespace-nowrap text-xs font-medium tracking-wide uppercase transition-colors lg:text-sm",
                location === navLinks[0].href
                  ? "text-white"
                  : "text-white/85 hover:text-white"
              )}
            >
              {navLinks[0].label}
            </div>
          </Link>
          <div className="relative" ref={guidesMenuRef}>
            <button
              type="button"
              className="flex items-center gap-1 whitespace-nowrap text-xs font-medium tracking-wide uppercase text-white/85 transition-colors hover:text-white lg:text-sm"
              aria-haspopup="menu"
              aria-expanded={isGuidesMenuOpen}
              onClick={() => {
                setIsGuidesMenuOpen((prev) => {
                  const next = !prev;
                  if (next) {
                    setIsPropertyMenuOpen(false);
                    setIsServicesMenuOpen(false);
                  }
                  return next;
                });
              }}
            >
              {copy.guides}
              <ChevronDown size={14} className={cn("transition-transform", isGuidesMenuOpen && "rotate-180")} />
            </button>
          </div>
          {navLinks.slice(1).map((link) => (
            <Link key={link.href} href={link.href}>
              <div
                className={cn(
                  "cursor-pointer whitespace-nowrap text-xs font-medium tracking-wide uppercase transition-colors lg:text-sm",
                  location === link.href
                    ? "text-white"
                    : "text-white/85 hover:text-white"
                )}
              >
                {link.label}
              </div>
            </Link>
          ))}
          <Link href="/contact">
            <Button
              variant="outline"
              className="h-9 whitespace-nowrap rounded border border-white/50 bg-transparent px-2 text-xs uppercase tracking-wide text-white hover:bg-white/15 hover:text-white"
            >
              {copy.enquire}
            </Button>
          </Link>
          <div className="relative" ref={currencyMenuRef}>
            <button
              type="button"
              className="flex h-9 items-center gap-1 rounded border border-white/50 bg-transparent px-2 text-xs text-white"
              aria-haspopup="menu"
              aria-expanded={isCurrencyMenuOpen}
              aria-label={copy.currency}
              onClick={() => setIsCurrencyMenuOpen((prev) => !prev)}
            >
              <span className="uppercase tracking-wide">{currency}</span>
              <ChevronDown size={14} className={cn("transition-transform", isCurrencyMenuOpen && "rotate-180")} />
            </button>
            {isCurrencyMenuOpen ? (
              <div
                className="absolute left-1/2 top-11 z-50 w-max -translate-x-1/2 rounded border border-white/30 bg-[#01514E] p-0.5 shadow-lg animate-in fade-in-0 zoom-in-95 duration-200"
                role="menu"
              >
                {[
                  { value: "AUD", label: "AUD (indicative only)" },
                  { value: "USD", label: "USD (indicative only)" },
                  { value: "IDR", label: "IDR" },
                  { value: "EUR", label: "EUR (indicative only)" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    role="menuitemradio"
                    aria-checked={currency === opt.value}
                    className={cn(
                      "flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-sm whitespace-nowrap text-white hover:bg-white/15",
                      currency === opt.value && "bg-white/20"
                    )}
                    onClick={() => {
                      setCurrency(opt.value);
                      setIsCurrencyMenuOpen(false);
                    }}
                  >
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="relative" ref={languageMenuRef}>
            <button
              type="button"
              className="flex h-9 items-center gap-1 rounded border border-white/50 bg-transparent px-2 text-xs text-white"
              aria-haspopup="menu"
              aria-expanded={isLanguageMenuOpen}
              aria-label={copy.language}
              onClick={() => setIsLanguageMenuOpen((prev) => !prev)}
            >
              <span className="text-base leading-none" aria-hidden>
                {languageFlagMap[language]}
              </span>
              <span className="uppercase tracking-wide">{languageCodeMap[language]}</span>
              <ChevronDown size={14} className={cn("transition-transform", isLanguageMenuOpen && "rotate-180")} />
            </button>
            {isLanguageMenuOpen ? (
              <div className="absolute left-1/2 top-11 z-50 w-max -translate-x-1/2 rounded border border-white/30 bg-[#01514E] p-0.5 shadow-lg animate-in fade-in-0 zoom-in-95 duration-200" role="menu">
                {LANGUAGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.code}
                    type="button"
                    className={cn(
                      "flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-left text-sm whitespace-nowrap text-white hover:bg-white/15",
                      language === opt.code && "bg-white/20"
                    )}
                    role="menuitemradio"
                    aria-checked={language === opt.code}
                    onClick={() => {
                      setLanguage(opt.code);
                      setIsLanguageMenuOpen(false);
                    }}
                  >
                    <span className="text-base leading-none" aria-hidden>
                      {languageFlagMap[opt.code]}
                    </span>
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {/* Mobile Toggle */}
        <button
          type="button"
          className="text-white flex min-h-11 min-w-11 items-center justify-center md:hidden"
          aria-expanded={isOpen}
          aria-label={isOpen ? "Close menu" : "Open menu"}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Desktop mega menus — anchored to bottom of nav (no fixed top gap when scrolled) */}
      {isPropertyMenuOpen ? (
        <div
          data-navbar-mega="properties"
          className="absolute left-0 right-0 top-full z-40 hidden w-full border-t border-b border-white/20 bg-[#f4f1ea] px-6 py-3 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200 md:block"
          role="menu"
        >
          <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-4 md:grid-cols-[240px_1fr_1fr]">
            <div className="overflow-hidden rounded">
              <img
                src="/site-media/property-dropdown-hero.png"
                alt="Modern luxury villa interior with kitchen and tropical garden view"
                className="h-full min-h-[120px] w-full object-cover"
              />
            </div>

            <div className="text-[#1c1917]">
              <h3 className="font-serif text-2xl font-bold uppercase tracking-[0.04em] text-primary">{copy.realEstateForSale}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#1c1917]/80">
                {copy.realEstateForSaleDesc}
              </p>
              <Link href="/projects">
                <div
                  className="mt-3 inline-flex cursor-pointer items-center gap-2 text-base font-medium text-[#1c1917] hover:opacity-80"
                  role="menuitem"
                  onClick={() => setIsPropertyMenuOpen(false)}
                >
                  {copy.learnMore}
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#1c1917]/40">
                    <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            </div>

            <div className="text-[#1c1917]">
              <h3 className="font-serif text-2xl font-bold uppercase tracking-[0.04em] text-primary">{copy.longTermRentals}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#1c1917]/80">
                {copy.longTermRentalsDesc}
              </p>
              <Link href="/long-term-rentals">
                <div
                  className="mt-3 inline-flex cursor-pointer items-center gap-2 text-base font-medium text-[#1c1917] hover:opacity-80"
                  role="menuitem"
                  onClick={() => setIsPropertyMenuOpen(false)}
                >
                  {copy.learnMore}
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#1c1917]/40">
                    <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      ) : null}
      {isServicesMenuOpen ? (
        <div
          data-navbar-mega="services"
          className="absolute left-0 right-0 top-full z-40 hidden w-full border-t border-b border-white/20 bg-[#f4f1ea] px-6 py-3 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200 md:block"
          role="menu"
        >
          <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-4 md:grid-cols-[240px_1fr_1fr]">
            <div className="overflow-hidden rounded">
              <img
                src={SITE_MEDIA.heroStill}
                alt="Bali villa entrance"
                className="h-full min-h-[120px] w-full object-cover"
              />
            </div>

            <div className="text-[#1c1917]">
              <h3 className="font-serif text-2xl font-bold uppercase tracking-[0.04em] text-primary">{copy.buyersAgent}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#1c1917]/80">
                {copy.buyersAgentDesc}
              </p>
              <Link href="/buyer-agents">
                <div
                  className="mt-3 inline-flex cursor-pointer items-center gap-2 text-base font-medium text-[#1c1917] hover:opacity-80"
                  role="menuitem"
                  onClick={() => setIsServicesMenuOpen(false)}
                >
                  {copy.learnMore}
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#1c1917]/40">
                    <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            </div>

            <div className="text-[#1c1917]">
              <h3 className="font-serif text-2xl font-bold uppercase tracking-[0.04em] text-primary">{copy.sellersAgent}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#1c1917]/80">
                {copy.sellersAgentDesc}
              </p>
              <Link href="/seller-agents">
                <div
                  className="mt-3 inline-flex cursor-pointer items-center gap-2 text-base font-medium text-[#1c1917] hover:opacity-80"
                  role="menuitem"
                  onClick={() => setIsServicesMenuOpen(false)}
                >
                  {copy.learnMore}
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#1c1917]/40">
                    <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      ) : null}
      {isGuidesMenuOpen ? (
        <div
          data-navbar-mega="guides"
          className="absolute left-0 right-0 top-full z-40 hidden w-full border-t border-b border-white/20 bg-[#f4f1ea] px-6 py-3 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200 md:block"
          role="menu"
        >
          <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-4 md:grid-cols-[240px_1fr_1fr_1fr]">
            <div className="overflow-hidden rounded">
              <img
                src={SITE_MEDIA.guidesDropdown}
                alt="Modern tropical villa with pool and garden at dusk"
                className="h-full min-h-[120px] w-full object-cover"
              />
            </div>

            <div className="text-[#1c1917]">
              <h3 className="font-serif text-2xl font-bold uppercase tracking-[0.04em] text-primary">{copy.legalGuide}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#1c1917]/80">
                {copy.legalGuideDesc}
              </p>
              <Link href="/legal-guide">
                <div
                  className="mt-3 inline-flex cursor-pointer items-center gap-2 text-base font-medium text-[#1c1917] hover:opacity-80"
                  role="menuitem"
                  onClick={() => setIsGuidesMenuOpen(false)}
                >
                  {copy.learnMore}
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#1c1917]/40">
                    <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            </div>

            <div className="text-[#1c1917]">
              <h3 className="font-serif text-2xl font-bold uppercase tracking-[0.04em] text-primary">{copy.locationGuide}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#1c1917]/80">
                {copy.locationGuideDesc}
              </p>
              <Link href="/bali-location-guide">
                <div
                  className="mt-3 inline-flex cursor-pointer items-center gap-2 text-base font-medium text-[#1c1917] hover:opacity-80"
                  role="menuitem"
                  onClick={() => setIsGuidesMenuOpen(false)}
                >
                  {copy.learnMore}
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#1c1917]/40">
                    <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            </div>

            <div className="text-[#1c1917]">
              <h3 className="font-serif text-2xl font-bold uppercase tracking-[0.04em] text-primary">{copy.investmentGuide}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#1c1917]/80">
                {copy.investmentGuideDesc}
              </p>
              <Link href="/investment-guide">
                <div
                  className="mt-3 inline-flex cursor-pointer items-center gap-2 text-base font-medium text-[#1c1917] hover:opacity-80"
                  role="menuitem"
                  onClick={() => setIsGuidesMenuOpen(false)}
                >
                  {copy.learnMore}
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#1c1917]/40">
                    <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      {/* Mobile Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full flex max-h-[min(70dvh,calc(100dvh-5rem))] flex-col gap-6 overflow-y-auto border-b border-white/20 bg-[#01514E] p-6 shadow-xl md:hidden">
          <label className="text-xs uppercase tracking-[0.16em] text-white/70" htmlFor="language-switcher-mobile">
            {copy.language}
          </label>
          <select
            id="language-switcher-mobile"
            value={language}
            onChange={(e) => setLanguage(safeLanguage(e.target.value))}
            className="h-11 rounded border border-white/50 bg-transparent px-3 text-sm text-white"
            aria-label={copy.language}
          >
            {LANGUAGE_OPTIONS.map((opt) => (
              <option key={opt.code} value={opt.code}>
                {languageFlagMap[opt.code]} {opt.label}
              </option>
            ))}
          </select>
          <label className="text-xs uppercase tracking-[0.16em] text-white/70" htmlFor="currency-switcher-mobile">
            {copy.currency}
          </label>
          <select
            id="currency-switcher-mobile"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="h-11 rounded border border-white/50 bg-transparent px-3 text-sm text-white"
            aria-label={copy.currency}
          >
            <option value="AUD">AUD (indicative only)</option>
            <option value="USD">USD (indicative only)</option>
            <option value="IDR">IDR (indicative only)</option>
            <option value="EUR">EUR (indicative only)</option>
          </select>
          <div className="border-t border-white/20 pt-4">
            <p className="text-xs uppercase tracking-[0.16em] text-white/70 mb-3">{copy.propertySection}</p>
            <div className="space-y-3">
              <Link href="/projects">
                <div
                  className="text-lg font-serif tracking-wider text-white cursor-pointer"
                  onClick={() => setIsOpen(false)}
                >
                  {copy.realEstateForSale}
                </div>
              </Link>
              <Link href="/long-term-rentals">
                <div
                  className="text-lg font-serif tracking-wider text-white cursor-pointer"
                  onClick={() => setIsOpen(false)}
                >
                  {copy.longTermRentals}
                </div>
              </Link>
            </div>
          </div>
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <div
                className="text-lg font-serif tracking-wider text-white cursor-pointer"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </div>
            </Link>
          ))}
          <div className="border-t border-white/20 pt-4">
            <p className="text-xs uppercase tracking-[0.16em] text-white/70 mb-3">{copy.services}</p>
            <div className="space-y-3">
              <Link href="/buyer-agents">
                <div
                  className="text-lg font-serif tracking-wider text-white cursor-pointer"
                  onClick={() => setIsOpen(false)}
                >
                  {copy.buyersAgent}
                </div>
              </Link>
              <Link href="/seller-agents">
                <div
                  className="text-lg font-serif tracking-wider text-white cursor-pointer"
                  onClick={() => setIsOpen(false)}
                >
                  {copy.sellersAgent}
                </div>
              </Link>
            </div>
          </div>
          <div className="border-t border-white/20 pt-4">
            <p className="text-xs uppercase tracking-[0.16em] text-white/70 mb-3">{copy.guides}</p>
            <div className="space-y-3">
              <Link href="/legal-guide">
                <div
                  className="text-lg font-serif tracking-wider text-white cursor-pointer"
                  onClick={() => setIsOpen(false)}
                >
                  {copy.legalGuide}
                </div>
              </Link>
              <Link href="/bali-location-guide">
                <div
                  className="text-lg font-serif tracking-wider text-white cursor-pointer"
                  onClick={() => setIsOpen(false)}
                >
                  {copy.locationGuide}
                </div>
              </Link>
              <Link href="/investment-guide">
                <div
                  className="text-lg font-serif tracking-wider text-white cursor-pointer"
                  onClick={() => setIsOpen(false)}
                >
                  {copy.investmentGuide}
                </div>
              </Link>
            </div>
          </div>
          <Link href="/contact">
            <Button
              className="w-full rounded-none border border-white text-white tracking-widest uppercase hover:bg-white hover:text-[#01514E]"
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
