export type PlaceCategory =
  | "landmark"
  | "museum"
  | "park"
  | "food"
  | "shopping"
  | "nightlife"
  | "outdoor"
  | "cultural"
  | "beach"
  | "indoor";

export type WeatherFit = "sunny" | "rainy" | "cold" | "hot" | "any";

export type FamousPlace = {
  id: string;
  name: string;
  description: string;
  category: PlaceCategory;
  weatherFit: WeatherFit[];
  avgHours: number;
  priceLevel: 1 | 2 | 3 | 4;
  tip: string;
  lat?: number;
  lon?: number;
  source: "openstreetmap";
  wikipedia?: string;
  imageUrl?: string | null;
};

export type GeoCity = {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  displayName: string;
};

export type CostProfile = {
  currency: string;
  currencySymbol: string;
  dailyBasePerPerson: number;
  hotelPerNight: number;
  localTransitDay: number;
};

const USER_AGENT = "TravelPartner/1.0 (local travel planner; contact: travelpartner@localhost)";

type NominatimResult = {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  name?: string;
  type?: string;
  class?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    state?: string;
    country?: string;
    country_code?: string;
  };
};

type OverpassElement = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

function cityLabel(item: NominatimResult): string {
  return (
    item.name ||
    item.address?.city ||
    item.address?.town ||
    item.address?.village ||
    item.address?.municipality ||
    item.display_name.split(",")[0]?.trim() ||
    "Unknown"
  );
}

function toGeoCity(item: NominatimResult): GeoCity {
  const countryCode = (item.address?.country_code || "us").toUpperCase();
  return {
    id: String(item.place_id),
    name: cityLabel(item),
    country: item.address?.country || "Unknown",
    countryCode,
    latitude: Number(item.lat),
    longitude: Number(item.lon),
    displayName: item.display_name,
  };
}

export async function searchCities(query: string, limit = 8): Promise<GeoCity[]> {
  const q = query.trim();
  if (!q) return [];

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("featuretype", "city");

  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`City search unavailable (${res.status})`);
  }

  const data = (await res.json()) as NominatimResult[];
  const seen = new Set<string>();
  const cities: GeoCity[] = [];

  for (const item of data) {
    const city = toGeoCity(item);
    const key = `${city.name.toLowerCase()}|${city.countryCode}`;
    if (seen.has(key)) continue;
    seen.add(key);
    cities.push(city);
  }

  return cities;
}

export async function resolveCity(query: string): Promise<GeoCity | null> {
  const matches = await searchCities(query, 5);
  if (!matches.length) return null;

  const q = query.trim().toLowerCase();
  const exact = matches.find((c) => c.name.toLowerCase() === q);
  return exact ?? matches[0] ?? null;
}

function mapOsmToPlace(el: OverpassElement): FamousPlace | null {
  const tags = el.tags ?? {};
  const name = tags.name || tags["name:en"];
  if (!name) return null;

  const tourism = tags.tourism;
  const historic = tags.historic;
  const leisure = tags.leisure;
  const amenity = tags.amenity;
  const natural = tags.natural;

  let category: PlaceCategory = "landmark";
  let weatherFit: WeatherFit[] = ["any"];
  let avgHours = 1.5;
  let tip = "Sourced from OpenStreetMap.";

  if (tourism === "museum" || tourism === "gallery" || amenity === "arts_centre") {
    category = "museum";
    weatherFit = ["rainy", "cold", "hot", "any"];
    avgHours = 2.5;
    tip = "Great indoor pick when weather turns.";
  } else if (tourism === "zoo" || tourism === "theme_park" || tourism === "aquarium") {
    category = tourism === "aquarium" ? "indoor" : "outdoor";
    weatherFit = tourism === "aquarium" ? ["rainy", "hot", "cold", "any"] : ["sunny", "any"];
    avgHours = 3;
  } else if (leisure === "park" || leisure === "garden" || leisure === "nature_reserve") {
    category = "park";
    weatherFit = ["sunny", "hot"];
    avgHours = 2;
    tip = "Best on clear days.";
  } else if (natural === "beach" || leisure === "beach_resort" || tags.sport === "swimming") {
    category = "beach";
    weatherFit = ["sunny", "hot"];
    avgHours = 3;
    tip = "Plan for warm, dry weather.";
  } else if (amenity === "marketplace" || amenity === "restaurant" || amenity === "fast_food") {
    category = "food";
    weatherFit = ["any"];
    avgHours = 1.5;
  } else if (amenity === "mall" || shopLike(tags)) {
    category = "shopping";
    weatherFit = ["rainy", "hot", "any"];
    avgHours = 2;
    tip = "Covered option for rain or heat.";
  } else if (historic || tourism === "attraction" || tourism === "viewpoint") {
    category = historic ? "cultural" : "landmark";
    weatherFit = tourism === "viewpoint" ? ["sunny", "any"] : ["sunny", "any"];
    avgHours = 2;
  } else if (tourism === "hotel" || tourism === "information") {
    return null;
  }

  const description =
    tags.description ||
    tags["description:en"] ||
    [tourism, historic, leisure, amenity, natural].filter(Boolean).join(" · ") ||
    "Popular place listed on OpenStreetMap.";

  const fee = tags.fee;
  const priceLevel: 1 | 2 | 3 | 4 = fee === "yes" ? 2 : fee === "no" ? 1 : 2;

  const lat = el.lat ?? el.center?.lat;
  const lon = el.lon ?? el.center?.lon;
  const wikipedia = tags.wikipedia || tags["wikipedia:en"];

  return {
    id: `${el.type}/${el.id}`,
    name,
    description,
    category,
    weatherFit,
    avgHours,
    priceLevel,
    tip,
    lat,
    lon,
    source: "openstreetmap",
    wikipedia,
    imageUrl: tags.image?.startsWith("http") ? tags.image : null,
  };
}

function shopLike(tags: Record<string, string>): boolean {
  return Boolean(tags.shop) || tags.building === "retail";
}

export async function fetchFamousPlaces(lat: number, lon: number, radiusM = 9000): Promise<FamousPlace[]> {
  const query = `
[out:json][timeout:25];
(
  nwr["tourism"~"attraction|museum|gallery|zoo|theme_park|viewpoint|aquarium"](around:${radiusM},${lat},${lon});
  nwr["historic"~"monument|castle|ruins|memorial|palace|fort"](around:${radiusM},${lat},${lon});
  nwr["leisure"~"park|garden|nature_reserve|beach_resort"](around:${radiusM},${lat},${lon});
  nwr["natural"="beach"](around:${radiusM},${lat},${lon});
  nwr["amenity"~"arts_centre|marketplace|place_of_worship"](around:${radiusM},${lat},${lon});
);
out center 40;
`.trim();

  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: {
      "User-Agent": USER_AGENT,
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!res.ok) {
    throw new Error(`Places service unavailable (${res.status})`);
  }

  const data = (await res.json()) as { elements?: OverpassElement[] };
  const places: FamousPlace[] = [];
  const seenNames = new Set<string>();

  for (const el of data.elements ?? []) {
    const place = mapOsmToPlace(el);
    if (!place) continue;
    const key = place.name.toLowerCase();
    if (seenNames.has(key)) continue;
    seenNames.add(key);
    places.push(place);
  }

  return places.slice(0, 24);
}

type WikiQueryResponse = {
  query?: {
    pages?: Record<
      string,
      {
        title?: string;
        thumbnail?: { source?: string };
        extract?: string;
      }
    >;
  };
};

async function fetchWikipediaImage(searchTerm: string): Promise<{
  imageUrl: string | null;
  extract?: string;
}> {
  const url = new URL("https://en.wikipedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("generator", "search");
  url.searchParams.set("gsrsearch", searchTerm);
  url.searchParams.set("gsrlimit", "1");
  url.searchParams.set("prop", "pageimages|extracts");
  url.searchParams.set("piprop", "thumbnail");
  url.searchParams.set("pithumbsize", "900");
  url.searchParams.set("exintro", "1");
  url.searchParams.set("explaintext", "1");
  url.searchParams.set("exchars", "180");
  url.searchParams.set("format", "json");

  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
  });
  if (!res.ok) return { imageUrl: null };

  const data = (await res.json()) as WikiQueryResponse;
  const page = Object.values(data.query?.pages ?? {})[0];
  return {
    imageUrl: page?.thumbnail?.source ?? null,
    extract: page?.extract,
  };
}

function wikiTitleFromTag(wikipedia?: string): string | null {
  if (!wikipedia) return null;
  // e.g. "en:Gateway of India" or "Gateway of India"
  const parts = wikipedia.split(":");
  return (parts.length > 1 ? parts.slice(1).join(":") : parts[0])?.trim() || null;
}

/** Enrich places with Wikimedia/Wikipedia thumbnails (free, no API key). */
export async function enrichPlacesWithImages(
  places: FamousPlace[],
  cityName: string,
): Promise<FamousPlace[]> {
  const concurrency = 4;
  const result: FamousPlace[] = [...places];

  for (let i = 0; i < result.length; i += concurrency) {
    const chunk = result.slice(i, i + concurrency);
    await Promise.all(
      chunk.map(async (place, offset) => {
        const index = i + offset;
        if (place.imageUrl) return;

        const wikiTitle = wikiTitleFromTag(place.wikipedia);
        const searchTerm = wikiTitle || `${place.name} ${cityName}`;

        try {
          const wiki = await fetchWikipediaImage(searchTerm);
          result[index] = {
            ...place,
            imageUrl: wiki.imageUrl,
            description:
              place.description.length > 80 || !wiki.extract
                ? place.description
                : wiki.extract,
          };
        } catch {
          // keep place without image
        }
      }),
    );
  }

  return result;
}

/** Country-level mid-range traveler cost heuristics in local currency units (approx.). */
const COUNTRY_COSTS: Record<string, CostProfile> = {
  US: { currency: "USD", currencySymbol: "$", dailyBasePerPerson: 80, hotelPerNight: 180, localTransitDay: 10 },
  GB: { currency: "GBP", currencySymbol: "£", dailyBasePerPerson: 60, hotelPerNight: 160, localTransitDay: 8 },
  FR: { currency: "EUR", currencySymbol: "€", dailyBasePerPerson: 55, hotelPerNight: 140, localTransitDay: 8 },
  DE: { currency: "EUR", currencySymbol: "€", dailyBasePerPerson: 50, hotelPerNight: 130, localTransitDay: 8 },
  IT: { currency: "EUR", currencySymbol: "€", dailyBasePerPerson: 50, hotelPerNight: 130, localTransitDay: 7 },
  ES: { currency: "EUR", currencySymbol: "€", dailyBasePerPerson: 45, hotelPerNight: 120, localTransitDay: 8 },
  JP: { currency: "JPY", currencySymbol: "¥", dailyBasePerPerson: 9000, hotelPerNight: 18000, localTransitDay: 1500 },
  AE: { currency: "AED", currencySymbol: "AED ", dailyBasePerPerson: 250, hotelPerNight: 400, localTransitDay: 20 },
  TH: { currency: "THB", currencySymbol: "฿", dailyBasePerPerson: 1200, hotelPerNight: 2500, localTransitDay: 150 },
  IN: { currency: "INR", currencySymbol: "₹", dailyBasePerPerson: 1500, hotelPerNight: 4500, localTransitDay: 200 },
  SG: { currency: "SGD", currencySymbol: "S$", dailyBasePerPerson: 80, hotelPerNight: 180, localTransitDay: 8 },
  AU: { currency: "AUD", currencySymbol: "A$", dailyBasePerPerson: 90, hotelPerNight: 170, localTransitDay: 12 },
  CA: { currency: "CAD", currencySymbol: "C$", dailyBasePerPerson: 85, hotelPerNight: 160, localTransitDay: 10 },
  BR: { currency: "BRL", currencySymbol: "R$", dailyBasePerPerson: 180, hotelPerNight: 350, localTransitDay: 25 },
  MX: { currency: "MXN", currencySymbol: "MX$", dailyBasePerPerson: 900, hotelPerNight: 1800, localTransitDay: 80 },
  TR: { currency: "TRY", currencySymbol: "₺", dailyBasePerPerson: 1800, hotelPerNight: 3500, localTransitDay: 200 },
  ID: { currency: "IDR", currencySymbol: "Rp", dailyBasePerPerson: 400000, hotelPerNight: 800000, localTransitDay: 50000 },
  VN: { currency: "VND", currencySymbol: "₫", dailyBasePerPerson: 600000, hotelPerNight: 1200000, localTransitDay: 80000 },
  KR: { currency: "KRW", currencySymbol: "₩", dailyBasePerPerson: 70000, hotelPerNight: 140000, localTransitDay: 5000 },
  CN: { currency: "CNY", currencySymbol: "¥", dailyBasePerPerson: 300, hotelPerNight: 500, localTransitDay: 30 },
  NL: { currency: "EUR", currencySymbol: "€", dailyBasePerPerson: 55, hotelPerNight: 150, localTransitDay: 9 },
  PT: { currency: "EUR", currencySymbol: "€", dailyBasePerPerson: 45, hotelPerNight: 110, localTransitDay: 7 },
  CH: { currency: "CHF", currencySymbol: "CHF ", dailyBasePerPerson: 90, hotelPerNight: 220, localTransitDay: 12 },
  SE: { currency: "SEK", currencySymbol: "kr", dailyBasePerPerson: 700, hotelPerNight: 1400, localTransitDay: 100 },
  NO: { currency: "NOK", currencySymbol: "kr", dailyBasePerPerson: 900, hotelPerNight: 1600, localTransitDay: 120 },
  NZ: { currency: "NZD", currencySymbol: "NZ$", dailyBasePerPerson: 90, hotelPerNight: 160, localTransitDay: 12 },
  ZA: { currency: "ZAR", currencySymbol: "R", dailyBasePerPerson: 700, hotelPerNight: 1400, localTransitDay: 100 },
  EG: { currency: "EGP", currencySymbol: "E£", dailyBasePerPerson: 1200, hotelPerNight: 2500, localTransitDay: 150 },
  MA: { currency: "MAD", currencySymbol: "MAD ", dailyBasePerPerson: 350, hotelPerNight: 700, localTransitDay: 40 },
  PH: { currency: "PHP", currencySymbol: "₱", dailyBasePerPerson: 2500, hotelPerNight: 4500, localTransitDay: 300 },
  MY: { currency: "MYR", currencySymbol: "RM", dailyBasePerPerson: 150, hotelPerNight: 280, localTransitDay: 15 },
};

const DEFAULT_COST: CostProfile = {
  currency: "INR",
  currencySymbol: "₹",
  dailyBasePerPerson: 1500,
  hotelPerNight: 4500,
  localTransitDay: 200,
};

export function costProfileForCountry(countryCode: string): CostProfile {
  return COUNTRY_COSTS[countryCode.toUpperCase()] ?? DEFAULT_COST;
}
