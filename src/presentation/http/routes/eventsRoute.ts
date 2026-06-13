import type { ServerResponse } from "node:http";

export interface SseConnection {
  connectionId: string;
  onClose?: () => void;
}

export interface EventsRouteHooks {
  onConnect: (response: ServerResponse) => SseConnection;
  onDisconnect: (connectionId: string) => void;
}

export const connectEventsRoute = (response: ServerResponse, hooks: EventsRouteHooks): SseConnection => {
  return hooks.onConnect(response);
};

export const disconnectEventsRoute = (connectionId: string, hooks: EventsRouteHooks): void => {
  hooks.onDisconnect(connectionId);
};
