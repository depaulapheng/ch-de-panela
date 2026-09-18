type GoogleImageItem = {
  link?: string;
  image?: { thumbnailLink?: string };
};

export async function searchGoogleProductImage(query: string) {
  const key = process.env.GOOGLE_CSE_API_KEY;
  const cx = process.env.GOOGLE_CSE_CX;
  if (!key || !cx) {
    throw new Error("GOOGLE_IMAGE_CONFIG_MISSING");
  }

  const params = new URLSearchParams({
    key,
    cx,
    searchType: "image",
    safe: "active",
    num: "1",
    imgType: "photo",
    q: `${query} produto utensílio doméstico fundo branco`
  });

  const response = await fetch(
    `https://customsearch.googleapis.com/customsearch/v1?${params.toString()}`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    const body = (await response.text()).replace(/\s+/g, " ").slice(0, 500);
    throw new Error(`GOOGLE_IMAGE_HTTP_${response.status}: ${body}`);
  }

  const data = await response.json() as { items?: GoogleImageItem[] };
  const item = data.items?.[0];
  return item?.link || item?.image?.thumbnailLink || null;
}
