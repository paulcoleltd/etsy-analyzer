'use client'

import { useState } from 'react'
import { Check, Copy, Zap, Tag, FileText, Image, Truck } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Suggestions {
  title_rewrite: string | null
  tag_additions: string[]
  tag_removals: string[]
  description_tips: string[]
  photo_tips: string[]
  priority_actions: string[]
}

interface Props {
  suggestions: Suggestions
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={copy}
      className="ml-2 rounded p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
      title="Copy"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}

function Section({
  icon: Icon, title, children, className,
}: {
  icon: React.ElementType
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('rounded-xl border bg-white p-4', className)}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-4 w-4 text-orange-500" />
        <p className="text-sm font-semibold text-gray-800">{title}</p>
      </div>
      {children}
    </div>
  )
}

export function SuggestionsPanel({ suggestions }: Props) {
  const hasSuggestions =
    suggestions.title_rewrite ||
    suggestions.tag_additions.length > 0 ||
    suggestions.description_tips.length > 0 ||
    suggestions.photo_tips.length > 0 ||
    suggestions.priority_actions.length > 0

  if (!hasSuggestions) {
    return (
      <div className="rounded-xl border bg-green-50 p-4 text-center">
        <p className="text-sm font-medium text-green-700">
          This listing scores well across all dimensions — no major improvements needed.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Priority actions */}
      {suggestions.priority_actions.length > 0 && (
        <Section icon={Zap} title="Priority actions" className="border-orange-200 bg-orange-50">
          <ol className="space-y-2">
            {suggestions.priority_actions.map((action, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-orange-800">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-200 text-xs font-bold text-orange-700">
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
        <Section icon={FileText} title="Suggested title">
          <div className="flex items-start gap-1">
            <p className="flex-1 rounded-lg bg-gray-50 p-2 text-sm text-gray-800">
              {suggestions.title_rewrite}
            </p>
            <CopyButton text={suggestions.title_rewrite} />
          </div>
          <p className="mt-1 text-xs text-gray-400">
            {suggestions.title_rewrite.length} / 140 characters
          </p>
        </Section>
      )}

      {/* Tag additions */}
      {suggestions.tag_additions.length > 0 && (
        <Section icon={Tag} title="Tags to add">
          <div className="flex flex-wrap gap-1.5">
            {suggestions.tag_additions.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 ring-1 ring-green-200"
              >
                + {tag}
                <CopyButton text={tag} />
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Tag removals */}
      {suggestions.tag_removals.length > 0 && (
        <Section icon={Tag} title="Tags to remove">
          <div className="flex flex-wrap gap-1.5">
            {suggestions.tag_removals.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 ring-1 ring-red-200 line-through"
              >
                {tag}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Description tips */}
      {suggestions.description_tips.length > 0 && (
        <Section icon={FileText} title="Description improvements">
          <ul className="space-y-1.5">
            {suggestions.description_tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400" />
                {tip}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Photo tips */}
      {suggestions.photo_tips.length > 0 && (
        <Section icon={Image} title="Photo improvements">
          <ul className="space-y-1.5">
            {suggestions.photo_tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400" />
                {tip}
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  )
}
