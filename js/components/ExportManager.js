/**
 * ExportManager.js - JSON and PDF Export
 */

import stateManager from '../core/StateManager.js';
import storageManager from '../utils/storage.js';
import Config from '../config.js';
import { formatDate } from '../utils/helpers.js';

class ExportManager {

    exportJSON() {
        const result = storageManager.exportToFile(stateManager.simulation);
        if (!result.success) {
            alert('Export failed: ' + result.error);
        }
    }

    async exportPDF() {
        if (typeof jspdf === 'undefined' && typeof jsPDF === 'undefined' && typeof window.jspdf === 'undefined') {
            alert('PDF export library not loaded');
            return;
        }

        const { jsPDF } = window.jspdf || window;
        if (!jsPDF) { alert('jsPDF not available'); return; }

        const sim = stateManager.simulation;
        const pdf = new jsPDF(Config.export.pdfOrientation, Config.export.pdfUnit, Config.export.pdfFormat);
        const W = pdf.internal.pageSize.getWidth();
        const H = pdf.internal.pageSize.getHeight();

        // ── Page 1: Cover ────────────────────────────────
        pdf.setFillColor(33, 150, 243);
        pdf.rect(0, 0, W, 40, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(22);
        pdf.text('AML Nesting Flow Simulator', W / 2, 20, { align: 'center' });
        pdf.setFontSize(14);
        pdf.text('Simulation Report', W / 2, 32, { align: 'center' });

        pdf.setTextColor(33, 33, 33);
        pdf.setFontSize(16);
        pdf.text(sim.name, W / 2, 60, { align: 'center' });

        if (sim.description) {
            pdf.setFontSize(10);
            pdf.setTextColor(117, 117, 117);
            const lines = pdf.splitTextToSize(sim.description, W - 40);
            pdf.text(lines, W / 2, 70, { align: 'center' });
        }

        const stats = sim.getStatistics();
        pdf.setFontSize(11);
        pdf.setTextColor(33, 33, 33);
        let y = 90;
        const kv = [
            ['Generated',        formatDate(Date.now())],
            ['Entities',         String(stats.entityCount)],
            ['Transactions',     String(stats.transactionCount)],
            ['Overall Risk',     String(sim.metadata.overallRiskScore) + '/100'],
            ['Patterns Detected',String(sim.metadata.detectedPatterns?.length || 0)],
            ['Total Flow',       '$' + stats.totalAmount.toLocaleString()]
        ];
        kv.forEach(([k, v]) => {
            pdf.setFont(undefined, 'bold');
            pdf.text(k + ':', 30, y);
            pdf.setFont(undefined, 'normal');
            pdf.text(v, 100, y);
            y += 9;
        });

        // ── Page 2: Flow Diagram (screenshot) ────────────
        pdf.addPage();
        pdf.setFontSize(16);
        pdf.text('Flow Diagram', 15, 20);

        try {
            const canvasEl = document.getElementById('flow-canvas');
            const screenshot = await html2canvas(canvasEl, {
                backgroundColor: '#fafafa',
                scale: 1.5,
                useCORS: true
            });
            const imgData = screenshot.toDataURL('image/png');
            const imgW = W - 20;
            const imgH = screenshot.height * imgW / screenshot.width;
            pdf.addImage(imgData, 'PNG', 10, 30, imgW, Math.min(imgH, H - 40));
        } catch (err) {
            pdf.setFontSize(10);
            pdf.setTextColor(200, 0, 0);
            pdf.text('Could not capture diagram: ' + err.message, 15, 40);
            pdf.setTextColor(33, 33, 33);
        }

        // ── Page 3: Entity List ───────────────────────────
        pdf.addPage();
        pdf.setFontSize(16);
        pdf.text('Entity Details', 15, 20);
        y = 32;
        pdf.setFontSize(9);

        stateManager.getAllEntities().forEach(entity => {
            if (y > H - 20) { pdf.addPage(); y = 20; }
            pdf.setFont(undefined, 'bold');
            pdf.text(entity.name, 15, y);
            pdf.setFont(undefined, 'normal');
            pdf.text(`${entity.type.replace(/_/g,' ')} | ${entity.jurisdiction} | Risk: ${entity.riskScore || 'N/A'} | Stage: ${entity.amlStage || '-'}`, 70, y);
            y += 7;
        });

        // ── Page 4: Detected Patterns ─────────────────────
        const patterns = sim.metadata.detectedPatterns || [];
        if (patterns.length > 0) {
            pdf.addPage();
            pdf.setFontSize(16);
            pdf.text('Detected Patterns', 15, 20);
            y = 32;

            patterns.forEach((p, i) => {
                if (y > H - 24) { pdf.addPage(); y = 20; }
                pdf.setFont(undefined, 'bold');
                pdf.setFontSize(11);
                pdf.text(`${i + 1}. ${p.type.replace(/_/g,' ').toUpperCase()} [${p.severity.toUpperCase()}]`, 15, y);
                y += 6;
                pdf.setFont(undefined, 'normal');
                pdf.setFontSize(9);
                const descLines = pdf.splitTextToSize(p.description, W - 30);
                pdf.text(descLines, 20, y);
                y += descLines.length * 5 + 4;
            });
        }

        pdf.save(`${sim.name.replace(/\s+/g, '_')}_report.pdf`);
    }

    async importJSON(file) {
        const result = await storageManager.importFromFile(file);
        if (result.success) {
            storageManager.saveSimulation(result.simulation);
            return result.simulation;
        } else {
            alert('Import failed: ' + result.error);
            return null;
        }
    }
}

export default ExportManager;
