"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { ReportData, Actividad } from "@/types/report"



interface ReportFormProps {
  data: ReportData
  onDataChange: (data: ReportData) => void
  actividades: Actividad[]
}

export function ReportForm({ data, onDataChange }: ReportFormProps) {
  const handleChange = (field: keyof ReportData, value: string) => {
    onDataChange({ ...data, [field]: value })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Información del Reporte</CardTitle>
          <CardDescription>Número de reporte consecutivo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="reportNumber">Número de Reporte *</Label>
            <Input
              id="reportNumber"
              value={data.reportNumber}
              onChange={(e) => handleChange("reportNumber", e.target.value)}
              placeholder="1"
              required
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Datos del Estudiante</CardTitle>
          <CardDescription>Información personal del prestante de servicio social</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="apellidoPaterno">Apellido Paterno *</Label>
              <Input
                id="apellidoPaterno"
                value={data.apellidoPaterno}
                onChange={(e) => handleChange("apellidoPaterno", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apellidoMaterno">Apellido Materno *</Label>
              <Input
                id="apellidoMaterno"
                value={data.apellidoMaterno}
                onChange={(e) => handleChange("apellidoMaterno", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre(s) *</Label>
              <Input
                id="nombre"
                value={data.nombre}
                onChange={(e) => handleChange("nombre", e.target.value)}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="carrera">Carrera *</Label>
              <Input
                id="carrera"
                value={data.carrera}
                onChange={(e) => handleChange("carrera", e.target.value)}
                placeholder="Ej: Ingeniería en Sistemas Computacionales"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numeroControl">Número de Control *</Label>
              <Input
                id="numeroControl"
                value={data.numeroControl}
                onChange={(e) => handleChange("numeroControl", e.target.value)}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fechas del Reporte</CardTitle>
          <CardDescription>Periodo que abarca este reporte</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-2 block">Fecha de Inicio *</Label>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fechaInicioDia" className="text-sm text-muted-foreground">
                  Día
                </Label>
                <Input
                  id="fechaInicioDia"
                  value={data.fechaInicioDia}
                  onChange={(e) => handleChange("fechaInicioDia", e.target.value)}
                  placeholder="01"
                  maxLength={2}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fechaInicioMes" className="text-sm text-muted-foreground">
                  Mes
                </Label>
                <Input
                  id="fechaInicioMes"
                  value={data.fechaInicioMes}
                  onChange={(e) => handleChange("fechaInicioMes", e.target.value)}
                  placeholder="01"
                  maxLength={2}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fechaInicioAno" className="text-sm text-muted-foreground">
                  Año
                </Label>
                <Input
                  id="fechaInicioAno"
                  value={data.fechaInicioAno}
                  onChange={(e) => handleChange("fechaInicioAno", e.target.value)}
                  placeholder="2025"
                  maxLength={4}
                  required
                />
              </div>
            </div>
          </div>
          <div>
            <Label className="mb-2 block">Fecha de Fin *</Label>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fechaFinDia" className="text-sm text-muted-foreground">
                  Día
                </Label>
                <Input
                  id="fechaFinDia"
                  value={data.fechaFinDia}
                  onChange={(e) => handleChange("fechaFinDia", e.target.value)}
                  placeholder="01"
                  maxLength={2}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fechaFinMes" className="text-sm text-muted-foreground">
                  Mes
                </Label>
                <Input
                  id="fechaFinMes"
                  value={data.fechaFinMes}
                  onChange={(e) => handleChange("fechaFinMes", e.target.value)}
                  placeholder="03"
                  maxLength={2}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fechaFinAno" className="text-sm text-muted-foreground">
                  Año
                </Label>
                <Input
                  id="fechaFinAno"
                  value={data.fechaFinAno}
                  onChange={(e) => handleChange("fechaFinAno", e.target.value)}
                  placeholder="2025"
                  maxLength={4}
                  required
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Información del Servicio Social</CardTitle>
          <CardDescription>Dependencia y programa</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dependencia">Dependencia *</Label>
            <Input
              id="dependencia"
              value={data.dependencia}
              onChange={(e) => handleChange("dependencia", e.target.value)}
              placeholder="Nombre del Departamento o Dependencia"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="programa">Programa *</Label>
            <Input
              id="programa"
              value={data.programa}
              onChange={(e) => handleChange("programa", e.target.value)}
              placeholder="Nombre del programa"
              required
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resumen de Actividades</CardTitle>
          <CardDescription>Detalle las actividades realizadas durante el periodo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="resumenActividades">Actividades Realizadas *</Label>
            <Textarea
              id="resumenActividades"
              value={data.resumenActividades}
              onChange={(e) => handleChange("resumenActividades", e.target.value)}
              placeholder="Describa detalladamente las actividades que realizó durante el periodo indicado..."
              rows={8}
              required
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Horas de Servicio</CardTitle>
          <CardDescription>Registro de horas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="horasReporte">Total de Horas de Este Reporte *</Label>
              <Input
                id="horasReporte"
                type="number"
                value={data.horasReporte}
                onChange={(e) => handleChange("horasReporte", e.target.value)}
                placeholder="120"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="horasAcumuladas">Total de Horas Acumuladas *</Label>
              <Input
                id="horasAcumuladas"
                type="number"
                value={data.horasAcumuladas}
                onChange={(e) => handleChange("horasAcumuladas", e.target.value)}
                placeholder="240"
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Información del Supervisor</CardTitle>
          <CardDescription>Jefe de Departamento o Dependencia</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombreJefe">Nombre del Jefe *</Label>
            <Input
              id="nombreJefe"
              value={data.nombreJefe}
              onChange={(e) => handleChange("nombreJefe", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="puestoJefe">Puesto *</Label>
            <Input
              id="puestoJefe"
              value={data.puestoJefe}
              onChange={(e) => handleChange("puestoJefe", e.target.value)}
              placeholder="Ej: Jefe de Departamento"
              required
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}