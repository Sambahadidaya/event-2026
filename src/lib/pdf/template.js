/**
 * Shared styling and header HTML templates for Puppeteer PDF rendering
 */

export const PDF_STYLES = `
    @page {
        size: A4 portrait;
        margin: 15mm 15mm 20mm 15mm;
    }
    body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        color: #1e293b;
        background-color: #ffffff;
        font-size: 11px;
        line-height: 1.4;
        margin: 0;
        padding: 0;
    }
    .header-container {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        border-bottom: 2px solid #0284c7;
        padding-bottom: 12px;
        margin-bottom: 20px;
    }
    .brand-title {
        font-size: 20px;
        font-weight: 800;
        color: #0f172a;
        margin: 0;
        letter-spacing: -0.5px;
    }
    .brand-subtitle {
        font-size: 13px;
        font-weight: 700;
        color: #0284c7;
        text-transform: uppercase;
        margin: 2px 0 0 0;
    }
    .doc-info {
        font-size: 10px;
        color: #64748b;
        margin-top: 4px;
    }
    .qr-container {
        text-align: right;
    }
    .qr-img {
        width: 75px;
        height: 75px;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        padding: 2px;
        background: #ffffff;
    }
    .qr-caption {
        font-size: 8px;
        color: #94a3b8;
        margin-top: 2px;
        font-family: monospace;
    }
    .report-title {
        font-size: 15px;
        font-weight: 700;
        color: #0f172a;
        margin-bottom: 4px;
    }
    .meta-bar {
        background-color: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 8px 12px;
        margin-bottom: 16px;
        display: flex;
        justify-content: space-between;
        font-size: 10px;
    }
    .table-pdf {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
    }
    .table-pdf th {
        background-color: #f1f5f9;
        color: #334155;
        font-weight: 700;
        text-align: left;
        padding: 8px 10px;
        border-bottom: 2px solid #cbd5e1;
        font-size: 10px;
        text-transform: uppercase;
    }
    .table-pdf td {
        padding: 7px 10px;
        border-bottom: 1px solid #e2e8f0;
        font-size: 10px;
    }
    .table-pdf tr:nth-child(even) {
        background-color: #f8fafc;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .font-mono { font-family: monospace; }
    .font-bold { font-weight: 700; }
    .badge {
        display: inline-block;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 9px;
        font-weight: 700;
        text-transform: uppercase;
    }
    .badge-income { background-color: #dcfce7; color: #166534; }
    .badge-expense { background-color: #ffe4e6; color: #9f1239; }
    .footer-stamp {
        margin-top: 30px;
        display: flex;
        justify-content: space-between;
        page-break-inside: avoid;
    }
    .stamp-box {
        width: 180px;
        text-align: center;
    }
    .stamp-space {
        height: 50px;
    }
`;
