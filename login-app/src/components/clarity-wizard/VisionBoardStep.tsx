import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import html2canvas from 'html2canvas'
import { useAutosave } from '../../hooks/useAutosave'
import { getJourneyById, getNextStep, getPreviousStep, type ClarityJourney } from '../../lib/clarity-wizard'
import {
  getVisionBoardVersion,
  getVisionBoardImages,
  uploadVisionBoardImage,
  createVisionBoardText,
  updateVisionBoardImage,
  deleteVisionBoardImage,
  commitVisionBoardVersion,
  type VisionBoardVersion,
  type VisionBoardImage,
} from '../../lib/vision-board'
import AddTextModal from './AddTextModal'

interface DragState {
  imageId: string
  startX: number
  startY: number
  initialX: number
  initialY: number
  type: 'move' | 'resize' | 'rotate'
  handle?: 'nw' | 'ne' | 'sw' | 'se' | 'rotate'
  initialWidth?: number
  initialHeight?: number
  initialRotation?: number // For resize/move: image rotation, for rotate: initial mouse angle
  imageRotation?: number // For rotate: the image's rotation at start
  centerX?: number
  centerY?: number
}

export default function VisionBoardStep() {
  const { journeyId } = useParams<{ journeyId: string }>()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const canvasContentRef = useRef<HTMLDivElement>(null)
  const [dragState, setDragState] = useState<DragState | null>(null)

  const [journey, setJourney] = useState<ClarityJourney | null>(null)
  const [version, setVersion] = useState<VisionBoardVersion | null>(null)
  const [images, setImages] = useState<VisionBoardImage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set())
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [isEditMode, setIsEditMode] = useState(true)
  const [isAddTextModalOpen, setIsAddTextModalOpen] = useState(false)
  const [editingTextId, setEditingTextId] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  // Canvas dimensions
  const CANVAS_WIDTH = 1200
  const CANVAS_HEIGHT = 1600

  // Load journey, version, and images on mount
  useEffect(() => {
    async function loadData() {
      if (!journeyId) {
        setError('Journey ID is required')
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        // Load journey
        const journeyResult = await getJourneyById(journeyId)
        if (!journeyResult.success || !journeyResult.data) {
          setError(journeyResult.error || 'Journey not found')
          setIsLoading(false)
          return
        }
        setJourney(journeyResult.data as ClarityJourney)

        // Load or create version
        const versionResult = await getVisionBoardVersion(journeyId)
        if (!versionResult.success || !versionResult.data) {
          setError(versionResult.error || 'Failed to load vision board')
          setIsLoading(false)
          return
        }
        const versionData = versionResult.data as VisionBoardVersion
        setVersion(versionData)

        // Load images
        if (versionData.id) {
          const imagesResult = await getVisionBoardImages(versionData.id)
          if (imagesResult.success && imagesResult.data) {
            const loadedImages = imagesResult.data as VisionBoardImage[]
            // Auto-position images that don't have positions yet
            const positionedImages = loadedImages.map((img, index) => {
              if (img.position_x === null || img.position_x === undefined) {
                return {
                  ...img,
                  position_x: Math.random() * (CANVAS_WIDTH - 200) + 50,
                  position_y: Math.random() * (CANVAS_HEIGHT - 200) + 50,
                  rotation: (Math.random() - 0.5) * 15, // -7.5 to 7.5 degrees
                  width: 150 + Math.random() * 100, // 150-250px
                  height: 150 + Math.random() * 100,
                  z_index: index,
                }
              }
              return img
            })
            setImages(positionedImages)
          } else if (imagesResult.error) {
            setError(imagesResult.error)
          }
        }
      } catch (err) {
        console.error('Error loading data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [journeyId])

  // Autosave hook for position updates
  const { save: autosavePosition } = useAutosave<{
    imageId: string
    position_x: number
    position_y: number
    rotation?: number
    width?: number
    height?: number
    z_index?: number
  }>(
    async (updates) => {
      // Only include fields that are actually defined
      const updatePayload: {
        position_x: number
        position_y: number
        rotation?: number
        width?: number
        height?: number
        z_index?: number
      } = {
        position_x: updates.position_x,
        position_y: updates.position_y,
      }
      
      if (updates.rotation !== undefined) {
        updatePayload.rotation = updates.rotation
      }
      if (updates.width !== undefined) {
        updatePayload.width = updates.width
      }
      if (updates.height !== undefined) {
        updatePayload.height = updates.height
      }
      if (updates.z_index !== undefined) {
        updatePayload.z_index = updates.z_index
      }
      
      const result = await updateVisionBoardImage(updates.imageId, updatePayload)
      if (!result.success) {
        throw new Error(result.error || 'Failed to save position')
      }
    },
    { debounceMs: 500 }
  )

  // Autosave hook for caption updates
  const { save: autosaveCaption } = useAutosave<{ imageId: string; caption: string }>(
    async ({ imageId, caption }) => {
      const result = await updateVisionBoardImage(imageId, { caption })
      if (!result.success) {
        throw new Error(result.error || 'Failed to save caption')
      }
    },
    { debounceMs: 300 }
  )

  // Autosave hook for text content updates
  const { save: autosaveTextContent } = useAutosave<{ imageId: string; textContent: string }>(
    async ({ imageId, textContent }) => {
      const result = await updateVisionBoardImage(imageId, { text_content: textContent })
      if (!result.success) {
        throw new Error(result.error || 'Failed to save text')
      }
    },
    { debounceMs: 500 }
  )

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files
      if (!files || !journeyId || !version?.id) return

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const tempId = `temp-${Date.now()}-${i}`

        setUploadingFiles((prev) => new Set(prev).add(tempId))

        try {
          const result = await uploadVisionBoardImage(journeyId, version.id!, file)
          
          if (result.success && result.data) {
            const newImage = result.data as VisionBoardImage
            // Auto-position new image
            const positionedImage = {
              ...newImage,
              position_x: Math.random() * (CANVAS_WIDTH - 200) + 50,
              position_y: Math.random() * (CANVAS_HEIGHT - 200) + 50,
              rotation: (Math.random() - 0.5) * 15,
              width: 150 + Math.random() * 100,
              height: 150 + Math.random() * 100,
              z_index: images.length,
            }
            setImages((prev) => [...prev, positionedImage])
            
            // Save position
            if (positionedImage.id) {
              await updateVisionBoardImage(positionedImage.id, {
                position_x: positionedImage.position_x,
                position_y: positionedImage.position_y,
                rotation: positionedImage.rotation,
                width: positionedImage.width,
                height: positionedImage.height,
                z_index: positionedImage.z_index,
              })
            }
          } else {
            setError(result.error || 'Failed to upload image')
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to upload image')
        } finally {
          setUploadingFiles((prev) => {
            const next = new Set(prev)
            next.delete(tempId)
            return next
          })
        }
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
    [journeyId, version, images.length]
  )

  const handleAddTextConfirm = useCallback(async (htmlContent: string) => {
    if (!journeyId || !version?.id) return

    try {
      if (editingTextId) {
        // Update existing text element
        const result = await updateVisionBoardImage(editingTextId, { text_content: htmlContent })
        
        if (result.success) {
          setImages((prev) =>
            prev.map((img) => (img.id === editingTextId ? { ...img, text_content: htmlContent } : img))
          )
          
          // Close modal and reset editing state
          setIsAddTextModalOpen(false)
          setEditingTextId(null)
        } else {
          setError(result.error || 'Failed to update text')
        }
      } else {
        // Create new text element
        const result = await createVisionBoardText(journeyId, version.id, htmlContent)
        
        if (result.success && result.data) {
          const newText = result.data as VisionBoardImage
          // Auto-position new text element
          const positionedText = {
            ...newText,
            position_x: Math.random() * (CANVAS_WIDTH - 200) + 50,
            position_y: Math.random() * (CANVAS_HEIGHT - 200) + 50,
            rotation: (Math.random() - 0.5) * 10, // Less rotation for text
            width: 200,
            height: 100,
            z_index: images.length,
          }
          setImages((prev) => [...prev, positionedText])
          
          // Save position
          if (positionedText.id) {
            await updateVisionBoardImage(positionedText.id, {
              position_x: positionedText.position_x,
              position_y: positionedText.position_y,
              rotation: positionedText.rotation,
              width: positionedText.width,
              height: positionedText.height,
              z_index: positionedText.z_index,
            })
          }
          
          // Close modal
          setIsAddTextModalOpen(false)
        } else {
          setError(result.error || 'Failed to create text')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save text')
    }
  }, [journeyId, version, images.length, editingTextId])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, imageId: string, type: 'move' | 'resize' | 'rotate' = 'move', handle?: 'nw' | 'ne' | 'sw' | 'se' | 'rotate') => {
      if (!isEditMode) return
      e.preventDefault()
      e.stopPropagation()
      
      const image = images.find((img) => img.id === imageId)
      if (!image || image.position_x === null || image.position_x === undefined || image.position_y === null || image.position_y === undefined) return

      const width = image.width ?? 200
      const height = image.height ?? 200
      const rotation = image.rotation ?? 0
      const positionX = image.position_x
      const positionY = image.position_y
      
      // Calculate center point in canvas coordinates
      const centerX = positionX + width / 2
      const centerY = positionY + height / 2

      // For rotation, calculate initial angle from center to mouse position
      let initialMouseAngle = 0
      if (type === 'rotate') {
        const canvas = canvasRef.current
        if (canvas) {
          const rect = canvas.getBoundingClientRect()
          const scaleX = CANVAS_WIDTH / rect.width
          const scaleY = CANVAS_HEIGHT / rect.height
          const mouseCanvasX = (e.clientX - rect.left) * scaleX
          const mouseCanvasY = (e.clientY - rect.top) * scaleY
          const dx = mouseCanvasX - centerX
          const dy = mouseCanvasY - centerY
          initialMouseAngle = Math.atan2(dy, dx) * (180 / Math.PI)
        }
      }

      setDragState({
        imageId,
        startX: e.clientX,
        startY: e.clientY,
        initialX: positionX,
        initialY: positionY,
        type,
        handle,
        initialWidth: width,
        initialHeight: height,
        initialRotation: type === 'rotate' ? initialMouseAngle : rotation,
        imageRotation: type === 'rotate' ? rotation : undefined,
        centerX,
        centerY,
      })
      setSelectedImage(imageId)
    },
    [isEditMode, images]
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragState || !isEditMode) return

      const deltaX = e.clientX - dragState.startX
      const deltaY = e.clientY - dragState.startY

      if (dragState.type === 'move') {
        const newX = Math.max(0, Math.min(CANVAS_WIDTH - 100, dragState.initialX + deltaX))
        const newY = Math.max(0, Math.min(CANVAS_HEIGHT - 100, dragState.initialY + deltaY))

        setImages((prev) =>
          prev.map((img) =>
            img.id === dragState.imageId
              ? { ...img, position_x: newX, position_y: newY }
              : img
          )
        )

        autosavePosition({
          imageId: dragState.imageId,
          position_x: newX,
          position_y: newY,
        })
      } else if (dragState.type === 'resize' && dragState.handle && dragState.initialWidth && dragState.initialHeight && dragState.centerX && dragState.centerY) {
        // Get canvas element to calculate relative coordinates
        const canvas = canvasRef.current
        if (!canvas) return

        const rect = canvas.getBoundingClientRect()
        const scaleX = CANVAS_WIDTH / rect.width
        const scaleY = CANVAS_HEIGHT / rect.height

        // Convert mouse position to canvas coordinates
        const mouseCanvasX = (e.clientX - rect.left) * scaleX
        const mouseCanvasY = (e.clientY - rect.top) * scaleY

        // Get the image to access its rotation and element type
        const currentImage = images.find((img) => img.id === dragState.imageId)
        const rotation = currentImage?.rotation ?? 0
        const rotationRad = (rotation * Math.PI) / 180
        const isText = currentImage?.element_type === 'text'

        // Calculate the initial handle position in image's local (unrotated) coordinate space
        const halfWidth = dragState.initialWidth / 2
        const halfHeight = dragState.initialHeight / 2
        
        let initialHandleLocalX = 0
        let initialHandleLocalY = 0
        
        if (dragState.handle === 'nw') {
          initialHandleLocalX = -halfWidth
          initialHandleLocalY = -halfHeight
        } else if (dragState.handle === 'ne') {
          initialHandleLocalX = halfWidth
          initialHandleLocalY = -halfHeight
        } else if (dragState.handle === 'sw') {
          initialHandleLocalX = -halfWidth
          initialHandleLocalY = halfHeight
        } else if (dragState.handle === 'se') {
          initialHandleLocalX = halfWidth
          initialHandleLocalY = halfHeight
        }

        // Calculate initial distance from center to handle in local space
        const initialDistance = Math.sqrt(initialHandleLocalX ** 2 + initialHandleLocalY ** 2)

        // Convert current mouse position to image's local coordinate space
        const mouseDx = mouseCanvasX - dragState.centerX
        const mouseDy = mouseCanvasY - dragState.centerY
        
        // Rotate mouse position back to image's local space (inverse rotation)
        const cos = Math.cos(-rotationRad)
        const sin = Math.sin(-rotationRad)
        const mouseLocalX = mouseDx * cos - mouseDy * sin
        const mouseLocalY = mouseDx * sin + mouseDy * cos

        // Calculate current distance from center to mouse in local space
        const currentDistance = Math.sqrt(mouseLocalX ** 2 + mouseLocalY ** 2)

        // Calculate scale factor based on distance ratio
        const scaleFactor = initialDistance > 0 ? currentDistance / initialDistance : 1

        // Apply scale factor to dimensions
        let newWidth = dragState.initialWidth * scaleFactor
        let newHeight = dragState.initialHeight * scaleFactor

        if (isText) {
          // Text elements: allow free resizing, no aspect ratio constraint
          newWidth = Math.max(150, Math.min(600, newWidth))
          newHeight = Math.max(60, Math.min(800, newHeight))
        } else {
          // Images: maintain aspect ratio
          newWidth = Math.max(100, Math.min(400, newWidth))
          newHeight = Math.max(100, Math.min(400, newHeight))

          const aspectRatio = dragState.initialWidth / dragState.initialHeight
          if (newWidth / newHeight > aspectRatio) {
            newHeight = newWidth / aspectRatio
          } else {
            newWidth = newHeight * aspectRatio
          }
          
          // Re-clamp after aspect ratio adjustment
          newWidth = Math.max(100, Math.min(400, newWidth))
          newHeight = Math.max(100, Math.min(400, newHeight))
        }

        // Calculate new position to keep center fixed
        const newX = dragState.centerX - newWidth / 2
        const newY = dragState.centerY - newHeight / 2

        setImages((prev) =>
          prev.map((img) =>
            img.id === dragState.imageId
              ? { ...img, position_x: newX, position_y: newY, width: newWidth, height: newHeight }
              : img
          )
        )

        autosavePosition({
          imageId: dragState.imageId,
          position_x: newX,
          position_y: newY,
          width: newWidth,
          height: newHeight,
        })
      } else if (dragState.type === 'rotate' && dragState.centerX && dragState.centerY && dragState.initialRotation !== undefined && dragState.imageRotation !== undefined) {
        // Get canvas element to calculate relative coordinates
        const canvas = canvasRef.current
        if (!canvas) return

        const rect = canvas.getBoundingClientRect()
        const scaleX = CANVAS_WIDTH / rect.width
        const scaleY = CANVAS_HEIGHT / rect.height

        // Convert mouse position to canvas coordinates
        const mouseCanvasX = (e.clientX - rect.left) * scaleX
        const mouseCanvasY = (e.clientY - rect.top) * scaleY

        // Calculate current angle from center to mouse position
        const dx = mouseCanvasX - dragState.centerX
        const dy = mouseCanvasY - dragState.centerY
        const currentAngle = Math.atan2(dy, dx) * (180 / Math.PI)

        // Calculate rotation delta from initial mouse angle
        const angleDelta = currentAngle - dragState.initialRotation

        // Apply the rotation delta to the image's initial rotation
        let newRotation = dragState.imageRotation + angleDelta
        newRotation = ((newRotation % 360) + 360) % 360 // Normalize to 0-360

        const rotatedImage = images.find((img) => img.id === dragState.imageId)
        if (rotatedImage && rotatedImage.position_x !== null && rotatedImage.position_x !== undefined && rotatedImage.position_y !== null && rotatedImage.position_y !== undefined) {
          setImages((prev) =>
            prev.map((img) =>
              img.id === dragState.imageId
                ? { ...img, rotation: newRotation }
                : img
            )
          )

          autosavePosition({
            imageId: dragState.imageId,
            position_x: rotatedImage.position_x,
            position_y: rotatedImage.position_y,
            rotation: newRotation,
          })
        }
      }
    },
    [dragState, isEditMode, autosavePosition]
  )

  const handleMouseUp = useCallback(() => {
    setDragState(null)
  }, [])

  useEffect(() => {
    if (dragState) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [dragState, handleMouseMove, handleMouseUp])

  const handleDeleteImage = useCallback(async (imageId: string) => {
    const result = await deleteVisionBoardImage(imageId)
    if (result.success) {
      setImages((prev) => prev.filter((img) => img.id !== imageId))
      setDeleteConfirm(null)
      setSelectedImage(null)
    } else {
      setError(result.error || 'Failed to delete image')
    }
  }, [])

  const handleRotate = useCallback(
    async (imageId: string, delta: number) => {
      const image = images.find((img) => img.id === imageId)
      if (!image) return

      const newRotation = (image.rotation || 0) + delta
      setImages((prev) =>
        prev.map((img) => (img.id === imageId ? { ...img, rotation: newRotation } : img))
      )

      const result = await updateVisionBoardImage(imageId, { rotation: newRotation })
      if (!result.success) {
        setError(result.error || 'Failed to save rotation')
      }
    },
    [images]
  )

  const handleStraighten = useCallback(
    async (imageId: string) => {
      const image = images.find((img) => img.id === imageId)
      if (!image) return

      setImages((prev) =>
        prev.map((img) => (img.id === imageId ? { ...img, rotation: 0 } : img))
      )

      const result = await updateVisionBoardImage(imageId, { rotation: 0 })
      if (!result.success) {
        setError(result.error || 'Failed to straighten image')
      }
    },
    [images]
  )

  async function handleNext() {
    if (!journeyId || !journey || !version?.id) return

    setIsSubmitting(true)
    setError('')

    try {
      // Commit the version
      const result = await commitVisionBoardVersion(version.id, journeyId)
      if (!result.success) {
        throw new Error(result.error || 'Failed to save vision board')
      }

      // Navigate to next step
      const nextRoute = getNextStep(journey, 'vision-board')
      navigate(nextRoute)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to proceed')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleBack() {
    if (journey) {
      const prevRoute = getPreviousStep(journey, 'vision-board')
      navigate(prevRoute)
    } else {
      navigate('/clarity-wizard')
    }
  }

  async function handleDownload() {
    if (!canvasRef.current || !canvasContentRef.current) return

    setIsDownloading(true)
    setError('')

    try {
      // Temporarily hide edit controls and selection indicators
      const originalSelectedImage = selectedImage
      setSelectedImage(null)

      // Wait a moment for state to update
      await new Promise(resolve => setTimeout(resolve, 100))

      // Capture the canvas content area with explicit dimensions
      const sourceCanvas = await html2canvas(canvasContentRef.current, {
        backgroundColor: '#0B0C10', // Match the background color
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        x: 0,
        y: 0,
      })

      // Restore selection state
      setSelectedImage(originalSelectedImage)

      // Create a new canvas with landscape orientation (swapped dimensions)
      const landscapeCanvas = document.createElement('canvas')
      landscapeCanvas.width = sourceCanvas.height // Landscape width: 1600
      landscapeCanvas.height = sourceCanvas.width // Landscape height: 1200
      const ctx = landscapeCanvas.getContext('2d')

      if (!ctx) {
        setError('Failed to create canvas context')
        return
      }

      // Fill background
      ctx.fillStyle = '#0B0C10'
      ctx.fillRect(0, 0, landscapeCanvas.width, landscapeCanvas.height)

      // Scale the portrait content to fit the landscape canvas height
      // This maintains aspect ratio and centers horizontally
      const scale = landscapeCanvas.height / sourceCanvas.height // 1200 / 1600 = 0.75
      const scaledWidth = sourceCanvas.width * scale // 1200 * 0.75 = 900
      const offsetX = (landscapeCanvas.width - scaledWidth) / 2 // Center horizontally
      
      ctx.drawImage(
        sourceCanvas,
        0, 0, sourceCanvas.width, sourceCanvas.height, // Source rectangle
        offsetX, 0, scaledWidth, landscapeCanvas.height // Destination rectangle (centered horizontally)
      )

      // Convert to blob and download
      landscapeCanvas.toBlob((blob) => {
        if (!blob) {
          setError('Failed to generate image')
          return
        }

        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `vision-board-${journeyId || 'export'}-${Date.now()}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }, 'image/png')
    } catch (err) {
      console.error('Error downloading vision board:', err)
      setError(err instanceof Error ? err.message : 'Failed to download vision board')
    } finally {
      setIsDownloading(false)
    }
  }

  // Sort images by z_index for proper layering
  const sortedImages = [...images].sort((a, b) => (a.z_index || 0) - (b.z_index || 0))

  if (isLoading) {
    return (
      <div className="relative w-full min-h-screen overflow-hidden">
        <div className="absolute inset-0 bg-auro-bg0">
          <div className="absolute inset-0 gradient-radial-top-left" />
          <div className="absolute inset-0 gradient-radial-mid-left" />
        </div>
        <div className="relative z-10 container mx-auto px-6 py-12 flex items-center justify-center min-h-screen">
          <div className="text-auro-text-secondary">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full min-h-screen overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-auro-bg0">
        <div className="absolute inset-0 gradient-radial-top-left" />
        <div className="absolute inset-0 gradient-radial-mid-left" />
      </div>

      <div className="relative z-10 container mx-auto px-6 py-12">
        <div className="glass-panel p-8 rounded-3xl max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-auro-accent-soft flex items-center justify-center">
                    <svg className="w-4 h-4 text-auro-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-auro-text-tertiary uppercase tracking-wider">
                    Step 5: Vision Board
                  </span>
                </div>
                <h1 className="text-3xl font-semibold text-auro-text-primary mb-2">
                  Create your vision board
                </h1>
                <p className="text-auro-text-secondary">
                  Upload images and arrange them in a collage-style layout. Drag to move, click to edit.
                </p>
              </div>
              <button
                onClick={() => setIsEditMode(!isEditMode)}
                className="px-4 py-2 rounded-full glass-control text-auro-text-primary hover:bg-white/8 transition-colors text-sm"
              >
                {isEditMode ? 'View Mode' : 'Edit Mode'}
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="glass-card p-4 rounded-xl border border-auro-danger/30 bg-auro-danger/10 mb-6">
              <p className="text-sm text-auro-danger">{error}</p>
            </div>
          )}

          {/* Upload area and Add Text button */}
          {isEditMode && (
            <>
              <div className="mb-6 flex justify-end gap-3">
                <button
                  onClick={handleDownload}
                  disabled={isDownloading || images.length === 0}
                  className="px-8 py-3 rounded-full glass-control text-auro-text-primary hover:bg-white/8 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  {isDownloading ? 'Downloading...' : 'Download PNG'}
                </button>
                <button
                  onClick={handleNext}
                  disabled={isSubmitting || uploadingFiles.size > 0}
                  className="px-8 py-3 rounded-full bg-white text-[#0B0C10] font-medium hover:bg-[#8B5CF6] hover:text-[#F4F6FF] transition-all shadow-[0_10px_26px_-16px_rgba(0,0,0,0.55)] hover:shadow-[0_0_22px_0_rgba(139,92,246,0.30)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Saving...' : 'Next'}
                </button>
              </div>
              <div className="mb-6 flex gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingFiles.size > 0}
                  className="flex-1 glass-card p-6 rounded-2xl border-2 border-dashed border-auro-stroke-subtle hover:border-auro-accent hover:bg-auro-accent/5 transition-all text-auro-text-secondary hover:text-auro-text-primary flex flex-col items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="w-12 h-12 rounded-full bg-auro-accent-soft flex items-center justify-center">
                    <svg className="w-6 h-6 text-auro-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium mb-1">
                      {uploadingFiles.size > 0 ? 'Uploading...' : 'Upload Images'}
                    </p>
                    <p className="text-xs text-auro-text-tertiary">
                      Click to select images (JPEG, PNG, GIF, WebP) • Max 10MB each
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => setIsAddTextModalOpen(true)}
                  className="glass-card p-6 rounded-2xl border-2 border-dashed border-auro-stroke-subtle hover:border-auro-accent hover:bg-auro-accent/5 transition-all text-auro-text-secondary hover:text-auro-text-primary flex flex-col items-center justify-center gap-3 min-w-[200px]"
                >
                  <div className="w-12 h-12 rounded-full bg-auro-accent-soft flex items-center justify-center">
                    <svg className="w-6 h-6 text-auro-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium mb-1">Add Text</p>
                    <p className="text-xs text-auro-text-tertiary">Create text element</p>
                  </div>
                </button>
              </div>
            </>
          )}

          {/* Collage Canvas */}
          <div className="relative mb-8 overflow-x-auto">
            <div className="relative mx-auto" style={{ width: '100%', maxWidth: CANVAS_WIDTH }}>
              <div
                ref={canvasRef}
                className="relative rounded-2xl overflow-visible"
                style={{
                  width: '100%',
                  paddingBottom: `${(CANVAS_HEIGHT / CANVAS_WIDTH) * 100}%`,
                  position: 'relative',
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                }}
              >
                <div ref={canvasContentRef} className="absolute inset-0">
              {/* Images and text elements positioned absolutely */}
              {sortedImages.map((image) => {
                const isSelected = selectedImage === image.id
                const isDragging = dragState?.imageId === image.id
                const isText = image.element_type === 'text'
                const x = image.position_x ?? 0
                const y = image.position_y ?? 0
                const rotation = image.rotation ?? 0
                const width = image.width ?? (isText ? 200 : 200)
                const height = image.height ?? (isText ? 100 : 200)

                return (
                  <div
                    key={image.id}
                    className={`absolute transition-transform ${isEditMode ? 'cursor-move' : 'cursor-default'} ${
                      isSelected ? 'ring-2 ring-auro-accent' : ''
                    } ${isDragging ? 'z-50' : ''}`}
                    style={{
                      left: `${(x / CANVAS_WIDTH) * 100}%`,
                      top: `${(y / CANVAS_HEIGHT) * 100}%`,
                      transform: `rotate(${rotation}deg)`,
                      width: `${(width / CANVAS_WIDTH) * 100}%`,
                      height: `${(height / CANVAS_HEIGHT) * 100}%`,
                      maxWidth: isText ? 'min(400px, 30vw)' : 'min(250px, 20vw)',
                      maxHeight: isText ? 'none' : 'min(250px, 20vw)',
                      minWidth: isText ? '150px' : '120px',
                      minHeight: isText ? '60px' : '120px',
                      zIndex: isSelected ? 1000 : image.z_index || 0,
                    }}
                    onMouseDown={(e) => isEditMode && handleMouseDown(e, image.id || '', 'move')}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (isText) {
                        // Open modal for text editing
                        setEditingTextId(image.id || null)
                        setIsAddTextModalOpen(true)
                      } else {
                        // Set selected for image caption editing
                        setSelectedImage(image.id || null)
                      }
                    }}
                  >
                    {isText ? (
                      // Text element
                      <div className="relative w-full h-full rounded-lg overflow-visible shadow-lg group glass-card p-3 border border-auro-stroke-subtle">
                        <div
                          className="text-auro-text-primary text-sm break-words"
                          dangerouslySetInnerHTML={{ __html: image.text_content || '<p>New text</p>' }}
                          style={{
                            wordBreak: 'break-word',
                          }}
                        />
                        <style>{`
                          .text-auro-text-primary a {
                            color: rgb(139, 92, 246);
                            text-decoration: underline;
                          }
                          .text-auro-text-primary a:hover {
                            color: rgb(167, 139, 250);
                          }
                        `}</style>
                      </div>
                    ) : (
                      // Image element
                      <div className="relative w-full h-full rounded-lg overflow-hidden shadow-lg group">
                        {image.preview_url ? (
                          <img
                            src={image.preview_url}
                            alt={image.caption || 'Vision board image'}
                            className="w-full h-full object-cover"
                            draggable={false}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-auro-surface2">
                            <svg className="w-12 h-12 text-auro-text-tertiary animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                    )}

                      {/* Resize handles - for both images and text */}
                      {isEditMode && isSelected && (
                        <>
                          {/* Corner resize handles - larger and easier to grab */}
                          <div
                            className="absolute -top-2 -left-2 w-5 h-5 bg-auro-accent border-2 border-white rounded-full cursor-nwse-resize z-10 shadow-lg hover:scale-125 transition-transform active:scale-110"
                            style={{ touchAction: 'none' }}
                            onMouseDown={(e) => {
                              e.stopPropagation()
                              handleMouseDown(e, image.id || '', 'resize', 'nw')
                            }}
                          />
                          <div
                            className="absolute -top-2 -right-2 w-5 h-5 bg-auro-accent border-2 border-white rounded-full cursor-nesw-resize z-10 shadow-lg hover:scale-125 transition-transform active:scale-110"
                            style={{ touchAction: 'none' }}
                            onMouseDown={(e) => {
                              e.stopPropagation()
                              handleMouseDown(e, image.id || '', 'resize', 'ne')
                            }}
                          />
                          <div
                            className="absolute -bottom-2 -left-2 w-5 h-5 bg-auro-accent border-2 border-white rounded-full cursor-nesw-resize z-10 shadow-lg hover:scale-125 transition-transform active:scale-110"
                            style={{ touchAction: 'none' }}
                            onMouseDown={(e) => {
                              e.stopPropagation()
                              handleMouseDown(e, image.id || '', 'resize', 'sw')
                            }}
                          />
                          <div
                            className="absolute -bottom-2 -right-2 w-5 h-5 bg-auro-accent border-2 border-white rounded-full cursor-nwse-resize z-10 shadow-lg hover:scale-125 transition-transform active:scale-110"
                            style={{ touchAction: 'none' }}
                            onMouseDown={(e) => {
                              e.stopPropagation()
                              handleMouseDown(e, image.id || '', 'resize', 'se')
                            }}
                          />
                          {/* Rotation handle on top center */}
                          <div
                            className="absolute -top-6 left-1/2 -translate-x-1/2 w-5 h-5 bg-auro-accent border-2 border-white rounded-full cursor-grab active:cursor-grabbing z-10 flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                            onMouseDown={(e) => {
                              e.stopPropagation()
                              handleMouseDown(e, image.id || '', 'rotate', 'rotate')
                            }}
                          >
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </div>
                        </>
                      )}

                      {/* Edit controls overlay - only for images */}
                      {isEditMode && isSelected && !isText && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRotate(image.id || '', -15)
                            }}
                            className="p-2 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-sm"
                            title="Rotate left"
                          >
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleStraighten(image.id || '')
                            }}
                            className="p-2 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-sm"
                            title="Straighten"
                          >
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h18" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRotate(image.id || '', 15)
                            }}
                            className="p-2 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-sm"
                            title="Rotate right"
                          >
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteConfirm(image.id || null)
                            }}
                            className="p-2 rounded-lg bg-red-500/80 hover:bg-red-600/80 backdrop-blur-sm"
                            title="Delete"
                          >
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}

                      {/* Delete button for text elements */}
                      {isEditMode && isSelected && isText && (
                        <div className="absolute -top-2 -right-2 z-10">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteConfirm(image.id || null)
                            }}
                            className="p-1.5 rounded-lg bg-red-500/80 hover:bg-red-600/80 backdrop-blur-sm shadow-lg"
                            title="Delete"
                          >
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      )}

                      {/* Caption overlay - only for images */}
                      {!isText && image.caption && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                          <p className="text-white text-xs font-medium line-clamp-2">{image.caption}</p>
                        </div>
                      )}
                  </div>
                )
              })}

              {/* Uploading placeholders */}
              {Array.from(uploadingFiles).map((tempId) => (
                <div
                  key={tempId}
                  className="absolute rounded-lg overflow-hidden"
                  style={{
                    left: `${Math.random() * 70 + 10}%`,
                    top: `${Math.random() * 70 + 10}%`,
                    width: '200px',
                    height: '200px',
                  }}
                >
                  <div className="w-full h-full flex items-center justify-center bg-auro-surface2">
                    <div className="text-center">
                      <svg className="w-12 h-12 text-auro-accent animate-spin mx-auto mb-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <p className="text-xs text-auro-text-tertiary">Uploading...</p>
                    </div>
                  </div>
                </div>
              ))}
                </div>
              </div>
            </div>
          </div>

          {/* Selected element editor - Image captions only */}
          {isEditMode && selectedImage && !deleteConfirm && (() => {
            const selectedElement = images.find((img) => img.id === selectedImage)
            const isText = selectedElement?.element_type === 'text'
            
            // Don't show editor for text elements - they use the modal
            if (isText) return null
            
            return (
              <div className="glass-card p-4 rounded-xl mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-auro-text-primary">
                    Edit Image
                  </h3>
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="text-auro-text-tertiary hover:text-auro-text-primary"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <textarea
                  value={selectedElement?.caption || ''}
                  onChange={(e) => {
                    if (selectedElement?.id) {
                      setImages((prev) =>
                        prev.map((img) => (img.id === selectedImage ? { ...img, caption: e.target.value } : img))
                      )
                      autosaveCaption({ imageId: selectedElement.id, caption: e.target.value })
                    }
                  }}
                  placeholder="Add a caption..."
                  className="w-full input-field rounded-xl min-h-[80px] resize-none text-sm"
                />
              </div>
            )
          })()}

          {/* Delete confirmation */}
          {deleteConfirm && (
            <div className="glass-card p-4 rounded-xl border border-auro-danger/30 bg-auro-danger/10 mb-6">
              <p className="text-sm text-auro-text-primary mb-3">Delete this image?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (deleteConfirm) {
                      handleDeleteImage(deleteConfirm)
                    }
                  }}
                  className="flex-1 px-4 py-2 text-sm rounded-lg bg-auro-danger text-white hover:bg-auro-danger/80 transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={() => {
                    setDeleteConfirm(null)
                    setSelectedImage(null)
                  }}
                  className="flex-1 px-4 py-2 text-sm rounded-lg glass-control text-auro-text-secondary hover:bg-white/8 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Info message when no images */}
          {images.length === 0 && (
            <div className="glass-card p-6 rounded-xl border border-auro-accent/20 bg-auro-accent/5 mb-8">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-auro-accent flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm text-auro-text-primary">
                    <strong>Get started:</strong> Upload images that represent your goals, aspirations, and the life you want to create. 
                    Images will be automatically arranged in a collage-style layout. Drag them around to reposition, and click to add captions.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-auro-divider">
            <button
              onClick={handleBack}
              disabled={isSubmitting}
              className="px-6 py-3 rounded-full glass-control text-auro-text-primary hover:bg-white/8 transition-colors disabled:opacity-50"
            >
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={isSubmitting || uploadingFiles.size > 0}
              className="px-8 py-3 rounded-full bg-white text-[#0B0C10] font-medium hover:bg-[#8B5CF6] hover:text-[#F4F6FF] transition-all shadow-[0_10px_26px_-16px_rgba(0,0,0,0.55)] hover:shadow-[0_0_22px_0_rgba(139,92,246,0.30)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Next'}
            </button>
          </div>
        </div>
      </div>

      {/* Add Text Modal */}
      <AddTextModal
        isOpen={isAddTextModalOpen}
        onClose={() => {
          setIsAddTextModalOpen(false)
          setEditingTextId(null)
        }}
        onConfirm={handleAddTextConfirm}
        initialText={editingTextId ? images.find(img => img.id === editingTextId)?.text_content : undefined}
      />
    </div>
  )
}
