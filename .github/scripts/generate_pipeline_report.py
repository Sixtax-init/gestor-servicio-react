"""
Genera reporte-pipeline.txt con el resumen ejecutivo del pipeline.
Lee los resultados de los pasos anteriores via variables de entorno.
"""
import json
import os
from datetime import datetime, timezone

ref_name         = os.environ.get("REF_NAME", "unknown")
sha              = os.environ.get("COMMIT_SHA", "unknown")
trufflehog       = os.environ.get("TRUFFLEHOG_OUTCOME", "skipped")
audit_failed     = os.environ.get("AUDIT_FAILED", "") == "true"
build_failed     = os.environ.get("BUILD_FAILED", "") == "true"
fecha            = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

lines = []
lines.append("============================================")
lines.append(" REPORTE DE CALIDAD Y SEGURIDAD")
lines.append(f" Rama   : {ref_name}")
lines.append(f" Commit : {sha}")
lines.append(f" Fecha  : {fecha}")
lines.append("============================================")

# ── Secrets ──────────────────────────────────────────────────
lines.append("")
lines.append("[ SECRETS (TruffleHog) ]")
if trufflehog == "failure":
    lines.append("  ESTADO : SECRETS DETECTADOS")
elif trufflehog == "success":
    lines.append("  ESTADO : Sin secrets expuestos")
else:
    lines.append("  ESTADO : Omitido (trigger manual)")

# ── npm audit ─────────────────────────────────────────────────
lines.append("")
lines.append("[ VULNERABILIDADES EN DEPENDENCIAS (npm audit) ]")
if audit_failed:
    try:
        with open("npm-audit-report.json") as f:
            d = json.load(f)
        v = d.get("metadata", {}).get("vulnerabilities", {})
        lines.append("  ESTADO  : VULNERABILIDADES ENCONTRADAS")
        lines.append(f"  Criticas: {v.get('critical', 0)}")
        lines.append(f"  Altas   : {v.get('high', 0)}")
    except Exception:
        lines.append("  ESTADO  : VULNERABILIDADES ENCONTRADAS (no se pudo parsear detalle)")
else:
    lines.append("  ESTADO  : Sin vulnerabilidades altas o criticas")

# ── Lint ──────────────────────────────────────────────────────
lines.append("")
lines.append("[ LINT (ESLint) ]")
lines.append("  Ver detalle completo en: eslint-report-legible.txt")
try:
    with open("eslint-report.json") as f:
        d = json.load(f)
    errors   = sum(item["errorCount"] for item in d)
    warnings = sum(item["warningCount"] for item in d)
    files_with_errors = [item["filePath"] for item in d if item["errorCount"] > 0]
    lines.append(f"  Errores : {errors}")
    lines.append(f"  Avisos  : {warnings}")
    if files_with_errors:
        lines.append("  Archivos con errores:")
        for fp in files_with_errors[:10]:
            lines.append(f"    - {fp}")
        if len(files_with_errors) > 10:
            lines.append(f"    ... y {len(files_with_errors) - 10} mas")
except FileNotFoundError:
    lines.append("  ESTADO  : Reporte no generado")
except Exception as e:
    lines.append(f"  ESTADO  : No se pudo parsear el reporte ({e})")

# ── Build ─────────────────────────────────────────────────────
lines.append("")
lines.append("[ CONSTRUCCION (Build) ]")
if build_failed:
    lines.append("  ESTADO : FALLO")
    try:
        with open("build_error.log") as f:
            tail = f.readlines()[-15:]
        lines.extend(f"  {l.rstrip()}" for l in tail)
    except FileNotFoundError:
        pass
else:
    lines.append("  ESTADO : Exitosa")

# ── CodeQL ────────────────────────────────────────────────────
lines.append("")
lines.append("[ CODEQL ]")
lines.append("  Ver resultados en: Security > Code scanning en GitHub")
lines.append("============================================")

with open("reporte-pipeline.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(lines))

print("reporte-pipeline.txt generado correctamente.")
