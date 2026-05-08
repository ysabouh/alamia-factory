"use client";

import { useEffect } from "react";

import { factoryChannels, factoryEvents } from "@/lib/realtime/factory-events";

type FactoryEventName = (typeof factoryEvents)[keyof typeof factoryEvents];

interface RealtimeClient {
  private(channel: string): {
    listen(event: FactoryEventName, callback: (payload: unknown) => void): unknown;
  };
  leave(channel: string): void;
}

declare global {
  interface Window {
    Echo?: RealtimeClient;
  }
}

export function useLiveDashboardEvents(onEvent: () => void) {
  useEffect(() => {
    if (!window.Echo) {
      return;
    }

    const channel = window.Echo.private(factoryChannels.liveDashboard);

    Object.values(factoryEvents).forEach((eventName) => {
      channel.listen(eventName, onEvent);
    });

    return () => {
      window.Echo?.leave(factoryChannels.liveDashboard);
    };
  }, [onEvent]);
}
