import { Tour } from "@/lib/hooks/use-tour"

export const maestroTour: Tour = {
    id: "maestro-dashboard",
    steps: [
        {
            target: '[data-tour="welcome-banner"]',
            title: "¡Bienvenido, Maestro!",
            content: "Este es tu panel de control. Aquí podrás gestionar tus cursos, tareas y dar seguimiento al progreso de tus alumnos.",
            placement: "bottom",
        },
        {
            target: '[data-tour="stats-courses"]',
            title: "Estadísticas de Cursos",
            content: "Aquí puedes ver el número total de cursos activos que tienes asignados.",
            placement: "bottom",
        },
        {
            target: '[data-tour="stats-tasks"]',
            title: "Tareas Asignadas",
            content: "Este contador muestra todas las tareas que has creado y asignado a tus alumnos.",
            placement: "bottom",
        },
        {
            target: '[data-tour="stats-students"]',
            title: "Alumnos Inscritos",
            content: "Aquí ves el total de alumnos inscritos en todos tus cursos.",
            placement: "bottom",
        },
        {
            target: '[data-tour="tabs"]',
            title: "Pestañas de Navegación",
            content: "Usa estas pestañas para navegar entre tus cursos, tareas y alumnos. Las estadísticas cambiarán según la pestaña activa.",
            placement: "bottom",
        },
        {
            target: '[data-tour="tab-cursos"]',
            title: "Pestaña: Mis Cursos",
            content: "Aquí puedes ver y gestionar todos tus cursos asignados.",
            placement: "bottom",
            switchToTab: "cursos",
        },
        {
            target: '[data-tour="cursos-content"]',
            title: "Gestión de Cursos",
            content: "En esta sección verás la lista de tus cursos activos. Puedes crear nuevos cursos, editarlos o eliminarlos.",
            placement: "top",
        },
        {
            target: '[data-tour="tab-tareas"]',
            title: "Pestaña: Tareas",
            content: "En esta sección puedes crear nuevas tareas, ver las entregas de los alumnos y calificarlas.",
            placement: "bottom",
            switchToTab: "tareas",
        },
        {
            target: '[data-tour="tareas-content"]',
            title: "Gestión de Tareas",
            content: "Aquí verás todas tus tareas organizadas por curso. Puedes crear nuevas tareas, ver entregas y revisar avances de los alumnos.",
            placement: "top",
        },
        {
            target: '[data-tour="tab-alumnos"]',
            title: "Pestaña: Alumnos",
            content: "Esta pestaña te permite ver y dar seguimiento al progreso de tus alumnos. ¡Las estadísticas cambiarán automáticamente!",
            placement: "bottom",
            switchToTab: "alumnos",
        },
        {
            target: '[data-tour="search-input"]',
            title: "Seguimiento de Alumnos",
            content: "Aquí puedes buscar alumnos, ver su progreso por curso y acceder a estadísticas detalladas de cada uno.",
            placement: "top",
        },
        {
            target: ".border-l-orange-500",
            title: "📊 Promedio de Horas",
            content: "Esta métrica muestra el promedio de horas de servicio social completadas por todos tus alumnos. Te ayuda a entender el rendimiento general del grupo.",
            placement: "bottom",
        },
        {
            target: ".border-l-green-500:has(.text-2xl)",
            title: "✅ Tasa de Completitud",
            content: "Muestra el porcentaje de alumnos que han completado las 480 horas requeridas. Incluye el conteo exacto de alumnos completados.",
            placement: "bottom",
        },
        {
            target: ".border-l-red-500",
            title: "⚠️ Alumnos en Riesgo",
            content: "Identifica cuántos alumnos tienen menos del 50% de progreso (menos de 240 horas). Estos alumnos necesitan atención especial.",
            placement: "bottom",
        },
        {
            target: '[data-tour="alumnos-content"]',
            title: "Lista Compacta de Alumnos",
            content: "Cada alumno se muestra con su nombre, matrícula, estado y barra de progreso.",
            placement: "top",
        },
        {
            target: '[data-tour="alumnos-data"]',
            title: "Datos de Alumnos",
            content: "Cada alumno se muestra con su nombre, matrícula, estado y barra de progreso. Haz clic en el ícono 📊 para ver detalles completos.",
            placement: "top",
        },
        {
            target: '[data-tour="welcome-banner"]',
            title: "¡Tour Completado!",
            content: "Ya conoces todas las funcionalidades de tu panel, incluyendo el nuevo sistema de seguimiento de progreso. Puedes volver a ver este tour haciendo clic en 'Manual' en cualquier momento.",
            placement: "bottom",
            switchToTab: "cursos",
        },
    ],
}
