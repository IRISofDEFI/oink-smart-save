/**
 * Testimonials for the landing page grid (TestimonialsGrid.tsx).
 *
 * The grid has six slots, filled from this array in order. Each entry is
 * either an open invitation (no invented people or quotes) or a real
 * testimonial. To add a real one, replace an invitation entry with:
 *
 *   {
 *     kind: "real",
 *     id: "jane-x-2026-10",                 // any unique id
 *     name: "Jane Doe",
 *     handle: "@janedoe",
 *     href: "https://x.com/janedoe/status/…", // link to the original post
 *     avatar: "/testimonials/jane.webp",      // optional; initials otherwise
 *     quote: "Their words, verbatim.",        // and/or a screenshot:
 *     screenshot: { src: "/testimonials/jane-post.webp", width: 1200, height: 800 },
 *   },
 *
 * Put images in public/testimonials/. Only use posts the person has made
 * publicly (or given permission for), and keep the quote word for word.
 */

export type RealTestimonial = {
  kind: "real";
  id: string;
  name: string;
  handle: string;
  /** Link to the original post. */
  href: string;
  /** Photo path under public/; falls back to initials. */
  avatar?: string;
  /** Verbatim quote. Provide this, a screenshot, or both. */
  quote?: string;
  /** Screenshot of the post, with its intrinsic size (avoids layout shift). */
  screenshot?: { src: string; width: number; height: number };
};

export type InvitationCard = {
  kind: "invitation";
  id: string;
};

export type TestimonialEntry = RealTestimonial | InvitationCard;

/** Opens a pre-filled post to @oink_AI in a new tab. */
export const shareFeedbackUrl =
  "https://x.com/intent/post?text=Hey%20%40oink_AI%2C%20here%27s%20my%20feedback%3A%20";

export const testimonials: TestimonialEntry[] = [
  { kind: "invitation", id: "slot-1" },
  { kind: "invitation", id: "slot-2" },
  { kind: "invitation", id: "slot-3" },
  { kind: "invitation", id: "slot-4" },
  { kind: "invitation", id: "slot-5" },
  { kind: "invitation", id: "slot-6" },
];
