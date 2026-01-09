import { useRef } from 'react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

interface TextEditorProps {
  value: string
  onChange: (html: string) => void
  onBlur?: () => void
  placeholder?: string
  className?: string
}

export function TextEditor({ value, onChange, onBlur, placeholder, className }: TextEditorProps) {
  const quillRef = useRef<ReactQuill>(null)

  // Quill toolbar configuration with comprehensive formatting options
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      [{ 'color': [] }, { 'background': [] }],
      ['link'],
      ['clean']
    ]
  }

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'align',
    'color', 'background',
    'link'
  ]

  // Handle onChange from Quill
  const handleChange = (content: string) => {
    onChange(content)
  }

  // Handle onBlur
  const handleBlur = () => {
    if (onBlur) {
      onBlur()
    }
  }

  return (
    <div className={`quill-editor-wrapper ${className || ''}`}>
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        modules={modules}
        formats={formats}
        placeholder={placeholder || 'Enter text...'}
      />
    </div>
  )
}
