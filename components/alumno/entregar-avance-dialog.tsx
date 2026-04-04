"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { FileUpload } from "@/components/ui/file-upload"
import { Badge } from "@/components/ui/badge"
import { apiFetch } from "@/lib/api-client"
import { toast } from "sonner"
import { FileText, Calendar, Loader2 } from "lucide-react"
import { DeleteConfirmDialog } from "../admin/delete-confirm-dialog"

interface EntregarAvanceDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    tareaId: number
}

interface Avance {
    id: number
    comentario: string
    comentario_revision: string | null
    archivo_url: string | null
    estado: string
    es_final: boolean
    fecha_entrega: string
    estado_entrega_principal?: string | null
}

function AvanceCard({ avance: a, numero, onMarcarFinal }: { avance: Avance; numero: number; onMarcarFinal: (id: number) => void }) {
    return (
        <div className={`group p-5 border rounded-2xl transition-all duration-300 hover:shadow-lg ${a.es_final ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/20' : 'bg-card/50 border-muted-foreground/10 hover:border-primary/30 hover:bg-muted/30'}`}>
            <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary/70">
                        Avance #{numero}
                    </span>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
                        <Calendar className="h-3 w-3" />
                        {new Date(a.fecha_entrega).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </div>
                </div>
                <Badge
                    variant={a.es_final ? "default" : "secondary"}
                    className={`text-[10px] font-bold h-6 px-3 rounded-full ${a.estado === 'aprobada' ? 'bg-green-500/10 text-green-600 border-green-500/20' : ''}`}
                >
                    {a.es_final ? "ENTREGA FINAL" : a.estado.toUpperCase()}
                </Badge>
            </div>

            <div className="space-y-4">
                <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-tighter">Mi entrega:</p>
                    <p className="text-sm leading-relaxed text-foreground/90 bg-muted/30 p-3 rounded-xl border border-muted-foreground/5 italic">
                        {a.comentario || "(Sin comentario)"}
                    </p>
                </div>

                {a.comentario_revision && (
                    <div className="space-y-2 animate-in slide-in-from-top-1 duration-300">
                        <div className="flex items-center gap-2">
                            <div className="h-px flex-1 bg-primary/20" />
                            <span className="text-[10px] font-bold text-primary uppercase tracking-widest px-2">Retroalimentación</span>
                            <div className="h-px flex-1 bg-primary/20" />
                        </div>
                        <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl shadow-inner group-hover:bg-primary/[0.15] transition-colors">
                            <p className="text-sm font-medium text-primary dark:text-blue-300 leading-relaxed">
                                {a.comentario_revision}
                            </p>
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between pt-2">
                    {a.archivo_url ? (
                        <Button variant="link" size="sm" asChild className="h-5 p-0 text-[11px] font-bold text-muted-foreground hover:text-primary transition-colors">
                            <a href={a.archivo_url} target="_blank" rel="noopener noreferrer">
                                📄 Ver archivo adjunto
                            </a>
                        </Button>
                    ) : <div />}

                    {!a.es_final && (!a.estado_entrega_principal || a.estado_entrega_principal !== 'aprobada') && (
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-[11px] border-primary/30 text-primary hover:bg-primary hover:text-white font-bold px-3 rounded-xl transition-all shadow-sm"
                            onClick={() => onMarcarFinal(a.id)}
                        >
                            Marcar como Final
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}

export function EntregarAvanceDialog({ open, onOpenChange, tareaId }: EntregarAvanceDialogProps) {
    const [comentario, setComentario] = useState("")
    const [archivo, setArchivo] = useState<File | null>(null)
    const [subiendo, setSubiendo] = useState(false)
    const [avances, setAvances] = useState<Avance[]>([])
    const [errorMsg, setErrorMsg] = useState<string | null>(null)
    const [showConfirmFinal, setShowConfirmFinal] = useState<{ id: number; open: boolean }>({ id: 0, open: false })


    const fetchAvances = async () => {
        const res = await apiFetch(`/api/alumno/entregas/avances?tarea_id=${tareaId}`)
        if (res.ok) {
            const data = await res.json()
            setAvances(data)

            // ✅ Bloquear si hay avance final O si el último avance aún es 'pendiente'
            const tieneFinalBloqueante = data.some((a: Avance) => a.es_final && a.estado_entrega_principal !== 'rechazada')
            const tienePendiente = data.some((a: Avance) => a.estado === 'pendiente')

            if (tieneFinalBloqueante || tienePendiente) {
                setSubiendo(true) // bloquea el botón de envío
            } else {
                setSubiendo(false)
            }
        }
    }

    useEffect(() => {
        if (open) fetchAvances()
    }, [open])

    const handleFileSelect = (files: File[]) => {
        if (files.length > 0) setArchivo(files[0])
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setErrorMsg(null)
        setSubiendo(true)

        try {
            // 1️⃣ Subir archivo
            let rutaArchivo: string | null = null
            if (archivo) {
                const formData = new FormData()
                formData.append("file", archivo)
                formData.append("type", "avances")

                const upload = await apiFetch("/api/upload", { method: "POST", body: formData })
                const result = await upload.json()
                rutaArchivo = result.ruta
            }

            // 2️⃣ Registrar avance
            const res = await apiFetch("/api/alumno/entregas/avances", {
                method: "POST",
                body: JSON.stringify({
                    tarea_id: tareaId,
                    comentario,
                    archivo_url: rutaArchivo,
                }),
            })

            const data = await res.json().catch(() => ({}))

            if (!res.ok) throw new Error(data.error || "Error al registrar avance")

            setComentario("")
            setArchivo(null)
            await fetchAvances()
        } catch (error) {
            setErrorMsg(error instanceof Error ? error.message : "Error al subir avance")
        } finally {
            setSubiendo(false)
        }
    }

    const marcarComoFinal = async (avanceId: number) => {
        const res = await apiFetch("/api/alumno/entregas/avances", {
            method: "PATCH",
            body: JSON.stringify({ avance_id: avanceId }),
        })
        if (res.ok) {
            await fetchAvances()
            toast.success("Avance marcado como entrega final")
        }
        setShowConfirmFinal({ id: 0, open: false })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[1000px] p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2 border-b">
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <FileText className="h-6 w-6 text-primary" />
                        Avances de la Tarea
                    </DialogTitle>
                </DialogHeader>

                {/* ── Mobile: Tabs ── Desktop: 2 columnas ─────────────────── */}

                {/* MOBILE */}
                <div className="lg:hidden flex flex-col max-h-[85vh]">
                    <Tabs defaultValue="nuevo" className="flex flex-col flex-1 overflow-hidden">
                        <TabsList className="mx-4 mt-2 mb-0 grid grid-cols-2 rounded-xl">
                            <TabsTrigger value="nuevo" className="rounded-lg text-sm font-bold">
                                Nuevo avance
                            </TabsTrigger>
                            <TabsTrigger value="historial" className="rounded-lg text-sm font-bold">
                                Historial
                                {avances.length > 0 && (
                                    <Badge className="ml-2 h-5 px-1.5 text-[10px] font-bold rounded-full bg-primary/20 text-primary border-primary/20">
                                        {avances.length}
                                    </Badge>
                                )}
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="nuevo" className="flex-1 overflow-y-auto p-4 mt-0">
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-3">
                                    <Label htmlFor="comentario-mobile" className="text-sm font-semibold text-muted-foreground/80 uppercase tracking-wider px-1">
                                        Comentario del Avance
                                    </Label>
                                    <Textarea
                                        id="comentario-mobile"
                                        value={comentario}
                                        onChange={(e) => setComentario(e.target.value)}
                                        placeholder="Describe qué has realizado en este avance..."
                                        className="min-h-[120px] resize-none focus-visible:ring-primary rounded-2xl bg-muted/20 border-muted-foreground/10"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-sm font-semibold text-muted-foreground/80 uppercase tracking-wider px-1">
                                        Archivo Adjunto
                                    </Label>
                                    <div className="rounded-2xl overflow-hidden border-2 border-dashed border-muted-foreground/10 hover:border-primary/50 transition-all hover:bg-primary/[0.02]">
                                        <FileUpload onFilesSelected={handleFileSelect} maxFiles={1} />
                                    </div>
                                </div>

                                {errorMsg && (
                                    <div className="p-4 rounded-2xl bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20">
                                        {errorMsg}
                                    </div>
                                )}

                                <div className="pt-2">
                                    {avances.some((a) => a.es_final && a.estado_entrega_principal !== 'rechazada') ? (
                                        <div className="p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 text-sm italic">
                                            <div className="flex gap-3">
                                                <span className="text-xl">⚠️</span>
                                                <span className="leading-relaxed">
                                                    {avances.some((a) => a.es_final && a.comentario === 'Entrega directa')
                                                        ? 'Ya has enviado una entrega final directa. No puedes subir más avances.'
                                                        : 'Ya has marcado un avance como final. No puedes subir más avances.'}
                                                </span>
                                            </div>
                                        </div>
                                    ) : avances.some((a) => a.estado === 'pendiente') ? (
                                        <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 text-primary text-sm italic">
                                            <div className="flex gap-3">
                                                <span className="text-xl">ℹ️</span>
                                                <span className="leading-relaxed">Tienes un avance pendiente de revisión. Podrás enviar el siguiente una vez que el maestro lo califique.</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <Button
                                            type="submit"
                                            disabled={subiendo || !comentario.trim()}
                                            className="w-full h-12 text-base font-bold shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-[0.98] rounded-2xl"
                                        >
                                            {subiendo ? (
                                                <>
                                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                    Procesando...
                                                </>
                                            ) : "Registrar nuevo avance"}
                                        </Button>
                                    )}
                                </div>
                            </form>
                        </TabsContent>

                        <TabsContent value="historial" className="flex-1 overflow-y-auto p-4 mt-0 space-y-3">
                            {avances.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-muted/20 rounded-2xl border border-dashed">
                                    <FileText className="h-12 w-12 mb-2 opacity-20" />
                                    <p className="text-sm">No hay avances registrados.</p>
                                </div>
                            ) : (
                                avances.map((a, idx) => (
                                    <AvanceCard
                                        key={a.id}
                                        avance={a}
                                        numero={avances.length - idx}
                                        onMarcarFinal={(id) => setShowConfirmFinal({ id, open: true })}
                                    />
                                ))
                            )}
                        </TabsContent>
                    </Tabs>
                </div>

                {/* DESKTOP */}
                <div className="hidden lg:grid grid-cols-2 gap-0 max-h-[85vh]">
                    {/* Columna Izquierda: Formulario */}
                    <div className="p-8 flex flex-col border-r border-muted-foreground/10 overflow-y-auto custom-scrollbar" style={{ maxHeight: '85vh' }}>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-3">
                                <Label htmlFor="comentario" className="text-sm font-semibold text-muted-foreground/80 uppercase tracking-wider px-1">
                                    Comentario del Avance
                                </Label>
                                <Textarea
                                    id="comentario"
                                    value={comentario}
                                    onChange={(e) => setComentario(e.target.value)}
                                    placeholder="Describe qué has realizado en este avance..."
                                    className="min-h-[140px] resize-none focus-visible:ring-primary rounded-2xl bg-muted/20 border-muted-foreground/10"
                                />
                            </div>

                            <div className="space-y-3">
                                <Label className="text-sm font-semibold text-muted-foreground/80 uppercase tracking-wider px-1">
                                    Archivo Adjunto
                                </Label>
                                <div className="rounded-2xl overflow-hidden border-2 border-dashed border-muted-foreground/10 hover:border-primary/50 transition-all hover:bg-primary/[0.02]">
                                    <FileUpload onFilesSelected={handleFileSelect} maxFiles={1} />
                                </div>
                            </div>

                            {errorMsg && (
                                <div className="p-4 rounded-2xl bg-destructive/10 text-destructive text-sm font-medium animate-in fade-in zoom-in duration-300 border border-destructive/20">
                                    {errorMsg}
                                </div>
                            )}

                            <div className="pt-4 mt-auto">
                                {avances.some((a) => a.es_final && a.estado_entrega_principal !== 'rechazada') ? (
                                    <div className="p-5 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 text-sm italic shadow-inner">
                                        <div className="flex gap-3">
                                            <span className="text-xl">⚠️</span>
                                            <span className="leading-relaxed">
                                                {avances.some((a) => a.es_final && a.comentario === 'Entrega directa')
                                                    ? 'Ya has enviado una entrega final directa. No puedes subir más avances.'
                                                    : 'Ya has marcado un avance como final. No puedes subir más avances.'}
                                            </span>
                                        </div>
                                    </div>
                                ) : avances.some((a) => a.estado === 'pendiente') ? (
                                    <div className="p-5 rounded-2xl bg-primary/10 border border-primary/20 text-primary text-sm italic shadow-inner">
                                        <div className="flex gap-3">
                                            <span className="text-xl">ℹ️</span>
                                            <span className="leading-relaxed">Tienes un avance pendiente de revisión. Podrás enviar el siguiente una vez que el maestro lo califique.</span>
                                        </div>
                                    </div>
                                ) : (
                                    <Button
                                        type="submit"
                                        disabled={subiendo || !comentario.trim()}
                                        className="w-full h-12 text-base font-bold shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-[0.98] rounded-2xl"
                                    >
                                        {subiendo ? (
                                            <>
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                Procesando...
                                            </>
                                        ) : "Registrar nuevo avance"}
                                    </Button>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* Columna Derecha: Historial */}
                    <div className="p-8 flex flex-col h-full bg-muted/5">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-black text-xl flex items-center gap-2 tracking-tight">
                                <FileText className="h-6 w-6 text-primary" />
                                Historial
                            </h3>
                            <Badge variant="secondary" className="px-3 py-0.5 rounded-full font-bold bg-primary/10 text-primary border-primary/20">
                                {avances.length} envíos
                            </Badge>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar" style={{ maxHeight: 'calc(85vh - 120px)' }}>
                            {avances.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-muted/20 rounded-2xl border border-dashed">
                                    <FileText className="h-12 w-12 mb-2 opacity-20" />
                                    <p className="text-sm">No hay avances registrados.</p>
                                </div>
                            ) : (
                                avances.map((a, idx) => (
                                    <AvanceCard
                                        key={a.id}
                                        avance={a}
                                        numero={avances.length - idx}
                                        onMarcarFinal={(id) => setShowConfirmFinal({ id, open: true })}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>

            <DeleteConfirmDialog
                open={showConfirmFinal.open}
                onOpenChange={(open) => setShowConfirmFinal(prev => ({ ...prev, open }))}
                onConfirm={() => marcarComoFinal(showConfirmFinal.id)}
                title="Marcar como Entrega Final"
                description="¿Deseas marcar este avance como tu entrega final? Una vez marcado, ya no podrás subir más avances para esta tarea."
            />
        </Dialog>
    )
}
