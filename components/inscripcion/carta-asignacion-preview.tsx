export interface CartaData {
  id: number
  numero_oficio: string | null
  nombre: string
  apellidos: string
  matricula: string
  carrera: string | null
  horas_previas_acreditadas: number
  programa_nombre: string
  dependencia_telefono: string | null
  nombre_dependencia: string | null
  responsable_dependencia_nombre: string | null
  responsable_dependencia_puesto: string | null
  departamento_nombre: string | null
  dias: string
  hora_inicio: string
  hora_fin: string
}

export function CartaAsignacionPreview({ data }: { data: CartaData }) {
  const nombreCompleto = `${data.nombre} ${data.apellidos}`.trim()

  return (
    <div
      className="bg-white text-black text-[11pt] leading-relaxed print:text-[10.5pt]"
      style={{ fontFamily: "'Times New Roman', Times, serif" }}
    >
      {/* Código REG — arriba a la derecha */}
      <div className="text-right text-xs font-bold mb-6">REG-8510-17</div>

      {/* Bloque Departamento / No. Oficio / Asunto — alineado a la derecha */}
      <div className="flex justify-end mb-10">
        <table className="text-sm border-separate" style={{ borderSpacing: "0 4px" }}>
          <tbody>
            <tr>
              <td className="pr-2 whitespace-nowrap">Departamento:</td>
              <td>
                <span className="border-b border-black px-1 min-w-[200px] inline-block">
                  Gestión Tecnológica y Vinculación
                </span>
              </td>
            </tr>
            <tr>
              <td className="pr-2 whitespace-nowrap">No. de Oficio:</td>
              <td>
                <span className="border-b border-black px-1 min-w-[200px] inline-block">
                  {data.numero_oficio ?? ""}
                </span>
              </td>
            </tr>
            <tr>
              <td className="pr-2 whitespace-nowrap">Asunto:</td>
              <td className="font-bold">Carta de Asignación</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Destinatario */}
      <div className="mb-6">
        <p className="font-bold">
          C. {data.responsable_dependencia_nombre ?? "(NOMBRE DE LA PERSONA A QUIEN VA DIRIGIDO)"}
        </p>
        <p className="font-bold">
          {data.nombre_dependencia ?? "(NOMBRE DE LA DEPENDENCIA)"}
          {data.dependencia_telefono ? ` ${data.dependencia_telefono}` : ""}
        </p>
        <p>Presente.-</p>
      </div>

      {/* Cuerpo */}
      <div className="mb-6 text-justify">
        <p>
          Por este conducto presentamos a sus finas atenciones al prestante C.{" "}
          <span className="border-b border-black px-1">{nombreCompleto}</span>
          {" "}con número de control escolar{" "}
          <span className="border-b border-black px-1">{data.matricula}</span>
          , estudiante de la carrera de{" "}
          <span className="border-b border-black px-1">{data.carrera ?? ""}</span>
          , quien desea realizar su Servicio Social en esa dependencia, cubriendo un total de 480 horas en
          el programa:{" "}
          <span className="border-b border-black px-1">{data.programa_nombre}</span>
          {" "}en el departamento de{" "}
          <span className="border-b border-black px-1">{data.departamento_nombre ?? ""}</span>
          {" "}en un período mínimo de seis meses y no mayor de dos años.
        </p>
      </div>

      {/* Agradecimiento */}
      <p className="text-center font-bold mb-6">
        Agradezco las atenciones se sirva brindar al prestante.
      </p>

      {/* Firma institucional */}
      <div className="mb-8">
        <p>ATENTAMENTE.-</p>
        <p className="italic">&ldquo;Ciencia y Tecnología al Servicio del Hombre&rdquo;</p>
        <br />
        <p className="font-bold">LIC. MARIA ARMANDINA RAMIREZ OROZCO</p>
        <p className="font-bold">Jefa Depto. de Gestión Tecnológica y Vinculación</p>
      </div>

      {/* Nota horas */}
      <p className="mb-6">
        NOTA: <strong>Tiene Acreditadas</strong>{" "}
        <span className="border-b border-black px-3 mx-1">{data.horas_previas_acreditadas}</span>{" "}
        <strong>horas.</strong>
      </p>

      {/* Alta definitiva */}
      <p className="text-center font-bold underline mb-1">ALTA DEFINITIVA DE SERVICIO SOCIAL</p>

      <table className="w-full border-collapse border border-black text-sm">
        <thead>
          <tr>
            <th className="border border-black p-2 w-1/2">
              <span className="font-bold">ACEPTADO</span>
              {" "}
              <span className="inline-block w-4 h-4 border border-black align-middle" />
            </th>
            <th className="border border-black p-2 w-1/2">
              <span className="font-bold">RECHAZADO</span>
              {" "}
              <span className="inline-block w-4 h-4 border border-black align-middle" />
            </th>
          </tr>
          <tr>
            <td className="border border-black p-1 text-center text-xs">para realizar Servicio Social</td>
            <td className="border border-black p-1 text-center text-xs">para realizar su Servicio Social</td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-black p-3 align-top">
              <p className="text-xs mb-4">Iniciará sus actividades el día (9)</p>
              <div className="border-b border-black mb-4" />
              <p className="text-xs mb-4">Horario de la prestación del Servicio Social: (10)</p>
              <div className="border-b border-black mb-4" />
            </td>
            <td className="border border-black p-3 align-top">
              <p className="text-xs font-bold mb-4">Motivos: (11)</p>
              <div className="min-h-[80px]" />
            </td>
          </tr>
        </tbody>
      </table>

      {/* Firmas */}
      <div className="grid grid-cols-2 gap-16 mt-16 text-xs">
        <div>
          <div className="border-t border-black pt-1">
            <p className="font-bold">Nombre y Firma del Jefe del Departamento o</p>
            <p className="font-bold">Dependencia y sello de aceptado (12)</p>
          </div>
        </div>
        <div>
          <div className="border-t border-black pt-1">
            <p className="font-bold">Nombre y Firma Del Jefe del Departamento o</p>
            <p className="font-bold">Dependencia y sello de rechazado (13)</p>
          </div>
        </div>
      </div>
    </div>
  )
}
