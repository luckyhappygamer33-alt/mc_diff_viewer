/* eslint-disable */
import { useState } from 'react'
import * as T from '../theme'

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
        <div style={{ position: 'fixed', inset: 0, background: T.theme.bg, zIndex: 100, display: 'flex', flexDirection: 'column', fontFamily: "'Consolas', monospace" }}>

            <T.TopBar>
                <T.Btn variant="secondary" onClick={onClose}>← Back</T.Btn>
                <span style={{ fontSize: '13px', color: T.theme.text, marginLeft: '8px' }}>
                    Select files to compare
                </span>
                <div style={{ flex: 1 }} />
                <span style={{ fontSize: '12px', color: T.theme.textMuted, marginRight: '12px' }}>
                    {selectedCount} selected
                </span>
                <T.Btn variant="primary" onClick={handleConfirm} disabled={selectedCount === 0}>
                    Confirm
                </T.Btn>
            </T.TopBar>

            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
                {Object.keys(fileTree).sort().map(folder => (
                    <div key={folder}>
                        <T.CheckFolderRow
                            label={folder}
                            open={openFolders[folder]}
                            onToggle={() => toggleFolder(folder)}
                            checked={fileTree[folder].every(({ fileName }) => checked[folder + '/' + fileName])}
                            onCheck={() => toggleFolderFiles(folder)}
                        />
                        {openFolders[folder] && (
                            <div style={{ paddingLeft: '16px' }}>
                                {fileTree[folder].map(({ fileName }) => (
                                    <T.CheckFileRow
                                        key={fileName}
                                        fileName={fileName}
                                        checked={!!checked[folder + '/' + fileName]}
                                        onChange={() => toggleFile(folder + '/' + fileName)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <T.StatusBar>
                {selectedCount === 0 ? 'No files selected' : `${selectedCount} file${selectedCount === 1 ? '' : 's'} selected`}
            </T.StatusBar>

        </div>
    )
}

export default FilePicker