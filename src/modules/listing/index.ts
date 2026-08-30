/**
 * Public API modul `listing` — halaman publik per properti.
 * Modul lain HANYA boleh import lewat file ini.
 */

// Components
export { ViewerFacade } from "./components/viewer-facade";
export { ShareButtons } from "./components/share-buttons";
export { ContactForm } from "./components/contact-form";
export { GalleryLightbox } from "./components/gallery-lightbox";

// Actions (Server Actions)
export { submitLead } from "./actions/leads";
export type { LeadActionState } from "./actions/leads";

// Queries
export { getListingBySlug, getSimilarListings, recordListingView } from "./queries/listing";

// SEO helpers
export {
  getSiteUrl,
  absoluteUrl,
  toAbsoluteImage,
  listingCanonicalUrl,
} from "./lib/seo";
