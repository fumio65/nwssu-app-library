import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Grid, Globe, Plus, Pencil, Trash2, LogOut, X,
  AlertCircle, CheckCircle2, Star, ExternalLink, Upload, ImagePlus,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

// ── Reusable form field ───────────────────────────────────────────────────────
function Field({ label, required, children }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 block mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls = 'w-full h-10 px-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent placeholder:text-gray-300'
const textareaCls = 'w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent placeholder:text-gray-300 resize-none'

// ── Icon uploader ─────────────────────────────────────────────────────────────
function IconUploader({ currentUrl, onUploaded }) {
  const fileRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(currentUrl ?? null)
  const [error, setError] = useState(null)

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return setError('Please select an image file.')
    setError(null)
    setUploading(true)

    // Show local blob preview immediately while uploading
    const blobUrl = URL.createObjectURL(file)
    setPreview(blobUrl)

    const ext = file.name.split('.').pop()
    const path = `icons/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('app-icons')
      .upload(path, file, { cacheControl: '3600', upsert: false })

    if (uploadError) {
      setError('Upload failed: ' + uploadError.message)
      setPreview(currentUrl ?? null)
    } else {
      const { data: { publicUrl } } = supabase.storage.from('app-icons').getPublicUrl(path)
      setPreview(publicUrl)
      onUploaded(publicUrl)
    }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleRemove() {
    // Delete from Supabase storage if it's a Supabase URL
    if (preview && preview.includes('app-icons')) {
      try {
        // Extract the storage path from the public URL
        const path = preview.split('/app-icons/')[1]
        if (path) {
          await supabase.storage.from('app-icons').remove([path])
        }
      } catch (err) {
        console.error('Failed to delete icon from storage:', err)
      }
    }
    setPreview(null)
    onUploaded(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="flex items-center gap-4">
      {preview ? (
        <div className="relative shrink-0">
          <img src={preview} alt="" className="w-16 h-16 rounded-2xl object-cover border border-gray-200" />
          {uploading && (
            <div className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {!uploading && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center"
            >
              <X size={10} />
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-16 h-16 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 hover:border-brand-400 transition-colors shrink-0 disabled:opacity-50"
        >
          {uploading
            ? <div className="w-4 h-4 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
            : <ImagePlus size={18} className="text-gray-300" />
          }
          {!uploading && <span className="text-[9px] text-gray-300">Upload</span>}
        </button>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-700">App icon</p>
        <p className="text-[11px] text-gray-400 mt-0.5">PNG, JPG — recommended 512×512px</p>

        {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  )
}


// ── Screenshot uploader ───────────────────────────────────────────────────────
function ScreenshotUploader({ currentUrls, onUploaded }) {
  const fileRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [screenshots, setScreenshots] = useState(currentUrls ?? [])
  const [error, setError] = useState(null)

  async function handleFile(e) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    const remaining = 5 - screenshots.length
    const toAdd = files.slice(0, remaining)
    setError(null)
    setUploading(true)

    const uploaded = []
    for (const file of toAdd) {
      if (!file.type.startsWith('image/')) continue
      const ext = file.name.split('.').pop()
      const path = `screenshots/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('app-screenshots')
        .upload(path, file, { cacheControl: '3600', upsert: false })
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('app-screenshots').getPublicUrl(path)
        uploaded.push(publicUrl)
      }
    }

    const newScreenshots = [...screenshots, ...uploaded]
    setScreenshots(newScreenshots)
    onUploaded(newScreenshots)
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleRemove(url) {
    try {
      const path = url.split('/app-screenshots/')[1]
      if (path) await supabase.storage.from('app-screenshots').remove([path])
    } catch (err) {
      console.error('Failed to delete screenshot:', err)
    }
    const updated = screenshots.filter(s => s !== url)
    setScreenshots(updated)
    onUploaded(updated)
  }

  return (
    <div>
      <div className="flex gap-2 flex-wrap mb-2">
        {screenshots.map((url, i) => (
          <div key={i} className="relative">
            <img src={url} alt="" className="w-20 h-36 object-cover rounded-xl border border-gray-200" />
            <button
              type="button"
              onClick={() => handleRemove(url)}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center"
            >
              <X size={10} />
            </button>
          </div>
        ))}
        {screenshots.length < 5 && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-20 h-36 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 hover:border-brand-400 transition-colors disabled:opacity-50"
          >
            {uploading
              ? <div className="w-4 h-4 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
              : <ImagePlus size={18} className="text-gray-300" />
            }
            {!uploading && <span className="text-[9px] text-gray-300 text-center px-1">Add</span>}
          </button>
        )}
      </div>
      <p className="text-[11px] text-gray-400">Upload up to 5 screenshots (portrait recommended)</p>
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFile} />
    </div>
  )
}

// ── App form modal ────────────────────────────────────────────────────────────
function AppModal({ app, onClose, onSave }) {
  const [form, setForm] = useState({
    name: app?.name ?? '',
    slug: app?.slug ?? '',
    description: app?.description ?? '',
    category: app?.category ?? '',
    version: app?.version ?? '',
    apk_url: app?.apk_url ?? '',
    icon_url: app?.icon_url ?? '',
    changelog: app?.changelog ?? '',
    screenshots: app?.screenshots ?? [],
    featured: app?.featured ?? false,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.name.trim()) return setError('App name is required.')
    setSaving(true)
    setError(null)
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || null,
      description: form.description.trim() || null,
      category: form.category.trim() || null,
      version: form.version.trim() || null,
      apk_url: form.apk_url.trim() || null,
      icon_url: form.icon_url || null,
      changelog: form.changelog.trim() || null,
      screenshots: form.screenshots ?? [],
      featured: form.featured,
    }
    const { error } = app?.id
      ? await supabase.from('apps').update(payload).eq('id', app.id)
      : await supabase.from('apps').insert(payload)
    if (error) setError(error.message)
    else { onSave(); onClose() }
    setSaving(false)
  }

  return (
    <ModalWrapper onClose={onClose}>
      <ModalHeader title={app?.id ? 'Edit app' : 'Add app'} onClose={onClose} />
      <form onSubmit={handleSave} className="overflow-y-auto flex-1 px-5 py-4 flex flex-col gap-4">
        {error && <ErrorBanner message={error} />}

        {/* Icon upload */}
        <IconUploader
          currentUrl={form.icon_url}
          onUploaded={url => set('icon_url', url ?? '')}
        />

        <Field label="App name" required>
          <input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. CampusFind" />
        </Field>

        <Field label="URL slug">
          <input className={inputCls} value={form.slug} onChange={e => set('slug', e.target.value)} placeholder="e.g. campusfind" />
          <p className="text-[11px] text-gray-400 mt-1">Used in the URL: /apps/<strong>{form.slug || 'slug'}</strong></p>
        </Field>

        <Field label="Description">
          <textarea className={textareaCls} rows={3} value={form.description} onChange={e => set('description', e.target.value)} placeholder="What does this app do?" />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Category">
            <input className={inputCls} value={form.category} onChange={e => set('category', e.target.value)} placeholder="e.g. Student Tools" />
          </Field>
          <Field label="Version">
            <input className={inputCls} value={form.version} onChange={e => set('version', e.target.value)} placeholder="e.g. 1.0.0" />
          </Field>
        </div>

        <Field label="APK download URL">
          <input
            className={inputCls}
            value={form.apk_url}
            onChange={e => set('apk_url', e.target.value)}
            placeholder="Paste GitHub release or Drive link…"
            type="url"
          />
          <p className="text-[11px] text-gray-400 mt-1">
            Upload your APK to GitHub Releases or Google Drive and paste the link here.
          </p>
        </Field>

        <Field label="Screenshots">
          <ScreenshotUploader
            currentUrls={form.screenshots}
            onUploaded={urls => set('screenshots', urls)}
          />
        </Field>

        <Field label="What's new / Changelog">
          <textarea
            className={textareaCls}
            rows={3}
            value={form.changelog}
            onChange={e => set('changelog', e.target.value)}
            placeholder="Describe what's new in this version…"
          />
        </Field>

        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={e => set('featured', e.target.checked)}
            className="w-4 h-4 rounded accent-brand-600"
          />
          <span className="text-sm text-gray-700">Mark as featured</span>
        </label>
      </form>
      <ModalFooter onClose={onClose} onSave={handleSave} saving={saving} />
    </ModalWrapper>
  )
}

// ── Link form modal ───────────────────────────────────────────────────────────
function LinkModal({ link, onClose, onSave }) {
  const [form, setForm] = useState({
    name: link?.name ?? '',
    url: link?.url ?? '',
    description: link?.description ?? '',
    category: link?.category ?? '',
    icon_url: link?.icon_url ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.name.trim()) return setError('Link name is required.')
    if (!form.url.trim()) return setError('URL is required.')
    setSaving(true)
    setError(null)
    const payload = {
      name: form.name.trim(),
      url: form.url.trim(),
      description: form.description.trim() || null,
      category: form.category.trim() || null,
      icon_url: form.icon_url.trim() || null,
    }
    const { error } = link?.id
      ? await supabase.from('links').update(payload).eq('id', link.id)
      : await supabase.from('links').insert(payload)
    if (error) setError(error.message)
    else { onSave(); onClose() }
    setSaving(false)
  }

  return (
    <ModalWrapper onClose={onClose}>
      <ModalHeader title={link?.id ? 'Edit link' : 'Add link'} onClose={onClose} />
      <form onSubmit={handleSave} className="overflow-y-auto flex-1 px-5 py-4 flex flex-col gap-4">
        {error && <ErrorBanner message={error} />}
        <Field label="Site name" required>
          <input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. NwSSU Official Website" />
        </Field>
        <Field label="URL" required>
          <input className={inputCls} value={form.url} onChange={e => set('url', e.target.value)} placeholder="https://..." type="url" />
        </Field>
        <Field label="Description">
          <input className={inputCls} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Brief description" />
        </Field>
        <Field label="Category">
          <input className={inputCls} value={form.category} onChange={e => set('category', e.target.value)} placeholder="e.g. Official, Enrollment, Library" />
        </Field>
        <Field label="Icon URL">
          <input className={inputCls} value={form.icon_url} onChange={e => set('icon_url', e.target.value)} placeholder="https://..." type="url" />
          <p className="text-[11px] text-gray-400 mt-1">Paste the website's favicon or logo URL.</p>
        </Field>
      </form>
      <ModalFooter onClose={onClose} onSave={handleSave} saving={saving} />
    </ModalWrapper>
  )
}

// ── Shared modal pieces ───────────────────────────────────────────────────────
function ModalWrapper({ onClose, children }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col shadow-xl"
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

function ModalHeader({ title, onClose }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
      <p className="text-sm font-bold text-gray-900">{title}</p>
      <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
        <X size={16} className="text-gray-400" />
      </button>
    </div>
  )
}

function ModalFooter({ onClose, onSave, saving }) {
  return (
    <div className="flex gap-2 px-5 py-4 border-t border-gray-100 shrink-0">
      <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-gray-200 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors">
        Cancel
      </button>
      <button onClick={onSave} disabled={saving} className="flex-1 h-10 rounded-xl bg-brand-600 text-white text-sm font-semibold disabled:opacity-60 hover:bg-brand-700 transition-colors">
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  )
}

function ErrorBanner({ message }) {
  return (
    <div className="flex items-center gap-2 bg-red-50 text-red-700 text-xs rounded-xl px-3 py-2.5">
      <AlertCircle size={13} className="shrink-0" />
      {message}
    </div>
  )
}

// ── Delete confirm ────────────────────────────────────────────────────────────
function DeleteConfirm({ name, onConfirm, onCancel, deleting }) {
  return (
    <ModalWrapper onClose={onCancel}>
      <div className="p-6 flex flex-col items-center text-center gap-4">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
          <Trash2 size={20} className="text-red-500" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900 mb-1">Delete "{name}"?</p>
          <p className="text-xs text-gray-400">This cannot be undone.</p>
        </div>
        <div className="flex gap-2 w-full">
          <button onClick={onCancel} className="flex-1 h-10 rounded-xl border border-gray-200 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={deleting} className="flex-1 h-10 rounded-xl bg-red-500 text-white text-sm font-semibold disabled:opacity-60 hover:bg-red-600 transition-colors">
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </ModalWrapper>
  )
}

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [apps, setApps] = useState([])
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('apps')
  const [appModal, setAppModal] = useState(null)
  const [linkModal, setLinkModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState(null)
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    const [{ data: a }, { data: l }] = await Promise.all([
      supabase.from('apps').select('*').order('featured', { ascending: false }).order('name'),
      supabase.from('links').select('*').order('category').order('name'),
    ])
    setApps(a ?? [])
    setLinks(l ?? [])
    setLoading(false)
  }

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    const table = deleteTarget.type === 'app' ? 'apps' : 'links'
    await supabase.from(table).delete().eq('id', deleteTarget.id)
    setDeleteTarget(null)
    setDeleting(false)
    fetchAll()
    showToast('Deleted successfully')
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  return (
    <div className="min-h-screen bg-[#f5f6f5]">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-xs font-medium px-4 py-2.5 rounded-full flex items-center gap-2"
          >
            <CheckCircle2 size={13} className="text-green-400" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {appModal !== null && (
          <AppModal
            app={appModal === 'new' ? null : appModal}
            onClose={() => setAppModal(null)}
            onSave={() => { fetchAll(); showToast('App saved') }}
          />
        )}
        {linkModal !== null && (
          <LinkModal
            link={linkModal === 'new' ? null : linkModal}
            onClose={() => setLinkModal(null)}
            onSave={() => { fetchAll(); showToast('Link saved') }}
          />
        )}
        {deleteTarget && (
          <DeleteConfirm
            name={deleteTarget.name}
            onConfirm={handleDelete}
            onCancel={() => setDeleteTarget(null)}
            deleting={deleting}
          />
        )}
        {showSignOutConfirm && (
          <ModalWrapper onClose={() => setShowSignOutConfirm(false)}>
            <div className="p-6 flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                <LogOut size={20} className="text-red-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 mb-1">Sign out?</p>
                <p className="text-xs text-gray-400">You'll need to sign back in to access the NwSSU Connect admin panel.</p>
              </div>
              <div className="flex gap-2 w-full">
                <button
                  onClick={() => setShowSignOutConfirm(false)}
                  className="flex-1 h-10 rounded-xl border border-gray-200 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSignOut}
                  className="flex-1 h-10 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors"
                >
                  Sign out
                </button>
              </div>
            </div>
          </ModalWrapper>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/apple-touch-icon.png" alt="NwSSU Connect" className="w-9 h-9 rounded-full object-cover shrink-0 border border-gray-100" />
            <div>
              <p className="text-sm font-bold text-gray-900">NwSSU Connect Admin</p>
              <p className="text-xs text-gray-400 hidden sm:block">Northwest Samar State University</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={import.meta.env.VITE_LIBRARY_URL ?? 'http://localhost:5175'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-brand-600 transition-colors px-2 py-1.5"
            >
              <ExternalLink size={13} /> View site
            </a>
            <button
              onClick={() => setShowSignOutConfirm(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-red-500 transition-colors px-2 py-1.5"
            >
              <LogOut size={13} /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs text-gray-400 mb-1">Total apps</p>
            <p className="text-2xl font-bold text-brand-600">{apps.length}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs text-gray-400 mb-1">Total links</p>
            <p className="text-2xl font-bold text-brand-600">{links.length}</p>
          </div>
        </div>

        {/* Tabs + add button */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1 bg-white border border-gray-100 rounded-xl p-1">
            {['apps', 'links'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                  activeTab === tab ? 'bg-brand-600 text-white' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <button
            onClick={() => activeTab === 'apps' ? setAppModal('new') : setLinkModal('new')}
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 transition-colors"
          >
            <Plus size={14} /> Add {activeTab === 'apps' ? 'app' : 'link'}
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-white rounded-2xl animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : activeTab === 'apps' ? (
          apps.length === 0 ? (
            <EmptyState
              icon={<Grid size={24} className="text-gray-300" />}
              title="No apps yet"
              desc="Add your first app to the library."
              action={<button onClick={() => setAppModal('new')} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 transition-colors"><Plus size={13} /> Add app</button>}
            />
          ) : (
            <div className="flex flex-col gap-3">
              {apps.map(app => (
                <div key={app.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
                  {app.icon_url ? (
                    <img src={app.icon_url} alt="" className="w-12 h-12 rounded-xl object-cover border border-gray-100 shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                      <Grid size={20} className="text-brand-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900">{app.name}</p>
                      {app.featured && (
                        <span className="flex items-center gap-0.5 text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full">
                          <Star size={8} /> Featured
                        </span>
                      )}
                      {app.category && (
                        <span className="text-[10px] text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded-full">{app.category}</span>
                      )}
                    </div>
                    {app.description && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{app.description}</p>
                    )}
                    <p className="text-[11px] text-gray-300 mt-0.5">
                      {app.apk_url ? '✓ APK linked' : '⚠ No APK yet'} {app.version ? `· v${app.version}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => setAppModal(app)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
                      <Pencil size={14} className="text-gray-400" />
                    </button>
                    <button onClick={() => setDeleteTarget({ ...app, type: 'app' })} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors">
                      <Trash2 size={14} className="text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          links.length === 0 ? (
            <EmptyState
              icon={<Globe size={24} className="text-gray-300" />}
              title="No links yet"
              desc="Add university websites and resources."
              action={<button onClick={() => setLinkModal('new')} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 transition-colors"><Plus size={13} /> Add link</button>}
            />
          ) : (
            <div className="flex flex-col gap-3">
              {links.map(link => (
                <div key={link.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
                  {link.icon_url ? (
                    <img src={link.icon_url} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-100 shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
                      <Globe size={16} className="text-brand-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900">{link.name}</p>
                      {link.category && (
                        <span className="text-[10px] text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded-full">{link.category}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{link.url}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
                      <ExternalLink size={14} className="text-gray-400" />
                    </a>
                    <button onClick={() => setLinkModal(link)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
                      <Pencil size={14} className="text-gray-400" />
                    </button>
                    <button onClick={() => setDeleteTarget({ ...link, type: 'link' })} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors">
                      <Trash2 size={14} className="text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </main>
    </div>
  )
}

function EmptyState({ icon, title, desc, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-full bg-white border border-gray-100 flex items-center justify-center mx-auto mb-3">
        {icon}
      </div>
      <p className="text-sm font-semibold text-gray-700 mb-1">{title}</p>
      <p className="text-xs text-gray-400 mb-4">{desc}</p>
      {action}
    </div>
  )
}