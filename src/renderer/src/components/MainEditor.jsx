/* eslint-disable */
import { useState, useEffect } from 'react'
import JSZip from 'jszip'
import * as Diff from 'diff'
import FilePicker from './FilePicker'

function groupByPackage(tree, files, tag) {
    for (const path of files) {
        const parts = path.split('/')
        const fileName = parts.pop()
        const folder = parts.join('/')
        if (!tree[folder]) tree[folder] = []
        tree[folder].push({ fileName, tag })
    }
}

async function hashString(str) {
    const encoder = new TextEncoder()
    const data = encoder.encode(str)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

function diffLines(a, b) {
    const changes = Diff.diffLines(a, b)
    const result = []

    for (const change of changes) {
        const lines = change.value.split('\n')
        if (lines[lines.length - 1] === '') lines.pop()

        for (const line of lines) {
            result.push({
                line,
                added: change.added ?? false,
                removed: change.removed ?? false,
            })
        }
    }

    return result
}

function MainEditor({ project, onProjectChange, onProjectClose }) {

    const [fileTree, setFileTree] = useState(null)
    const [openFolders, setOpenFolders] = useState({})
    const [selectedFile, setSelectedFile] = useState(null)
    const [fileHashes, setFileHashes] = useState({})
    const [fileContents, setFileContents] = useState({ a: null, b: null })
    const [zips, setZips] = useState({ a: null, b: null })
    const [diff, setDiff] = useState(null)
    const [showFilePicker, setShowFilePicker] = useState(false)
    const [selectedPairs, setSelectedPairs] = useState({})
    const [hoveredLine, setHoveredLine] = useState(null)
    const [notes, setNotes] = useState({})

    useEffect(() => {
        loadJars()
    }, [])

    useEffect(() => {
        if (!fileTree) return  // jars not loaded yet

        setSelectedPairs(project.selectedPairs || {})
        setOpenFolders(project.openFolders || {})
        setSelectedFile(project.selectedFile || null)
        setNotes(project.notes || {})
    }, [fileTree])

    useEffect(() => {
        if (!selectedFile) return
        if (!zips.a || !zips.b) return
        openFile(selectedFile)
    }, [selectedFile, zips])

    useEffect(() => {
        if (!zips.a || !zips.b) return
        computeHashesForPairs(selectedPairs)
    }, [selectedPairs])

    const toggleFolder = (folder) => {
        setOpenFolders(prev => ({ ...prev, [folder]: !prev[folder] }))
    }

    const loadJars = async () => {
        try {
            const bytesA = await window.api.readJar(project.versionA.path)
            const bytesB = await window.api.readJar(project.versionB.path)

            const zipA = await JSZip.loadAsync(bytesA)
            const zipB = await JSZip.loadAsync(bytesB)

            const filesA = Object.keys(zipA.files).filter(f => f.endsWith('.java'))
            const filesB = Object.keys(zipB.files).filter(f => f.endsWith('.java'))

            const setA = new Set(filesA)
            const setB = new Set(filesB)

            const paired = filesA.filter(f => setB.has(f))   // in A AND in B
            const aOnly = filesA.filter(f => !setB.has(f))  // in A but NOT in B
            const bOnly = filesB.filter(f => !setA.has(f))  // in B but NOT in A

            const tree = {}
            groupByPackage(tree, paired, null)
            groupByPackage(tree, aOnly, 'A')
            groupByPackage(tree, bOnly, 'B')

            const taggedFiles = Object.values(tree)
                .flat()
                .filter(f => f.tag !== null)

            setFileTree({ tree, paired, aOnly, bOnly })
            setZips({ a: zipA, b: zipB })

        } catch (e) {
            console.error('loadJars failed:', e)
        }
    }

    const computeHashesForPairs = async (pairs) => {
        const paths = Object.entries(pairs).flatMap(([folder, files]) =>
            files.map(({ fileName }) => folder + '/' + fileName)
        )

        for (const filePath of paths) {
            if (fileHashes[filePath]) continue  // skip if already computed
            const contentA = await zips.a.files[filePath].async('string')
            const contentB = await zips.b.files[filePath].async('string')
            const hashA = await hashString(contentA)
            const hashB = await hashString(contentB)
            const changed = hashA !== hashB
            setFileHashes(prev => ({ ...prev, [filePath]: { hashA, hashB, changed } }))
        }
    }

    const openFile = async (filePath) => {
        try {
            const zipA = zips.a
            const zipB = zips.b

            const contentA = await zipA.files[filePath].async('string')
            const contentB = await zipB.files[filePath].async('string')

            const diff = diffLines(contentA, contentB)

            setFileContents({ a: contentA, b: contentB })
            setDiff(diff)
        } catch (e) {
            console.error('openFile failed:', e)
        }
    }

    const handleFilePickerConfirm = async (selectedPaths) => {
        // compute hashes for newly selected files
        for (const filePath of selectedPaths) {
            if (!fileHashes[filePath]) {  // skip if already computed
                const contentA = await zips.a.files[filePath].async('string')
                const contentB = await zips.b.files[filePath].async('string')
            }
        }

        setSelectedPairs(prev => {
            const grouped = { ...prev }
            groupByPackage(grouped, selectedPaths, null)
            for (const folder of Object.keys(grouped)) {
                grouped[folder].sort((a, b) => a.fileName.localeCompare(b.fileName))
            }
            return grouped
        })
        setShowFilePicker(false)
    }

    const handleSave = async () => {
        const data = {
            name: project.name,
            versionA: project.versionA.path,
            versionB: project.versionB.path,
            selectedPairs,
            openFolders,
            selectedFile,
            notes
        }

        const content = JSON.stringify(data, null, 2)

        const savePath = await window.api.saveProject(content)

        if (savePath !== null) {
            console.log('Project saved to: ', savePath)
        }
    }

    if (!fileTree) {
        return <div>Loading jars...</div>
    }

    const selectedPairsSet = new Set(Object.entries(selectedPairs).flatMap(([path, files]) =>
        files.map(({ fileName }) => path + '/' + fileName)
    ))
    const availableTree = {}
    for (const [folder, files] of Object.entries(fileTree.tree)) {
        const available = files.filter(({ fileName }) =>
            !selectedPairsSet.has(folder + '/' + fileName)
        )

        available.sort((a, b) => a.fileName.localeCompare(b.fileName))

        if (available.length > 0) {
            availableTree[folder] = available
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

            {/* Top bar */}
            <div style={{ height: '40px', borderBottom: '1px solid #444', display: 'flex', alignItems: 'center', padding: '0 12px', flexShrink: 0 }}>
                <button onClick={onProjectClose}>Close Project</button>
                <button onClick={handleSave}>Save</button>
                <span style={{ marginLeft: '12px', color: '#888', fontSize: '12px' }}>{project.name}</span>
            </div>

            {/* Main Area */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

                {/* Left panel - file tree */}
                <div style={{ width: '300px', height: '100vh', overflowY: 'auto', borderRight: '1px solid #444', padding: '8px', flexShrink: 0 }}>

                    {/* Files panel - top half */}
                    <div style={{ flex: 1, overflowY: 'auto', borderBottom: '1px solid #444', padding: '8px' }}>
                        <h4>Files</h4>
                        <button onClick={() => setShowFilePicker(true)}>+ Add Files</button>
                        {Object.keys(selectedPairs).sort().map(folder => (
                            <div key={folder}>
                                <div
                                    onClick={() => toggleFolder(folder)}
                                    style={{ cursor: 'pointer', padding: '2px 4px', userSelect: 'none' }}
                                >
                                    {openFolders[folder] ? '▼' : '▶'} {folder}
                                </div>
                                {openFolders[folder] && (
                                    <div style={{ paddingLeft: '16px' }}>
                                        {selectedPairs[folder].map(({ fileName, tag }) => (
                                            <div
                                                key={fileName}
                                                style={{ padding: '2px 4px', cursor: tag === null ? 'pointer' : 'default', color: fileHashes[folder + '/' + fileName]?.changed ? '#f87171' : 'inherit' }}
                                            ><span style={{ cursor: 'pointer', flex: 1 }} onClick={() => {
                                                const fullPath = folder + '/' + fileName
                                                setSelectedFile(fullPath)
                                                openFile(fullPath)
                                            }}>{fileName}</span>

                                                <span
                                                    style={{ cursor: 'pointer', color: '#888', fontSize: '10px', marginLeft: '4px' }}
                                                    onClick={() => {
                                                        setSelectedPairs(prev => {
                                                            const updated = { ...prev }
                                                            updated[folder] = updated[folder].filter(f => f.fileName !== fileName)
                                                            if (updated[folder].length === 0) delete updated[folder]
                                                            return updated
                                                        })
                                                        // clear selected file if it was the one removed
                                                        const removedPath = folder + '/' + fileName
                                                        if (selectedFile === removedPath) {
                                                            setSelectedFile(null)
                                                            setFileContents({ a: null, b: null })
                                                            setDiff(null)
                                                        }
                                                        // remove notes for that file
                                                        setNotes(prev => {
                                                            const updated = { ...prev }
                                                            delete updated[removedPath]
                                                            return updated
                                                        })
                                                    }}
                                                >
                                                    ✕
                                                </span>
                                                {tag && (
                                                    <span style={{ marginLeft: '6px', fontSize: '10px', color: tag === 'A' ? '#f87171' : '#60a5fa' }}>
                                                        [{tag}]
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Notes panel - bottom half */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
                        <h4>Notes</h4>
                        <p style={{ color: '#888', fontSize: '12px' }}>
                            {!selectedFile ? (
                                <p style={{ color: '#888', fontSize: '12px' }}>Select a file to see notes</p>
                            ) : (
                                <textarea
                                    style={{ flex: 1, background: '#2a2a2a', color: '#fff', border: '1px solid #444', padding: '8px', resize: 'none' }}
                                    placeholder="Add notes for this file..."
                                    value={notes[selectedFile] || ''}
                                    onChange={e => setNotes(prev => ({ ...prev, [selectedFile]: e.target.value }))}
                                />
                            )}
                        </p>
                    </div>
                </div>

                {/* Center panel */}
                <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                    {fileContents.a === null ? (
                        <div style={{ flex: 1, padding: '8px' }}>
                            <p>Select a paired file to view contents</p>
                        </div>
                    ) : (
                        <>
                            {/* Version A */}
                            <div style={{ flex: 1, overflowY: 'auto', borderRight: '1px solid #444', padding: '8px' }}>
                                <div style={{ marginBottom: '8px', color: '#888', fontSize: '12px' }}>
                                    {project.versionA.label} — {selectedFile}
                                </div>
                                {diff.map((line, i) => (
                                    <pre key={`a-${i}`}
                                        onMouseEnter={() => setHoveredLine(i)}
                                        onMouseLeave={() => setHoveredLine(null)} style={{
                                            margin: 0,
                                            fontSize: '12px',
                                            backgroundColor: line.removed ? 'rgb(190, 66, 66)' : line.added ? 'rgba(71, 171, 110, 0.15)' : 'transparent',
                                            whiteSpace: 'pre-wrap',
                                            outline: hoveredLine === i ? '1px solid yellow' : 'none'
                                        }}>
                                        {line.added ? ' ' : line.line || ' '}
                                    </pre>
                                ))}
                            </div>

                            {/* Version B */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
                                <div style={{ marginBottom: '8px', color: '#888', fontSize: '12px' }}>
                                    {project.versionB.label} — {selectedFile}
                                </div>
                                {diff.map((line, i) => (
                                    <pre key={`a-${i}`}
                                        onMouseEnter={() => setHoveredLine(i)}
                                        onMouseLeave={() => setHoveredLine(null)} style={{
                                            margin: 0,
                                            fontSize: '12px',
                                            backgroundColor: line.added ? 'rgb(71, 171, 110)' : line.removed ? 'rgba(190, 66, 66, 0.15)' : 'transparent',
                                            whiteSpace: 'pre-wrap',
                                            outline: hoveredLine === i ? '1px solid yellow' : 'none'
                                        }}>
                                        {line.removed ? ' ' : line.line || ' '}
                                    </pre>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {showFilePicker && (
                <FilePicker
                    fileTree={availableTree}
                    onConfirm={handleFilePickerConfirm}
                    onClose={() => setShowFilePicker(false)}
                />
            )}

        </div>
    )
}

export default MainEditor;