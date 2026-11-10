// Antes los comentarios se abrían como hoja inferior. Desde la Corrección 4.4
// tienen pantalla propia (ProjectCommentsPage, con respuestas en hilo); esta
// función se conserva para que los lugares que la usaban sigan funcionando.
import { Nav } from "@/src/core/navigation/Nav";

/** Abre los comentarios del proyecto [projectId]. */
export function showProjectComments(projectId: string, projectName = ""): Promise<void> {
  return Nav.to("ProjectComments", { projectId, projectName }).then(() => undefined);
}
