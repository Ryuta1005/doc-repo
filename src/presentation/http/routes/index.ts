export interface RouteRegistration {
  path: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  operation: "getSiteConfig" | "listDocuments" | "getDocument" | "saveDocument" | "events";
}

export const registerRoutes = (): RouteRegistration[] => {
  return [
    { method: "GET", path: "/api/documents", operation: "listDocuments" },
    { method: "GET", path: "/api/document", operation: "getDocument" },
    { method: "POST", path: "/api/document/save", operation: "saveDocument" },
    { method: "GET", path: "/api/site-config", operation: "getSiteConfig" },
    { method: "GET", path: "/events", operation: "events" },
  ];
};
