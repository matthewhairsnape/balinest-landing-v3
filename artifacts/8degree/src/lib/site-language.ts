export const LANGUAGE_STORAGE_KEY = "8degree.language";

export type SiteLanguage = "id" | "en" | "ru" | "zh" | "tr";

export const LANGUAGE_OPTIONS: Array<{ code: SiteLanguage; label: string }> = [
  { code: "id", label: "Indonesia" },
  { code: "en", label: "English" },
  { code: "ru", label: "Russian" },
  { code: "zh", label: "Chinese" },
  { code: "tr", label: "Turkish" },
];

export const UI_COPY: Record<
  SiteLanguage,
  {
    properties: string;
    portfolio: string;
    invest: string;
    aboutUs: string;
    journal: string;
    enquire: string;
  }
> = {
  en: {
    properties: "Properties",
    portfolio: "Portfolio",
    invest: "Invest",
    aboutUs: "About Us",
    journal: "Journal",
    enquire: "Enquire",
  },
  id: {
    properties: "Properti",
    portfolio: "Portofolio",
    invest: "Investasi",
    aboutUs: "Tentang Kami",
    journal: "Jurnal",
    enquire: "Hubungi",
  },
  ru: {
    properties: "Объекты",
    portfolio: "Портфолио",
    invest: "Инвестиции",
    aboutUs: "О нас",
    journal: "Журнал",
    enquire: "Запрос",
  },
  zh: {
    properties: "房源",
    portfolio: "项目集",
    invest: "投资",
    aboutUs: "关于我们",
    journal: "博客",
    enquire: "咨询",
  },
  tr: {
    properties: "Mülkler",
    portfolio: "Portföy",
    invest: "Yatırım",
    aboutUs: "Hakkımızda",
    journal: "Blog",
    enquire: "İletişim",
  },
};

export function safeLanguage(value: string | null | undefined): SiteLanguage {
  if (!value) return "en";
  if (value === "id" || value === "en" || value === "ru" || value === "zh" || value === "tr") {
    return value;
  }
  return "en";
}
