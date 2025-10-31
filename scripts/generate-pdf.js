// Simple README -> PDF generator using PDFKit
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

const repoUrl = process.env.REPO_URL || 'https://github.com/your-org/AI-Travel-Planner';
const readmePath = path.resolve('README.md');
const outDir = path.resolve('docs');
const outPdf = path.join(outDir, 'submission.pdf');

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const doc = new PDFDocument({ size: 'A4', margin: 40 });
doc.pipe(fs.createWriteStream(outPdf));

doc.fontSize(20).text('AI-Travel-Planner 提交文件', { align: 'center' });
doc.moveDown();
doc.fontSize(12).text('GitHub 仓库地址：');
doc.fillColor('blue').text(repoUrl, { link: repoUrl, underline: true });
doc.fillColor('black');
doc.moveDown();
doc.fontSize(12).text('README 摘要：');

const readme = fs.readFileSync(readmePath, 'utf-8');
doc.fontSize(10).text(readme, { align: 'left' });

doc.end();
console.log(`生成完成：${outPdf}`);