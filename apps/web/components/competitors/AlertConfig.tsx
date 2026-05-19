'use client'

import { useState } from 'react'
import { Loader2, CheckCircle2, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AlertConfigData {
  newListing: boolean
  priceChange: boolean
  reviewMilestone: boolean
  channels: Array<'in_app' | 'email'>
}

export function AlertConfig({ config: initial, onSave }: { config: AlertConfigData; onSave: (c: AlertConfigData) => Promise<void> }) {
  const [config, setConfig] = useState<AlertConfigData>(initial)
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)

  const toggle = (key: keyof Omit<AlertConfigData, 'channels'>) => {
    setConfig(c => ({ ...c, [key]: !c[key] }))
    setSaved(false)
  }

  const toggleChannel = (ch: 'in_app' | 'email') => {
    setConfig(c => ({
      ...c,
      channels: c.channels.includes(ch) ? c.channels.filter(x => x !== ch) : [...c.channels, ch],
    }))
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try { await onSave(config); setSaved(true) }
    finally { setSaving(false) }
  }

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50">
          <Bell className="h-3.5 w-3.5 text-orange-500" />
        </div>
        <p className="text-sm font-bold text-slate-800">Alert settings</p>
      </div>

      {/* Toggles */}
      <div className="space-y-3">
        {[
          { key: 'newListing'      as const, label: 'New listings',      desc: 'When they add a new listing'  },
          { key: 'priceChange'     as const, label: 'Price changes',     desc: 'When a price changes by >5%'  },
          { key: 'reviewMilestone' as const, label: 'Review milestones', desc: '10, 25, 50, 100… reviews'    },
        ].map(({ key, label, desc }) => (
          <label key={key} className="flex cursor-pointer items-start gap-3">
            <div
              onClick={() => toggle(key)}
              className={cn(
                'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all',
                config[key] ? 'border-orange-500 bg-orange-500' : 'border-slate-300 bg-white hover:border-orange-300',
              )}
            >
              {config[key] && (
                <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">{label}</p>
              <p className="text-xs text-slate-400">{desc}</p>
            </div>
          </label>
        ))}
      </div>

      {/* Channels */}
      <div className="border-t border-slate-100 pt-4">
        <p className="section-label mb-2">Delivery channels</p>
        <div className="flex gap-2">
          {(['in_app', 'email'] as const).map(ch => (
            <button
              key={ch}
              onClick={() => toggleChannel(ch)}
              className={cn(
                'rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all',
                config.channels.includes(ch)
                  ? 'border-orange-300 bg-orange-50 text-orange-700'
                  : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50',
              )}
            >
              {ch === 'in_app' ? 'In-app' : 'Email'}
            </button>
          ))}
        </div>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving}
        className={cn('btn-primary w-full justify-center', saved && '!from-emerald-500 !to-emerald-600')}
      >
        {saving
          ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
          : saved
            ? <><CheckCircle2 className="h-4 w-4" /> Saved!</>
            : 'Save alerts'}
      </button>
    </div>
  )
}
