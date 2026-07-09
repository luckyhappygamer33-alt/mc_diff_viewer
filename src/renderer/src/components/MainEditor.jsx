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

function MainEditor({ project, onProjectChange }) {

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

    useEffect(() => {
        loadJars()
    }, [])

    const toggleFolder = (folder) => {
        setOpenFolders(prev => ({ ...prev, [folder]: !prev[folder] }))
    }

    const loadJars = async () => {
        try {
            // console.log('Reading jars...')
            // console.log('Path A:', project.versionA.path)
            // console.log('Path B:', project.versionB.path)

            const bytesA = await window.api.readJar(project.versionA.path)
            // console.log('bytesA type:', bytesA?.constructor?.name)
            // console.log('bytesA length:', bytesA?.length)

            const bytesB = await window.api.readJar(project.versionB.path)
            // console.log('bytesB length:', bytesB?.length)

            const zipA = await JSZip.loadAsync(bytesA)
            // console.log('zipA loaded, files:', Object.keys(zipA.files).length)

            const zipB = await JSZip.loadAsync(bytesB)
            // console.log('zipB loaded, files:', Object.keys(zipB.files).length)

            const filesA = Object.keys(zipA.files).filter(f => f.endsWith('.java'))
            const filesB = Object.keys(zipB.files).filter(f => f.endsWith('.java'))

            // console.log('Java files in A:', filesA.length)
            // console.log('Java files in B:', filesB.length)
            // console.log('First 5 from A:', filesA.slice(0, 5))

            const setA = new Set(filesA)
            const setB = new Set(filesB)

            const paired = filesA.filter(f => setB.has(f))   // in A AND in B
            const aOnly = filesA.filter(f => !setB.has(f))  // in A but NOT in B
            const bOnly = filesB.filter(f => !setA.has(f))  // in B but NOT in A

            // console.log('Paired:', paired.length)
            // console.log('A only:', aOnly.length)
            // console.log('B only:', bOnly.length)

            const tree = {}
            groupByPackage(tree, paired, null)
            groupByPackage(tree, aOnly, 'A')
            groupByPackage(tree, bOnly, 'B')

            const taggedFiles = Object.values(tree)
                .flat()
                .filter(f => f.tag !== null)
            // console.log('Tagged files:', taggedFiles.slice(0, 5))

            // const folders = Object.keys(tree)
            // console.log('Total folders:', folders.length)
            // console.log('First 3 folders:', folders.slice(0, 3))
            // console.log('Files in first folder:', tree[folders[0]])

            setFileTree({ tree, paired, aOnly, bOnly })
            setZips({ a: zipA, b: zipB })

        } catch (e) {
            console.error('loadJars failed:', e)
        }
    }

    const openFile = async (filePath) => {
        try {
            const zipA = zips.a
            const zipB = zips.b

            const contentA = await zipA.files[filePath].async('string')
            const contentB = await zipB.files[filePath].async('string')

            const hashA = await hashString(contentA)
            const hashB = await hashString(contentB)
            const changed = hashA !== hashB

            // console.log('Content A length:', contentA.length)
            // console.log('Content B length:', contentB.length)
            // console.log('First 3 lines A:', contentA.split('\n').slice(0, 3))

            const diff = diffLines(contentA, contentB)
            console.log('Total lines:', diff.length)
            // console.log('Changed lines:', diff.filter(l => l.changed).length)
            console.log('First 5 lines:', diff.slice(0, 5))

            setFileHashes(prev => ({ ...prev, [filePath]: { hashA, hashB, changed } }))
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
                const hashA = await hashString(contentA)
                const hashB = await hashString(contentB)
                const changed = hashA !== hashB
                setFileHashes(prev => ({ ...prev, [filePath]: { hashA, hashB, changed } }))
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
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

            {/* Left panel - file tree */}
            <div style={{ width: '300px', height: '100vh', overflowY: 'auto', borderRight: '1px solid #444', padding: '8px', flexShrink: 0 }}>
                <h3 style={{ margin: '0 0 8px 0' }}>{project.name}</h3>
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