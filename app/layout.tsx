import './globals.css';

export const metadata = {
    title: 'PDF Processor',
    description: 'Upload images and insert into PDF',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    )
}