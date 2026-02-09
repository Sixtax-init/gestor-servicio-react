const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

/**
 * Función centralizada para realizar peticiones a la API del sistema.
 * Maneja automáticamente el basePath para entornos de producción.
 * 
 * @param input La URL de la API (ej. "/api/auth/login")
 * @param init Opciones de la petición fetch
 * @returns Promise<Response>
 */
export async function apiFetch(
    input: string,
    init?: RequestInit
) {
    // Normalizar la URL: si empieza con /api y hay basePath, concatenar cuidando de no duplicar barras
    let url = input;

    if (!input.startsWith("http")) {
        const cleanBasePath = basePath.endsWith("/") ? basePath.slice(0, -1) : basePath;
        const cleanInput = input.startsWith("/") ? input : `/${input}`;
        url = `${cleanBasePath}${cleanInput}`;
    }

    // Preparar los headers
    const headers = new Headers(init?.headers);

    // Si no es FormData, nos aseguramos de que sea JSON por defecto (si hay body)
    if (init?.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    return fetch(url, {
        credentials: "include", // Importante para auth y sesiones
        ...init,
        headers,
    });
}
