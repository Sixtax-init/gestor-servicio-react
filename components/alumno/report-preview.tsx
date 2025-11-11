import Image from "next/image"
import { ReportData, Actividad } from "@/types/report"

interface ReportPreviewProps {
  data: ReportData
  actividades: Actividad[]
}

export function ReportPreview({ data, actividades = [] }: ReportPreviewProps) {
  return (
    <div className="bg-white text-black font-sans print:text-[11pt]">
      {/* Header */}
      <div className="border-2 border-black p-4">
        <div className="flex justify-between items-start mb-2">
           {/* Logo */}
          <div className="flex-shrink-0">
            <Image
              src="/logos/ITNL.png"
              alt="Logo ITNL"
              width={80}
              height={80}
              className="object-contain"
            />
          </div>
          <div className="flex-1">
            <div className="font-bold text-center text-sm leading-tight">TECNOLÓGICO NACIONAL DE MÉXICO</div>
            <div className="font-bold text-center text-sm leading-tight">INSTITUTO TECNOLÓGICO DE NUEVO LEÓN</div>
          </div>
          <div className="text-right text-xs border-l-2 border-black pl-4">
            <div>Fecha de elaboración</div>
            <div>{new Date().toISOString().split('T')[0]}</div>
          </div>
        </div>

        <div className="flex justify-between items-center text-xs mt-2 pt-2 border-t border-black">
          <div>Reporte Bimestral de Servicio Social 1</div>
          <div>Código: REG-8510-18</div>
          <div>Revisión: 01</div>
        </div>
      </div>

      {/* Department */}
      <div className="text-center font-bold text-xs mt-2 mb-4">
        DEPARTAMENTO DE GESTIÓN TECNOLÓGICA Y VINCULACIÓN
        <br />
        OFICINA DE SERVICIO SOCIAL
      </div>

      {/* Form Content */}
      <div className="border-2 border-black p-4 space-y-3 text-sm">
        {/* Report Number */}
        <div className="flex items-center gap-2">
          <span>REPORTE No.</span>
          <span className="border-b border-black min-w-[80px] px-2">{data.reportNumber || "_______"}</span>
        </div>

        {/* Activities Section 
        <div className="mt-6">
          <h3 className="font-semibold mb-2">Actividades:</h3>
          {actividades.length > 0 ? (
            <div className="space-y-4">
              {actividades.map((actividad, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <h4 className="font-medium">{actividad.actividad}</h4>
                  {actividad.descripcion && (
                    <p className="mt-2 text-sm text-gray-600">{actividad.descripcion}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="border border-gray-200 rounded p-4">
              <p className="text-muted-foreground">No hay actividades registradas.</p>
            </div>
          )}
        </div>*/}

        {/* Name */}
        <div className="space-y-1">
          <div>Nombre:</div>
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div>
              <div className="border-b border-black px-2 min-h-[24px]">{data.apellidoPaterno}</div>
              <div className="text-center mt-1">Apellido Paterno</div>
            </div>
            <div>
              <div className="border-b border-black px-2 min-h-[24px]">{data.apellidoMaterno}</div>
              <div className="text-center mt-1">Apellido Materno</div>
            </div>
            <div>
              <div className="border-b border-black px-2 min-h-[24px]">{data.nombre}</div>
              <div className="text-center mt-1">Nombre (s)</div>
            </div>
          </div>
        </div>

        {/* Career and Control Number */}
        <div className="flex items-center gap-4">
          <span>Carrera:</span>
          <span className="border-b border-black flex-1 px-2 min-h-[24px]">{data.carrera}</span>
          <span className="whitespace-nowrap">No de Control:</span>
          <span className="border-b border-black min-w-[120px] px-2 min-h-[24px]">{data.numeroControl}</span>
        </div>

        {/* Dates */}
        <div className="space-y-1">
          <div>Fechas del reporte:</div>
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <span>Del día:</span>
            <span className="border-b border-black w-[40px] text-center">{data.fechaInicioDia}</span>
            <span>mes</span>
            <span className="border-b border-black w-[40px] text-center">{data.fechaInicioMes}</span>
            <span>año</span>
            <span className="border-b border-black w-[60px] text-center">{data.fechaInicioAno}</span>
            <span>; al día:</span>
            <span className="border-b border-black w-[40px] text-center">{data.fechaFinDia}</span>
            <span>mes</span>
            <span className="border-b border-black w-[40px] text-center">{data.fechaFinMes}</span>
            <span>año</span>
            <span className="border-b border-black w-[60px] text-center">{data.fechaFinAno}</span>
          </div>
        </div>

        {/* Dependencia */}
        <div className="flex items-center gap-2">
          <span>Dependencia:</span>
          <span className="border-b border-black flex-1 px-2 min-h-[24px]">{data.dependencia}</span>
        </div>

        {/* Programa */}
        <div className="flex items-center gap-2">
          <span>Programa:</span>
          <span className="border-b border-black flex-1 px-2 min-h-[24px]">{data.programa}</span>
        </div>

        {/* Resumen de actividades */}
        <div className="space-y-1">
          <div>Resumen de actividades:</div>
          <div className="border border-black p-2 min-h-[120px] text-xs whitespace-pre-wrap">
            {data.resumenActividades}
          </div>
        </div>

        {/* Horas */}
        <div className="flex items-center gap-4">
          <span>Total de horas de este reporte:</span>
          <span className="border-b border-black min-w-[80px] px-2">{data.horasReporte}</span>
          <span>Total de horas acumuladas:</span>
          <span className="border-b border-black min-w-[80px] px-2">{data.horasAcumuladas}</span>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-3 gap-4 mt-8 pt-4 text-xs">
          <div className="text-center space-y-8">
            <div className="min-h-[40px]"></div>
            <div className="border-t border-black pt-1">
              <div className="font-bold">NOMBRE, PUESTO Y FIRMA</div>
              <div className="font-bold">DEL JEFE (A) DE DEPTO. O</div>
              <div className="font-bold">DEPENDENCIA</div>
              <div className="mt-2 text-xs">
                {data.nombreJefe && data.puestoJefe && (
                  <>
                    <div>{data.nombreJefe}</div>
                    <div>{data.puestoJefe}</div>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="text-center space-y-8">
            <div className="min-h-[40px]">
              <div className="border-2 border-black h-[40px] flex items-center justify-center font-bold">SELLO</div>
            </div>
            <div className="border-t border-black pt-1">
              <div className="font-bold">FIRMA DEL ESTUDIANTE</div>
            </div>
          </div>
          <div className="text-center space-y-8">
            <div className="min-h-[40px]"></div>
            <div className="border-t border-black pt-1">
              <div className="font-bold">Vo. Bo. OFICINA SERVICIO SOCIAL</div>
              <div className="font-bold">DEL INSTITUTO TECNOLÓGICO</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="text-[8pt] mt-4 text-center text-gray-600 print:hidden">
        NOTA: IMPRIMIR SOLAMENTE EL REPORTE BIMESTRAL Y ENTREGAR ORIGINAL Y COPIA
      </div>
    </div>
  )
}