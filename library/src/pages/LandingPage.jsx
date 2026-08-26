import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Download, ExternalLink, Search, Grid, Globe, ChevronRight, Star } from 'lucide-react'
import { supabase } from '../lib/supabase'

const BRAND = '#06433C'

function AppCard({ app }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4 hover:border-brand-200 hover:shadow-sm transition-all"
    >
      <div className="flex items-start gap-4">
        {app.icon_url ? (
          <img src={app.icon_url} alt={app.name} className="w-16 h-16 rounded-2xl object-cover border border-gray-100 shrink-0" />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center shrink-0">
            <Grid size={28} className="text-brand-600" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">{app.name}</h3>
              {app.category && (
                <span className="text-[11px] font-medium text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full mt-1 inline-block">
                  {app.category}
                </span>
              )}
            </div>
            {app.featured && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full shrink-0">
                <Star size={9} /> Featured
              </span>
            )}
          </div>
          {app.version && (
            <p className="text-[11px] text-gray-400 mt-1">v{app.version}</p>
          )}
        </div>
      </div>

      {app.description && (
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{app.description}</p>
      )}

      {app.screenshots?.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {app.screenshots.slice(0, 3).map((s, i) => (
            <img key={i} src={s} alt="" className="h-24 w-auto rounded-xl border border-gray-100 shrink-0 object-cover" />
          ))}
        </div>
      )}

      <a
        href={app.apk_url ?? '#'}
        onClick={!app.apk_url ? (e) => e.preventDefault() : undefined}
        className={`flex items-center justify-center gap-2 w-full h-10 rounded-xl text-sm font-semibold transition-colors ${
          app.apk_url
            ? 'bg-brand-600 text-white hover:bg-brand-700'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
        download={!!app.apk_url}
      >
        <Download size={15} />
        {app.apk_url ? 'Download APK' : 'Coming soon'}
      </a>
    </motion.div>
  )
}

function LinkCard({ link }) {
  return (
    <motion.a
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-white rounded-xl border border-gray-100 px-4 py-3.5 flex items-center gap-3 hover:border-brand-200 hover:bg-brand-50/30 transition-all group"
    >
      {link.icon_url ? (
        <img src={link.icon_url} alt="" className="w-9 h-9 rounded-lg object-cover border border-gray-100 shrink-0" />
      ) : (
        <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
          <Globe size={16} className="text-brand-600" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{link.name}</p>
        {link.description && (
          <p className="text-xs text-gray-400 truncate mt-0.5">{link.description}</p>
        )}
      </div>
      <ExternalLink size={14} className="text-gray-300 group-hover:text-brand-600 shrink-0 transition-colors" />
    </motion.a>
  )
}

export default function LandingPage() {
  const [apps, setApps] = useState([])
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('apps')
  const [linkCategories, setLinkCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState('All')

  useEffect(() => {
    async function fetchAll() {
      const [{ data: appsData }, { data: linksData }] = await Promise.all([
        supabase.from('apps').select('*').order('featured', { ascending: false }).order('name'),
        supabase.from('links').select('*').order('category').order('name'),
      ])
      setApps(appsData ?? [])
      setLinks(linksData ?? [])
      const cats = ['All', ...new Set((linksData ?? []).map(l => l.category).filter(Boolean))]
      setLinkCategories(cats)
      setLoading(false)
    }
    fetchAll()
  }, [])

  const filteredApps = apps.filter(a =>
    a.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.description?.toLowerCase().includes(search.toLowerCase())
  )

  const filteredLinks = links.filter(l => {
    const matchSearch = l.name?.toLowerCase().includes(search.toLowerCase()) ||
      l.description?.toLowerCase().includes(search.toLowerCase())
    const matchCat = activeCategory === 'All' || l.category === activeCategory
    return matchSearch && matchCat
  })

  return (
    <div className="min-h-screen bg-[#f5f6f5]">
      {/* Header */}
      <header style={{ background: BRAND }} className="sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
              <Grid size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-tight">NwSSU App Library</p>
              <p className="text-[11px] text-white/50 leading-tight hidden sm:block">Northwest Samar State University</p>
            </div>
          </div>

        </div>
      </header>

      {/* Hero */}
      <section style={{ background: BRAND }} className="pb-10">
        <div className="max-w-4xl mx-auto px-4 pt-8 pb-4">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 leading-tight">
              Northwest Samar State University
            </h1>
            <p className="text-white/60 text-sm mb-6">
              Official apps and web resources for NwSSU students and staff.
            </p>
          </motion.div>

          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search apps and links…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-11 pl-10 pr-4 text-sm rounded-xl border-0 bg-white focus:outline-none focus:ring-2 focus:ring-white/30 placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-1 bg-white/10 rounded-xl p-1 w-fit">
            {['apps', 'links'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                  activeTab === tab ? 'bg-white text-brand-600' : 'text-white/70 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-48 bg-white rounded-2xl animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : activeTab === 'apps' ? (
          <>
            {filteredApps.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-14 h-14 rounded-full bg-white border border-gray-100 flex items-center justify-center mx-auto mb-3">
                  <Grid size={24} className="text-gray-300" />
                </div>
                <p className="text-sm font-semibold text-gray-700 mb-1">No apps found</p>
                <p className="text-xs text-gray-400">
                  {search ? 'Try a different search term.' : 'No apps have been added yet.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredApps.map(app => <AppCard key={app.id} app={app} />)}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Link category filter */}
            {linkCategories.length > 1 && (
              <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
                {linkCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
                      activeCategory === cat
                        ? 'bg-brand-600 text-white'
                        : 'bg-white text-gray-500 border border-gray-200 hover:border-brand-300'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {filteredLinks.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-14 h-14 rounded-full bg-white border border-gray-100 flex items-center justify-center mx-auto mb-3">
                  <Globe size={24} className="text-gray-300" />
                </div>
                <p className="text-sm font-semibold text-gray-700 mb-1">No links found</p>
                <p className="text-xs text-gray-400">
                  {search ? 'Try a different search term.' : 'No links have been added yet.'}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {filteredLinks.map(link => <LinkCard key={link.id} link={link} />)}
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-8">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
          <p className="text-xs text-gray-400">© {new Date().getFullYear()} Northwest Samar State University</p>

        </div>
      </footer>
    </div>
  )
}
