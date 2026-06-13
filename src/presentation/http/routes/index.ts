export interface RouteRegistration {
  path: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  operation: "getSiteConfig" | "listDocuments" | "getDocument" | "events";
}

export const registerRoutes = (): RouteRegistration[] => {
  return [
    { method: "GET", path: "/api/documents", operation: "listDocuments" },
    { method: "GET", path: "/api/document", operation: "getDocument" },
    { method: "GET", path: "/api/site-config", operation: "getSiteConfig" },
    { method: "GET", path: "/events", operation: "events" },
  ];
};
