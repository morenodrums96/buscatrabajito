function tokenizar(texto: string): string[] {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita acentos
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Verifica que el nombre extraído de un CV corresponda razonablemente al
 * nombre y apellido paterno capturados en el perfil del usuario. Tolera
 * acentos, mayúsculas y nombres/apellidos compuestos o con texto adicional
 * alrededor (ej. título profesional en la misma línea).
 */
export function nombreCoincide(
  nombreExtraido: string | undefined | null,
  nombre: string,
  apellidoPaterno: string
): boolean {
  if (!nombreExtraido?.trim()) return false;

  const tokensExtraidos = new Set(tokenizar(nombreExtraido));
  const tokensRequeridos = [...tokenizar(nombre), ...tokenizar(apellidoPaterno)];

  if (tokensRequeridos.length === 0) return true;

  return tokensRequeridos.every((t) => tokensExtraidos.has(t));
}
