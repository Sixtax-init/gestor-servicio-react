# Configuración del Sistema de Archivos

## Estructura de Directorios

El sistema guarda los archivos subidos en la siguiente estructura:

\`\`\`
/uploads
  /entregas
    /{entrega_id}
      /{timestamp}-{nombre_archivo}
\`\`\`

## Configuración en Servidor Linux

### 1. Crear Directorio de Uploads

\`\`\`bash
# Crear directorio
mkdir -p uploads/entregas

# Dar permisos de escritura
chmod 755 uploads
chmod 755 uploads/entregas
\`\`\`

### 2. Configurar Permisos

\`\`\`bash
# Cambiar propietario al usuario de Node.js
sudo chown -R $USER:$USER uploads

# Permisos recursivos
find uploads -type d -exec chmod 755 {} \;
find uploads -type f -exec chmod 644 {} \;
\`\`\`

### 3. Configurar Next.js para Servir Archivos

El sistema ya está configurado para servir archivos estáticos desde `/uploads`.

### 4. Límites de Tamaño

Por defecto, Next.js limita el tamaño de archivos a 4MB. Para aumentar este límite:

\`\`\`javascript
// next.config.mjs
export default {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}
\`\`\`

## Tipos de Archivos Permitidos

Por defecto, el sistema acepta:
- Documentos: PDF, DOC, DOCX
- Imágenes: JPG, JPEG, PNG
- Máximo 10MB por archivo
- Máximo 5 archivos por entrega

## Respaldos

\`\`\`bash
# Respaldar archivos subidos
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz uploads/

# Restaurar respaldo
tar -xzf uploads_backup_20250119.tar.gz
\`\`\`

## Limpieza de Archivos Huérfanos

\`\`\`bash
# Script para limpiar archivos de entregas eliminadas
# Ejecutar periódicamente

#!/bin/bash
cd uploads/entregas
for dir in */; do
  entrega_id="${dir%/}"
  # Verificar si la entrega existe en la base de datos
  exists=$(psql -U gestor_user -d gestor_horas -tAc "SELECT COUNT(*) FROM entregas WHERE id=$entrega_id")
  if [ "$exists" -eq 0 ]; then
    echo "Eliminando archivos de entrega $entrega_id"
    rm -rf "$dir"
  fi
done
\`\`\`

## Seguridad

1. **Validación de tipos**: El sistema valida extensiones de archivo
2. **Límite de tamaño**: Máximo 10MB por archivo
3. **Aislamiento**: Cada entrega tiene su propio directorio
4. **Permisos**: Solo el alumno propietario puede subir archivos a su entrega

## Monitoreo de Espacio

\`\`\`bash
# Ver espacio usado por uploads
du -sh uploads/

# Ver espacio por entrega
du -sh uploads/entregas/*/ | sort -h
\`\`\`
