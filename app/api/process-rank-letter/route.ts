import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, StandardFonts } from 'pdf-lib'
import fs from 'fs'
import path from 'path'
import { PDFPage, PDFFont } from 'pdf-lib'

function drawJustifiedParagraph(
    page: PDFPage,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    font: PDFFont,
    size: number,
    lineHeight: number
): void {
    const words = text.split(' ');
    let currentLineWords: string[] = [];
    let currentY = y;

    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const testLine = [...currentLineWords, word].join(' ');
        const testWidth = font.widthOfTextAtSize(testLine, size);

        if (testWidth <= maxWidth) {
            currentLineWords.push(word);
        } else {
            renderLine(page, currentLineWords, x, currentY, maxWidth, font, size, false);
            currentY -= lineHeight;
            currentLineWords = [word];
        }
    }

    if (currentLineWords.length > 0) {
        renderLine(page, currentLineWords, x, currentY, maxWidth, font, size, true);
    }
}

function renderLine(
    page: PDFPage,
    words: string[],
    x: number,
    y: number,
    maxWidth: number,
    font: PDFFont,
    size: number,
    isLastLine: boolean
): void {
    if (words.length === 0) return;

    if (isLastLine || words.length === 1) {
        page.drawText(words.join(' '), { x, y, size, font });
        return;
    }

    const totalWordsWidth = words.reduce((sum, word) => sum + font.widthOfTextAtSize(word, size), 0);
    const totalSpaceToFill = maxWidth - totalWordsWidth;
    const numberOfGaps = words.length - 1;
    const spacePerGap = totalSpaceToFill / numberOfGaps;

    let currentX = x;
    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        page.drawText(word, { x: currentX, y, size, font });
        currentX += font.widthOfTextAtSize(word, size) + spacePerGap;
    }
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const refName = formData.get('refName')?.toString() || ''
        const date = formData.get('date')?.toString() || ''
        const courseName = formData.get('courseName')?.toString().toUpperCase() || ''
        const marks = formData.get('marks')?.toString() || ''
        const session = formData.get('session')?.toString() || ''
        const candidateName = formData.get('candidateName')?.toString() || ''
        const fatherName = formData.get('fatherName')?.toString() || ''
        const stateName = formData.get('stateName')?.toString() || ''

        const header = `
To,
${candidateName}
S/o Sh. ${fatherName}
${stateName}`.replace(/^[^\S\r\n]+/gm, '').trim();


        let pdfBytes: Uint8Array | ArrayBuffer
        if (process.env.VERCEL_URL) {
            // In Vercel, use fetch
            const pdfResponse = await fetch(`${process.env.VERCEL_URL}/rank-letter.pdf`)
            if (!pdfResponse.ok) {
                console.log('Failed to load PDF via fetch', pdfResponse.status)
                return NextResponse.json({ error: 'Failed to load PDF' }, { status: 500 })
            }
            pdfBytes = await pdfResponse.arrayBuffer()
        } else {
            // Local, use fs
            const pdfPath = path.join(process.cwd(), 'public', 'rank-letter.pdf')
            if (!fs.existsSync(pdfPath)) {
                console.log('PDF file not found at', pdfPath)
                return NextResponse.json({ error: 'PDF file not found' }, { status: 500 })
            }
            pdfBytes = new Uint8Array(fs.readFileSync(pdfPath))
        }

        const pdfDoc = await PDFDocument.load(pdfBytes)
        const timesNewRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman)
        const timesNewRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)
        const pages = pdfDoc.getPages()
        const firstPage = pages[0]

        const textSize = 15

        firstPage.drawText(refName, {
            x: 56,
            y: 680,
            size: textSize,
            font: timesNewRoman,
        })

        firstPage.drawText(date, {
            x: 503,
            y: 681,
            size: textSize,
            font: timesNewRoman,
        })

        const pageWidth = firstPage.getWidth();
        const margin = 40; // This is now your unified left and right margin
        const maxLineWidth = pageWidth - (margin * 2);

        // 1. Draw Header (Aligned to the margin variable)
        firstPage.drawText(header.toUpperCase(), {
            x: margin, // Changed from 37 to margin (40)
            y: 600,
            size: textSize,
            font: timesNewRomanBold,
            lineHeight: 17,
        });

        // 2. Clean up your body string
        const cleanBody = `This is to inform you that have been provisionally selected for Admission in 1st year of Four Years degree course ${courseName} on the basis of Test conducted by the Institution in the following Subjects Physics, Chemistry & MATHS taken together for the Session ${session}. He has secured ${marks} Marks out of 120 Marks in SVIET EEE Entrance test.`.replace(/\s+/g, ' ');

        const footer = `It is further certified that this Institute is approved by Engineering Council of India, AICTE (Ministry of HRD), Govt.of India and Govt of Punjab, affiliated to IKGPTU, Jalandhar.`

        // 3. Draw Body (Aligned to the exact same margin variable)
        drawJustifiedParagraph(
            firstPage,
            cleanBody,
            margin,
            500,
            maxLineWidth,
            timesNewRoman,
            textSize,
            17
        );

        firstPage.drawText(footer, {
            x: margin, // Aligned perfectly with the header
            y: 370,
            size: textSize,
            font: timesNewRoman,
            lineHeight: 17,
            maxWidth: maxLineWidth,
        });


        const modifiedPdfBytes = await pdfDoc.save()

        return new Response(Buffer.from(modifiedPdfBytes), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename=${candidateName}`,
            },
        })
    } catch (error) {
        console.error('Error processing PDF:', error)
        return NextResponse.json({ error: 'Failed to process PDF' }, { status: 500 })
    }
}