import type { CostProfile, FamousPlace, GeoCity, WeatherFit } from "./places";
import { costProfileForCountry } from "./places";

export type WeatherCondition = WeatherFit;

export type WeatherSnapshot = {
  temperatureC: number;
  weatherCode: number;
  condition: WeatherCondition;
  label: string;
  isDay: boolean;
  windSpeedKmh: number;
  precipitationMm: number;
};

type OpenMeteoResponse = {
  current?: {
    temperature_2m?: number;
    weather_code?: number;
    is_day?: number;
    wind_speed_10m?: number;
    precipitation?: number;
  };
};

function mapWeatherCode(code: number, tempC: number): { condition: WeatherCondition; label: string } {
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code)) {
    return { condition: "rainy", label: "Rainy" };
  }
  if ([71, 73, 75, 77, 85, 86].includes(code) || tempC <= 5) {
    return { condition: "cold", label: tempC <= 0 ? "Freezing" : "Cold" };
  }
  if (tempC >= 32) {
    return { condition: "hot", label: "Hot" };
  }
  if ([0, 1].includes(code) && tempC >= 18) {
    return { condition: "sunny", label: "Clear & sunny" };
  }
  if ([0, 1, 2].includes(code)) {
    return { condition: "sunny", label: "Mostly clear" };
  }
  if (tempC < 12) {
    return { condition: "cold", label: "Cool" };
  }
  if (tempC >= 28) {
    return { condition: "hot", label: "Warm to hot" };
  }
  return { condition: "sunny", label: "Mild" };
}

export async function fetchWeather(lat: number, lon: number): Promise<WeatherSnapshot> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set(
    "current",
    "temperature_2m,weather_code,is_day,wind_speed_10m,precipitation",
  );
  url.searchParams.set("timezone", "auto");

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Weather service unavailable (${res.status})`);
  }

  const data = (await res.json()) as OpenMeteoResponse;
  const current = data.current;
  if (!current || current.temperature_2m === undefined || current.weather_code === undefined) {
    throw new Error("Weather data incomplete");
  }

  const temperatureC = current.temperature_2m;
  const weatherCode = current.weather_code;
  const mapped = mapWeatherCode(weatherCode, temperatureC);

  return {
    temperatureC,
    weatherCode,
    condition: mapped.condition,
    label: mapped.label,
    isDay: current.is_day === 1,
    windSpeedKmh: current.wind_speed_10m ?? 0,
    precipitationMm: current.precipitation ?? 0,
  };
}

export function rankPlacesForWeather(
  places: FamousPlace[],
  condition: WeatherCondition,
): Array<FamousPlace & { matchScore: number; weatherReason: string }> {
  return places
    .map((place) => {
      const exact = place.weatherFit.includes(condition);
      const flexible = place.weatherFit.includes("any");
      let matchScore = 0;
      let weatherReason = "Worth visiting regardless of weather.";

      if (exact && condition !== "any") {
        matchScore = 3;
        weatherReason = `Strong fit for ${condition} conditions.`;
      } else if (flexible) {
        matchScore = 2;
        weatherReason = "Works in most weather.";
      } else if (
        (condition === "rainy" || condition === "cold") &&
        ["museum", "indoor", "shopping", "food", "cultural"].includes(place.category)
      ) {
        matchScore = 2;
        weatherReason = "Indoor-friendly when outdoor weather is rough.";
      } else if (
        (condition === "sunny" || condition === "hot") &&
        ["park", "outdoor", "beach", "landmark"].includes(place.category)
      ) {
        matchScore = condition === "hot" && place.category === "beach" ? 3 : 1;
        weatherReason =
          condition === "hot"
            ? "Better in warm weather — pace yourself outdoors."
            : "Nice outdoors on a clear day.";
      } else {
        matchScore = 0;
        weatherReason = `Less ideal while it's ${condition} — consider alternatives first.`;
      }

      return { ...place, matchScore, weatherReason };
    })
    .sort((a, b) => b.matchScore - a.matchScore || a.name.localeCompare(b.name));
}

export type TransportMode = "flight" | "train" | "bus" | "car" | "local";

export type BudgetCity = Pick<GeoCity, "name" | "country" | "countryCode"> & CostProfile;

export type BudgetInput = {
  city: BudgetCity;
  people: number;
  days: number;
  transport: TransportMode;
  distanceKm?: number;
};

export type TransportBreakdown = {
  mode: TransportMode;
  label: string;
  perPerson: number;
  total: number;
  note: string;
};

export type BudgetEstimate = {
  currency: string;
  currencySymbol: string;
  people: number;
  days: number;
  lodging: number;
  foodAndMisc: number;
  localTransit: number;
  transport: TransportBreakdown;
  allTransportOptions: TransportBreakdown[];
  grandTotal: number;
  perPersonTotal: number;
  dailyPerPerson: number;
  note: string;
};

const TRANSPORT_META: Record<
  TransportMode,
  { label: string; basePerKm: number; minimum: number; note: string }
> = {
  flight: {
    label: "Flight",
    basePerKm: 0.12,
    minimum: 80,
    note: "Economy round-trip estimate scaled by distance.",
  },
  train: {
    label: "Train",
    basePerKm: 0.08,
    minimum: 25,
    note: "Intercity rail estimate; scenic and mid-speed.",
  },
  bus: {
    label: "Bus",
    basePerKm: 0.04,
    minimum: 15,
    note: "Coach / long-distance bus — budget friendly.",
  },
  car: {
    label: "Car (shared)",
    basePerKm: 0.1,
    minimum: 30,
    note: "Fuel + tolls split across the group (round trip).",
  },
  local: {
    label: "Local only",
    basePerKm: 0,
    minimum: 0,
    note: "Already in-city — no long-haul transport counted.",
  },
};

/** Rough USD conversion factors for transport scaling into local currency. */
const FX_TO_USD: Record<string, number> = {
  USD: 1,
  EUR: 1.08,
  GBP: 1.27,
  JPY: 0.0067,
  AED: 0.27,
  THB: 0.029,
  INR: 0.012,
  SGD: 0.74,
  AUD: 0.65,
  CAD: 0.72,
  CHF: 1.12,
  CNY: 0.14,
  KRW: 0.00074,
  BRL: 0.18,
  MXN: 0.05,
  TRY: 0.029,
  SEK: 0.094,
  NOK: 0.093,
  NZD: 0.59,
  ZAR: 0.055,
  IDR: 0.000062,
  VND: 0.000039,
  PHP: 0.017,
  MYR: 0.22,
  EGP: 0.02,
  MAD: 0.1,
};

function toLocalCurrency(amountUsd: number, currency: string): number {
  const rate = FX_TO_USD[currency] ?? 1;
  return Math.round(amountUsd / rate);
}

function convertAmount(amount: number, fromCurrency: string, toCurrency: string): number {
  if (fromCurrency === toCurrency) return Math.round(amount);
  const usd = amount * (FX_TO_USD[fromCurrency] ?? 1);
  return toLocalCurrency(usd, toCurrency);
}

function transportCost(
  mode: TransportMode,
  people: number,
  distanceKm: number,
  currency: string,
): TransportBreakdown {
  const meta = TRANSPORT_META[mode];
  if (mode === "local") {
    return {
      mode,
      label: meta.label,
      perPerson: 0,
      total: 0,
      note: meta.note,
    };
  }

  const distance = Math.max(distanceKm, 50);
  let perPersonUsd = Math.max(meta.minimum, distance * meta.basePerKm);

  if (mode !== "car") {
    perPersonUsd *= 2;
  } else {
    const carTotalUsd = Math.max(meta.minimum, distance * 2 * meta.basePerKm);
    const perPersonLocal = toLocalCurrency(carTotalUsd / Math.max(people, 1), currency);
    return {
      mode,
      label: meta.label,
      perPerson: perPersonLocal,
      total: perPersonLocal * people,
      note: meta.note,
    };
  }

  const perPerson = toLocalCurrency(perPersonUsd, currency);
  return {
    mode,
    label: meta.label,
    perPerson,
    total: perPerson * people,
    note: meta.note,
  };
}

export function budgetCityFromGeo(city: GeoCity): BudgetCity {
  const costs = costProfileForCountry(city.countryCode);
  return {
    name: city.name,
    country: city.country,
    countryCode: city.countryCode,
    ...costs,
  };
}

export function estimateBudget(input: BudgetInput): BudgetEstimate {
  const { city, people, days, transport } = input;
  const p = Math.max(1, Math.min(people, 20));
  const d = Math.max(1, Math.min(days, 30));
  const distanceKm = input.distanceKm ?? 800;

  // Always present estimates in Indian Rupees for this product.
  const displayCurrency = "INR";
  const displaySymbol = "₹";
  const from = city.currency;

  const rooms = Math.ceil(p / 2);
  const lodgingLocal = city.hotelPerNight * rooms * d;
  const foodLocal = city.dailyBasePerPerson * p * d;
  const transitLocal = city.localTransitDay * p * d;

  const lodging = convertAmount(lodgingLocal, from, displayCurrency);
  const foodAndMisc = convertAmount(foodLocal, from, displayCurrency);
  const localTransit = convertAmount(transitLocal, from, displayCurrency);

  const allTransportOptions = (["flight", "train", "bus", "car", "local"] as TransportMode[]).map(
    (mode) => {
      const option = transportCost(mode, p, distanceKm, from);
      return {
        ...option,
        perPerson: convertAmount(option.perPerson, from, displayCurrency),
        total: convertAmount(option.total, from, displayCurrency),
      };
    },
  );

  const selected =
    allTransportOptions.find((t) => t.mode === transport) ?? allTransportOptions[0]!;

  const grandTotal = lodging + foodAndMisc + localTransit + selected.total;

  return {
    currency: displayCurrency,
    currencySymbol: displaySymbol,
    people: p,
    days: d,
    lodging,
    foodAndMisc,
    localTransit,
    transport: selected,
    allTransportOptions,
    grandTotal,
    perPersonTotal: Math.round(grandTotal / p),
    dailyPerPerson: Math.round(grandTotal / p / d),
    note: `Mid-range estimate for ${city.country} (${city.countryCode}), shown in ₹. Not live pricing.`,
  };
}
