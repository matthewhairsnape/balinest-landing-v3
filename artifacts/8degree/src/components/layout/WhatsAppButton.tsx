import { SITE_WHATSAPP_URL } from "@/lib/site-links";

export function WhatsAppButton() {
  return (
    <a
      href={SITE_WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        bottom: "max(1.25rem, env(safe-area-inset-bottom, 0px))",
        right: "max(1.25rem, env(safe-area-inset-right, 0px))",
      }}
      className="fixed z-50 flex min-h-[3.25rem] min-w-[3.25rem] items-center justify-center rounded-full bg-[#25D366] p-3 text-white shadow-xl transition-all duration-300 hover:-translate-y-1 hover:bg-[#20bd5a] sm:min-h-14 sm:min-w-14 sm:p-4"
      aria-label="Contact us on WhatsApp"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7" aria-hidden>
        <path d="M12.04 2C6.56 2 2.1 6.31 2.1 11.6c0 1.74.49 3.44 1.42 4.93L2 22l5.7-1.48c1.42.75 3.02 1.15 4.66 1.15 5.48 0 9.94-4.31 9.94-9.6C22.3 6.31 17.84 2 12.04 2Zm0 17.9c-1.52 0-3-.4-4.3-1.16l-.31-.18-3.38.88.9-3.2-.2-.32a7.66 7.66 0 0 1-1.22-4.1c0-4.25 3.62-7.7 8.51-7.7 4.6 0 8.46 3.2 8.46 7.48 0 4.25-3.62 7.5-8.46 7.5Zm4.76-5.64c-.26-.13-1.55-.75-1.8-.84-.24-.09-.42-.13-.6.13-.18.26-.69.84-.85 1.01-.16.17-.31.2-.58.07-.26-.13-1.12-.4-2.14-1.29-.79-.67-1.32-1.5-1.47-1.76-.15-.26-.02-.4.11-.53.12-.12.26-.31.39-.46.13-.16.18-.26.26-.44.09-.17.04-.33-.02-.46-.06-.13-.6-1.43-.82-1.96-.22-.52-.44-.45-.6-.45l-.51-.01c-.18 0-.46.06-.7.33-.24.26-.92.9-.92 2.2 0 1.3.95 2.56 1.08 2.74.13.17 1.86 2.85 4.52 3.99.63.27 1.12.43 1.5.55.63.2 1.2.17 1.65.1.5-.07 1.55-.62 1.77-1.22.22-.6.22-1.12.15-1.22-.06-.1-.24-.16-.5-.29Z" />
      </svg>
    </a>
  );
}
