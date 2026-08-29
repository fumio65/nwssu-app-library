import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Download, Star, Grid, ChevronRight,
  Tag, Info, Clock, X,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

const BRAND = '#06433C'

export default function AppDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [app, setApp] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lightbox, setLightbox] = useState(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    async function fetchApp() {
      const { data } = await supabase
        .from('apps')
        .select('*')
        .eq('id', id)
        .single()
      setApp(data)
      setLoading(false)
    }
    fetchApp()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f6f5]">
        <div style={{ background: BRAND }} className="h-14 flex items-center px-4">
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <ArrowLeft size={16} className="text-white" />
          </button>
        </div>
        <div className="px-4 py-6 flex flex-col gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-white rounded-2xl animate-pulse border border-gray-100" />
          ))}
        </div>
      </div>
    )
  }

  if (!app) {
    return (
      <div className="min-h-screen bg-[#f5f6f5] flex flex-col items-center justify-center gap-3 px-6">
        <Grid size={32} className="text-gray-300" />
        <p className="text-sm font-semibold text-gray-700">App not found</p>
        <button onClick={() => navigate('/')} className="text-xs text-brand-600 font-medium hover:underline">
          ← Back to library
        </button>
      </div>
    )
  }

  const screenshots = app.screenshots ?? []
  const descriptionLong = (app.description ?? '').length > 200
  const descriptionText = expanded || !descriptionLong
    ? app.description
    : app.description?.slice(0, 200) + '…'

  return (
    <div className="min-h-screen bg-[#f5f6f5]">

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="" className="max-w-full max-h-full rounded-xl object-contain" />
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Header */}
      <div style={{ background: BRAND }} className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <ArrowLeft size={16} className="text-white" />
        </button>
        <p className="text-sm font-bold text-white truncate flex-1">{app.name}</p>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">

        {/* App hero card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-gray-100 p-5"
        >
          <div className="flex items-start gap-4 mb-4">
            {app.icon_url ? (
              <img src={app.icon_url} alt={app.name} className="w-20 h-20 rounded-2xl object-cover border border-gray-100 shrink-0" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-brand-50 flex items-center justify-center shrink-0">
                <Grid size={32} className="text-brand-600" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-gray-900 leading-tight">{app.name}</h1>
              {app.category && (
                <p className="text-xs text-brand-600 mt-1">{app.category}</p>
              )}
              {app.version && (
                <p className="text-xs text-gray-400 mt-0.5">Version {app.version}</p>
              )}
              {app.featured && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full mt-1.5">
                  <Star size={9} /> Featured
                </span>
              )}
            </div>
          </div>

          {/* Download button */}
          <a
            href={app.apk_url ?? '#'}
            onClick={!app.apk_url ? (e) => e.preventDefault() : undefined}
            download={!!app.apk_url}
            className={`flex items-center justify-center gap-2 w-full h-12 rounded-xl text-sm font-semibold transition-colors ${
              app.apk_url
                ? 'bg-brand-600 text-white hover:bg-brand-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Download size={16} />
            {app.apk_url ? 'Download APK' : 'Coming soon'}
          </a>
          {!app.apk_url && (
            <p className="text-[11px] text-gray-400 text-center mt-2">
              This app is not yet available for download.
            </p>
          )}
        </motion.div>

        {/* Screenshots */}
        {screenshots.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              Screenshots
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {screenshots.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setLightbox(url)}
                  className="shrink-0 rounded-2xl overflow-hidden border border-gray-100 hover:border-brand-200 transition-colors"
                >
                  <img
                    src={url}
                    alt={`Screenshot ${i + 1}`}
                    className="h-64 w-auto object-cover"
                  />
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Description */}
        {app.description && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="bg-white rounded-2xl border border-gray-100 p-5"
          >
            <h2 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Info size={14} className="text-brand-600" />
              About this app
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
              {descriptionText}
            </p>
            {descriptionLong && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs text-brand-600 font-medium mt-2 hover:underline flex items-center gap-1"
              >
                {expanded ? 'Show less' : 'Read more'}
                <ChevronRight size={12} className={`transition-transform ${expanded ? 'rotate-90' : ''}`} />
              </button>
            )}
          </motion.div>
        )}

        {/* What's new / Changelog */}
        {app.changelog && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-gray-100 p-5"
          >
            <h2 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Clock size={14} className="text-brand-600" />
              What's new
            </h2>
            {app.version && (
              <p className="text-xs text-brand-600 font-medium mb-2">Version {app.version}</p>
            )}
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
              {app.changelog}
            </p>
          </motion.div>
        )}

        {/* App info */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="bg-white rounded-2xl border border-gray-100 p-5"
        >
          <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Tag size={14} className="text-brand-600" />
            App info
          </h2>
          <div className="flex flex-col divide-y divide-gray-50">
            {[
              { label: 'Version', value: app.version ?? '—' },
              { label: 'Category', value: app.category ?? '—' },
              { label: 'Platform', value: 'Android' },
              { label: 'Developer', value: 'Northwest Samar State University' },
              { label: 'Compatibility', value: 'Android 8.0 and above' },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-2.5">
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-xs font-medium text-gray-700">{value}</p>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  )
}