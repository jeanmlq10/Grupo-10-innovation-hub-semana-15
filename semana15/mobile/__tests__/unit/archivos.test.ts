// Pruebas del almacenamiento de archivos (bucket R2 vía Roble) con un
// datasource falso en memoria: sin red ni bucket real.
import { Row } from "@/src/core/roble/sdk/robleOwnership";
import { IAttachmentDataSource } from "@/src/features/attachments/data/datasources/iAttachmentDataSource";
import { AttachmentRepository, ImagePolicy } from "@/src/features/attachments/data/repositories/attachmentRepository";
import { StorageFolders } from "@/src/features/attachments/domain/models/storedFile";

class FakeStorage implements IAttachmentDataSource {
  session = true;
  objects = new Map<string, { name: string; folder: string; size: number }>();
  rows: Row[] = [];
  urlCalls = 0;
  failCreate = false;
  private n = 0;
  get hasSession() {
    return this.session;
  }
  async upload(a: { fileName: string; data: Blob; folder: string }) {
    const fileId = `f${++this.n}`;
    this.objects.set(fileId, { name: a.fileName, folder: a.folder, size: a.data.size });
    return { fileId };
  }
  async downloadUrl(fileId: string) {
    this.urlCalls++;
    return { downloadUrl: `https://firmada.example/${fileId}?t=${this.urlCalls}`, fileName: this.objects.get(fileId)?.name ?? "" };
  }
  async removeObject(fileId: string) {
    this.objects.delete(fileId);
  }
  async readForProject(projectId: string) {
    return this.rows.filter((r) => r.projectId === projectId);
  }
  async create(row: Row) {
    if (this.failCreate) throw new Error("Roble no respondió");
    const r = { ...row, _id: `row${this.rows.length + 1}` };
    this.rows.push(r);
    return r;
  }
  async delete(id: string) {
    this.rows = this.rows.filter((r) => r._id !== id);
  }
  async readLocal() {
    return new Blob(["contenido de prueba"], { type: "application/pdf" });
  }
}

describe("Almacenamiento de archivos (R2 vía Roble)", () => {
  test("un documento se sube a proyectos/documentos y queda asociado al proyecto", async () => {
    const s = new FakeStorage();
    const repo = new AttachmentRepository(s);
    const doc = await repo.uploadProjectDocument("P1", { name: "Propuesta.pdf", uri: "file://p", mimeType: "application/pdf", size: 19 });
    expect([...s.objects.values()][0]).toMatchObject({ folder: StorageFolders.projectDocuments, name: "Propuesta.pdf" });
    expect(doc).toMatchObject({ projectId: "P1", extension: "pdf", kind: "document" });
    expect((await repo.documentsFor("P1")).map((d) => d.fileName)).toEqual(["Propuesta.pdf"]);
    expect(await repo.documentsFor("P2")).toEqual([]);
  });

  test("rechaza formatos no permitidos antes de subir", async () => {
    const s = new FakeStorage();
    await expect(new AttachmentRepository(s).uploadProjectDocument("P1", { name: "virus.exe", uri: "file://x" })).rejects.toThrow(/formato/);
    expect(s.objects.size).toBe(0);
  });

  test("si no se puede registrar la fila, borra el archivo del bucket (no quedan huérfanos)", async () => {
    const s = new FakeStorage();
    s.failCreate = true;
    await expect(new AttachmentRepository(s).uploadProjectDocument("P1", { name: "a.pdf", uri: "file://a", size: 10 })).rejects.toThrow();
    expect(s.objects.size).toBe(0);
  });

  test("la imagen va a proyectos/imagenes y se valida tipo y tamaño", async () => {
    const s = new FakeStorage();
    const repo = new AttachmentRepository(s);
    const fileId = await repo.uploadProjectImage({ name: "portada.png", uri: "file://i", mimeType: "image/png", size: 1000 });
    expect(s.objects.get(fileId)?.folder).toBe(StorageFolders.projectImages);
    expect(ImagePolicy.validate({ name: "doc.pdf", uri: "", mimeType: "application/pdf" })).toMatch(/JPG/);
    expect(ImagePolicy.validate({ name: "big.jpg", uri: "", size: 6 * 1024 * 1024 })).toMatch(/5 MB/);
  });

  test("las URLs firmadas se piden al mostrar, se reutilizan un rato y no existen sin sesión", async () => {
    const s = new FakeStorage();
    const repo = new AttachmentRepository(s);
    const id = await repo.uploadProjectImage({ name: "p.jpg", uri: "file://i", mimeType: "image/jpeg" });
    const a = await repo.downloadUrl(id);
    const b = await repo.downloadUrl(id);
    expect(a).toBe(b);
    expect(s.urlCalls).toBe(1);
    s.session = false;
    expect(await new AttachmentRepository(s).downloadUrl(id)).toBeNull();
  });

  test("quitar un documento borra el objeto y su fila", async () => {
    const s = new FakeStorage();
    const repo = new AttachmentRepository(s);
    const doc = await repo.uploadProjectDocument("P1", { name: "b.docx", uri: "file://b", size: 5 });
    await repo.removeDocument(doc);
    expect(s.objects.size).toBe(0);
    expect(s.rows).toEqual([]);
  });
});
