/**
 * Configuración global del sistema.
 * Modifica los valores en .env.local para ajustar sin tocar el código.
 */

// Horas requeridas para completar el servicio social
export const REQUIRED_SERVICE_HOURS = Number(process.env.REQUIRED_SERVICE_HOURS) || 480
