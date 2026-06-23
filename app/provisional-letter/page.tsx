'use client'

import { useState } from 'react'

export default function ProvisionalLetter() {
    const [refName, setRefName] = useState('')
    const [date, setDate] = useState('')
    const [session, setSession] = useState('')
    const [state, setState] = useState('')
    const [candidateName, setCandidateName] = useState('')
    const [fatherName, setFatherName] = useState('')
    const [loading, setLoading] = useState(false)
    const [courseName, setCourseName] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        setLoading(true)
        const formData = new FormData()
        formData.append('refName', refName)
        formData.append('date', date)
        formData.append('session', session)
        formData.append('stateName', state)
        formData.append('candidateName', candidateName)
        formData.append('fatherName', fatherName)
        formData.append('courseName', courseName)

        try {
            const response = await fetch('/api/process-provisional-letter', {
                method: 'POST',
                body: formData,
            })
            if (response.ok) {
                const blob = await response.blob()
                const url = URL.createObjectURL(blob)
                // Auto download
                const a = document.createElement('a')
                a.href = url
                a.download = candidateName + '.pdf'
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
                    <h1>Provisional Letter</h1>
                    <p>Fill the information below: </p>
                </div>
                <form onSubmit={handleSubmit} className="form-grid">

                    <div className="form-row">

                        <label className="form-label">Ref Name</label>
                        <input
                            className="form-input"
                            type="text"
                            value={refName}
                            onChange={(e) => setRefName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-row">

                        <label className="form-label">Date</label>
                        <input
                            className="form-input"
                            type="text"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-row">
                        <label className="form-label">Session</label>
                        <input
                            className="form-input"
                            type="text"
                            value={session}
                            onChange={(e) => setSession(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-row">
                        <label className="form-label">State</label>
                        <input
                            className="form-input"
                            type="text"
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-row">
                        <label className="form-label">Course Name</label>
                        <input
                            className="form-input"
                            type="text"
                            value={courseName}
                            onChange={(e) => setCourseName(e.target.value)}
                            required
                        />
                    </div>
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

                    <div className="form-actions">
                        <button className="submit-button" type="submit" disabled={loading}>
                            {loading ? 'Processing...' : 'Process PDF'}
                        </button>
                    </div>
                </form>

            </div>
        </div>
    )
}