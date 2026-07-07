function parseCSV(text) {
  const lines = text.trim().split(String.fromCharCode(10));
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = parseCSVLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('#')) continue;
    const values = parseCSVLine(line);
    if (values.length === headers.length) {
      const row = {};
      headers.forEach((h, idx) => { row[h.trim()] = values[idx] ? values[idx].trim() : ''; });
      rows.push(row);
    }
  }
  return { headers, rows };
}
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (char === ',' && !inQuotes) { result.push(current); current = ''; }
    else { current += char; }
  }
  result.push(current);
  return result;
}
function rowsToCSV(headers, rows) {
  let csv = headers.join(',') + String.fromCharCode(10);
  rows.forEach(row => {
    const values = headers.map(h => {
      let val = row[h] || '';
      if (val.includes(',') || val.includes('"') || val.includes(String.fromCharCode(10))) { val = '"' + val.replace(/"/g, '""') + '"'; }
      return val;
    });
    csv += values.join(',') + String.fromCharCode(10);
  });
  return csv;
}
function detectPuzzleType(headers) {
  if (headers.includes('row') && headers.includes('col')) return 'manual';
  return 'auto';
}
