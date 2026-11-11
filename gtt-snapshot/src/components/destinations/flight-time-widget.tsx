"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  US_DEPARTURE_CITIES,
  estimateFlightHours,
  formatFlightTime,
} from "@/lib/flight-time";

interface FlightTimeWidgetProps {
  destLat: number;
  destLng: number;
  destName: string;
}

export function FlightTimeWidget({ destLat, destLng, destName }: FlightTimeWidgetProps) {
  const [selectedCity, setSelectedCity] = useState<string>("");

  const flightHours = selectedCity
    ? estimateFlightHours(
        US_DEPARTURE_CITIES.find((c) => c.code === selectedCity)!.lat,
        US_DEPARTURE_CITIES.find((c) => c.code === selectedCity)!.lng,
        destLat,
        destLng
      )
    : null;

  return (
    <div className="bg-white border rounded-lg p-4 print:hidden">
      <div className="flex items-center gap-2 mb-3">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#3a5f54] shrink-0"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>
        <h3 className="font-semibold text-sm text-[#3a5f54]">Estimated Flight Time</h3>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm text-muted-foreground">From:</span>
        <Select value={selectedCity} onValueChange={setSelectedCity}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Select departure city" />
          </SelectTrigger>
          <SelectContent>
            {US_DEPARTURE_CITIES.map((city) => (
              <SelectItem key={city.code} value={city.code}>
                {city.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {flightHours !== null && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">to {destName}:</span>
            <span className="text-lg font-bold text-[#3a5f54]">
              {formatFlightTime(flightHours)}
            </span>
            <span className="text-xs text-muted-foreground">(nonstop estimate)</span>
          </div>
        )}
      </div>

      {flightHours !== null && (
        <p className="text-xs text-muted-foreground mt-2">
          Based on great circle distance at average cruise speed. Actual flight times vary by airline, route, and conditions.
        </p>
      )}
    </div>
  );
}
