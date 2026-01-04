import { Tour } from "@/lib/hooks/use-tour"

export const alumnoTour: Tour = {
    id: "alumno-dashboard",
    steps: [
        {
            target: '[data-tour="welcome-banner"]',
            title: "¡Bienvenido!",
            content: "Este es tu panel de alumno. Aquí encontrarás toda la información sobre tus cursos y horas de servicio social.",
            placement: "bottom",
        },
        {
            target: '[data-tour="stats-courses"]',
            title: "Cursos Inscritos",
            content: "Aquí puedes ver cuántos cursos tienes activos actualmente.",
            placement: "bottom",
        },
        {
            target: '[data-tour="stats-hours"]',
            title: "Horas Completadas",
            content: "Este contador muestra las horas de servicio social que has acumulado.",
            placement: "bottom",
        },
        {
            target: '[data-tour="stats-available"]',
            title: "Cursos Disponibles",
            content: "Aquí ves cuántos cursos nuevos están disponibles para inscribirte.",
            placement: "bottom",
        },
        {
            target: '[data-tour="tabs"]',
            title: "Navegación por Pestañas",
            content: "Usa estas pestañas para navegar entre diferentes secciones. Ahora te mostraré cada una.",
            placement: "bottom",
        },
        // Mis Cursos Tab
        {
            target: '[data-tour="tab-mis-cursos"]',
            title: "Pestaña: Mis Cursos",
            content: "En esta pestaña verás todos los cursos en los que estás inscrito actualmente.",
            placement: "bottom",
            switchToTab: "mis-cursos",
        },
        // Cursos Disponibles Tab
        {
            target: '[data-tour="tab-disponibles"]',
            title: "Pestaña: Cursos Disponibles",
            content: "Aquí encontrarás todos los cursos y servicios sociales disponibles para inscribirte.",
            placement: "bottom",
            switchToTab: "disponibles",
        },
        // Mis Tareas Tab
        {
            target: '[data-tour="tab-tareas"]',
            title: "Pestaña: Mis Tareas",
            content: "En esta sección verás todas las tareas asignadas en tus cursos, con sus fechas de vencimiento y estado.",
            placement: "bottom",
            switchToTab: "tareas",
        },
        // Mis Horas Tab
        {
            target: '[data-tour="tab-horas"]',
            title: "Pestaña: Mis Horas",
            content: "Aquí puedes hacer seguimiento detallado de tus horas de servicio social por curso.",
            placement: "bottom",
            switchToTab: "horas",
        },
        {
            target: '[data-tour="welcome-banner"]',
            title: "¡Tour Completado!",
            content: "Ya conoces todas las secciones de tu panel. Puedes volver a ver este tour haciendo clic en el botón 'Manual' en cualquier momento.",
            placement: "bottom",
            switchToTab: "mis-cursos",
        },
    ],
}
