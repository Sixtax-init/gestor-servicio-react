import { Tour } from "@/lib/hooks/use-tour"

export const maestroTour: Tour = {
    id: "maestro-dashboard",
    steps: [
        {
            target: '[data-tour="welcome-banner"]',
            title: "¡Bienvenido Maestro!",
            content: "Este es tu panel de maestro. Aquí puedes gestionar tus cursos, tareas y alumnos.",
            placement: "bottom",
        },
        {
            target: '[data-tour="stats-courses"]',
            title: "Tus Cursos",
            content: "Aquí ves el número total de cursos que tienes asignados.",
            placement: "bottom",
        },
        {
            target: '[data-tour="stats-tasks"]',
            title: "Tareas Creadas",
            content: "Este contador muestra todas las tareas que has creado para tus cursos.",
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
            title: "Navegación",
            content: "Usa estas pestañas para gestionar diferentes aspectos. Te mostraré cada sección.",
            placement: "bottom",
        },
        // Mis Cursos Tab
        {
            target: '[data-tour="tab-cursos"]',
            title: "Pestaña: Mis Cursos",
            content: "Aquí puedes ver y gestionar todos tus cursos asignados.",
            placement: "bottom",
            switchToTab: "cursos",
        },
        // Tareas Tab
        {
            target: '[data-tour="tab-tareas"]',
            title: "Pestaña: Tareas",
            content: "En esta sección puedes crear nuevas tareas, ver las entregas de los alumnos y calificarlas.",
            placement: "bottom",
            switchToTab: "tareas",
        },
        // Alumnos Tab
        {
            target: '[data-tour="tab-alumnos"]',
            title: "Pestaña: Alumnos",
            content: "Aquí puedes ver todos los alumnos inscritos en tus cursos y su progreso.",
            placement: "bottom",
            switchToTab: "alumnos",
        },
        {
            target: '[data-tour="welcome-banner"]',
            title: "¡Tour Completado!",
            content: "Ya conoces todas las herramientas de tu panel. Usa el botón 'Manual' para volver a ver este tour.",
            placement: "bottom",
            switchToTab: "cursos",
        },
    ],
}
