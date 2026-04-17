'use client'

import { useState } from 'react'

export default function Home() {
    const [picture, setPicture] = useState<File | null>(null)
    const [signature, setSignature] = useState<File | null>(null)
    const [candidateName, setCandidateName] = useState('')
    const [fatherName, setFatherName] = useState('')
    const [rollNo, setRollNo] = useState('')
    const [dob, setDob] = useState('')
    const [loading, setLoading] = useState(false)
    const [pdfUrl, setPdfUrl] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!picture || !signature) return

        setLoading(true)
        const formData = new FormData()
        formData.append('picture', picture)
        formData.append('signature', signature)
        formData.append('candidateName', candidateName)
        formData.append('fatherName', fatherName)
        formData.append('rollNo', rollNo)
        formData.append('dob', dob)

        try {
            const response = await fetch('/api/process-pdf', {
                method: 'POST',
                body: formData,
            })
            if (response.ok) {
                const blob = await response.blob()
                const url = URL.createObjectURL(blob)
                setPdfUrl(url)
                // Auto download
                const a = document.createElement('a')
                a.href = url
                a.download = 'processed.pdf'
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
            } else {
                const errorText = await response.text()
                alert(`Error: ${errorText}`)
            }
        } catch (error) {
            console.error(error)
            alert('Failed to process PDF')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="app-shell">
            <div className="form-card">
                <div className="form-header">
                    <h1>PDF Processor</h1>
                    <p>Upload your photo, signature, and candidate details to generate the completed admit card.</p>
                </div>
                <form onSubmit={handleSubmit} className="form-grid">
                    <div className="form-row">
                        <label className="form-label">Candidate Name</label>
                        <input
                            className="form-input"
                            type="text"
                            value={candidateName}
                            onChange={(e) => setCandidateName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-row">
                        <label className="form-label">Father Name</label>
                        <input
                            className="form-input"
                            type="text"
                            value={fatherName}
                            onChange={(e) => setFatherName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-row">
                        <label className="form-label">Roll No</label>
                        <input
                            className="form-input"
                            type="text"
                            value={rollNo}
                            onChange={(e) => setRollNo(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-row">
                        <label className="form-label">DOB</label>
                        <input
                            className="form-input"
                            type="text"
                            placeholder="DD.MM.YYYY"
                            value={dob}
                            onChange={(e) => setDob(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-row">
                        <label className="form-label">Upload Picture</label>
                        <input
                            className="form-input"
                            type="file"
                            accept="image/*"
                            onChange={(e) => setPicture(e.target.files?.[0] || null)}
                            required
                        />
                    </div>
                    <div className="form-row">
                        <label className="form-label">Upload Signature</label>
                        <input
                            className="form-input"
                            type="file"
                            accept="image/*"
                            onChange={(e) => setSignature(e.target.files?.[0] || null)}
                            required
                        />
                    </div>
                    <div className="form-actions">
                        <button className="submit-button" type="submit" disabled={loading}>
                            {loading ? 'Processing...' : 'Process PDF'}
                        </button>
                    </div>
                </form>
                {pdfUrl && (
                    <div className="result-card">
                        <h2>Processed PDF</h2>
                        <a className="download-link" href={pdfUrl} download="processed.pdf">
                            Download PDF
                        </a>
                    </div>
                )}
            </div>
        </div>
    )
}