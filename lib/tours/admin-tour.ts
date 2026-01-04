import { Tour } from "@/lib/hooks/use-tour"

export const adminTour: Tour = {
    id: "admin-dashboard",
    steps: [
        {
            target: '[data-tour="welcome-banner"]',
            title: "Panel de Administración",
            content: "Bienvenido al panel de administración. Desde aquí puedes gestionar usuarios, cursos y tareas del sistema.",
            placement: "bottom",
        },
        {
            target: '[data-tour="stats-users"]',
            title: "Total de Usuarios",
            content: "Aquí ves el número total de usuarios activos en el sistema (alumnos, maestros y administradores).",
            placement: "bottom",
        },
        {
            target: '[data-tour="stats-courses"]',
            title: "Total de Cursos",
            content: "Este contador muestra todos los cursos y servicios sociales registrados en el sistema.",
            placement: "bottom",
        },
        {
            target: '[data-tour="stats-tasks"]',
            title: "Total de Tareas",
            content: "Aquí ves el número total de tareas asignadas en todos los cursos.",
            placement: "bottom",
        },
        {
            target: '[data-tour="tabs"]',
            title: "Gestión del Sistema",
            content: "Usa estas pestañas para administrar el sistema. Te mostraré cada sección.",
            placement: "bottom",
        },
        // Usuarios Tab
        {
            target: '[data-tour="tab-usuarios"]',
            title: "Pestaña: Usuarios",
            content: "Aquí puedes crear, editar y gestionar todos los usuarios del sistema (alumnos, maestros y administradores).",
            placement: "bottom",
            switchToTab: "usuarios",
        },
        // Cursos Tab
        {
            target: '[data-tour="tab-cursos"]',
            title: "Pestaña: Cursos",
            content: "En esta sección puedes crear y gestionar todos los cursos y servicios sociales del sistema.",
            placement: "bottom",
            switchToTab: "cursos",
        },
        // Tareas Tab
        {
            target: '[data-tour="tab-tareas"]',
            title: "Pestaña: Tareas",
            content: "Aquí puedes ver todas las tareas del sistema y su estado general.",
            placement: "bottom",
            switchToTab: "tareas",
        },
        {
            target: '[data-tour="welcome-banner"]',
            title: "¡Tour Completado!",
            content: "Ya conoces todas las herramientas de administración. Usa el botón 'Manual' para volver a ver este tour.",
            placement: "bottom",
            switchToTab: "usuarios",
        },
    ],
}
