/* eslint-disable */
import { useState } from 'react'
import * as T from '../theme'

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
        <div style={{ background: T.theme.bg, color: T.theme.text, height: '100vh', width: '100%', display: 'flex', flexDirection: 'column', fontFamily: "'Consolas', monospace" }}>

            {/* Top bar */}
            <T.TopBar>
                <T.Btn variant="secondary" onClick={onBack}>← Back</T.Btn>
            </T.TopBar>

            {/* Content */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '400px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* Card */}
                    <div style={{ border: `1px solid ${T.theme.border}`, borderRadius: '6px', overflow: 'hidden' }}>

                        {/* Card header */}
                        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.theme.border}`, background: T.theme.bgPanel }}>
                            <div style={{ fontSize: '16px', fontWeight: 400, color: T.theme.accent }}>New Project</div>
                            <div style={{ fontSize: '11px', color: T.theme.textMuted, marginTop: '4px' }}>Configure comparison</div>
                        </div>

                        {/* Card body */}
                        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', background: T.theme.bg }}>
                            <T.FormField label="PROJECT NAME">
                                <T.TextInput
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="e.g. 1.20 → 1.20.2"
                                />
                            </T.FormField>

                            <T.JarPicker label="VERSION A — sources jar" path={jarA} onPick={handlePickJarA} />
                            <T.JarPicker label="VERSION B — sources jar" path={jarB} onPick={handlePickJarB} />
                        </div>

                        {/* Card footer */}
                        <div style={{ padding: '12px 20px', borderTop: `1px solid ${T.theme.border}`, background: T.theme.bgPanel, display: 'flex', justifyContent: 'flex-end' }}>
                            <T.Btn variant="primary" onClick={handleCreate} disabled={!name || !jarA || !jarB}>
                                Create Project
                            </T.Btn>
                        </div>

                    </div>

                    {/* <div style={{ textAlign: 'center' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 400, margin: 0 }}>New <span style={{ color: T.theme.accent }}>Project</span></h2>
                    </div> */}

                    {/* Project name */}
                    {/* <div style={T.styles.row}>
                        <label style={T.styles.label}>PROJECT NAME</label>
                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. 1.20 → 1.20.2"
                            style={T.styles.inputStyle}
                        />
                    </div> */}

                    {/* Jar A */}
                    {/* <div style={T.styles.row}>
                        <label style={T.styles.label}>VERSION A — sources jar</label>
                        <div style={T.styles.jarRow}>
                            <T.Btn variant="secondary"
                                onClick={handlePickJarA}
                            >
                                Browse
                            </T.Btn>
                            <span style={{ fontSize: '11px', color: jarA ? T.theme.text : T.theme.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {jarA ?? 'Not selected'}
                            </span>

                        </div>
                    </div> */}

                    {/* Jar B */}
                    {/* <div style={T.styles.row}>
                        <label style={T.styles.label}>VERSION B — sources jar</label>
                        <div style={T.styles.jarRow}>
                            <T.Btn variant="secondary"
                                onClick={handlePickJarB}
                            >
                                Browse
                            </T.Btn>
                            <span style={{ fontSize: '11px', color: jarB ? T.theme.text : T.theme.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {jarB ?? 'Not selected'}
                            </span>
                        </div>
                    </div> */}

                    {/* Create button */}
                    {/* <T.Btn variant="primary"
                        onClick={handleCreate}
                        disabled={!name || !jarA || !jarB}
                    >
                        Create Project
                    </T.Btn> */}

                </div>
            </div>

            {/* Status bar */}
            <T.StatusBar>
                v1.0.0
            </T.StatusBar>

        </div >
    )
}

export default SetupWizard;