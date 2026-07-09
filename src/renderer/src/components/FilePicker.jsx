/* eslint-disable */
import { useState } from 'react'

function FilePicker({ fileTree, onConfirm, onClose }) {
    const [checked, setChecked] = useState({})
    const [openFolders, setOpenFolders] = useState({})

    const toggleFolder = (folder) => {
        setOpenFolders(prev => ({ ...prev, [folder]: !prev[folder] }))
    }

    const toggleFile = (filePath) => {
        setChecked(prev => ({ ...prev, [filePath]: !prev[filePath] }))
    }

    const toggleFolderFiles = (folder) => {
        const files = fileTree[folder]
        const allChecked = files.every(({ fileName }) => checked[folder + '/' + fileName])
        const newValue = !allChecked
        const updates = {}
        for (const { fileName } of files) {
            updates[folder + '/' + fileName] = newValue
        }
        setChecked(prev => ({ ...prev, ...updates }))
    }

    const selectedCount = Object.values(checked).filter(Boolean).length

    const handleConfirm = () => {
        const selected = Object.entries(checked)
            .filter(([_, isChecked]) => isChecked)
            .map(([filePath]) => filePath)
        onConfirm(selected)
    }

    return (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: '#1a1a1a', zIndex: 100, display: 'flex', flexDirection: 'column', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                <button onClick={onClose}>← Back</button>
                <h2 style={{ margin: '0 16px' }}>Select files to compare</h2>
                <span style={{ color: '#888' }}>Selected: {selectedCount} files</span>
                <button onClick={handleConfirm} disabled={selectedCount === 0} style={{ marginLeft: 'auto' }}>
                    Confirm
                </button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1 }}>
                {Object.keys(fileTree).sort().map(folder => (
                    <div key={folder}>
                        <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '2px 4px', userSelect: 'none' }}>
                            <span onClick={() => toggleFolder(folder)}>
                                {openFolders[folder] ? '▼' : '▶'} {folder}
                            </span>
                            <input
                                type="checkbox"
                                style={{ marginLeft: '8px' }}
                                checked={fileTree[folder].every(({ fileName }) => checked[folder + '/' + fileName])}
                                onChange={() => toggleFolderFiles(folder)}
                            />
                        </div>

                        {openFolders[folder] && (
                            <div style={{ paddingLeft: '16px' }}>
                                {fileTree[folder].map(({ fileName }) => (
                                    <div key={fileName} style={{ display: 'flex', alignItems: 'center', padding: '2px 4px' }}>
                                        <input
                                            type="checkbox"
                                            checked={!!checked[folder + '/' + fileName]}
                                            onChange={() => toggleFile(folder + '/' + fileName)}
                                        />
                                        <span style={{ marginLeft: '6px' }}>{fileName}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

export default FilePicker;
