/**
 * Reglas de departamento de un programa de servicio social.
 *
 * Un programa vive en uno de dos mundos y nunca en los dos:
 *
 * - `interno`: lo lleva un departamento real del Tec, así que se guarda la
 *   referencia `departamento_id`. De ahí hereda su departamento el alumno al
 *   confirmarse la inscripción, por eso es obligatorio.
 * - `externo`: lo lleva una organización de fuera. No hay departamento del Tec
 *   al que apuntar, así que sólo se guarda el área tal como la escriba el
 *   main_admin (`departamento_externo`), y `departamento_id` queda en NULL.
 *
 * El formulario ya aplica esta regla, pero la API se puede llamar directamente:
 * el invariante se resuelve aquí para que ambos caminos coincidan.
 */
export function normalizarDepartamento(
  tipoUbicacion: string,
  departamentoId: unknown,
  departamentoExterno: unknown,
): { departamentoId: number | null; departamentoExterno: string | null; error?: string } {
  if (tipoUbicacion === "interno") {
    const id = Number(departamentoId)
    if (!Number.isInteger(id) || id <= 0) {
      return {
        departamentoId: null,
        departamentoExterno: null,
        error: "Un programa interno debe tener un departamento asignado",
      }
    }
    // El texto libre no aplica a los internos: se descarta.
    return { departamentoId: id, departamentoExterno: null }
  }

  const texto = typeof departamentoExterno === "string" ? departamentoExterno.trim() : ""
  // La referencia al departamento del Tec no aplica a los externos: se descarta.
  return { departamentoId: null, departamentoExterno: texto || null }
}

/**
 * Normaliza las carreras permitidas de un programa.
 *
 * Son referencias al catálogo `carreras`, no texto: antes eran cadenas sueltas
 * que nunca llegaban a compararse con la carrera del alumno. NULL o vacío
 * significa "abierto a todas las carreras".
 */
export async function normalizarCarreras(
  consulta: (q: TemplateStringsArray, ...p: any[]) => Promise<any[]>,
  valor: unknown,
): Promise<{ carreras: number[] | null; error?: string }> {
  if (valor === null || valor === undefined) return { carreras: null }
  if (!Array.isArray(valor)) {
    return { carreras: null, error: "Las carreras permitidas deben ser una lista" }
  }
  if (valor.length === 0) return { carreras: null }

  const ids = [...new Set(valor.map(Number))]
  if (ids.some((id) => !Number.isInteger(id) || id <= 0)) {
    return { carreras: null, error: "Las carreras permitidas contienen un identificador inválido" }
  }

  const encontradas = await consulta`SELECT id FROM carreras WHERE id = ANY(${ids})`
  if (encontradas.length !== ids.length) {
    return { carreras: null, error: "Alguna de las carreras seleccionadas ya no existe" }
  }

  return { carreras: ids }
}

/**
 * Valida quién será el responsable de validar las horas del programa, es decir
 * el `maestro_id` del curso de servicio social asociado.
 *
 * No se exige que sea del mismo departamento que el programa: un maestro del
 * Tec puede supervisar perfectamente un programa externo, que por definición no
 * tiene departamento al que pertenecer.
 */
export async function validarResponsableHoras(
  consulta: (q: TemplateStringsArray, ...p: any[]) => Promise<any[]>,
  maestroId: unknown,
): Promise<{ maestroId: number | null; error?: string }> {
  const id = Number(maestroId)
  if (!Number.isInteger(id) || id <= 0) {
    return { maestroId: null, error: "Debes indicar quién validará las horas del programa" }
  }

  const [maestro] = await consulta`
    SELECT id FROM usuarios
    WHERE id = ${id} AND tipo_usuario = 'maestro' AND activo = true
  `
  if (!maestro) {
    return { maestroId: null, error: "El responsable indicado no es un maestro activo" }
  }

  return { maestroId: id }
}
