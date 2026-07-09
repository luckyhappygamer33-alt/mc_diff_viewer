/* eslint-disable */
import { useState } from 'react'

function SetupWizard({ onProjectReady, onBack }) {
    const [name, setName] = useState('')
    const [jarA, setJarA] = useState(null)
    const [jarB, setJarB] = useState(null)

    const handlePickJarA = async () => {
        const path = await window.api.pickJar()
        if (path) setJarA(path)
    }

    const handlePickJarB = async () => {
        const path = await window.api.pickJar()
        if (path) setJarB(path)
    }

    const handleCreate = () => {
        if (!name || !jarA || !jarB) return
        onProjectReady({
            name,
            versionA: { label: 'Version A', path: jarA },
            versionB: { label: 'Version B', path: jarB },
            pairs: [],
            unpaired: { a: [], b: [] }
        })
    }

    return (
        <div>
            <button onClick={onBack}>← Back</button>
            <h2>New Project</h2>

            <div>
                <label>Project name</label>
                <input value={name} onChange={e => setName(e.target.value)} />
            </div>

            <div>
                <label>Version A jar</label>
                <button onClick={handlePickJarA}>Pick jar</button>
                <span>{jarA ?? 'not selected'}</span>
            </div>

            <div>
                <label>Version B jar</label>
                <button onClick={handlePickJarB}>Pick jar</button>
                <span>{jarB ?? 'not selected'}</span>
            </div>

            <button onClick={handleCreate} disabled={!name || !jarA || !jarB}>
                Create Project
            </button>
        </div>
    )
}

export default SetupWizard;