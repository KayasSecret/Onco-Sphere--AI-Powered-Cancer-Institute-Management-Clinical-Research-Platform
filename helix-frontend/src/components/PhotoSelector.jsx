import { useState, useRef, useEffect } from 'react'
import {
  RiCameraLine,
  RiCameraSwitchLine,
  RiUploadCloud2Line,
  RiZoomInLine,
  RiRefreshLine,
  RiCheckLine,
} from 'react-icons/ri'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { toast } from 'sonner'
import patientService from '../services/patientService'
import useCamera from '../hooks/useCamera'

export default function PhotoSelector({ value, onChange, onUploadingChange, customTrigger, hidePreview }) {
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState('select') // 'select' | 'camera' | 'crop'
  const [imageSrc, setImageSrc] = useState(null)
  const [uploading, setUploading] = useState(false)
  
  // Camera state & controller
  const videoRef = useRef(null)
  const {
    stream: cameraStream,
    facingMode,
    isLoading: cameraLoading,
    isSwitching,
    videoDevices,
    cameraError,
    startCamera,
    stopCamera,
    switchCamera,
    captureFrame,
  } = useCamera({ defaultFacingMode: 'user' })

  // Cropper state
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const imageRef = useRef(null)
  const [dimensions, setDimensions] = useState({ naturalWidth: 0, naturalHeight: 0 })

  // Bind camera stream to video element whenever camera is active
  useEffect(() => {
    if (mode === 'camera' && videoRef.current) {
      if (videoRef.current.srcObject !== cameraStream) {
        videoRef.current.srcObject = cameraStream || null
      }
    }
  }, [mode, cameraStream])

  // Start camera handler
  const handleStartCamera = async () => {
    setMode('camera')
    const stream = await startCamera()
    if (!stream) {
      setMode('select')
    }
  }

  // Cancel camera handler
  const handleCancelCamera = () => {
    stopCamera()
    setMode('select')
  }

  // Capture photo from camera
  const handleCapturePhoto = () => {
    if (!videoRef.current) return
    const dataUrl = captureFrame(videoRef.current)
    if (!dataUrl) return
    setImageSrc(dataUrl)
    stopCamera()
    setMode('crop')
    setZoom(1)
    setOffset({ x: 0, y: 0 })
  }

  // Handle local file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPG, PNG and WEBP images are supported.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setImageSrc(reader.result)
      setMode('crop')
      setZoom(1)
      setOffset({ x: 0, y: 0 })
    }
    reader.readAsDataURL(file)
  }

  // Image load details for crop sizing
  const handleImageLoaded = (e) => {
    const { naturalWidth, naturalHeight } = e.target
    setDimensions({ naturalWidth, naturalHeight })
    
    // Auto center offset
    const baseScale = Math.max(300 / naturalWidth, 300 / naturalHeight)
    const w = naturalWidth * baseScale
    const h = naturalHeight * baseScale
    setOffset({
      x: (300 - w) / 2,
      y: (300 - h) / 2
    })
  }

  // Dragging / Panning handlers (pointer events for unified mouse + touch support)
  const handlePointerDown = (e) => {
    e.preventDefault()
    e.target.setPointerCapture(e.pointerId)
    setIsDragging(true)
    dragStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y }
  }

  const handlePointerMove = (e) => {
    if (!isDragging) return
    const newX = e.clientX - dragStart.current.x
    const newY = e.clientY - dragStart.current.y
    
    // Clamp to boundaries so image always covers 300x300 area
    const baseScale = Math.max(300 / dimensions.naturalWidth, 300 / dimensions.naturalHeight)
    const currentScale = baseScale * zoom
    const w = dimensions.naturalWidth * currentScale
    const h = dimensions.naturalHeight * currentScale

    const clampedX = Math.max(Math.min(newX, 0), 300 - w)
    const clampedY = Math.max(Math.min(newY, 0), 300 - h)
    
    setOffset({ x: clampedX, y: clampedY })
  }

  const handlePointerUp = () => {
    setIsDragging(false)
  }

  // Finalize crop and upload
  const handleCropAndSave = async () => {
    const canvas = document.createElement('canvas')
    canvas.width = 300
    canvas.height = 300
    const ctx = canvas.getContext('2d')

    const baseScale = Math.max(300 / dimensions.naturalWidth, 300 / dimensions.naturalHeight)
    const currentScale = baseScale * zoom
    const w = dimensions.naturalWidth * currentScale
    const h = dimensions.naturalHeight * currentScale

    // Draw image at exact offsets and scaled size
    const img = new Image()
    img.src = imageSrc
    img.onload = async () => {
      ctx.drawImage(img, offset.x, offset.y, w, h)
      
      canvas.toBlob(async (blob) => {
        const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
        
        setUploading(true)
        if (onUploadingChange) onUploadingChange(true)
        try {
          const res = await patientService.uploadImage(file)
          onChange(res.data.url)
          toast.success('Photo uploaded successfully.')
          closeModal()
        } catch {
          toast.error('Failed to upload cropped image.')
        } finally {
          setUploading(false)
          if (onUploadingChange) onUploadingChange(false)
        }
      }, 'image/jpeg', 0.9)
    }
  }

  const closeModal = () => {
    stopCamera()
    setIsOpen(false)
    setMode('select')
    setImageSrc(null)
  }

  return (
    <>
      {customTrigger ? (
        customTrigger({ openModal: () => setIsOpen(true) })
      ) : hidePreview ? (
        <Button
          type="button"
          variant="outline"
          className="border-surface-border text-ink-primary hover:bg-surface-hover text-xs"
          onClick={() => setIsOpen(true)}
        >
          {value ? 'Change Photo' : 'Attach Photo'}
        </Button>
      ) : (
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-lg bg-surface-base border border-surface-border overflow-hidden flex items-center justify-center text-xs text-ink-disabled font-medium relative group">
            {value ? (
              <img src={value} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              'No Photo'
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            className="border-surface-border text-ink-primary hover:bg-surface-hover text-xs"
            onClick={() => setIsOpen(true)}
          >
            {value ? 'Change Photo' : 'Attach Photo'}
          </Button>
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) closeModal() }}>
        <DialogContent className={`w-[95vw] bg-surface-card border border-surface-border ${mode === 'select' ? 'sm:max-w-md' : 'sm:max-w-2xl'}`}>
          <DialogHeader>
            <DialogTitle className="text-ink-primary">Profile Photo</DialogTitle>
          </DialogHeader>

          {/* MODE: Select Camera or Upload */}
          {mode === 'select' && (
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 gap-3 sm:gap-4 py-3 sm:py-4">
              <button
                type="button"
                onClick={handleStartCamera}
                className="flex flex-col items-center justify-center p-5 sm:p-6 border border-surface-border rounded-xl hover:bg-surface-hover hover:border-brand-blue group transition-all cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-brand-navy/10 flex items-center justify-center text-brand-navy group-hover:bg-brand-blue group-hover:text-ink-inverse transition-colors mb-3">
                  <RiCameraLine size={24} />
                </div>
                <span className="text-sm font-semibold text-ink-primary">Use Camera</span>
                <span className="text-xs text-ink-secondary mt-1">Take a live photo</span>
              </button>

              <label className="flex flex-col items-center justify-center p-5 sm:p-6 border border-surface-border rounded-xl hover:bg-surface-hover hover:border-brand-blue group cursor-pointer transition-all">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-full bg-brand-navy/10 flex items-center justify-center text-brand-navy group-hover:bg-brand-blue group-hover:text-ink-inverse transition-colors mb-3">
                  <RiUploadCloud2Line size={24} />
                </div>
                <span className="text-sm font-semibold text-ink-primary">Browse Files</span>
                <span className="text-xs text-ink-secondary mt-1">Upload image file</span>
              </label>
            </div>
          )}

          {/* MODE: Live Camera Stream with Front / Back Switch */}
          {mode === 'camera' && (
            <div className="space-y-4 py-2 flex flex-col items-center">
              <div className="w-full aspect-square max-h-[70vh] sm:w-[480px] sm:h-[480px] bg-slate-950 rounded-xl overflow-hidden relative border border-surface-border shadow-inner flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover transition-transform duration-200 ${
                    facingMode === 'user' ? 'scale-x-[-1]' : 'scale-x-1'
                  }`}
                />

                {/* Active Camera Indicator Badge */}
                <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md text-[11px] font-semibold text-white/90 border border-white/10 flex items-center gap-1.5 shadow-sm pointer-events-none select-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{facingMode === 'user' ? 'Front Camera' : 'Rear Camera'}</span>
                </div>

                {/* Direct Flip / Switch Camera Overlay Button */}
                <button
                  type="button"
                  onClick={switchCamera}
                  disabled={isSwitching || cameraLoading}
                  title={
                    videoDevices.length > 1
                      ? `Switch to ${facingMode === 'user' ? 'Rear (Back)' : 'Front'} Camera (${videoDevices.length} cameras available)`
                      : `Switch to ${facingMode === 'user' ? 'Rear (Back)' : 'Front'} Camera`
                  }
                  aria-label={`Switch to ${facingMode === 'user' ? 'Rear' : 'Front'} camera`}
                  className="absolute top-2.5 right-2.5 p-2 rounded-full bg-black/65 hover:bg-black/85 text-white active:scale-95 transition-all backdrop-blur-md border border-white/20 shadow-md flex items-center justify-center hover:text-brand-blue-light focus:outline-hidden disabled:opacity-50 cursor-pointer"
                >
                  <RiCameraSwitchLine
                    size={20}
                    className={`transition-transform duration-300 ${isSwitching ? 'animate-spin' : 'hover:rotate-180'}`}
                  />
                </button>

                {/* Switching / Starting Spinner Overlay */}
                {(isSwitching || cameraLoading) && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-white select-none">
                    <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="text-xs font-medium">
                      {isSwitching ? 'Switching camera...' : 'Starting camera...'}
                    </span>
                  </div>
                )}

                {/* Camera Error Message Overlay */}
                {cameraError && !cameraLoading && (
                  <div className="absolute inset-x-3 bottom-3 p-2.5 rounded-lg bg-red-950/85 backdrop-blur-md border border-red-500/40 text-red-200 text-xs text-center shadow-lg">
                    {cameraError}
                  </div>
                )}
              </div>

              {/* Camera Action Buttons Row */}
              <div className="flex flex-wrap items-center justify-center gap-2 w-full">
                <Button
                  type="button"
                  variant="outline"
                  className="border-surface-border text-ink-primary hover:bg-surface-hover"
                  onClick={handleCancelCamera}
                >
                  Cancel
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={switchCamera}
                  disabled={isSwitching || cameraLoading}
                  className="border-surface-border text-ink-primary hover:bg-surface-hover flex items-center gap-1.5"
                  title={`Switch to ${facingMode === 'user' ? 'Rear (Back)' : 'Front'} Camera`}
                >
                  <RiCameraSwitchLine
                    size={16}
                    className={isSwitching ? 'animate-spin' : ''}
                  />
                  <span>Switch Camera</span>
                </Button>

                <Button
                  type="button"
                  onClick={handleCapturePhoto}
                  disabled={isSwitching || cameraLoading || !cameraStream}
                  className="bg-brand-blue hover:bg-brand-blue-dark text-ink-inverse flex items-center gap-1.5 shadow-sm"
                >
                  <RiCameraLine size={16} /> Capture Photo
                </Button>
              </div>
            </div>
          )}

          {/* MODE: Drag, Zoom and Crop Image */}
          {mode === 'crop' && (
            <div className="space-y-4 py-2 flex flex-col items-center max-w-full overflow-hidden">
              {/* Crop Container */}
              <div
                className="w-[250px] h-[250px] sm:w-[300px] sm:h-[300px] bg-surface-base rounded-lg overflow-hidden relative cursor-move border border-surface-border shrink-0"
                style={{ touchAction: 'none' }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              >
                <img
                  ref={imageRef}
                  src={imageSrc}
                  alt="Crop preview"
                  onLoad={handleImageLoaded}
                  style={{
                    position: 'absolute',
                    left: `${offset.x}px`,
                    top: `${offset.y}px`,
                    width: `${dimensions.naturalWidth * Math.max(300 / dimensions.naturalWidth, 300 / dimensions.naturalHeight) * zoom}px`,
                    height: `${dimensions.naturalHeight * Math.max(300 / dimensions.naturalWidth, 300 / dimensions.naturalHeight) * zoom}px`,
                    maxWidth: 'none',
                    userSelect: 'none',
                    pointerEvents: 'none'
                  }}
                />

                {uploading && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-white select-none z-10 animate-fade-in">
                    <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="text-xs font-semibold">Uploading photo…</span>
                  </div>
                )}
              </div>

              {/* Zoom Slider */}
              <div className="w-full flex items-center gap-2 px-4">
                <RiZoomInLine className="text-ink-secondary" size={16} />
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.01"
                  value={zoom}
                  disabled={uploading}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full accent-brand-blue h-1.5 bg-surface-hover rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                />
              </div>

              {/* Crop Actions */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploading}
                  className="border-surface-border text-ink-primary hover:bg-surface-hover flex items-center gap-1"
                  onClick={() => {
                    if (cameraStream) stopCamera()
                    setMode('select')
                    setImageSrc(null)
                  }}
                >
                  <RiRefreshLine size={16} /> Retake / Reselect
                </Button>
                <Button
                  type="button"
                  disabled={uploading}
                  onClick={handleCropAndSave}
                  className="bg-brand-blue hover:bg-brand-blue-dark text-ink-inverse flex items-center gap-2 font-medium"
                >
                  {uploading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving Photo…</span>
                    </>
                  ) : (
                    <>
                      <RiCheckLine size={16} /> Save Crop
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
