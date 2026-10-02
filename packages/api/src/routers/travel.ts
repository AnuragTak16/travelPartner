import { z } from "zod";

import { publicProcedure, router } from "../index";
import {
  enrichPlacesWithImages,
  fetchFamousPlaces,
  resolveCity,
  searchCities,
} from "../lib/places";
import {
  budgetCityFromGeo,
  estimateBudget,
  fetchWeather,
  rankPlacesForWeather,
  type TransportMode,
} from "../lib/travel";

const transportSchema = z.enum(["flight", "train", "bus", "car", "local"]);

export const travelRouter = router({
  searchCities: publicProcedure
    .input(z.object({ query: z.string().max(80) }))
    .query(async ({ input }) => {
      if (!input.query.trim()) return [];
      try {
        const cities = await searchCities(input.query, 8);
        return cities.map((c) => ({
          id: c.id,
          name: c.name,
          country: c.country,
          countryCode: c.countryCode,
          displayName: c.displayName,
        }));
      } catch {
        return [];
      }
    }),

  explore: publicProcedure
    .input(
      z.object({
        city: z.string().min(1).max(80),
        /** Fetch Wikipedia/Wikimedia thumbnails — slower, for places page */
        withImages: z.boolean().optional().default(false),
      }),
    )
    .query(async ({ input }) => {
      let city;
      try {
        city = await resolveCity(input.city);
      } catch {
        return {
          found: false as const,
          message: "City search is temporarily unavailable. Try again in a moment.",
          suggestions: [] as Array<{ id: string; name: string; country: string }>,
        };
      }

      if (!city) {
        return {
          found: false as const,
          message: `No city found for "${input.city}". Try a clearer city name.`,
          suggestions: [] as Array<{ id: string; name: string; country: string }>,
        };
      }

      const [weatherResult, placesResult] = await Promise.allSettled([
        fetchWeather(city.latitude, city.longitude),
        fetchFamousPlaces(city.latitude, city.longitude),
      ]);

      const weather =
        weatherResult.status === "fulfilled"
          ? weatherResult.value
          : {
              temperatureC: 22,
              weatherCode: 1,
              condition: "sunny" as const,
              label: "Mild (estimated)",
              isDay: true,
              windSpeedKmh: 10,
              precipitationMm: 0,
            };

      let rawPlaces = placesResult.status === "fulfilled" ? placesResult.value : [];
      if (input.withImages && rawPlaces.length) {
        rawPlaces = await enrichPlacesWithImages(rawPlaces, city.name);
      }

      const places = rankPlacesForWeather(rawPlaces, weather.condition);
      const costs = budgetCityFromGeo(city);

      return {
        found: true as const,
        city: {
          id: city.id,
          name: city.name,
          country: city.country,
          countryCode: city.countryCode,
          currency: costs.currency,
          currencySymbol: costs.currencySymbol,
          latitude: city.latitude,
          longitude: city.longitude,
        },
        weather,
        places,
        recommended: places.filter((p) => p.matchScore >= 2).slice(0, 4),
        sources: {
          geocoding: "OpenStreetMap Nominatim",
          places: "OpenStreetMap Overpass",
          weather: "Open-Meteo",
          images: input.withImages ? "Wikipedia / Wikimedia" : null,
        },
        placesError:
          placesResult.status === "rejected"
            ? "Could not load places right now. Weather still available."
            : null,
      };
    }),

  budget: publicProcedure
    .input(
      z.object({
        city: z.string().min(1).max(80),
        people: z.number().int().min(1).max(20),
        days: z.number().int().min(1).max(30).default(3),
        transport: transportSchema.default("flight"),
        distanceKm: z.number().min(0).max(20000).optional(),
      }),
    )
    .query(async ({ input }) => {
      let city;
      try {
        city = await resolveCity(input.city);
      } catch {
        return {
          found: false as const,
          message: "City lookup unavailable right now.",
        };
      }

      if (!city) {
        return {
          found: false as const,
          message: `Unknown city "${input.city}".`,
        };
      }

      const estimate = estimateBudget({
        city: budgetCityFromGeo(city),
        people: input.people,
        days: input.days,
        transport: input.transport as TransportMode,
        distanceKm: input.distanceKm,
      });

      return {
        found: true as const,
        city: {
          id: city.id,
          name: city.name,
          country: city.country,
          countryCode: city.countryCode,
        },
        estimate,
      };
    }),
});
