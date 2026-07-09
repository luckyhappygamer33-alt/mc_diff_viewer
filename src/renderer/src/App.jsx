/* eslint-disable */
import { useState } from 'react'
import WelcomeScreen from './components/WelcomeScreen'
import SetupWizard from './components/SetupWizard'
import MainEditor from './components/MainEditor'

function App() {
  // Which screen is currently shown
  const [screen, setScreen] = useState('welcome')

  // The active project data — null until a project is created or loaded
  const [project, setProject] = useState(null)

  // Called when user clicks "New Project" on welcome screen
  const handleNewProject = () => {
    setScreen('setup')
  }

  // Called when user clicks "Open Existing Project" on welcome screen
  const handleOpenProject = async () => {
    const path = await window.api.pickProject()
    if (!path) return

    const content = await window.api.readFile(path)
    if (!content) return

    try {
      const projectData = JSON.parse(content)
      // Remember where this project was loaded from so we can save back to it
      projectData.savedPath = path
      setProject(projectData)
      setScreen('editor')
    } catch (e) {
      console.error('Failed to parse project file:', e)
    }
  }

  // Called when SetupWizard finishes — hands off the new project data
  const handleProjectReady = (projectData) => {
    setProject(projectData)
    setScreen('editor')
  }

  if (screen === 'welcome') {
    return <WelcomeScreen onNewProject={handleNewProject} onOpenProject={handleOpenProject} />
  }

  if (screen === 'setup') {
    return <SetupWizard onProjectReady={handleProjectReady} onBack={() => setScreen('welcome')} />
  }

  if (screen === 'editor') {
    return <MainEditor project={project} onProjectChange={setProject} />
  }
}

export default App;