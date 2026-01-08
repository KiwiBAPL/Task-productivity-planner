import { useState, useRef, useEffect } from 'react'

interface TextEditorProps {
  value: string
  onChange: (html: string) => void
  onBlur?: () => void
  placeholder?: string
  className?: string
}

export function TextEditor({ value, onChange, onBlur, placeholder, className }: TextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })

  // Initialize editor content on mount
  useEffect(() => {
    if (editorRef.current && !editorRef.current.innerHTML && value) {
      editorRef.current.innerHTML = value
    }
  }, [value])

  // Update editor content when value prop changes (but not while user is typing)
  useEffect(() => {
    if (editorRef.current && !isFocused && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || ''
    }
  }, [value, isFocused])

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  const getSelection = () => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return null
    return selection.getRangeAt(0)
  }

  const applyFormat = (tag: string, attributes?: Record<string, string>) => {
    const range = getSelection()
    if (!range || range.collapsed) {
      editorRef.current?.focus()
      return
    }

    const selectedText = range.toString()
    if (!selectedText) return

    const element = document.createElement(tag)
    if (attributes) {
      Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value)
      })
    }
    element.textContent = selectedText

    range.deleteContents()
    range.insertNode(element)

    editorRef.current?.focus()
    handleInput()
  }

  const toggleFormat = (tag: string) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/2d17eab2-d1b0-4bfa-8292-fc3e189d183d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TextEditor.tsx:68',message:'toggleFormat entry',data:{tag,hasEditorRef:!!editorRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    const range = getSelection()
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/2d17eab2-d1b0-4bfa-8292-fc3e189d183d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TextEditor.tsx:72',message:'After getSelection',data:{hasRange:!!range,isCollapsed:range?.collapsed,selectedText:range?.toString()?.substring(0,50)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    if (!range || range.collapsed) {
      editorRef.current?.focus()
      return
    }

    const selectedText = range.toString()
    if (!selectedText) return

    // Save selection
    const selection = window.getSelection()
    
    // Wrap selection in the tag
    const element = document.createElement(tag)
    try {
      // Try to use surroundContents first (works when selection is within a single element)
      range.surroundContents(element)
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/2d17eab2-d1b0-4bfa-8292-fc3e189d183d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TextEditor.tsx:88',message:'surroundContents succeeded',data:{tag},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
    } catch (e) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/2d17eab2-d1b0-4bfa-8292-fc3e189d183d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TextEditor.tsx:92',message:'surroundContents failed, using manual wrap',data:{tag,error:JSON.stringify(e)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      // If surroundContents fails (selection spans multiple elements), manually wrap
      const contents = range.extractContents()
      element.appendChild(contents)
      range.insertNode(element)
    }

    // Restore selection
    if (selection) {
      selection.removeAllRanges()
      const newRange = document.createRange()
      newRange.selectNodeContents(element)
      selection.addRange(newRange)
    }

    editorRef.current?.focus()
    handleInput()
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/2d17eab2-d1b0-4bfa-8292-fc3e189d183d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TextEditor.tsx:105',message:'toggleFormat complete',data:{tag,newHTML:editorRef.current?.innerHTML?.substring(0,100)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
  }

  const handleBold = () => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/2d17eab2-d1b0-4bfa-8292-fc3e189d183d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TextEditor.tsx:101',message:'handleBold called',data:{hasEditorRef:!!editorRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    toggleFormat('strong')
    setShowMenu(false)
  }

  const handleItalic = () => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/2d17eab2-d1b0-4bfa-8292-fc3e189d183d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TextEditor.tsx:107',message:'handleItalic called',data:{hasEditorRef:!!editorRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    toggleFormat('em')
    setShowMenu(false)
  }

  const handleUnderline = () => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/2d17eab2-d1b0-4bfa-8292-fc3e189d183d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TextEditor.tsx:113',message:'handleUnderline called',data:{hasEditorRef:!!editorRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    toggleFormat('u')
    setShowMenu(false)
  }

  const handleLink = () => {
    const range = getSelection()
    if (!range || range.collapsed) {
      editorRef.current?.focus()
      setShowMenu(false)
      return
    }

    const url = prompt('Enter URL:')
    if (!url) {
      setShowMenu(false)
      return
    }

    const selectedText = range.toString()
    if (!selectedText) {
      setShowMenu(false)
      return
    }

    const link = document.createElement('a')
    link.href = url
    link.textContent = selectedText
    link.target = '_blank'
    link.rel = 'noopener noreferrer'

    range.deleteContents()
    range.insertNode(link)

    editorRef.current?.focus()
    handleInput()
    setShowMenu(false)
  }

  const handleRemoveLink = () => {
    const range = getSelection()
    if (!range) {
      setShowMenu(false)
      return
    }

    let node = range.commonAncestorContainer
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentElement!
    }

    const link = (node as Element).closest('a')
    if (link) {
      const text = document.createTextNode(link.textContent || '')
      link.replaceWith(text)
      editorRef.current?.focus()
      handleInput()
    }
    setShowMenu(false)
  }

  const updateMenuPosition = () => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/2d17eab2-d1b0-4bfa-8292-fc3e189d183d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TextEditor.tsx:176',message:'updateMenuPosition called',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    const selection = window.getSelection()
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/2d17eab2-d1b0-4bfa-8292-fc3e189d183d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TextEditor.tsx:180',message:'Selection check',data:{hasSelection:!!selection,rangeCount:selection?.rangeCount,isCollapsed:selection?.isCollapsed},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      setShowMenu(false)
      return
    }

    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    
    setMenuPosition({
      top: rect.top - 50,
      left: rect.left + rect.width / 2,
    })
    setShowMenu(true)
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/2d17eab2-d1b0-4bfa-8292-fc3e189d183d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TextEditor.tsx:193',message:'Menu shown',data:{top:rect.top - 50,left:rect.left + rect.width / 2},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
  }

  const handleMouseUp = () => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/2d17eab2-d1b0-4bfa-8292-fc3e189d183d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TextEditor.tsx:191',message:'handleMouseUp called',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    // Small delay to ensure selection is complete
    setTimeout(updateMenuPosition, 10)
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    const selection = window.getSelection()
    if (selection && !selection.isCollapsed) {
      updateMenuPosition()
    } else {
      setMenuPosition({ top: e.clientY, left: e.clientX })
      setShowMenu(true)
    }
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showMenu && !(e.target as Element).closest('.text-editor-menu') && !(e.target as Element).closest('[contenteditable]')) {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener('click', handleClickOutside)
      document.addEventListener('selectionchange', () => {
        const selection = window.getSelection()
        if (!selection || selection.isCollapsed) {
          setShowMenu(false)
        }
      })
      return () => {
        document.removeEventListener('click', handleClickOutside)
        document.removeEventListener('selectionchange', updateMenuPosition)
      }
    }
  }, [showMenu])

  return (
    <div className={`relative ${className || ''}`}>
      {/* Formatting Toolbar - Always visible when focused */}
      {isFocused && (
        <div className="absolute -top-12 left-0 z-50 flex items-center gap-1 glass-card p-2 rounded-lg border border-auro-stroke-subtle">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleBold()
            }}
            className="p-1.5 rounded hover:bg-white/10 transition-colors text-auro-text-secondary hover:text-auro-text-primary"
            title="Bold"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6zM6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleItalic()
            }}
            className="p-1.5 rounded hover:bg-white/10 transition-colors text-auro-text-secondary hover:text-auro-text-primary"
            title="Italic"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleUnderline()
            }}
            className="p-1.5 rounded hover:bg-white/10 transition-colors text-auro-text-secondary hover:text-auro-text-primary"
            title="Underline"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5v14M19 5v14M3 3h18M3 21h18" />
            </svg>
          </button>
          <div className="w-px h-6 bg-auro-divider mx-1" />
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleLink()
            }}
            className="p-1.5 rounded hover:bg-white/10 transition-colors text-auro-text-secondary hover:text-auro-text-primary"
            title="Insert Link"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleRemoveLink()
            }}
            className="p-1.5 rounded hover:bg-white/10 transition-colors text-auro-text-secondary hover:text-auro-text-primary"
            title="Remove Link"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </button>
        </div>
      )}

      {/* Context Menu - Appears on text selection or right-click */}
      {showMenu && (
        <div
          className="text-editor-menu fixed z-50 glass-card p-2 rounded-lg border border-auro-stroke-subtle shadow-lg"
          style={{
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`,
            minWidth: '180px',
            transform: 'translateX(-50%)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleBold()
              }}
              className="px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-left text-sm text-auro-text-primary flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6zM6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
              </svg>
              <span>Bold</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleItalic()
              }}
              className="px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-left text-sm text-auro-text-primary flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              <span>Italic</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleUnderline()
              }}
              className="px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-left text-sm text-auro-text-primary flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5v14M19 5v14M3 3h18M3 21h18" />
              </svg>
              <span>Underline</span>
            </button>
            <div className="w-full h-px bg-auro-divider my-1" />
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleLink()
              }}
              className="px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-left text-sm text-auro-text-primary flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span>Insert Link</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleRemoveLink()
              }}
              className="px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-left text-sm text-auro-text-primary flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              <span>Remove Link</span>
            </button>
          </div>
        </div>
      )}

      {/* Editable div */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onMouseUp={handleMouseUp}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false)
          onBlur?.()
        }}
        onContextMenu={handleContextMenu}
        className={`min-h-[60px] w-full px-3 py-2 rounded-lg bg-auro-surface1 border border-auro-stroke-subtle focus:border-auro-accent focus:outline-none text-auro-text-primary ${
          !value && !isFocused ? 'text-auro-text-tertiary' : ''
        }`}
        style={{
          wordBreak: 'break-word',
        }}
        data-placeholder={placeholder || 'Enter text...'}
        suppressContentEditableWarning
      />
      <style>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: rgb(148, 163, 184);
          pointer-events: none;
        }
        [contenteditable] a {
          color: rgb(139, 92, 246);
          text-decoration: underline;
        }
        [contenteditable] a:hover {
          color: rgb(167, 139, 250);
        }
        [contenteditable] strong {
          font-weight: 600;
        }
        [contenteditable] em {
          font-style: italic;
        }
        [contenteditable] u {
          text-decoration: underline;
        }
      `}</style>
    </div>
  )
}
