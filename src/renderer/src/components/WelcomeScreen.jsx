/* eslint-disable */
function WelcomeScreen({ onNewProject, onOpenProject }) {
    return (
        <div>
            <h1>MC Diff Viewer</h1>
            <button onClick={onNewProject}>New Project</button>
            <button onClick={onOpenProject}>Open Existing Project</button>
        </div>
    )
}

export default WelcomeScreen;
