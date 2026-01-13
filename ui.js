/**
 * ui.js
 * Handles rendering tables, tab switching, and modal management
 */

let currentLogs = [];
let currentPage = 1;
let pageSize = 50;

function switchTab(tabId) {
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active', 'border-blue-500'));
    
    document.getElementById(tabId).classList.remove('hidden');
    event.currentTarget.classList.add('active', 'border-blue-500');
}

function renderAgentTable() {
    const container = document.getElementById('agent-table-body');
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const pageData = currentLogs.slice(start, end);

    container.innerHTML = pageData.map((log, idx) => `
        <tr class="border-b hover:bg-slate-50 cursor-pointer" onclick="openDetail(${start + idx})">
            <td class="p-2 text-xs font-mono">${log.ts}</td>
            <td class="p-2"><span class="px-2 py-1 rounded text-[10px] font-bold ${getLevelClass(log.lvl)}">${log.lvl}</span></td>
            <td class="p-2 text-xs text-gray-600">${log.module}</td>
            <td class="p-2 text-xs truncate max-w-xs">${log.msg}</td>
        </tr>
    `).join('');
    
    renderPagination();
}

function openDetail(index) {
    const log = currentLogs[index];
    const content = document.getElementById('jsonModalContent');
    content.innerHTML = renderRustData(log.payload || log.msg);
    document.getElementById('jsonModal').classList.remove('hidden');
}

function getLevelClass(lvl) {
    if (lvl.includes('ERR')) return 'bg-red-100 text-red-700';
    if (lvl.includes('WRN')) return 'bg-amber-100 text-amber-700';
    return 'bg-blue-100 text-blue-700';
}