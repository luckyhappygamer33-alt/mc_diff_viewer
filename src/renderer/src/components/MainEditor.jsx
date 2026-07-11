/* eslint-disable */
import { useState, useEffect, useRef } from 'react'
import JSZip from 'jszip'
import * as Diff from 'diff'
import FilePicker from './FilePicker'
import * as T from '../theme'

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

    const [projectName, setProjectName] = useState(null)
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

    const panelARef = useRef(null)
    const panelBRef = useRef(null)
    const isSyncing = useRef(false)

    useEffect(() => {
        loadJars()
    }, [])

    useEffect(() => {
        if (!fileTree) return  // jars not loaded yet

        setProjectName(project.name || null)
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

    const handleScrollSync = (source, target) => {
        if (isSyncing.current) return
        if (!source || !target) return

        isSyncing.current = true
        target.scrollTop = source.scrollTop
        target.scrollLeft = source.scrollLeft
        console.log('syncings')

        setTimeout(() => {
            isSyncing.current = false
        }, 0)
    }

    const handleSave = async () => {
        const data = {
            name: projectName,
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
        <div style={{ display: 'flex', background: T.theme.bg, flexDirection: 'column', height: '100vh', width: '100%', overflow: 'hidden' }}>

            {/* Top bar */}
            <T.TopBar>
                <T.Btn variant='secondary' onClick={onProjectClose}>Close Project</T.Btn>
                <T.Btn variant='primary' onClick={handleSave}>Save</T.Btn>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                    <T.ProjectBadge name={projectName} onRename={projectName => {
                        setProjectName(projectName)
                    }} />
                </div>
            </T.TopBar>

            {/* Main Area */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

                {/* Left panel - file tree */}
                <T.Panel>

                    {/* Files panel - top half */}
                    <T.PanelSection>
                        <T.PanelHeader>Files</T.PanelHeader>
                        <T.Btn variant='primary' style={{ width: '90' }} onClick={() => setShowFilePicker(true)}>+ Add Files</T.Btn>
                        {Object.keys(selectedPairs).sort().map(folder => (
                            <div key={folder}>
                                <T.FolderRow
                                    label={folder}
                                    onClick={() => toggleFolder(folder)}
                                    onRemove={() => {
                                        // remove all files in this folder from selectedPairs
                                        setSelectedPairs(prev => {
                                            const updated = { ...prev }
                                            delete updated[folder]
                                            return updated
                                        })
                                        // remove from openFolders too
                                        setOpenFolders(prev => {
                                            const updated = { ...prev }
                                            delete updated[folder]
                                            return updated
                                        })
                                        // clear selected file if it was in this folder
                                        if (selectedFile && selectedFile.startsWith(folder + '/')) {
                                            setSelectedFile(null)
                                            setFileContents({ a: null, b: null })
                                            setDiff(null)
                                        }
                                        // remove notes for all files in this folder
                                        setNotes(prev => {
                                            const updated = { ...prev }
                                            for (const key of Object.keys(updated)) {
                                                if (key.startsWith(folder + '/')) delete updated[key]
                                            }
                                            return updated
                                        })
                                    }}
                                    open={openFolders[folder]}
                                >
                                </T.FolderRow>
                                {openFolders[folder] && (
                                    <div style={{ paddingLeft: '16px' }}>
                                        {selectedPairs[folder].map(({ fileName, tag }) => (
                                            <T.FileRow
                                                key={fileName}
                                                fileName={fileName}
                                                changed={fileHashes[folder + '/' + fileName]?.changed}
                                                selected={selectedFile === folder + '/' + fileName ? true : false}
                                                onClick={() => {
                                                    const fullPath = folder + '/' + fileName
                                                    setSelectedFile(fullPath)
                                                    openFile(fullPath)
                                                }}
                                                onRemove={() => {
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
                                                {tag && (
                                                    <span style={{ marginLeft: '6px', fontSize: '10px', color: tag === 'A' ? '#f87171' : '#60a5fa' }}>
                                                        [{tag}]
                                                    </span>
                                                )}
                                            </T.FileRow>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </T.PanelSection>

                    {/* Notes panel - bottom half */}
                    <T.PanelSection>
                        <T.PanelHeader>Notes</T.PanelHeader>
                        {!selectedFile ? (
                            <p style={{ color: `${T.theme.textMuted}`, fontSize: '12px', padding: '8px 4px 6px' }}>Select a file to see notes</p>
                        ) : (
                            <textarea
                                style={{
                                    width: '100%',
                                    flex: 1,
                                    background: T.theme.bgInput,
                                    color: T.theme.text,
                                    border: `1px solid ${T.theme.border}`,
                                    padding: '8px',
                                    resize: 'none',
                                    fontFamily: "'Consolas', monospace",
                                    fontSize: '12px',
                                    borderRadius: '3px',
                                    outline: 'none',
                                    minHeight: '120px'
                                }}
                                placeholder="Add notes for this file..."
                                value={notes[selectedFile] || ''}
                                onChange={e => setNotes(prev => ({ ...prev, [selectedFile]: e.target.value }))}
                            />
                        )}

                    </T.PanelSection>
                </T.Panel>

                {/* Center panel */}
                <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                    {fileContents.a === null ? (
                        <div style={{ flex: 1, padding: '8px' }}>
                            <p>Select a paired file to view contents</p>
                        </div>
                    ) : (
                        <>
                            {/* Version A */}
                            <T.DiffPanel scrollRef={panelARef} onScroll={() => handleScrollSync(panelARef.current, panelBRef.current)}>
                                <T.DiffHeader>
                                    Version A — {selectedFile}
                                </T.DiffHeader>
                                <div style={{ minWidth: 'max-content' }}>
                                    {diff.map((line, i) => (
                                        <pre key={`a-${i}`}
                                            onMouseEnter={() => setHoveredLine(i)}
                                            onMouseLeave={() => setHoveredLine(null)} style={{
                                                display: 'block',
                                                margin: 0,
                                                fontSize: '12px',
                                                backgroundColor: line.removed ? `${T.theme.diffRemoved}` : line.added ? `${T.theme.diffAddedDim}` : 'transparent',
                                                whiteSpace: 'pre',
                                                outline: hoveredLine === i ? '3px solid orange' : 'none'
                                            }}>
                                            {line.added ? ' ' : line.line || ' '}
                                        </pre>
                                    ))}
                                </div>
                            </T.DiffPanel>

                            {/* Version B */}
                            <T.DiffPanel scrollRef={panelBRef} onScroll={() => handleScrollSync(panelBRef.current, panelARef.current)}>
                                <T.DiffHeader>
                                    Version B — {selectedFile}
                                </T.DiffHeader>
                                <div style={{ minWidth: 'max-content' }}>
                                    {diff.map((line, i) => (
                                        <pre key={`a-${i}`}
                                            onMouseEnter={() => setHoveredLine(i)}
                                            onMouseLeave={() => setHoveredLine(null)} style={{
                                                display: 'block',
                                                margin: 0,
                                                fontSize: '12px',
                                                backgroundColor: line.added ? `${T.theme.diffAdded}` : line.removed ? `${T.theme.diffRemovedDim}` : 'transparent',
                                                whiteSpace: 'pre',
                                                outline: hoveredLine === i ? '3px solid orange' : 'none'
                                            }}>
                                            {line.removed ? ' ' : line.line || ' '}
                                        </pre>
                                    ))}
                                </div>
                            </T.DiffPanel>
                        </>
                    )}
                </div>
            </div >

            <T.StatusBar>
                v1.0.0
            </T.StatusBar>

            {
                showFilePicker && (
                    <FilePicker
                        fileTree={availableTree}
                        onConfirm={handleFilePickerConfirm}
                        onClose={() => setShowFilePicker(false)}
                    />
                )
            }

        </div >
    )
}

export default MainEditor;