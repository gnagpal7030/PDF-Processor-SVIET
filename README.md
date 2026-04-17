# PDF Processor

A Next.js application that allows uploading images and inserting them into a PDF at specific positions.

## Features

- Upload a picture and signature image
- Insert picture on the right side of Important Instructions section
- Insert signature in the Full Signature of Candidate column
- Download the processed PDF

## Technologies

- Next.js (React)
- pdf-lib for PDF manipulation
- Deployable on Vercel

## Setup

1. Clone the repository
2. Run `npm install`
3. Place your PDF in `public/admit-card.pdf`
4. Run `npm run dev`
5. Open http://localhost:3000

## Deployment

Deploy to Vercel by connecting your GitHub repository.

Note: The image positions are hardcoded. You may need to adjust the coordinates in `app/api/process-pdf/route.ts` based on your PDF layout.