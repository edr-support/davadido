/**
 * parser.js
 * Handles Gzip extraction, Log Splitting, and Rust Debug Parsing
 */

// --- 1. Gzip & File Extraction ---
async function decompressBlob(blob) {
    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    return pako.ungzip(uint8Array, { to: 'string' });
}

function extractLogsFromArchive(text) {
    const files = {};
    const parts = text.split(/==\s+(.*?)\s+==/);
    for (let i = 1; i < parts.length; i += 2) {
        files[parts[i].trim()] = parts[i + 1].trim();
    }
    return files;
}

// --- 2. Rust Debug String Parser (Crucial for test.txt format) ---
function parseRustFieldsSmart(str) {
    const items = [];
    let current = "";
    let depth = 0;
    let inQuotes = false;
    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        if (char === '"' && str[i-1] !== '\\') inQuotes = !inQuotes;
        if (!inQuotes) {
            if (['{','[','('].includes(char)) depth++;
            if (['}',']',')'].includes(char)) depth--;
            if (char === ',' && depth === 0) {
                items.push(current.trim());
                current = "";
                continue;
            }
        }
        current += char;
    }
    if (current.trim()) items.push(current.trim());
    return items;
}

function renderRustData(val) {
    if (!val) return '<span class="text-slate-500">null</span>';
    val = val.trim();
    
    // Recursive handling for Some/None/Object/Array
    if (val.startsWith("Some(")) return `<span class="text-purple-400 font-bold">Some</span>(${renderRustData(val.slice(5, -1))})`;
    if (val === "None") return '<span class="text-purple-400 font-bold">None</span>';
    
    if (val.startsWith("Object {") || val.startsWith("Array [")) {
        const isObj = val.startsWith("Object");
        const content = isObj ? val.slice(8, -1) : val.slice(7, -1);
        const items = parseRustFieldsSmart(content);
        const id = 'id_' + Math.random().toString(36).substr(2, 9);
        
        return `
            <div class="mt-1">
                <div onclick="document.getElementById('${id}').classList.toggle('hidden')" class="cursor-pointer hover:bg-slate-700 p-1 rounded flex items-center gap-2 bg-slate-800/40">
                    <span class="text-xs font-bold ${isObj ? 'text-blue-400' : 'text-emerald-400'}">${isObj ? 'Object' : 'Array'}</span>
                    <span class="text-[10px] text-slate-500">(${items.length} items)</span>
                </div>
                <div id="${id}" class="pl-4 border-l border-slate-700 ml-2 space-y-1">
                    ${items.map(item => {
                        if (isObj) {
                            const splitIdx = item.indexOf(':');
                            const k = item.slice(0, splitIdx);
                            const v = item.slice(splitIdx + 1);
                            return `<div class="flex gap-2"><span class="text-slate-400 text-[10px]">${k}:</span>${renderRustData(v)}</div>`;
                        }
                        return `<div>${renderRustData(item)}</div>`;
                    }).join('')}
                </div>
            </div>`;
    }
    
    // Primitives
    if (val.startsWith('String("')) return `<span class="text-amber-200">"${val.slice(8, -2)}"</span>`;
    if (val.startsWith('Bool(')) return `<span class="text-orange-400">${val.slice(5, -1)}</span>`;
    return `<span class="text-slate-300">${val}</span>`;
}