import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, StandardFonts } from 'pdf-lib'
import fs from 'fs'
import path from 'path'
import { PDFPage, PDFFont } from 'pdf-lib'

// Define a structured fragment that includes its styling
interface TextFragment {
    text: string;
    isBold: boolean;
}

function drawJustifiedParagraph(
    page: PDFPage,
    fragments: TextFragment[],
    x: number,
    y: number,
    maxWidth: number,
    regularFont: PDFFont,
    boldFont: PDFFont,
    size: number,
    lineHeight: number
): void {
    // Flatten fragments into an array of individual word-fragments
    const words: TextFragment[] = [];
    for (const frag of fragments) {
        const splitWords = frag.text.split(' ').filter(w => w !== '');
        for (const word of splitWords) {
            words.push({ text: word, isBold: frag.isBold });
        }
    }

    let currentLineWords: TextFragment[] = [];
    let currentY = y;

    for (let i = 0; i < words.length; i++) {
        const wordFrag = words[i];
        
        // Calculate the tentative line width accounting for custom fonts per word
        const testLine = [...currentLineWords, wordFrag];
        let testWidth = 0;
        for (let j = 0; j < testLine.length; j++) {
            const font = testLine[j].isBold ? boldFont : regularFont;
            testWidth += font.widthOfTextAtSize(testLine[j].text, size);
            if (j < testLine.length - 1) {
                // Add regular space width between words for calculation
                testWidth += regularFont.widthOfTextAtSize(' ', size);
            }
        }

        if (testWidth <= maxWidth) {
            currentLineWords.push(wordFrag);
        } else {
            renderLine(page, currentLineWords, x, currentY, maxWidth, regularFont, boldFont, size, false);
            currentY -= lineHeight;
            currentLineWords = [wordFrag];
        }
    }

    if (currentLineWords.length > 0) {
        renderLine(page, currentLineWords, x, currentY, maxWidth, regularFont, boldFont, size, true);
    }
}

function renderLine(
    page: PDFPage,
    words: TextFragment[],
    x: number,
    y: number,
    maxWidth: number,
    regularFont: PDFFont,
    boldFont: PDFFont,
    size: number,
    isLastLine: boolean
): void {
    if (words.length === 0) return;

    if (isLastLine || words.length === 1) {
        let currentX = x;
        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            const font = word.isBold ? boldFont : regularFont;
            page.drawText(word.text, { x: currentX, y, size, font });
            currentX += font.widthOfTextAtSize(word.text, size) + regularFont.widthOfTextAtSize(' ', size);
        }
        return;
    }

    // Calculate exact width taken by the characters
    const totalWordsWidth = words.reduce((sum, word) => {
        const font = word.isBold ? boldFont : regularFont;
        return sum + font.widthOfTextAtSize(word.text, size);
    }, 0);

    const totalSpaceToFill = maxWidth - totalWordsWidth;
    const numberOfGaps = words.length - 1;
    const spacePerGap = totalSpaceToFill / numberOfGaps;

    let currentX = x;
    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const font = word.isBold ? boldFont : regularFont;
        page.drawText(word.text, { x: currentX, y, size, font });
        currentX += font.widthOfTextAtSize(word.text, size) + spacePerGap;
    }
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const refName = formData.get('refName')?.toString() || ''
        const date = formData.get('date')?.toString() || ''
        const courseName = formData.get('courseName')?.toString().toUpperCase() || ''
        const session = formData.get('session')?.toString() || ''
        const candidateName = formData.get('candidateName')?.toString() || ''
        const fatherName = formData.get('fatherName')?.toString() || ''
        const stateName = formData.get('stateName')?.toString() || ''

        let pdfBytes: Uint8Array | ArrayBuffer
        if (process.env.VERCEL_URL) {
            const pdfResponse = await fetch(`${process.env.VERCEL_URL}/pro-letter.pdf`)
            if (!pdfResponse.ok) {
                console.log('Failed to load PDF via fetch', pdfResponse.status)
                return NextResponse.json({ error: 'Failed to load PDF' }, { status: 500 })
            }
            pdfBytes = await pdfResponse.arrayBuffer()
        } else {
            const pdfPath = path.join(process.cwd(), 'public', 'pro-letter.pdf')
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
            x: 66,
            y: 680,
            size: textSize,
            font: timesNewRoman,
        })

        firstPage.drawText(date, {
            x: 484,
            y: 681,
            size: textSize,
            font: timesNewRoman,
        })

        const pageWidth = firstPage.getWidth();
        const margin = 74; 
        const maxLineWidth = pageWidth - (margin * 2);

        // Break up the text body dynamically into stylable components
        const dynamicFragments: TextFragment[] = [
            { text: "It is certified that ", isBold: false },
            { text: candidateName, isBold: true },
            { text: " S/o Sh. ", isBold: false },
            { text: fatherName, isBold: true },
            { text: " R/O ", isBold: false },
            { text: stateName, isBold: true },
            { text: " has been provisionally admitted in this Institute in four years degree course ", isBold: false },
            { text: `${courseName}`, isBold: true },
            { text: ` (spread over eight semesters) in ${session} sessions. `, isBold: false },
            { text: "This institute is approved from AICTE, Govt. of India and Govt. of Punjab, affiliated to IKGPTU, Jalandhar.", isBold: true }
        ];

        // Draw the structured mixed-font body
        drawJustifiedParagraph(
            firstPage,
            dynamicFragments,
            margin,
            550,
            maxLineWidth,
            timesNewRoman,
            timesNewRomanBold,
            textSize,
            17
        );

        const modifiedPdfBytes = await pdfDoc.save()

        return new Response(Buffer.from(modifiedPdfBytes), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename=${candidateName || 'document'}.pdf`,
            },
        })
    } catch (error) {
        console.error('Error processing PDF:', error)
        return NextResponse.json({ error: 'Failed to process PDF' }, { status: 500 })
    }
}