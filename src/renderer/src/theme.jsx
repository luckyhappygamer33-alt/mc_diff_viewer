/* eslint-disable */
import { useState } from 'react'

export const theme = {
  // Backgrounds
  bg: '#ffffff',
  bgPanel: '#f3f3f3',
  bgSidebar: '#f3f3f3',
  bgHover: '#e8e8e8',
  bgSelected: '#0066b8',
  bgTopbar: '#ececec',
  bgActivity: '#2c2c2c',
  bgInput: '#fafafa',

  // Borders
  border: '#e0e0e0',
  borderStrong: '#c0c0c0',

  // Text
  text: '#3b3b3b',
  textMuted: '#aaaaaa',
  textSelected: '#ffffff',
  textActivity: '#858585',

  // Accent
  accent: '#0066b8',
  accentHover: '#0073cc',

  // Status bar
  statusBar: '#0066b8',

  // Diff colors
  diffRemoved: 'rgba(190, 66, 66, 0.25)',
  diffAdded: 'rgba(71, 171, 110, 0.25)',
  diffRemovedDim: 'rgba(190, 66, 66, 0.08)',
  diffAddedDim: 'rgba(71, 171, 110, 0.08)',
}

export function Btn({ onClick, children, variant = 'secondary', disabled = false, style = {} }) {
  const base = {
    padding: '7px 16px',
    fontSize: '12px',
    fontFamily: "'Consolas', monospace",
    borderRadius: '3px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s',
    border: 'none',
    outline: 'none',
    ...style
  }

  const variants = {
    primary: {
      background: disabled ? theme.border : theme.accent,
      color: disabled ? theme.textMuted : '#fff',
      border: 'none',
    },
    secondary: {
      background: 'transparent',
      color: theme.text,
      border: `1px solid ${theme.borderStrong}`,
    },
  }

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      onMouseEnter={e => {
        if (disabled) return
        if (variant === 'primary') e.currentTarget.style.background = theme.accentHover
        else { e.currentTarget.style.background = theme.bgHover; e.currentTarget.style.borderColor = theme.accent }
      }}
      onMouseLeave={e => {
        if (disabled) return
        if (variant === 'primary') e.currentTarget.style.background = theme.accent
        else { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = theme.borderStrong }
      }}
      onMouseDown={e => { if (!disabled) e.currentTarget.style.transform = 'scale(0.97)' }}
      onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
      style={{ ...base, ...variants[variant] }}
    >
      {children}
    </button>
  )
}

export function TopBar({ children }) {
  return (
    <div style={{ height: '40px', background: theme.bgTopbar, borderBottom: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', padding: '0 12px', gap: '8px', flexShrink: 0 }}>
      {children}
    </div>
  )
}

export function Panel({ children, width = '300px' }) {
  return (
    <div style={{ width, flexShrink: 0, height: '100%', overflowY: 'auto', borderRight: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column' }}>
      {children}
    </div>
  )
}

export function PanelSection({ children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto', padding: '8px', borderBottom: `1px solid ${theme.border}` }}>
      {children}
    </div>
  )
}

export function PanelHeader({ children }) {
  return (
    <div style={{ fontSize: '11px', fontWeight: 600, color: theme.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '8px 4px 6px' }}>
      {children}
    </div>
  )
}

export function FolderRow({ label, open, onClick, onRemove }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      title={label ?? ''}
      onClick={onClick}
      style={{
        cursor: 'pointer',
        padding: '3px 4px',
        userSelect: 'none',
        fontSize: '12px',
        background: hovered ? theme.bgHover : 'transparent',
        color: theme.textMuted,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '4px'
      }}
      onMouseEnter={e => {
        setHovered(true)
      }}
      onMouseLeave={e => {
        setHovered(false)
      }}
    >
      {open ? '▼' : '▶'} {label}
      {
        onRemove && hovered && (
          <span
            onClick={e => { e.stopPropagation(); onRemove() }}
            style={{ fontSize: '10px', color: theme.textMuted, marginLeft: '4px', cursor: 'pointer', padding: '0 2px' }}
            onMouseEnter={e => e.currentTarget.style.color = '#e05555'}
            onMouseLeave={e => e.currentTarget.style.color = theme.textMuted}
          >
            ✕
          </span>
        )
      }
    </div>
  )
}

export function FileRow({ fileName, changed, selected, onClick, onRemove, children }) {
  const [hovered, setHovered] = useState(false)

  return (
    < div
      title={fileName ?? ''
      }
      style={{
        padding: '3px 4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer',
        background: selected
          ? (changed ? 'rgba(190, 66, 66, 0.15)' : 'rgba(0, 102, 184, 0.15)')
          : hovered ? theme.bgHover : 'transparent',
        color: changed ? '#c0392b' : selected ? theme.accent : theme.text,
        borderRadius: '2px'
      }}
      onMouseEnter={e => {
        setHovered(true)
      }}
      onMouseLeave={e => {
        setHovered(false)
      }}
    >
      <span style={{ fontSize: '12px', flex: 1 }} onClick={onClick}>{fileName}</span>
      {children}
      {
        onRemove && hovered && (
          <span
            onClick={e => { e.stopPropagation(); onRemove() }}
            style={{ fontSize: '10px', color: theme.textMuted, marginLeft: '4px', cursor: 'pointer', padding: '0 2px' }}
            onMouseEnter={e => e.currentTarget.style.color = '#e05555'}
            onMouseLeave={e => e.currentTarget.style.color = theme.textMuted}
          >
            ✕
          </span>
        )
      }
    </div >
  )
}

export function StatusBar({ children }) {
  return (
    <div style={{
      height: '22px',
      background: theme.statusBar,
      display: 'flex',
      alignItems: 'center',
      padding: '0 10px',
      gap: '12px',
      flexShrink: 0,
      fontFamily: "'Consolas', monospace",
      fontSize: '11px',
      color: 'rgba(255,255,255,0.85)'
    }}>
      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)' }}>{children}</span>
    </div>
  )
}

export function DiffPanel({ children, borderRight = false }) {
  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      overflowX: 'auto',
      padding: '8px',
      color: theme.text,
      fontFamily: "'Consolas', monospace",
      borderRight: borderRight ? `1px solid ${theme.border}` : 'none',
      background: theme.bg,
      whiteSpace: 'pre'
    }}>
      {children}
    </div>
  )
}

export function DiffHeader({ children }) {
  return (
    <div style={{ marginBottom: '8px', color: theme.textMuted, fontSize: '11px', borderBottom: `1px solid ${theme.border}`, paddingBottom: '6px' }}>
      {children}
    </div>
  )
}

export function ProjectBadge({ name, onRename }) {
  const [editingName, setEditingName] = useState(false)
  const [inputValue, setInputValue] = useState(name)

  if (editingName) {
    return (
      <input
        autoFocus
        value={inputValue}
        size={Math.max(inputValue.length, 1)}
        onChange={e => setInputValue(e.target.value)}
        onBlur={e => {
          const val = e.target.value.trim()
          if (val.length === 0) {
            setInputValue(name)  // revert to original name
            setEditingName(false)
            return
          };
          onRename(val)
          setEditingName(false)
        }}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            const val = e.target.value.trim()
            if (val.length === 0) {
              setInputValue(name)  // revert to original name
              setEditingName(false)
              return
            };
            onRename(val)
            setEditingName(false)
          }
        }}
        style={{
          padding: '3px 12px',
          border: `1px solid ${theme.accent}`,
          borderRadius: '6px',
          fontSize: '12px',
          fontFamily: "'Consolas', monospace",
          outline: 'none',
          color: theme.text,
          textAlign: 'center'
        }}
      />
    )
  }

  return (
    <div style={{
      width: 'fit-content',
      padding: '3px 12px',
      border: `1px solid ${theme.border}`,
      borderRadius: '6px',
      fontSize: '12px',
      color: theme.textMuted,
      fontFamily: "'Consolas', monospace",
    }}
      onClick={() => { setInputValue(name); setEditingName(true) }}
    >
      {name}
    </div>
  )
}

export function FormField({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <span style={{ fontSize: '11px', color: theme.textMuted, letterSpacing: '0.08em' }}>
        {label}
      </span>
      {children}
    </div>
  )
}

export function TextInput({ value, onChange, placeholder }) {
  return (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{
        padding: '8px 10px',
        background: theme.bgInput,
        color: theme.text,
        border: `1px solid ${theme.border}`,
        borderRadius: '3px',
        fontSize: '12px',
        fontFamily: "'Consolas', monospace",
        outline: 'none',
        width: '100%',
      }}
      onFocus={e => e.target.style.borderColor = theme.accent}
      onBlur={e => e.target.style.borderColor = theme.border}
    />
  )
}

export function JarPicker({ label, path, onPick }) {
  return (
    <FormField label={label}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Btn variant="secondary" onClick={onPick}>Browse</Btn>
        <span title={path ?? ''} style={{
          fontSize: '11px',
          color: path ? theme.text : theme.textMuted,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {path ? path.split('\\').pop() : 'Not selected'}
        </span>
      </div>
    </FormField>
  )
}

export function CheckFolderRow({ label, open, onToggle, checked, onCheck }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '3px 4px',
        userSelect: 'none',
        background: hovered ? theme.bgHover : 'transparent',
        borderRadius: '2px'
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span onClick={onToggle} style={{ fontSize: '12px', color: theme.textMuted, cursor: 'pointer' }}>
        {open ? '▼' : '▶'} {label}
      </span>
      <input type="checkbox" checked={checked} onChange={onCheck} style={{ cursor: 'pointer', flexShrink: 0, marginLeft: '6px' }} />

    </div>
  )
}

export function CheckFileRow({ fileName, checked, onChange }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '3px 4px',
        gap: '6px',
        background: hovered ? theme.bgHover : 'transparent',
        borderRadius: '2px',
        cursor: 'pointer'
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onChange}
    >
      <input type="checkbox" checked={checked} onChange={onChange} onClick={e => e.stopPropagation()} style={{ cursor: 'pointer', flexShrink: 0 }} />
      <span style={{ fontSize: '12px', color: theme.text }}>{fileName}</span>
    </div>
  )
}