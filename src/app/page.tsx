import Link from "next/link";
import { getPublishedProjects } from "@/lib/roble/projects";

export default async function Home() {
  const result = await getPublishedProjects();

  return (
    <main className="page-shell">
      <header className="site-header">
        <Link className="brand" href="/">Innovation Hub <span>Grupo 10</span></Link>
        <nav aria-label="Navegación principal">
          <a href="#explorar">Explorar</a>
          <a href="#sobre-proyecto">Sobre el proyecto</a>
        </nav>
      </header>

      <section className="hero" aria-labelledby="hero-title">
        <p className="eyebrow">Comunidad · Ideas · Colaboración</p>
        <h1 id="hero-title">Las buenas ideas crecen en equipo.</h1>
        <p>Descubre proyectos de la comunidad y encuentra una iniciativa a la que puedas aportar.</p>
        <a className="primary-link" href="#explorar">Explorar proyectos <span aria-hidden="true">↗</span></a>
      </section>

      <section id="explorar" className="content-section" aria-labelledby="explore-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Explorar</p>
            <h2 id="explore-title">Proyectos de la comunidad</h2>
          </div>
          {result.status === "loaded" && <span className="count">{result.projects.length} proyectos</span>}
        </div>

        {result.status === "pending" && (
          <div className="notice" role="status">
            <h3>Conexión de datos en preparación</h3>
            <p>La consulta pública de Roble se activará después de verificar que los borradores y datos privados estén protegidos.</p>
          </div>
        )}
        {result.status === "error" && (
          <div className="notice" role="alert">
            <h3>No pudimos cargar los proyectos</h3>
            <p>Intenta de nuevo más tarde. La aplicación móvil sigue disponible.</p>
          </div>
        )}
        {result.status === "loaded" && result.projects.length === 0 && (
          <div className="notice"><h3>Aún no hay proyectos publicados</h3><p>Vuelve pronto para descubrir nuevas ideas.</p></div>
        )}
        {result.status === "loaded" && result.projects.length > 0 && (
          <div className="project-grid">
            {result.projects.map((project) => (
              <article className="project-card" key={project.id}>
                <p className="project-category">{project.categories[0] ?? "Proyecto"}</p>
                <h3>{project.name}</h3>
                <p>{project.description}</p>
                <div className="project-card-footer">
                  <span>{project.createdByName ?? "Comunidad"}</span>
                  <span>{project.acceptedMembersCount} integrantes</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section id="sobre-proyecto" className="about-section" aria-labelledby="about-title">
        <p className="eyebrow">Una comunidad, dos formas de participar</p>
        <h2 id="about-title">Tu información te acompaña.</h2>
        <p>La futura experiencia web y la aplicación móvil compartirán tu cuenta y tus proyectos. Estamos construyendo la web por etapas.</p>
      </section>
      <footer>Innovation Hub · Grupo 10</footer>
    </main>
  );
}
