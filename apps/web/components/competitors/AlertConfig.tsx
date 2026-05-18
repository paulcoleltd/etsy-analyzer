'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AlertConfigData {
  newListing: boolean
  priceChange: boolean
  reviewMilestone: boolean
  channels: Array<'in_app' | 'email'>
}

interface Props {
  config: AlertConfigData
  onSave: (config: AlertConfigData) => Promise<void>
}

export function AlertConfig({ config: initial, onSave }: Props) {
  const [config, setConfig] = useState<AlertConfigData>(initial)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function toggle(key: keyof Omit<AlertConfigData, 'channels'>) {
    setConfig((c) => ({ ...c, [key]: !c[key] }))
    setSaved(false)
  }

  function toggleChannel(ch: 'in_app' | 'email') {
    setConfig((c) => ({
      ...c,
      channels: c.channels.includes(ch)
        ? c.channels.filter((x) => x !== ch)
        : [...c.channels, ch],
    }))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    try { await onSave(config); setSaved(true) }
    finally { setSaving(false) }
  }

  return (
    <div className="rounded-2xl border bg-white p-5 space-y-4">
      <p className="text-sm font-semibold text-gray-700">Alert settings</p>

      <div className="space-y-3">
        {[
          { key: 'newListing' as const,      label: 'New listings',       desc: 'When they add a new listing' },
          { key: 'priceChange' as const,     label: 'Price changes',      desc: 'When a price changes by >5%' },
          { key: 'reviewMilestone' as const, label: 'Review milestones',  desc: '10, 25, 50, 100… reviews' },
        ].map(({ key, label, desc }) => (
          <label key={key} className="flex items-start gap-3 cursor-pointer">
            <div
              className={cn(
                'mt-0.5 h-5 w-5 shrink-0 rounded border-2 transition-colors flex items-center justify-center',
                config[key]
                  ? 'border-orange-500 bg-orange-500'
                  : 'border-gray-300 bg-white',
              )}
              onClick={() => toggle(key)}
            >
              {config[key] && <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">{label}</p>
              <p className="text-xs text-gray-400">{desc}</p>
            </div>
          </label>
        ))}
      </div>

      <div className="border-t pt-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Channels</p>
        <div className="flex gap-2">
          {(['in_app', 'email'] as const).map((ch) => (
            <button
              key={ch}
              onClick={() => toggleChannel(ch)}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-medium border transition-colors capitalize',
                config.channels.includes(ch)
                  ? 'border-orange-400 bg-orange-50 text-orange-700'
                  : 'border-gray-200 text-gray-500 hover:bg-gray-50',
              )}
            >
              {ch === 'in_app' ? 'In-app' : 'Email'}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60 transition-colors"
      >
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        {saved ? 'Saved!' : 'Save alerts'}
      </button>
    </div>
  )
}
