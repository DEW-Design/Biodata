// Labs (`app/proto`) are for designing, not for the deployed site: the Pages build removes
// `app/proto` before building (CONTRACTS §5.4). A link from a product or docs page to a lab goes
// through here, so in production it disappears instead of pointing at a 404.
export function labHref(slug: string): string | null {
  return process.env.NODE_ENV === "development" ? `/proto/${slug}` : null;
}
