import axios from "axios";
import mongoose from "mongoose";

import SearchHistory from "../models/SearchHistory.js";

const WEATHER_API_BASE_URL = "https://api.weatherapi.com/v1/current.json";


const classifyWeather = ({ temperature, humidity, conditionMain }) => {
  const lowerCondition = conditionMain.toLowerCase();

  if (lowerCondition.includes("thunder")) {
    return "stormy";
  }

  if (lowerCondition.includes("rain") || lowerCondition.includes("drizzle")) {
    return "rainy";
  }

  if (
    lowerCondition.includes("snow") ||
    lowerCondition.includes("ice") ||
    lowerCondition.includes("blizzard")
  ) {
    return "snowy";
  }

  if (humidity >= 80) {
    return "humid";
  }

  if (temperature <= 16) {
    return "cold";
  }

  if (temperature >= 32) {
    return "hot";
  }

  if (lowerCondition.includes("cloud") || lowerCondition.includes("overcast")) {
    return "cloudy";
  }

  return "clear";
};

const normalizeWeather = (data, originalQuery) => {
  const conditionText = data.current?.condition?.text || "Clear";
  const conditionMain = conditionText.split(" ")[0] || "Clear";
  const temperature = Math.round(data.current.temp_c);
  const humidity = data.current.humidity;
  const windSpeed = Number((data.current.wind_kph / 3.6).toFixed(1));
  const feelsLike = Math.round(data.current.feelslike_c);
  const visibility = Number(data.current.vis_km?.toFixed(1) || 0);
  const category = classifyWeather({ temperature, humidity, conditionMain });

  return {
    query: originalQuery,
    location: {
      city: data.location.name,
      country: data.location.country,
      region: data.location.region,
      label: `${data.location.name}, ${data.location.country}`,
      coordinates: {
        lat: data.location.lat,
        lon: data.location.lon,
      },
    },
    weather: {
      category,
      conditionMain,
      description: conditionText,
      icon: data.current.condition?.icon || "",
      temperature,
      feelsLike,
      humidity,
      windSpeed,
      pressure: data.current.pressure_mb,
      visibility,
      tempMin: Math.round(data.current.temp_c),
      tempMax: Math.round(data.current.feelslike_c),
    },
    searchedAt: new Date().toISOString(),
  };
};

const saveSearchHistory = async (weatherResult) => {
  if (mongoose.connection.readyState !== 1) {
    return;
  }

  await SearchHistory.create({
    query: weatherResult.query,
    locationName: weatherResult.location.city,
    country: weatherResult.location.country,
    condition: weatherResult.weather.conditionMain,
    temperature: weatherResult.weather.temperature,
  });
  console.log("Search history saved:", weatherResult.query);
};

export const getWeatherByQuery = async (req, res, next) => {
  try {
    const query = req.query.query?.trim();
    console.log("Received weather query:", query);    

    if (!query) {
      return res.status(400).json({
        message: "Please provide a city or country in the query parameter.",
      });
    }

    if (!process.env.WEATHER_API_KEY) {
      return res.status(500).json({
        message: "WEATHER_API_KEY is missing in backend/.env",
      });
    }

    const response = await axios.get(WEATHER_API_BASE_URL, {
      params: {
        key: process.env.WEATHER_API_KEY,
        q: query,
        aqi: "no",
      },
    });

    const result = normalizeWeather(response.data, query);
    await saveSearchHistory(result);

    res.json(result);
  } catch (error) {
    const apiMessage = error.response?.data?.error?.message;

    if (error.response?.status === 400 || error.response?.status === 404) {
      return res.status(404).json({
        message:
          apiMessage ||
          "Location not found. Try a city name, country, or city,country format.",
      });
    }

    if (error.response?.status) {
      return res.status(error.response.status).json({
        message: apiMessage || "Weather service error",
      });
    }

    next(error);
  }
};


export const getRecentSearches = async (_req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json([]);
    }

    const searches = await SearchHistory.find()
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    res.json(searches);
  } catch (error) {
    next(error);
  }
};
