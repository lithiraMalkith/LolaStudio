'use client'

import { useEffect, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap-config'
import { useAuth } from '@/contexts/auth-context'
import { fetchMessages, updateMessageStatus, deleteMessage, type Message } from '@/lib/admin-client'
import { Search, Mail, MailOpen, Archive, Trash2, Clock, User, Info } from 'lucide-react'

export default function MessagesPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { user, hasPermission } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useGSAP(() => {
    gsap.from('.page-header', { opacity: 0, y: -10, duration: 0.4, ease: 'power2.out' })
    const cards = document.querySelectorAll('.message-card')
    if (cards.length > 0) {
      gsap.from('.message-card', { opacity: 0, y: 20, stagger: 0.06, duration: 0.5, ease: 'power3.out', delay: 0.2 })
    }
  }, { scope: containerRef })

  useEffect(() => {
    const loadMessages = async () => {
      if (!user) return
      setLoading(true)

      try {
        const token = await user.getIdToken()
        const rawMessages = await fetchMessages(token)
        setMessages(rawMessages)
      } catch (error) {
        console.error('Failed to load messages:', error)
      } finally {
        setLoading(false)
      }
    }

    loadMessages()
  }, [user])

  const handleUpdateStatus = async (id: string, status: 'unread' | 'read' | 'archived') => {
    if (!user) return
    try {
      const token = await user.getIdToken()
      await updateMessageStatus(id, status, token)
      setMessages(messages.map(m => m.id === id ? { ...m, status } : m))
    } catch (error) {
      console.error('Failed to update message status:', error)
      alert('Failed to update status')
    }
  }

  const handleDelete = async (id: string) => {
    if (!user) return
    if (!confirm('Are you sure you want to delete this message permanently?')) return
    
    try {
      const token = await user.getIdToken()
      await deleteMessage(id, token)
      setMessages(messages.filter(m => m.id !== id))
    } catch (error) {
      console.error('Failed to delete message:', error)
      alert('Failed to delete message')
    }
  }

  const filtered = messages.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase()) ||
    m.subject.toLowerCase().includes(search.toLowerCase())
  )

  const canWrite = hasPermission('messages:write')
  const canDelete = hasPermission('messages:delete')

  return (
    <div ref={containerRef} className="space-y-6">
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-brand-text">Messages</h1>
          <p className="text-brand-muted text-sm mt-1">{messages.filter(m => m.status === 'unread').length} unread messages</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-[448px]">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted pointer-events-none" />
        <input type="text" placeholder="Search by name, email or subject..." value={search} onChange={(e) => setSearch(e.target.value)} className="form-input pl-10" />
      </div>

      {/* Message Cards List */}
      <div className="space-y-4">
        {filtered.map((message) => (
          <div key={message.id} className={`message-card bg-brand-surface rounded-xl border p-5 transition-all ${message.status === 'unread' ? 'border-brand-gold bg-brand-gold/5' : 'border-brand-border'}`}>
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
              <div className="flex items-start gap-4 flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${message.status === 'unread' ? 'bg-brand-gold/20 text-brand-gold' : 'bg-brand-bg text-brand-muted'}`}>
                  {message.status === 'unread' ? <Mail className="w-5 h-5" /> : <MailOpen className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-brand-text truncate">{message.subject}</h3>
                    {message.status === 'unread' && (
                      <span className="px-2 py-0.5 rounded-full bg-brand-gold/20 text-brand-gold text-[10px] font-medium uppercase tracking-wider shrink-0">New</span>
                    )}
                  </div>
                  <p className="text-sm text-brand-text-secondary whitespace-pre-wrap">{message.message}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 md:flex-col md:items-end shrink-0 text-xs text-brand-muted">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>{message.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  <a href={`mailto:${message.email}`} className="hover:text-brand-gold transition-colors">{message.email}</a>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{new Date(message.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end items-center pt-4 border-t border-brand-border/50 gap-2">
              {canWrite && message.status === 'unread' && (
                <button onClick={() => handleUpdateStatus(message.id, 'read')} className="px-3 py-1.5 text-xs font-medium bg-brand-bg border border-brand-border text-brand-text rounded-lg hover:bg-brand-surface transition-colors flex items-center gap-1.5">
                  <MailOpen className="w-3.5 h-3.5" /> Mark Read
                </button>
              )}
              {canWrite && message.status !== 'archived' && (
                <button onClick={() => handleUpdateStatus(message.id, 'archived')} className="px-3 py-1.5 text-xs font-medium bg-brand-bg border border-brand-border text-brand-text rounded-lg hover:bg-brand-surface transition-colors flex items-center gap-1.5">
                  <Archive className="w-3.5 h-3.5" /> Archive
                </button>
              )}
              {canDelete && (
                <button onClick={() => handleDelete(message.id)} className="px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-400/10 rounded-lg transition-colors flex items-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && !loading && (
        <div className="text-center py-16 bg-brand-surface rounded-xl border border-brand-border">
          <MailOpen className="w-12 h-12 text-brand-muted mx-auto mb-3" />
          <p className="text-brand-muted">No messages found</p>
        </div>
      )}
    </div>
  )
}
