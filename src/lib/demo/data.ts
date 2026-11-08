// Datos ilustrativos. Ninguna fila de este módulo procede de Roble.
export type DemoProject = {
  id: string; name: string; description: string; categories: string[];
  members: number; tasks: number; requests: number; status: "Publicado" | "Borrador";
};

export const demoProjects: DemoProject[] = [
  { id: "eco-campus", name: "EcoCampus", description: "Diseñemos juntos un campus más sostenible.", categories: ["Medio ambiente", "Impacto social"], members: 3, tasks: 2, requests: 1, status: "Publicado" },
  { id: "green-lab", name: "GreenLab", description: "Laboratorio estudiantil de soluciones ambientales de bajo costo.", categories: ["Medio ambiente", "Tecnología"], members: 2, tasks: 3, requests: 0, status: "Publicado" },
  { id: "quiz-pro", name: "QuizPro", description: "Aplicación web para crear actividades de aprendizaje.", categories: ["Innovación", "Educación"], members: 5, tasks: 2, requests: 2, status: "Publicado" },
];

export const demoNotifications = [
  { id: "n1", title: "Solicitud para unirse al equipo", body: "Una persona quiere participar en EcoCampus.", time: "Hace 4 días", icon: "user" as const },
  { id: "n2", title: "Comentario en tu proyecto", body: "Hay un comentario nuevo en QuizPro.", time: "Hace 4 días", icon: "chat" as const },
  { id: "n3", title: "Nueva postulación a tarea", body: "Una persona se postuló a una tarea de GreenLab.", time: "Hace 13 días", icon: "folder" as const },
];
