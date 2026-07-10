"use client";

import { useEffect, useState } from "react";

export function DateTimeDisplay() {
  const [dateTime, setDateTime] = useState<string>("");

  useEffect(() => {
    function updateDateTime() {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone: "America/Bogota",
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      };
      setDateTime(
        new Intl.DateTimeFormat("es-CO", options).format(now)
      );
    }

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!dateTime) return null;

  return (
    <div className="text-center text-sm text-muted-foreground py-2 border-b">
      {dateTime}
    </div>
  );
}