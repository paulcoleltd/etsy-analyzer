'use client'

import { useState } from 'react'
import { Check, Copy, Zap, Tag, FileText, Image } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Suggestions {
  title_rewrite: string | null
  tag_additions: string[]
  tag_removals: string[]
  description_tips: string[]
  photo_tips: string[]
  priority_actions: string[]
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="ml-1.5 rounded-md p-0.5 text-slate-400 transition-colors hover:text-slate-600"
      title="Copy"
    >
      {copied
        ? <Check className="h-3.5 w-3.5 text-emerald-500" />
        : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}

function Section({ icon: Icon, title, accent = false, children }: {
  icon: React.ElementType; title: string; accent?: boolean; children: React.ReactNode
}) {
  return (
    <div className={cn(
      'rounded-2xl border p-4',
      accent
        ? 'border-orange-200/80 bg-gradient-to-br from-orange-50 to-amber-50/40'
        : 'border-slate-200/70 bg-white',
    )}>
      <div className="mb-3 flex items-center gap-2">
        <div className={cn('flex h-6 w-6 items-center justify-center rounded-lg', accent ? 'bg-orange-100' : 'bg-slate-100')}>
          <Icon className={cn('h-3.5 w-3.5', accent ? 'text-orange-600' : 'text-slate-500')} />
        </div>
        <p className={cn('text-sm font-bold', accent ? 'text-orange-900' : 'text-slate-800')}>{title}</p>
      </div>
      {children}
    </div>
  )
}

export function SuggestionsPanel({ suggestions }: { suggestions: Suggestions }) {
  const hasAny = suggestions.title_rewrite
    || suggestions.tag_additions.length > 0
    || suggestions.description_tips.length > 0
    || suggestions.photo_tips.length > 0
    || suggestions.priority_actions.length > 0

  if (!hasAny) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
        <p className="text-sm font-semibold text-emerald-700">
          Excellent — this listing scores well across all dimensions. No major improvements needed.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Priority actions */}
      {suggestions.priority_actions.length > 0 && (
        <Section icon={Zap} title="Priority actions" accent>
          <ol className="space-y-2.5">
            {suggestions.priority_actions.map((action, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-orange-900">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-500 text-[10px] font-extrabold text-white">
                  {i + 1}
                </span>
                {action}
              </li>
            ))}
          </ol>
        </Section>
      )}

      {/* Title rewrite */}
      {suggestions.title_rewrite && (
        <Section icon={FileText} title="Suggested title rewrite">
          <div className="flex items-start gap-2">
            <p className="flex-1 rounded-xl bg-slate-50 p-3 text-sm text-slate-800 leading-relaxed">
              {suggestions.title_rewrite}
            </p>
            <CopyButton text={suggestions.title_rewrite} />
          </div>
          <p className="mt-1.5 text-xs text-slate-400">{suggestions.title_rewrite.length} / 140 characters</p>
        </Section>
      )}

      {/* Tag additions */}
      {suggestions.tag_additions.length > 0 && (
        <Section icon={Tag} title="Tags to add">
          <div className="flex flex-wrap gap-1.5">
            {suggestions.tag_additions.map(tag => (
              <span key={tag} className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                + {tag} <CopyButton text={tag} />
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Tag removals */}
      {suggestions.tag_removals.length > 0 && (
        <Section icon={Tag} title="Tags to remove">
          <div className="flex flex-wrap gap-1.5">
            {suggestions.tag_removals.map(tag => (
              <span key={tag} className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 line-through">
                {tag}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Description tips */}
      {suggestions.description_tips.length > 0 && (
        <Section icon={FileText} title="Description improvements">
          <ul className="space-y-2">
            {suggestions.description_tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400" />
                {tip}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Photo tips */}
      {suggestions.photo_tips.length > 0 && (
        <Section icon={Image} title="Photo improvements">
          <ul className="space-y-2">
            {suggestions.photo_tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400" />
                {tip}
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  )
}
