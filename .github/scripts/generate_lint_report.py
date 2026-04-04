import json
import sys

try:
    with open('eslint-report.json', encoding='utf-8') as f:
        data = json.load(f)
except FileNotFoundError:
    print("eslint-report.json no encontrado, omitiendo.")
    sys.exit(0)

total_errors   = sum(item['errorCount'] for item in data)
total_warnings = sum(item['warningCount'] for item in data)
files_with_issues = [item for item in data if item['errorCount'] > 0 or item['warningCount'] > 0]
files_clean = len(data) - len(files_with_issues)

# Ordena: primero los que tienen errores, luego solo warnings
files_with_issues.sort(key=lambda x: (-x['errorCount'], -x['warningCount']))

out = []
out.append('=' * 64)
out.append('  REPORTE LINT - ESLint')
out.append('=' * 64)
out.append('')
out.append('RESUMEN')
out.append(f'  Errores              : {total_errors}')
out.append(f'  Avisos               : {total_warnings}')
out.append(f'  Archivos analizados  : {len(data)}')
out.append(f'  Archivos con errores : {len(files_with_issues)}')
out.append(f'  Archivos limpios     : {files_clean}')
out.append('')

if files_with_issues:
    out.append('-' * 64)
    out.append('  DETALLE POR ARCHIVO')
    out.append('-' * 64)
    for item in files_with_issues:
        path = item['filePath']
        # Acortar ruta del runner
        for prefix in ['/home/runner/work/', '/github/workspace/']:
            if path.startswith(prefix):
                path = path[len(prefix):]
                break
        errors_in_file   = item['errorCount']
        warnings_in_file = item['warningCount']
        tag = '[ERROR]' if errors_in_file > 0 else '[WARN] '
        out.append('')
        out.append(f'{tag} {path}  ({errors_in_file} err, {warnings_in_file} warn)')
        out.append('─' * 60)
        for m in item['messages']:
            severity = 'error  ' if m['severity'] == 2 else 'warning'
            line_no  = str(m.get('line', '?')).rjust(4)
            col_no   = str(m.get('column', '?')).ljust(3)
            rule     = m.get('ruleId') or 'unknown'
            msg      = m.get('message', '')
            out.append(f'  Linea {line_no}:{col_no}  {severity}  ({rule})')
            out.append(f'    {msg}')
else:
    out.append('✓ Sin archivos con errores o avisos.')

out.append('')
out.append('=' * 64)

with open('eslint-report-legible.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(out))

print(f"Reporte generado: {len(files_with_issues)} archivos con problemas de {len(data)} analizados.")
