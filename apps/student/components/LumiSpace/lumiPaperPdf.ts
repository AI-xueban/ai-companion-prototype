export interface PaperPdfQuestion {
    id: number;
    type: string;
    stem: string;
    score: number;
    answer: string;
    explanation: string;
}

export interface PaperPdfDocument {
    title: string;
    scope: string;
    duration: string;
    difficulty: string;
    version: number;
    questions: PaperPdfQuestion[];
    assumedTextbook?: string;
    withAnswers?: boolean;
}

const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);

const englishPrompts: Array<[string, string]> = [
    ['选择正确单词：I ___ to school every day. A. go  B. goes  C. going', 'A. go'],
    ['选择正确单词：She ___ English on Mondays. A. study  B. studies  C. studying', 'B. studies'],
    ['选择正确单词：There ___ three books on the desk. A. is  B. are  C. am', 'B. are'],
    ['选择正确单词：My father ___ a teacher. A. am  B. are  C. is', 'C. is'],
    ['选择正确单词：We can ___ football after school. A. play  B. plays  C. playing', 'A. play'],
    ['选择正确单词：___ is your birthday? A. When  B. Where  C. Who', 'A. When'],
    ['选择正确单词：I have ___ apple. A. a  B. an  C. the', 'B. an'],
    ['选择正确单词：They ___ in the library now. A. read  B. reads  C. are reading', 'C. are reading'],
    ['选择正确单词：What ___ you do on Sundays? A. do  B. does  C. are', 'A. do'],
    ['选择正确单词：This is ___ new classroom. A. we  B. our  C. us', 'B. our'],
    ['选择正确单词：I like apples, ___ I do not like pears. A. but  B. so  C. because', 'A. but'],
    ['选择正确单词：How many ___ do you have? A. pencil  B. pencils  C. penciles', 'B. pencils'],
    ['选择正确单词：The cat is ___ the table. A. under  B. happy  C. tall', 'A. under'],
    ['选择正确单词：He ___ breakfast at seven yesterday. A. has  B. had  C. have', 'B. had'],
    ['选择正确单词：Please ___ the window. A. open  B. opens  C. opening', 'A. open'],
    ['选择正确单词：My sister is ___ than me. A. tall  B. taller  C. tallest', 'B. taller'],
    ['选择正确单词：Can you ___ a bike? A. ride  B. rides  C. riding', 'A. ride'],
    ['选择正确单词：The children are ___ pictures. A. draw  B. draws  C. drawing', 'C. drawing'],
    ['选择正确单词：___ bag is this? A. Whose  B. Who  C. What', 'A. Whose'],
    ['选择正确单词：It is time ___ lunch. A. for  B. to  C. in', 'A. for'],
];

const englishAlternates: Array<[string, string]> = [
    ['选择正确单词：We ___ music on Fridays. A. have  B. has  C. having', 'A. have'],
    ['选择正确单词：Tom ___ a blue bag. A. have  B. has  C. having', 'B. has'],
    ['选择正确单词：There ___ a bird in the tree. A. is  B. are  C. am', 'A. is'],
    ['选择正确单词：I am good ___ swimming. A. at  B. in  C. on', 'A. at'],
    ['选择正确单词：Do you like ___ books? A. read  B. reads  C. reading', 'C. reading'],
    ['选择正确单词：The dog is ___ the door. A. behind  B. kind  C. fast', 'A. behind'],
    ['选择正确单词：She is going ___ a song. A. sing  B. to sing  C. sings', 'B. to sing'],
    ['选择正确单词：These ___ my friends. A. is  B. am  C. are', 'C. are'],
    ['选择正确单词：What time ___ the class begin? A. do  B. does  C. are', 'B. does'],
    ['选择正确单词：They went to the park ___. A. yesterday  B. tomorrow  C. now', 'A. yesterday'],
];

const chinesePrompts: Array<[string, string]> = [
    ['写出“安静”的一个近义词。', '宁静'],
    ['写出“温暖”的一个反义词。', '寒冷'],
    ['用“因为……所以……”写一个完整的句子。', '示例：因为今天下雨，所以我们在教室里活动。'],
    ['写出“认真”的一个近义词。', '仔细'],
    ['写出“勇敢”的一个反义词。', '胆怯'],
    ['将“同学们打扫教室”扩写成更具体的一句话。', '示例：放学后，同学们认真地打扫明亮的教室。'],
    ['给“清澈”写一个合适的搭配词。', '清澈的河水'],
    ['写出“宽阔”的一个反义词。', '狭窄'],
    ['用“虽然……但是……”写一个完整的句子。', '示例：虽然路很远，但是我们坚持走到了终点。'],
    ['写出“节约”的一个反义词。', '浪费'],
    ['把“我们应该保护环境”改写成反问句。', '难道我们不应该保护环境吗？'],
    ['用一句话解释“坚持不懈”的意思。', '一直坚持下去，不轻易放弃。'],
    ['写出“仔细”的一个反义词。', '粗心'],
    ['给“观察”写一个合适的宾语。', '观察植物'],
    ['把“太阳升起来了”扩写成更具体的一句话。', '示例：清晨，红彤彤的太阳从东方慢慢升起来了。'],
    ['写出“谦虚”的一个反义词。', '骄傲'],
    ['用“如果……就……”写一个完整的句子。', '示例：如果明天天气晴朗，我们就去公园。'],
    ['写出“热闹”的一个反义词。', '冷清'],
    ['将“他完成了作业”改写成“把”字句。', '他把作业完成了。'],
    ['用一句话说明“团结合作”的好处。', '示例：团结合作能让大家更有效地完成任务。'],
];

const chineseAlternates: Array<[string, string]> = [
    ['写出“明亮”的一个反义词。', '昏暗'],
    ['写出“珍惜”的一个近义词。', '爱惜'],
    ['用“即使……也……”写一个完整的句子。', '示例：即使遇到困难，我们也要认真完成任务。'],
    ['将“风吹动树叶”扩写成更具体的一句话。', '示例：傍晚，轻柔的风吹动了金黄的树叶。'],
    ['写出“坚强”的一个反义词。', '软弱'],
    ['把“我们热爱家乡”改写成反问句。', '难道我们不热爱家乡吗？'],
    ['写出“整齐”的一个反义词。', '凌乱'],
    ['用一句话解释“专心致志”的意思。', '一心一意地做一件事。'],
    ['把“老师表扬了小明”改写成“被”字句。', '小明被老师表扬了。'],
    ['给“欣赏”写一个合适的宾语。', '欣赏风景'],
];

export const makePaperQuestion = (scope: string, id: number, score: number, difficulty = '中等难度', variantIndex = id): PaperPdfQuestion => {
    if (/英语/.test(scope)) {
        const pool = id > englishPrompts.length ? englishAlternates : englishPrompts;
        const [stem, answer] = pool[(id - 1) % pool.length];
        return { id, type: '英语基础题', stem, score, answer, explanation: `根据句意和语法，正确答案是 ${answer}。` };
    }
    if (/语文/.test(scope)) {
        const pool = id > chinesePrompts.length ? chineseAlternates : chinesePrompts;
        const [stem, answer] = pool[(id - 1) % pool.length];
        return { id, type: '语文基础题', stem, score, answer, explanation: `参考答案：${answer}。开放题可接受表达合理的其他答案。` };
    }
    const lowerGrade = /一(?:年级)|1\s*年级/.test(scope) ? 1
        : /二(?:年级)|2\s*年级/.test(scope) ? 2
            : /三(?:年级)|3\s*年级/.test(scope) ? 3 : 0;
    if (/数学/.test(scope) && lowerGrade > 0 && !/分数|有理数|方程/.test(scope)) {
        const item = ((variantIndex - 1) % 40) + 1;
        if (lowerGrade === 1) {
            const left = 2 + (item % 9);
            const right = 1 + (Math.floor(item / 2) % (20 - left));
            const subtract = item % 3 === 0;
            return {
                id, type: '口算题', score,
                stem: `计算 ${subtract ? left + right : left} ${subtract ? '−' : '+'} ${right}。`,
                answer: String(subtract ? left : left + right),
                explanation: subtract ? `${left + right} 减去 ${right} 得 ${left}。` : `${left} 加 ${right} 得 ${left + right}。`,
            };
        }
        if (lowerGrade === 2) {
            const left = 24 + (item % 20) * 2;
            const right = 8 + item % 12;
            const multiply = item % 4 === 0;
            const subtract = item % 2 === 0;
            const factorA = 2 + item % 7;
            const factorB = 2 + Math.floor(item / 2) % 7;
            const answer = multiply ? factorA * factorB : subtract ? left - right : left + right;
            return {
                id, type: multiply ? '乘法口算' : '两位数计算', score,
                stem: multiply ? `计算 ${factorA} × ${factorB}。` : `计算 ${left} ${subtract ? '−' : '+'} ${right}。`,
                answer: String(answer), explanation: `按${multiply ? '乘法口诀' : '两位数加减法'}计算，结果是 ${answer}。`,
            };
        }
        const kind = item % 5;
        const basic = difficulty === '基础难度';
        const left = basic ? 24 + item * 2 : 126 + item * 9;
        const right = basic ? 5 + item % 12 : 18 + item * 2;
        const factor = basic ? 2 + item % 3 : 3 + item % 6;
        const groups = 4 + item % 7;
        const perGroup = 12 + item % 9;
        const quotient = basic ? 8 + item : 16 + item * 2;
        const stem = kind === 0 ? `计算 ${left} + ${right}。`
            : kind === 1 ? `计算 ${left} − ${right}。`
                : kind === 2 ? `计算 ${right} × ${factor}。`
                    : kind === 3 ? `计算 ${quotient * factor} ÷ ${factor}。`
                        : `每盒有 ${perGroup} 支铅笔，${groups} 盒一共有多少支？`;
        const answer = kind === 0 ? left + right : kind === 1 ? left - right
            : kind === 2 ? right * factor : kind === 3 ? quotient : perGroup * groups;
        return {
            id, type: kind === 4 ? '应用题' : '计算题', stem, score,
            answer: String(answer),
            explanation: kind === 4 ? `用每盒 ${perGroup} 支乘 ${groups} 盒，得 ${answer} 支。` : `按整数${kind === 0 ? '加法' : kind === 1 ? '减法' : kind === 2 ? '乘法' : '除法'}计算，结果是 ${answer}。`,
        };
    }
    if (/有理数/.test(scope) && !/分数/.test(scope)) {
        const left = id * 3 - 17;
        const right = id % 2 === 0 ? id + 4 : -(id + 2);
        const operation = id % 3 === 0 ? '×' : id % 3 === 1 ? '+' : '−';
        const result = operation === '×' ? left * right : operation === '+' ? left + right : left - right;
        return {
            id, type: '有理数计算',
            stem: `计算 (${left}) ${operation} (${right})，写出计算过程。`,
            score, answer: String(result),
            explanation: `按有理数${operation === '×' ? '乘法' : operation === '+' ? '加法' : '减法'}法则计算，结果为 ${result}。`,
        };
    }
    if (/方程|七年级/.test(scope) && !/分数/.test(scope)) {
        const coefficient = id % 5 + 2;
        const value = id % 8 + 1;
        const constant = id % 7 + 3;
        return {
            id, type: '计算与方程',
            stem: `解方程 ${coefficient}x + ${constant} = ${coefficient * value + constant}，写出计算过程。`,
            score, answer: `x = ${value}`,
            explanation: `两边同时减去 ${constant}，得 ${coefficient}x = ${coefficient * value}；再除以 ${coefficient}，得 x = ${value}。`,
        };
    }
    const denominators = [4, 5, 6, 8, 9, 10, 12];
    let d1 = denominators[(id - 1) % denominators.length];
    let d2 = denominators[(id * 3 + 1) % denominators.length];
    let n1 = (id * 3) % d1 + 1;
    let n2 = (id * 5 + 1) % d2 + 1;
    const operation = id % 3 === 0 ? '−' : '+';
    if (operation === '−' && n1 * d2 < n2 * d1) {
        [n1, n2] = [n2, n1];
        [d1, d2] = [d2, d1];
    }
    const commonDenominator = (d1 * d2) / gcd(d1, d2);
    const leftNumerator = n1 * (commonDenominator / d1);
    const rightNumerator = n2 * (commonDenominator / d2);
    const rawNumerator = operation === '+' ? leftNumerator + rightNumerator : leftNumerator - rightNumerator;
    const divisor = gcd(rawNumerator, commonDenominator);
    const answer = `${rawNumerator / divisor}/${commonDenominator / divisor}`;
    const resultLine = operation === '+' ? leftNumerator + rightNumerator : leftNumerator - rightNumerator;
    return {
        id,
        type: '计算题',
        stem: `${scope}：计算 ${n1}/${d1} ${operation} ${n2}/${d2}，写出通分过程。`,
        score,
        answer,
        explanation: `${n1}/${d1} ${operation} ${n2}/${d2} = ${leftNumerator}/${commonDenominator} ${operation} ${rightNumerator}/${commonDenominator} = ${resultLine}/${commonDenominator} = ${answer}。`,
    };
};

export const buildPaperQuestions = (scope: string, count: number, difficulty = '中等难度'): PaperPdfQuestion[] => {
    const safeCount = Math.max(1, Math.min(100, Math.floor(count) || 1));
    const baseScore = Math.floor(100 / safeCount);
    const remainder = 100 % safeCount;
    return Array.from({ length: safeCount }, (_, index) => makePaperQuestion(scope, index + 1, baseScore + (index < remainder ? 1 : 0), difficulty));
};

type PdfPage = { image: Uint8Array; width: number; height: number };

// ISO 216 A4 page size in PDF points (210 × 297 mm).
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const SCALE = 2;
const FONT = 'Microsoft YaHei, Microsoft JhengHei, PingFang SC, sans-serif';

const encode = (value: string) => new TextEncoder().encode(value);

const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
    const lines: string[] = [];
    for (const paragraph of text.split('\n')) {
        let line = '';
        for (const char of paragraph) {
            if (line && ctx.measureText(line + char).width > maxWidth) {
                lines.push(line);
                line = char;
            } else {
                line += char;
            }
        }
        lines.push(line);
    }
    return lines;
};

const canvasToJpeg = (canvas: HTMLCanvasElement) => {
    const data = canvas.toDataURL('image/jpeg', 0.94).split(',')[1];
    const binary = atob(data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
};

const renderPages = (paper: PaperPdfDocument, answerCopy: boolean, pageOffset = 0): PdfPage[] => {
    const pages: PdfPage[] = [];
    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;
    let y: number;
    const totalScore = paper.questions.reduce((sum, question) => sum + question.score, 0);
    const paperStyle = /基础/.test(paper.difficulty) ? '基础巩固版'
        : /较高|提高|困难/.test(paper.difficulty) ? '提高拓展版' : '综合测试版';
    let pageIndex = 0;
    const beginPage = () => {
        canvas = document.createElement('canvas');
        canvas.width = Math.round(PAGE_WIDTH * SCALE);
        canvas.height = Math.round(PAGE_HEIGHT * SCALE);
        ctx = canvas.getContext('2d')!;
        ctx.scale(SCALE, SCALE);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);
        // Subtle diagonal watermark, painted beneath the printable content.
        ctx.save();
        ctx.translate(PAGE_WIDTH / 2, PAGE_HEIGHT / 2);
        ctx.rotate(-Math.PI / 4);
        ctx.globalAlpha = 0.055;
        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'center';
        ctx.font = `bold 42px ${FONT}`;
        ctx.fillText('小晤同学 AI 生成', 0, 0);
        ctx.restore();

        if (pageIndex === 0) {
            ctx.fillStyle = '#64748b';
            ctx.textAlign = 'left';
            ctx.font = `8px ${FONT}`;
            ctx.fillText(paper.title, 46, 31, PAGE_WIDTH - 220);
            ctx.textAlign = 'right';
            ctx.fillText('小晤同学 AI 生成', PAGE_WIDTH - 46, 31);
            ctx.strokeStyle = '#e5e7eb';
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(46, 39);
            ctx.lineTo(PAGE_WIDTH - 46, 39);
            ctx.stroke();

            ctx.fillStyle = '#111827';
            ctx.textAlign = 'center';
            ctx.font = `bold 18px ${FONT}`;
            ctx.fillText(paper.title, PAGE_WIDTH / 2, 75, PAGE_WIDTH - 100);
            ctx.fillStyle = '#4b5563';
            ctx.font = `9px ${FONT}`;
            ctx.fillText(`${answerCopy ? '答案解析' : paperStyle}  满分：${totalScore}分　　考试时间：${paper.duration}`, PAGE_WIDTH / 2, 99);
            if (paper.assumedTextbook) {
                ctx.fillStyle = '#6b7280';
                ctx.font = `8px ${FONT}`;
                ctx.fillText(`教材版本暂按：${paper.assumedTextbook}`, PAGE_WIDTH / 2, 116);
            }
            ctx.strokeStyle = '#1f2937';
            ctx.lineWidth = 0.9;
            ctx.beginPath();
            ctx.moveTo(46, paper.assumedTextbook ? 128 : 119);
            ctx.lineTo(PAGE_WIDTH - 46, paper.assumedTextbook ? 128 : 119);
            ctx.stroke();
            y = paper.assumedTextbook ? 157 : 148;
        } else {
            y = 62;
        }
        pages.push({ image: new Uint8Array(), width: canvas.width, height: canvas.height });
        pageIndex += 1;
    };
    const addFooter = (pageNumber: number) => {
        ctx.fillStyle = '#64748b';
        ctx.font = `8px ${FONT}`;
        ctx.textAlign = 'center';
        ctx.fillText(String(pageNumber + pageOffset), PAGE_WIDTH / 2, PAGE_HEIGHT - 25);
        ctx.textAlign = 'left';
        pages[pages.length - 1].image = canvasToJpeg(canvas);
    };
    const writeBlock = (text: string, fontSize: number, color: string, indent = 0) => {
        ctx.font = `${fontSize}px ${FONT}`;
        ctx.fillStyle = color;
        ctx.textAlign = 'left';
        const lines = wrapText(ctx, text, PAGE_WIDTH - 92 - indent);
        const lineHeight = fontSize * 1.7;
        if (y + lines.length * lineHeight > PAGE_HEIGHT - 54) {
            addFooter(pages.length);
            beginPage();
        }
        for (const line of lines) {
            ctx.fillText(line, 46 + indent, y);
            y += lineHeight;
        }
        y += 8;
    };
    const ensureQuestionSpace = (blocks: Array<{ text: string; fontSize: number; indent?: number }>) => {
        const requiredHeight = blocks.reduce((height, block) => {
            ctx.font = `${block.fontSize}px ${FONT}`;
            const lines = wrapText(ctx, block.text, PAGE_WIDTH - 92 - (block.indent ?? 0));
            return height + lines.length * block.fontSize * 1.7 + 8;
        }, 0);
        if (y + requiredHeight > PAGE_HEIGHT - 54) {
            addFooter(pages.length);
            beginPage();
        }
    };

    beginPage();
    if (!answerCopy) {
        for (const [index, question] of paper.questions.entries()) {
            ensureQuestionSpace([
                { text: `${index + 1}. ${question.type}（${question.score}分）`, fontSize: 10 },
                { text: question.stem, fontSize: 11, indent: 8 },
                ...(question.type !== '选择题' ? [{ text: '作答：____________________________________________________________', fontSize: 9, indent: 8 }] : []),
            ]);
            writeBlock(`${index + 1}. ${question.type}（${question.score}分）`, 10, '#111827');
            writeBlock(question.stem, 11, '#172033', 8);
            if (question.type !== '选择题') writeBlock('作答：____________________________________________________________', 9, '#64748b', 8);
        }
    } else {
        for (const [index, question] of paper.questions.entries()) {
            ensureQuestionSpace([
                { text: `${index + 1}. ${question.type}`, fontSize: 10 },
                { text: `答案：${question.answer}`, fontSize: 10, indent: 8 },
                { text: `解析：${question.explanation}`, fontSize: 9, indent: 8 },
            ]);
            writeBlock(`${index + 1}. ${question.type}`, 10, '#111827');
            writeBlock(`答案：${question.answer}`, 10, '#172033', 8);
            writeBlock(`解析：${question.explanation}`, 9, '#475569', 8);
        }
    }
    addFooter(pages.length);
    return pages;
};

const buildImagePdf = (pages: PdfPage[]) => {
    const chunks: Uint8Array[] = [];
    const offsets: number[] = [0];
    let byteLength = 0;
    const append = (bytes: Uint8Array) => {
        chunks.push(bytes);
        byteLength += bytes.length;
    };
    const appendText = (text: string) => append(encode(text));
    appendText('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
    const objectCount = 2 + pages.length * 3;
    const addObject = (id: number, body: Uint8Array[]) => {
        offsets[id] = byteLength;
        appendText(`${id} 0 obj\n`);
        body.forEach(append);
        appendText('\nendobj\n');
    };
    const kids = pages.map((_, i) => `${3 + i * 3} 0 R`).join(' ');
    addObject(1, [encode('<< /Type /Catalog /Pages 2 0 R >>')]);
    addObject(2, [encode(`<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`)]);
    pages.forEach((page, index) => {
        const pageId = 3 + index * 3;
        const imageId = pageId + 1;
        const contentId = pageId + 2;
        const content = encode(`q ${PAGE_WIDTH} 0 0 ${PAGE_HEIGHT} 0 0 cm /Im0 Do Q`);
        addObject(pageId, [encode(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /XObject << /Im0 ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`)]);
        addObject(imageId, [
            encode(`<< /Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.image.length} >>\nstream\n`),
            page.image,
            encode('\nendstream'),
        ]);
        addObject(contentId, [encode(`<< /Length ${content.length} >>\nstream\n`), content, encode('\nendstream')]);
    });
    const xrefOffset = byteLength;
    appendText(`xref\n0 ${objectCount + 1}\n0000000000 65535 f \n`);
    for (let id = 1; id <= objectCount; id += 1) appendText(`${String(offsets[id]).padStart(10, '0')} 00000 n \n`);
    appendText(`trailer\n<< /Size ${objectCount + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);
    const pdf = new Uint8Array(byteLength);
    let cursor = 0;
    for (const chunk of chunks) {
        pdf.set(chunk, cursor);
        cursor += chunk.length;
    }
    return new Blob([pdf], { type: 'application/pdf' });
};

const validatePaperQuestions = (paper: PaperPdfDocument) => {
    if (!paper.questions.length
        || new Set(paper.questions.map((question) => question.id)).size !== paper.questions.length
        || paper.questions.some((question) => !question.stem.trim() || !question.answer.trim() || question.score <= 0)) {
        throw new Error('Paper questions failed structural validation');
    }
};

const createValidatedPdf = async (pages: PdfPage[]) => {
    const pdf = buildImagePdf(pages);
    const bytes = new Uint8Array(await pdf.arrayBuffer());
    const fileText = new TextDecoder('latin1').decode(bytes);
    const header = fileText.slice(0, 8);
    const tail = fileText.slice(-1024);
    if (header !== '%PDF-1.4' || !tail.includes('%%EOF') || !fileText.includes(`/Count ${pages.length}`)) {
        throw new Error('Generated PDF failed structural validation');
    }
    return pdf;
};

export const createPaperPdf = async (paper: PaperPdfDocument, answerCopy = false) => {
    validatePaperQuestions(paper);
    return createValidatedPdf(renderPages(paper, answerCopy));
};

/** 默认交付一份文件：题目在前，答案解析接在后面。 */
export const createCombinedPaperDocument = async (paper: PaperPdfDocument, onBeforeValidation?: () => void) => {
    validatePaperQuestions(paper);
    const questionPages = renderPages(paper, false);
    const pages = paper.withAnswers === false
        ? questionPages
        : [...questionPages, ...renderPages(paper, true, questionPages.length)];
    onBeforeValidation?.();
    await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
    const pdf = await createValidatedPdf(pages);
    const previewPages = pages.map((page) => new Blob([new Uint8Array(page.image)], { type: 'image/jpeg' }));
    return { pdf, previewPages };
};

export const downloadPaperPdf = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};
