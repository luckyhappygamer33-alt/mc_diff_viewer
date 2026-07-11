/* eslint-disable */
import * as T from '../theme'

function WelcomeScreen({ onNewProject, onOpenProject }) {
    return (
        <div style={{ background: T.theme.bg, color: T.theme.text, height: '100vh', width: '100%', display: 'flex', flexDirection: 'column' }}>

            {/* Top bar */}
            <T.TopBar>
                <span style={{ fontSize: '12px', color: T.theme.textMuted }}>MC Diff Viewer</span>
            </T.TopBar>

            {/* Center content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '32px' }}>

                <div style={{ textAlign: 'center' }}>
                    <h1 style={{ fontSize: '28px', fontWeight: 400, margin: 0 }}>
                        MC <span style={{ color: T.theme.accent }}>Diff Viewer</span>
                    </h1>
                    <p style={{ fontSize: '12px', color: T.theme.textMuted, marginTop: '6px', letterSpacing: '0.05em' }}>
                        placeholder text
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '220px' }}>
                    <T.Btn variant="primary" onClick={onNewProject}>
                        + New Project
                    </T.Btn>
                    <T.Btn variant="secondary" onClick={onOpenProject}>
                        Open Existing Project
                    </T.Btn>
                </div>

            </div>

            {/* Status bar */}
            <T.StatusBar>
                v1.0.0
            </T.StatusBar>

        </div>
    )
}

export default WelcomeScreen