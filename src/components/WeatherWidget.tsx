import { useState, useEffect } from "react";
import { Cloud, Sun, CloudRain, CloudSnow, Wind, Droplets, MapPin, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface WeatherData {
  temperature: number;
  weatherCode: number;
  windSpeed: number;
  humidity: number;
  location: string;
}

const weatherDescriptions: Record<number, { label: string; icon: typeof Sun }> = {
  0: { label: "Clear sky", icon: Sun },
  1: { label: "Mainly clear", icon: Sun },
  2: { label: "Partly cloudy", icon: Cloud },
  3: { label: "Overcast", icon: Cloud },
  45: { label: "Foggy", icon: Cloud },
  48: { label: "Depositing rime fog", icon: Cloud },
  51: { label: "Light drizzle", icon: CloudRain },
  53: { label: "Moderate drizzle", icon: CloudRain },
  55: { label: "Dense drizzle", icon: CloudRain },
  61: { label: "Slight rain", icon: CloudRain },
  63: { label: "Moderate rain", icon: CloudRain },
  65: { label: "Heavy rain", icon: CloudRain },
  71: { label: "Slight snow", icon: CloudSnow },
  73: { label: "Moderate snow", icon: CloudSnow },
  75: { label: "Heavy snow", icon: CloudSnow },
  80: { label: "Rain showers", icon: CloudRain },
  81: { label: "Moderate showers", icon: CloudRain },
  82: { label: "Violent showers", icon: CloudRain },
  95: { label: "Thunderstorm", icon: CloudRain },
};

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = async (lat: number, lon: number, locationName: string) => {
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`
      );
      
      if (!response.ok) throw new Error("Failed to fetch weather");
      
      const data = await response.json();
      
      setWeather({
        temperature: Math.round(data.current.temperature_2m),
        weatherCode: data.current.weather_code,
        windSpeed: Math.round(data.current.wind_speed_10m),
        humidity: data.current.relative_humidity_2m,
        location: locationName,
      });
      setError(null);
    } catch (err) {
      setError("Unable to fetch weather data");
    } finally {
      setLoading(false);
    }
  };

  const getLocationByIP = async () => {
    try {
      const response = await fetch("https://ipapi.co/json/");
      if (!response.ok) throw new Error("IP lookup failed");
      
      const data = await response.json();
      const locationName = `${data.city}, ${data.country_code}`;
      await fetchWeather(data.latitude, data.longitude, locationName);
    } catch (err) {
      setError("Unable to determine location");
      setLoading(false);
    }
  };

  const getLocationName = async (lat: number, lon: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
      );
      if (!response.ok) return "Your Location";
      
      const data = await response.json();
      const city = data.address?.city || data.address?.town || data.address?.village || "";
      const country = data.address?.country_code?.toUpperCase() || "";
      return city ? `${city}, ${country}` : "Your Location";
    } catch {
      return "Your Location";
    }
  };

  const loadWeather = async () => {
    setLoading(true);
    setError(null);

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const locationName = await getLocationName(latitude, longitude);
          await fetchWeather(latitude, longitude, locationName);
        },
        async () => {
          // Fallback to IP-based location
          await getLocationByIP();
        },
        { timeout: 5000, enableHighAccuracy: false }
      );
    } else {
      await getLocationByIP();
    }
  };

  useEffect(() => {
    loadWeather();
  }, []);

  if (loading) {
    return (
      <div className="card-elevated p-6">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
        <Skeleton className="h-12 w-32 mb-2" />
        <Skeleton className="h-4 w-24 mb-4" />
        <div className="flex gap-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-elevated p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-lg text-foreground">Weather</h3>
          <Button variant="ghost" size="icon" onClick={loadWeather}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-muted-foreground text-sm">{error}</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={loadWeather}>
          Try Again
        </Button>
      </div>
    );
  }

  if (!weather) return null;

  const weatherInfo = weatherDescriptions[weather.weatherCode] || { label: "Unknown", icon: Cloud };
  const WeatherIcon = weatherInfo.icon;

  return (
    <div className="card-elevated p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-lg text-foreground">Weather</h3>
        <Button variant="ghost" size="icon" onClick={loadWeather} title="Refresh weather">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold text-foreground">{weather.temperature}°</span>
            <span className="text-muted-foreground text-lg">C</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{weatherInfo.label}</p>
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" />
            <span>{weather.location}</span>
          </div>
        </div>
        
        <div className="p-3 rounded-xl bg-primary/10">
          <WeatherIcon className="w-10 h-10 text-primary" />
        </div>
      </div>
      
      <div className="flex gap-4 mt-4 pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <Wind className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-foreground">{weather.windSpeed} km/h</span>
        </div>
        <div className="flex items-center gap-2">
          <Droplets className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-foreground">{weather.humidity}%</span>
        </div>
      </div>
    </div>
  );
}
