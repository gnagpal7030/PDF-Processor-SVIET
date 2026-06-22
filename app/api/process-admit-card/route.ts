import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, StandardFonts } from 'pdf-lib'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const pictureFile = formData.get('picture') as File
        const signatureFile = formData.get('signature') as File
        const candidateName = formData.get('candidateName')?.toString() || ''
        const fatherName = formData.get('fatherName')?.toString() || ''
        const rollNo = formData.get('rollNo')?.toString() || ''
        const dob = formData.get('dob')?.toString() || ''

        if (!pictureFile || !signatureFile) {
            console.log('Missing files')
            return NextResponse.json({ error: 'Missing files' }, { status: 400 })
        }

        console.log('Loading PDF')
        let pdfBytes: Uint8Array | ArrayBuffer
        if (process.env.VERCEL_URL) {
            // In Vercel, use fetch
            const pdfResponse = await fetch(`${process.env.VERCEL_URL}/admit-card.pdf`)
            if (!pdfResponse.ok) {
                console.log('Failed to load PDF via fetch', pdfResponse.status)
                return NextResponse.json({ error: 'Failed to load PDF' }, { status: 500 })
            }
            pdfBytes = await pdfResponse.arrayBuffer()
        } else {
            // Local, use fs
            const pdfPath = path.join(process.cwd(), 'public', 'admit-card.pdf')
            if (!fs.existsSync(pdfPath)) {
                console.log('PDF file not found at', pdfPath)
                return NextResponse.json({ error: 'PDF file not found' }, { status: 500 })
            }
            pdfBytes = new Uint8Array(fs.readFileSync(pdfPath))
        }

        console.log('PDF loaded, loading doc')
        const pdfDoc = await PDFDocument.load(pdfBytes)
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
        const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
        const pages = pdfDoc.getPages()
        const firstPage = pages[0]

        console.log('Embedding images')
        // Embed the picture image
        const pictureBytes = await pictureFile.arrayBuffer()
        let pictureImage
        if (pictureFile.type === 'image/png') {
            pictureImage = await pdfDoc.embedPng(new Uint8Array(pictureBytes))
        } else if (pictureFile.type === 'image/jpeg' || pictureFile.type === 'image/jpg') {
            pictureImage = await pdfDoc.embedJpg(new Uint8Array(pictureBytes))
        } else {
            console.log('Unsupported picture format')
            return NextResponse.json({ error: 'Unsupported picture format' }, { status: 400 })
        }

        // Embed the signature image
        const signatureBytes = await signatureFile.arrayBuffer()
        let signatureImage
        if (signatureFile.type === 'image/png') {
            signatureImage = await pdfDoc.embedPng(new Uint8Array(signatureBytes))
        } else if (signatureFile.type === 'image/jpeg' || signatureFile.type === 'image/jpg') {
            signatureImage = await pdfDoc.embedJpg(new Uint8Array(signatureBytes))
        } else {
            console.log('Unsupported signature format')
            return NextResponse.json({ error: 'Unsupported signature format' }, { status: 400 })
        }

        console.log('Drawing images')
        const { width, height } = firstPage.getSize()

        // Photo: top-right, adjacent to Important Instructions
        // Provided: X=690, Y=35 (top-left), Width=265, Height=285
        // Convert Y to bottom-left: height - Y - Height
        const pictureWidth = 115
        const pictureHeight = 130
        firstPage.drawImage(pictureImage, {
            x: 450,
            y: 600,
            width: pictureWidth,
            height: pictureHeight,
        })

        // Signature: Full Signature of Candidate column
        // Provided: X=45, Y=735 (top-left), Width=435, Height=45
        // Convert Y to bottom-left: height - Y - Height
        firstPage.drawImage(signatureImage, {
            x: 55,
            y: height - 440,
            width: 200,
            height: 30,
        })

        console.log('Drawing text')

        const textSize = 12

        firstPage.drawText(candidateName, {
            x: 190,
            y: 575,
            size: textSize,
            font: helveticaBoldFont,
        })

        firstPage.drawText(rollNo, {
            x: 100,
            y: 537,
            size: textSize,
            font: helveticaBoldFont,
        })

        firstPage.drawText(fatherName, {
            x: 136,
            y: 497,
            size: textSize,
            font: helveticaBoldFont,
        })

        firstPage.drawText(dob, {
            x: 361,
            y: 537,
            size: textSize,
            font: helveticaBoldFont,
        })

        console.log('Saving PDF')
        const modifiedPdfBytes = await pdfDoc.save()

        console.log('PDF processed successfully')
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