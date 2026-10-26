"use client";

import { useSyncExternalStore } from "react";

const format = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Kolkata",
});

function subscribe(onChange: () => void) {
  const timer = setInterval(onChange, 20_000);
  return () => clearInterval(timer);
}

/** Local time where I am. Empty on the server, filled in once mounted. */
export function Clock() {
  const time = useSyncExternalStore(subscribe, () => format.format(new Date()), () => "");
  return <span className="tabular-nums">{time}</span>;
}
