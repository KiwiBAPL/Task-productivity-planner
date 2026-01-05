import { useState, useEffect } from 'react'
import { getCurrentUser, updateProfile, type AvatarData } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { AvatarIcon, type AvatarPreset } from './avatars/PresetAvatars'
import ProfileEditModal from './ProfileEditModal'
import AvatarSelectionModal from './AvatarSelectionModal'

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
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('Dashboard')
  const [isProfileEditModalOpen, setIsProfileEditModalOpen] = useState(false)
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false)

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
              { icon: 'home', label: 'Home' },
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
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-auro-text-secondary hover:bg-white/5 hover:text-auro-text-primary transition-all"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  {/* Icon placeholder */}
                  <div className="w-4 h-4 rounded border border-auro-stroke-subtle" />
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
        <main className="flex-1 flex flex-col overflow-hidden">
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
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-auro-accent-soft flex items-center justify-center">
                <svg className="w-6 h-6 text-auro-accent" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-auro-text-primary">DentalPro</h1>
                <div className="flex items-center gap-4 mt-1 text-xs text-auro-text-tertiary uppercase tracking-wider">
                  <span>CREATED Dec 3, 9:52 am</span>
                  <span>•</span>
                  <span>DUE DATE JAN 24, 00:00 am</span>
                  <span>•</span>
                  <span>TRACKED TIME 5 days, 39 sec</span>
                </div>
              </div>
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
        <aside className="w-[380px] glass-panel p-4 flex flex-col gap-4 overflow-y-auto">
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
    </div>
  )
}

export default Dashboard

