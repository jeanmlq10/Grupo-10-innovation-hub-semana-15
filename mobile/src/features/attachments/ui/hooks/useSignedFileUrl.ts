// Pide la URL firmada de un archivo en el momento de mostrarlo (las URLs de
// Roble caducan en minutos, por eso no se guardan en la base de datos).
import { useEffect, useState } from "react";

import { useFindStatic } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";

import { IAttachmentRepository } from "../../domain/repositories/iAttachmentRepository";

export function useSignedFileUrl(fileId: string | null | undefined): string | null {
  const repo = useFindStatic<IAttachmentRepository>(TOKENS.AttachmentRepo);
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    setUrl(null);
    if (!fileId) return;
    repo
      .downloadUrl(fileId)
      .then((u) => active && setUrl(u))
      .catch(() => active && setUrl(null));
    return () => {
      active = false;
    };
  }, [repo, fileId]);
  return url;
}
