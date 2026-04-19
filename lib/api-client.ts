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

    // Bandera para evitar bucles infinitos de retry
    const isRetry = (init as any)?._isRetry

    let response = await fetch(url, {
        credentials: "include", // Importante para auth y sesiones
        ...init,
        headers,
    });

    // Interceptor: Si obtenemos 401 y no es ya un segundo intento, ni es la un endpoint público, intentamos renovar
    // (Aseguramos no atrapar el endpoint de refresh recursivamente, ni el login)
    if (response.status === 401 && !isRetry && !url.includes('/api/auth/login') && !url.includes('/api/auth/refresh')) {
        try {
            // Intentamos renovar la sesión
            const refreshRes = await fetch(`${basePath || ''}/api/auth/refresh`, {
                method: "POST",
                credentials: "include",
            })

            if (refreshRes.ok) {
                // El refresh fue un éxito (tenemos cookies nuevas), repetimos la petición original
                const retryInit = { ...init, _isRetry: true }
                response = await fetch(url, {
                    credentials: "include",
                    ...retryInit,
                    headers,
                })
            } else {
                // El refresh falló (Revocado o Expirado), se forzará al usuario al login
                if (typeof window !== "undefined") {
                    window.location.href = `${basePath || ''}/login?motivo=expirada`
                }
            }
        } catch (e) {
            // Falla en la red al refrescar
        }
    }

    return response;
}
