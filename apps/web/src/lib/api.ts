const API_PROXY_BASE = "/api/proxy";

export const buildApiUrl = (path: string) => {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${API_PROXY_BASE}${normalizedPath}`;
};
