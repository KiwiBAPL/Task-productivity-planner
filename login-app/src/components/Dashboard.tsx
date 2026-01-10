import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser, updateProfile, type AvatarData } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { AvatarIcon, type AvatarPreset } from './avatars/PresetAvatars'
import ProfileEditModal from './ProfileEditModal'
import AvatarSelectionModal from './AvatarSelectionModal'
import { getActiveJourney, type ClarityJourney } from '../lib/clarity-wizard'
import { getVisionBoardVersion, getVisionBoardImages, type VisionBoardVersion, type VisionBoardImage } from '../lib/vision-board'
import { getBig5Buckets, type Big5BucketWithOKRs } from '../lib/big5'

interface Task {
  id: string
  title: string
  description?: string
  assignees: string[]
  tags: string[]
  comments: number
  views: number
  attachments?: number
}

function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('Dashboard')
  const [isProfileEditModalOpen, setIsProfileEditModalOpen] = useState(false)
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false)

  // Clarity Wizard data state
  const [activeJourney, setActiveJourney] = useState<ClarityJourney | null>(null)
  const [visionBoardVersion, setVisionBoardVersion] = useState<VisionBoardVersion | null>(null)
  const [visionBoardImages, setVisionBoardImages] = useState<VisionBoardImage[]>([])
  const [big5Buckets, setBig5Buckets] = useState<Big5BucketWithOKRs[]>([])
  const [isClarityDataLoading, setIsClarityDataLoading] = useState(true)
  const [isVisionBoardModalOpen, setIsVisionBoardModalOpen] = useState(false)
  const [isRightSidebarVisible, setIsRightSidebarVisible] = useState(true)

  // Mock tasks data
  const tasks: Record<string, Task[]> = {
    icebox: [
      {
        id: '1',
        title: 'Decompose the task of creating popups',
        description: 'Break down the popup creation process into smaller tasks',
        assignees: ['Tom Pelosky', 'Lucy Meller'],
        tags: ['Docs', 'Prepare'],
        comments: 2,
        views: 3,
        attachments: 2,
      },
      {
        id: '2',
        title: 'Draw icons for the "Advantages" block',
        description: 'Create icon set for advantages section',
        assignees: ['Mike Wilson'],
        tags: ['Illustrations'],
        comments: 1,
        views: 2,
      },
      {
        id: '3',
        title: 'Home page design',
        assignees: [],
        tags: [],
        comments: 0,
        views: 0,
      },
    ],
    inProgress: [
      {
        id: '4',
        title: 'Draw illustrations for the "About Us" block',
        description: 'Create custom illustrations for about us section',
        assignees: ['Mike Wilson'],
        tags: ['Illustrations'],
        comments: 8,
        views: 3,
      },
      {
        id: '5',
        title: 'Creating a prototype for the section "Doctors"',
        description: 'Build interactive prototype for doctors section',
        assignees: ['Wi Young'],
        tags: ['Prototype'],
        comments: 24,
        views: 14,
      },
      {
        id: '6',
        title: 'Home page design',
        assignees: [],
        tags: [],
        comments: 0,
        views: 0,
      },
    ],
    discussion: [
      {
        id: '7',
        title: 'Authorization page',
        description: 'Design and implement authorization page',
        assignees: ['Jenny Rood'],
        tags: ['Coding'],
        comments: 36,
        views: 14,
      },
      {
        id: '8',
        title: 'Request a price list from the client',
        description: 'Follow up with client for pricing information',
        assignees: ['Tom Pelosky'],
        tags: ['Docs', 'Prepare'],
        comments: 2,
        views: 0,
      },
      {
        id: '9',
        title: 'Home page design',
        assignees: [],
        tags: [],
        comments: 0,
        views: 0,
      },
    ],
  }

  // Load user and profile data
  useEffect(() => {
    async function loadUser() {
      const currentUser = await getCurrentUser()
      if (currentUser) {
        setUser(currentUser)
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single()
        if (data) {
          setProfile(data)
        }
      }
    }
    loadUser()
  }, [])

  // Load Clarity Wizard data (active journey, vision board, Big 5)
  useEffect(() => {
    async function loadClarityData() {
      setIsClarityDataLoading(true)
      try {
        // Get active journey
        const journeyResult = await getActiveJourney()
        if (journeyResult.success && journeyResult.data) {
          const journey = journeyResult.data as ClarityJourney
          setActiveJourney(journey)

          // Load vision board if it exists
          const visionResult = await getVisionBoardVersion(journey.id)
          if (visionResult.success && visionResult.data) {
            const version = visionResult.data as VisionBoardVersion
            // Only show if it's current AND committed
            if (version.is_current && version.is_committed && version.id) {
              setVisionBoardVersion(version)
              
              // Load images for this version
              const imagesResult = await getVisionBoardImages(version.id)
              if (imagesResult.success && imagesResult.data) {
                setVisionBoardImages(imagesResult.data as VisionBoardImage[])
              }
            }
          }

          // Load Big 5 buckets
          const big5Result = await getBig5Buckets(journey.id)
          if (big5Result.success && big5Result.data) {
            const buckets = big5Result.data as Big5BucketWithOKRs[]
            setBig5Buckets(buckets)
          }
        }
      } catch (error) {
        console.error('Error loading Clarity Wizard data:', error)
      } finally {
        setIsClarityDataLoading(false)
      }
    }
    
    loadClarityData()
  }, [])

  // Reload profile after updates
  async function reloadProfile() {
    const currentUser = await getCurrentUser()
    if (currentUser) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single()
      if (data) {
        setProfile(data)
      }
    }
  }

  async function handleAvatarUpdate(type: 'preset' | 'upload', preset?: AvatarPreset, file?: File) {
    let avatarData: AvatarData | undefined
    if (type === 'preset' && preset) {
      avatarData = { type: 'preset', preset }
    } else if (type === 'upload' && file) {
      avatarData = { type: 'upload', file }
    }

    if (avatarData && profile) {
      const result = await updateProfile(
        profile.first_name || '',
        profile.last_name || '',
        avatarData
      )
      if (result.success) {
        await reloadProfile()
      }
    }
  }

  return (
    <div className="relative w-full min-h-screen overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-auro-bg0">
        <div className="absolute inset-0 gradient-radial-top-left" />
        <div className="absolute inset-0 gradient-radial-mid-left" />
      </div>

      <div className="relative z-10 flex h-screen">
        {/* Left Sidebar */}
        <aside className="w-[260px] glass-panel p-4 flex flex-col">
          {/* User Profile */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <button
                onClick={() => setIsAvatarModalOpen(true)}
                className="flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                aria-label="Change avatar"
              >
                {profile?.avatar_preset ? (
                  <AvatarIcon preset={profile.avatar_preset as any} size={40} />
                ) : profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Profile"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-auro-surface1 border border-auro-stroke-subtle flex items-center justify-center">
                    <span className="text-auro-text-secondary text-sm font-medium">
                      {profile?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
              </button>
              <div className="flex-1 min-w-0">
                <button
                  onClick={() => setIsProfileEditModalOpen(true)}
                  className="text-left w-full hover:opacity-80 transition-opacity"
                >
                  <div className="text-sm font-medium text-auro-text-primary truncate">
                    {profile?.first_name && profile?.last_name
                      ? `${profile.first_name} ${profile.last_name}`
                      : user?.email || 'User'}
                  </div>
                  {user?.email && (
                    <div className="text-xs text-auro-text-tertiary truncate mt-0.5">
                      {user.email}
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Icons */}
          <div className="space-y-1 mb-4">
            {[
              { 
                icon: 'home', 
                label: 'My Planning Space',
                route: '/dashboard'
              },
              { 
                icon: 'sparkles', 
                label: 'Clarity Wizard',
                route: '/clarity-wizard',
                svg: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                )
              },
              { icon: 'bell', label: 'Notifications' },
              { icon: 'chat', label: 'Chat' },
              { icon: 'folder', label: 'Files', badge: 2 },
              { icon: 'users', label: 'Team' },
              { icon: 'chart', label: 'Analytics' },
              { icon: 'help', label: 'Help' },
              { icon: 'settings', label: 'Settings' },
              { icon: 'integrations', label: 'Integrations' },
              { icon: 'apps', label: 'Apps' },
            ].map((item) => (
              <button
                key={item.icon}
                onClick={() => item.route && navigate(item.route)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-auro-text-secondary hover:bg-white/5 hover:text-auro-text-primary transition-all"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  {item.svg || (
                    <div className="w-4 h-4 rounded border border-auro-stroke-subtle" />
                  )}
                </div>
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <span className="px-2 py-0.5 rounded-full bg-auro-danger text-auro-text-primary text-xs font-medium">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-y-auto">
          {/* Top Bar */}
          <div className="h-16 glass-panel flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <button className="w-8 h-8 flex items-center justify-center glass-control rounded-md hover:bg-white/5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button className="w-8 h-8 flex items-center justify-center glass-control rounded-md hover:bg-white/5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button className="w-8 h-8 flex items-center justify-center glass-control rounded-md hover:bg-white/5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center -space-x-2">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-auro-surface1 border-2 border-auro-bg0"
                  />
                ))}
                <div className="w-8 h-8 rounded-full bg-auro-surface1 border-2 border-auro-bg0 flex items-center justify-center text-xs text-auro-text-secondary">
                  +11
                </div>
              </div>
              <button className="w-8 h-8 flex items-center justify-center glass-control rounded-md hover:bg-white/5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </button>
              <button className="w-8 h-8 flex items-center justify-center glass-control rounded-md hover:bg-white/5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
              <button className="w-8 h-8 flex items-center justify-center glass-control rounded-md hover:bg-white/5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </button>
              <button className="w-8 h-8 flex items-center justify-center glass-control rounded-md hover:bg-white/5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Project Header */}
          <div className="px-6 py-5">
            <div className="mb-4">
              <h1 className="text-2xl font-semibold text-auro-text-primary">Planning Overview</h1>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 mb-4">
              {['Overview', 'List', 'Dashboard', 'Timeline', 'Calendar'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    activeTab === tab
                      ? 'bg-white/10 border border-white/10 text-auro-text-primary'
                      : 'text-auro-text-secondary hover:bg-white/5'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 mb-4">
              <select className="glass-control h-9 px-4 rounded-full text-sm text-auro-text-primary bg-transparent border border-auro-stroke-subtle">
                <option>Deadline</option>
              </select>
              <select className="glass-control h-9 px-4 rounded-full text-sm text-auro-text-primary bg-transparent border border-auro-stroke-subtle">
                <option>Department: Web development</option>
              </select>
              <select className="glass-control h-9 px-4 rounded-full text-sm text-auro-text-primary bg-transparent border border-auro-stroke-subtle">
                <option>Priority</option>
              </select>
            </div>

            {/* Vision Board Section */}
            {!isClarityDataLoading && activeJourney && visionBoardVersion && visionBoardImages.length > 0 && (
              <div className="mb-6">
                <div className="glass-card p-6 rounded-3xl">
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold text-auro-text-primary mb-1">Vision Board</h2>
                    <p className="text-sm text-auro-text-secondary">Your current vision for this journey</p>
                  </div>
                  
                  {/* Vision Board Banner - Clickable */}
                  <div
                    className="relative mx-auto rounded-2xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity group"
                    style={{
                      width: '100%',
                      height: '400px',
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                    }}
                    onClick={() => setIsVisionBoardModalOpen(true)}
                  >
                    {/* Click hint overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center z-10 pointer-events-none">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity px-4 py-2 rounded-full glass-control text-auro-text-primary text-sm font-medium">
                        Click to view full vision board
                      </div>
                    </div>

                    {/* Render vision board images and text elements (scaled for banner) */}
                    {visionBoardImages
                      .sort((a, b) => (a.z_index || 0) - (b.z_index || 0))
                      .map((image) => {
                        const isText = image.element_type === 'text'
                        const x = image.position_x ?? 0
                        const y = image.position_y ?? 0
                        const rotation = image.rotation ?? 0
                        const width = image.width ?? (isText ? 200 : 200)
                        const height = image.height ?? (isText ? 100 : 200)
                        const CANVAS_WIDTH = 1200
                        const CANVAS_HEIGHT = 1600

                        return (
                          <div
                            key={image.id}
                            className="absolute"
                            style={{
                              left: `${(x / CANVAS_WIDTH) * 100}%`,
                              top: `${(y / CANVAS_HEIGHT) * 100}%`, // Percentage scales automatically with container
                              transform: `rotate(${rotation}deg)`,
                              width: `${(width / CANVAS_WIDTH) * 100}%`,
                              height: `${(height / CANVAS_HEIGHT) * 100}%`, // Percentage scales automatically with container
                              zIndex: image.z_index || 0,
                            }}
                          >
                            {isText ? (
                              // Text element
                              <div className="relative w-full h-full rounded-lg overflow-visible shadow-lg glass-card p-2 border border-auro-stroke-subtle">
                                <div
                                  className="text-auro-text-primary text-xs break-words"
                                  dangerouslySetInnerHTML={{ __html: image.text_content || '<p>Text</p>' }}
                                  style={{ wordBreak: 'break-word', fontSize: '0.75rem' }}
                                />
                              </div>
                            ) : (
                              // Image element
                              <div className="relative w-full h-full rounded-lg overflow-hidden shadow-lg">
                                {image.preview_url ? (
                                  <img
                                    src={image.preview_url}
                                    alt={image.caption || 'Vision board image'}
                                    className="w-full h-full object-cover"
                                    draggable={false}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-auro-surface2">
                                    <svg className="w-8 h-8 text-auro-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                )}
                                {image.caption && (
                                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                                    <p className="text-white text-xs font-medium line-clamp-1">{image.caption}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                  </div>
                </div>
              </div>
            )}

            {/* Big 5 Outcomes Section */}
            {!isClarityDataLoading && activeJourney && big5Buckets.length > 0 && (
              <div className="mb-6">
                <div className="glass-card p-6 rounded-3xl">
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold text-auro-text-primary mb-1">Big 5 Outcomes</h2>
                    <p className="text-sm text-auro-text-secondary">Your key focus areas and objectives</p>
                  </div>
                  
                  {/* Big 5 List */}
                  <div className="space-y-4">
                    {big5Buckets
                      .sort((a, b) => a.order_index - b.order_index)
                      .map((bucket, index) => (
                        <div key={bucket.id || index} className="glass-panel p-5 rounded-2xl">
                          {/* Bucket Title and Statement */}
                          <div className="mb-4">
                            <div className="flex items-start gap-3 mb-2">
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-auro-accent-soft flex items-center justify-center">
                                <span className="text-sm font-bold text-auro-accent">{index + 1}</span>
                              </div>
                              <div className="flex-1">
                                <h3 className="text-lg font-semibold text-auro-text-primary mb-1">{bucket.title}</h3>
                                <p className="text-sm text-auro-text-secondary">{bucket.statement}</p>
                              </div>
                            </div>
                          </div>
                          
                          {/* OKRs List */}
                          {bucket.okrs && bucket.okrs.length > 0 && (
                            <div className="ml-11 space-y-2">
                              <h4 className="text-xs font-medium text-auro-text-tertiary uppercase tracking-wider mb-2">Key Results</h4>
                              {bucket.okrs
                                .filter((okr) => okr.description && okr.description.trim().length > 0)
                                .sort((a, b) => a.order_index - b.order_index)
                                .map((okr, okrIndex) => (
                                  <div key={okr.id || okrIndex} className="flex items-start gap-3 py-2">
                                    <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-auro-accent mt-2"></div>
                                    <div className="flex-1">
                                      <p className="text-sm text-auro-text-primary mb-1">{okr.description}</p>
                                      {(okr.target_value_number !== null || okr.target_value_text) && (
                                        <div className="flex items-center gap-2 text-xs text-auro-text-tertiary">
                                          <span className="px-2 py-0.5 rounded-full bg-auro-surface2 capitalize">
                                            {okr.metric_type}
                                          </span>
                                          {okr.target_value_number !== null && (
                                            <span>Target: {okr.target_value_number}</span>
                                          )}
                                          {okr.target_value_text && (
                                            <span>Target: {okr.target_value_text}</span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* Kanban Board */}
            <div className="flex gap-4 overflow-x-auto pb-4">
              {/* Ice box Column */}
              <div className="flex-shrink-0 w-80">
                <div className="glass-card p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-auro-text-primary">Ice box</h3>
                    <span className="px-2 py-0.5 rounded-full bg-auro-surface2 text-auro-text-secondary text-xs">
                      {tasks.icebox.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {tasks.icebox.map((task) => (
                      <div
                        key={task.id}
                        className="glass-panel p-4 rounded-lg cursor-pointer hover:border-auro-stroke-strong transition-all"
                      >
                        <h4 className="text-sm font-medium text-auro-text-primary mb-2">
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className="text-xs text-auro-text-tertiary mb-3">{task.description}</p>
                        )}
                        <div className="flex items-center gap-2 mb-3">
                          {task.assignees.map((assignee, i) => (
                            <div
                              key={i}
                              className="w-6 h-6 rounded-full bg-auro-surface1 border border-auro-stroke-subtle flex items-center justify-center text-xs text-auro-text-secondary"
                            >
                              {assignee[0]}
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap mb-3">
                          {task.tags.map((tag, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-full bg-auro-surface2 text-auro-text-secondary text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-auro-text-tertiary">
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            {task.comments}
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            {task.views}
                          </span>
                          {task.attachments && (
                            <span className="flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                              </svg>
                              {task.attachments}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* In Progress Column */}
              <div className="flex-shrink-0 w-80">
                <div className="glass-card p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-auro-text-primary">In Progress</h3>
                    <span className="px-2 py-0.5 rounded-full bg-auro-surface2 text-auro-text-secondary text-xs">
                      {tasks.inProgress.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {tasks.inProgress.map((task) => (
                      <div
                        key={task.id}
                        className="glass-panel p-4 rounded-lg cursor-pointer hover:border-auro-stroke-strong transition-all"
                      >
                        <h4 className="text-sm font-medium text-auro-text-primary mb-2">
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className="text-xs text-auro-text-tertiary mb-3">{task.description}</p>
                        )}
                        <div className="flex items-center gap-2 mb-3">
                          {task.assignees.map((assignee, i) => (
                            <div
                              key={i}
                              className="w-6 h-6 rounded-full bg-auro-surface1 border border-auro-stroke-subtle flex items-center justify-center text-xs text-auro-text-secondary"
                            >
                              {assignee[0]}
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap mb-3">
                          {task.tags.map((tag, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-full bg-auro-surface2 text-auro-text-secondary text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-auro-text-tertiary">
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            {task.comments}
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            {task.views}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Discussion Column */}
              <div className="flex-shrink-0 w-80">
                <div className="glass-card p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-auro-text-primary">Discussion</h3>
                    <span className="px-2 py-0.5 rounded-full bg-auro-surface2 text-auro-text-secondary text-xs">
                      {tasks.discussion.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {tasks.discussion.map((task) => (
                      <div
                        key={task.id}
                        className="glass-panel p-4 rounded-lg cursor-pointer hover:border-auro-stroke-strong transition-all"
                      >
                        <h4 className="text-sm font-medium text-auro-text-primary mb-2">
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className="text-xs text-auro-text-tertiary mb-3">{task.description}</p>
                        )}
                        <div className="flex items-center gap-2 mb-3">
                          {task.assignees.map((assignee, i) => (
                            <div
                              key={i}
                              className="w-6 h-6 rounded-full bg-auro-surface1 border border-auro-stroke-subtle flex items-center justify-center text-xs text-auro-text-secondary"
                            >
                              {assignee[0]}
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap mb-3">
                          {task.tags.map((tag, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-full bg-auro-surface2 text-auro-text-secondary text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-auro-text-tertiary">
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            {task.comments}
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            {task.views}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Right Sidebar */}
        <aside
          className={`glass-panel p-4 flex flex-col gap-4 overflow-y-auto transition-all duration-300 relative ${
            isRightSidebarVisible ? 'w-[380px]' : 'w-0 overflow-hidden p-0 opacity-0'
          }`}
        >
          {/* Hide Sidebar Button */}
          {isRightSidebarVisible && (
            <button
              onClick={() => setIsRightSidebarVisible(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center glass-control rounded-md hover:bg-white/10 transition-colors z-10"
              aria-label="Hide sidebar"
              title="Hide sidebar"
            >
              <svg className="w-4 h-4 text-auro-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Recent Project Work */}
          <div>
            <h3 className="text-sm font-semibold text-auro-text-primary mb-3">Your recent project work</h3>
            <div className="space-y-3">
              <div className="glass-card p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-auro-accent-soft flex items-center justify-center">
                    <svg className="w-5 h-5 text-auro-accent" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-auro-text-primary">Design of the page "Reviews"</h4>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-6 h-6 rounded-full bg-auro-surface1 border border-auro-stroke-subtle" />
                      <div className="w-6 h-6 rounded-full bg-auro-surface1 border border-auro-stroke-subtle -ml-2" />
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-auro-text-tertiary">Progress</span>
                    <span className="text-xs text-auro-text-secondary">71%</span>
                  </div>
                  <div className="h-2 rounded-full bg-auro-surface2 overflow-hidden">
                    <div className="h-full bg-auro-accent rounded-full" style={{ width: '71%' }} />
                  </div>
                </div>
              </div>

              <div className="glass-card p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-auro-warning/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-auro-warning" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-auro-text-primary">Preparing for UX Testing</h4>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-6 h-6 rounded-full bg-auro-surface1 border border-auro-stroke-subtle" />
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-auro-text-tertiary">Progress</span>
                    <span className="text-xs text-auro-text-secondary">43%</span>
                  </div>
                  <div className="h-2 rounded-full bg-auro-surface2 overflow-hidden">
                    <div className="h-full bg-auro-success rounded-full" style={{ width: '43%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Time Management */}
          <div>
            <h3 className="text-sm font-semibold text-auro-text-primary mb-3">Time Management</h3>
            <div className="glass-card p-4 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-semibold text-auro-text-primary">36h 10m</span>
                <button className="px-3 py-1.5 rounded-full bg-auro-accent-soft text-auro-text-primary text-xs font-medium border border-auro-accent/35">
                  Now
                </button>
              </div>
              <div className="h-20 flex items-end gap-1">
                {[20, 35, 28, 45, 60, 55, 40].map((height, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t bg-auro-accent"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-auro-text-tertiary">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </div>
            </div>
          </div>

          {/* Team Chat */}
          <div className="flex-1 flex flex-col">
            <h3 className="text-sm font-semibold text-auro-text-primary mb-3">Team Chat</h3>
            <div className="flex-1 glass-card p-4 rounded-lg flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <button className="w-8 h-8 flex items-center justify-center glass-control rounded-md hover:bg-white/5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
                <button className="w-8 h-8 flex items-center justify-center glass-control rounded-md hover:bg-white/5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 space-y-4 mb-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-auro-surface1 border border-auro-stroke-subtle flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-auro-text-primary mb-1">
                      Can you tell me how the task is progressing?
                    </p>
                    <p className="text-xs text-auro-text-tertiary">1h ago</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-auro-surface1 border border-auro-stroke-subtle flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-auro-text-primary mb-1">
                      Do you need new texts for articles from me?
                    </p>
                    <p className="text-xs text-auro-text-tertiary">1h ago</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-auro-surface1 border border-auro-stroke-subtle flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-auro-text-primary mb-1">
                      In progress, I'll text you later about some tasks
                    </p>
                    <p className="text-xs text-auro-text-tertiary">1h ago</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-auro-surface1 border border-auro-stroke-subtle flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-auro-text-primary mb-1">Waiting, ok</p>
                    <p className="text-xs text-auro-text-tertiary">1h ago</p>
                  </div>
                </div>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Type a message"
                  className="glass-control w-full h-10 px-4 pr-10 rounded-full text-sm text-auro-text-primary placeholder:text-auro-text-tertiary"
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center">
                  <svg className="w-4 h-4 text-auro-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Profile Edit Modal */}
      {profile && (
        <ProfileEditModal
          isOpen={isProfileEditModalOpen}
          onClose={() => setIsProfileEditModalOpen(false)}
          onComplete={async () => {
            await reloadProfile()
          }}
          currentFirstName={profile.first_name || ''}
          currentLastName={profile.last_name || ''}
        />
      )}

      {/* Avatar Selection Modal */}
      <AvatarSelectionModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        onSelect={handleAvatarUpdate}
        currentPreset={profile?.avatar_preset as AvatarPreset | null}
        currentPreviewUrl={profile?.avatar_url || null}
      />

      {/* Show Sidebar Button - Appears when sidebar is hidden */}
      {!isRightSidebarVisible && (
        <button
          onClick={() => setIsRightSidebarVisible(true)}
          className="fixed right-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 flex items-center justify-center glass-control rounded-full hover:bg-white/10 transition-all shadow-lg backdrop-blur-sm"
          aria-label="Show sidebar"
          title="Show sidebar"
        >
          <svg
            className="w-5 h-5 text-auro-text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            style={{ transform: 'rotate(180deg)' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Vision Board Modal */}
      {isVisionBoardModalOpen && visionBoardVersion && visionBoardImages.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsVisionBoardModalOpen(false)
            }
          }}
        >
          <div className="relative w-full max-w-5xl max-h-[90vh] bg-auro-bg0 rounded-3xl overflow-hidden glass-panel shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-auro-stroke-subtle">
              <div>
                <h2 className="text-2xl font-semibold text-auro-text-primary">Vision Board</h2>
                <p className="text-sm text-auro-text-secondary mt-1">Your current vision for this journey</p>
              </div>
              <button
                onClick={() => setIsVisionBoardModalOpen(false)}
                className="w-10 h-10 flex items-center justify-center glass-control rounded-full hover:bg-white/10 transition-colors"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5 text-auro-text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="relative mx-auto" style={{ maxWidth: '1200px' }}>
                <div
                  className="relative rounded-2xl overflow-hidden mx-auto"
                  style={{
                    width: '100%',
                    paddingBottom: '133.33%', // 1200:1600 aspect ratio
                    position: 'relative',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                  }}
                >
                  <div className="absolute inset-0">
                    {/* Render vision board images and text elements at full size */}
                    {visionBoardImages
                      .sort((a, b) => (a.z_index || 0) - (b.z_index || 0))
                      .map((image) => {
                        const isText = image.element_type === 'text'
                        const x = image.position_x ?? 0
                        const y = image.position_y ?? 0
                        const rotation = image.rotation ?? 0
                        const width = image.width ?? (isText ? 200 : 200)
                        const height = image.height ?? (isText ? 100 : 200)
                        const CANVAS_WIDTH = 1200
                        const CANVAS_HEIGHT = 1600

                        return (
                          <div
                            key={image.id}
                            className="absolute"
                            style={{
                              left: `${(x / CANVAS_WIDTH) * 100}%`,
                              top: `${(y / CANVAS_HEIGHT) * 100}%`,
                              transform: `rotate(${rotation}deg)`,
                              width: `${(width / CANVAS_WIDTH) * 100}%`,
                              height: `${(height / CANVAS_HEIGHT) * 100}%`,
                              zIndex: image.z_index || 0,
                            }}
                          >
                            {isText ? (
                              // Text element
                              <div className="relative w-full h-full rounded-lg overflow-visible shadow-lg glass-card p-3 border border-auro-stroke-subtle">
                                <div
                                  className="text-auro-text-primary text-sm break-words"
                                  dangerouslySetInnerHTML={{ __html: image.text_content || '<p>Text</p>' }}
                                  style={{ wordBreak: 'break-word' }}
                                />
                              </div>
                            ) : (
                              // Image element
                              <div className="relative w-full h-full rounded-lg overflow-hidden shadow-lg">
                                {image.preview_url ? (
                                  <img
                                    src={image.preview_url}
                                    alt={image.caption || 'Vision board image'}
                                    className="w-full h-full object-cover"
                                    draggable={false}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-auro-surface2">
                                    <svg className="w-12 h-12 text-auro-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                )}
                                {image.caption && (
                                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                                    <p className="text-white text-xs font-medium line-clamp-2">{image.caption}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard

