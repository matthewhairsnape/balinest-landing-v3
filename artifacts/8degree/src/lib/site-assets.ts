/**
 * Local marketing assets (downloaded from Google Drive).
 * Source Drive folder IDs are preserved in scripts/fetch-site-media-from-drive.sh.
 *
 * Hero assets
 *   hero-cinematic.mp4  ← Drive ID 10sSFDovjSw_krEVU918oNqNQPrWVFX9z
 *   hero-still.jpg      ← Drive ID 1qaXnGteqT0MRHOCrCILtQmEh3wRI42_x
 *   hero-poster.jpg     ← Drive ID 1ub5eDDyyhD6lKjTNd5IfHXgd8G-0jqi-
 *
 * Team photos     ← Drive folder 1y_5qRH398Jexl7ccmWx_63lQ7jSXxePb
 * Area images     ← Drive folder 1_XsNdvz-ip0KqnLnecHdyxNDQFlE84Dp
 */

export const SITE_MEDIA = {
  heroVideo: "/site-media/hero-cinematic.mp4",
  heroPoster: "/site-media/hero-poster.jpg",
  heroStill: "/site-media/hero-still.jpg",
  topArea: "/site-media/area-canggu.jpg",

  team: [
    { src: "/site-media/team-robert.jpg",   name: "Robert",   role: "CEO" },
    { src: "/site-media/team-stephen.jpg",  name: "Stephen",  role: "Listing Agent" },
    { src: "/site-media/team-maya.jpg",     name: "Maya",     role: "Property Adviser" },
    { src: "/site-media/team-ryan.jpg",     name: "Ryan",     role: "Marketing Manager" },
    { src: "/site-media/team-mariam.jpg",   name: "Mariam",   role: "Business Office Manager" },
    { src: "/site-media/team-yohanes.jpg",  name: "Yohanes",  role: "Executive Sales Advisor" },
    { src: "/site-media/team-kinan.jpg",    name: "Kinan",    role: "Social Media Manager" },
    { src: "/site-media/team-rangga.jpg",   name: "Rangga",   role: "Photographer & Graphic Designer" },
    { src: "/site-media/team-charis.jpg",   name: "Charis",   role: "Videographer" },
  ] as const,

  areas: [
    { src: "/site-media/area-canggu.jpg",    label: "Canggu" },
    { src: "/site-media/area-cemagi.jpg",    label: "Cemagi" },
    { src: "/site-media/area-jimbaran.jpg",  label: "Jimbaran" },
    { src: "/site-media/area-kuta.jpg",      label: "Kuta" },
    { src: "/site-media/area-nusa-dua.jpg",  label: "Nusa Dua" },
    { src: "/site-media/area-seminyak.jpg",  label: "Seminyak" },
    { src: "/site-media/area-tabanan.jpg",   label: "Tabanan" },
    { src: "/site-media/area-ubud.jpg",      label: "Ubud" },
    { src: "/site-media/area-uluwatu.jpg",   label: "Uluwatu" },
  ] as const,
} as const;
