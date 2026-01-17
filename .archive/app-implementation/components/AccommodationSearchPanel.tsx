'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { trpc } from '@/lib/trpc/client'
import { Building2, Loader2, CheckCircle2, Mail } from 'lucide-react'
import type { AccommodationSuggestion } from '@/lib/ai/agents/accommodation-agent'
import { toast } from 'sonner'

interface AccommodationSearchPanelProps {
  phaseId: string
  defaultLocation?: string
  defaultParticipants?: number
}

export function AccommodationSearchPanel({
  phaseId,
  defaultLocation = '',
  defaultParticipants = 30,
}: AccommodationSearchPanelProps) {
  const [location, setLocation] = useState(defaultLocation)
  const [participants, setParticipants] = useState(defaultParticipants)

  const [searchResults, setSearchResults] = useState<AccommodationSuggestion[] | null>(null)
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set())
  const [quotesDialogOpen, setQuotesDialogOpen] = useState(false)
  const [generatedEmails, setGeneratedEmails] = useState<
    { recipient?: string; subject: string; body: string; optionName?: string }[]
  >([])

  const searchMutation = trpc.pipeline.phases.searchAccommodation.useMutation({
    onSuccess: (data) => {
      setSearchResults(data.options)
      toast.success('Found accommodation options!')
    },
    onError: (error) => {
      toast.error(`Search failed: ${error.message}`)
    },
  })

  const generateQuotesMutation = trpc.pipeline.phases.generateAccommodationQuoteEmails.useMutation({
    onSuccess: (data) => {
      setGeneratedEmails(data.emails)
      setQuotesDialogOpen(true)
    },
    onError: (error) => {
      toast.error(`Failed to generate quotes: ${error.message}`)
    },
  })

  const handleSearch = () => {
    if (!location || !participants) {
      toast.error('Please fill in all fields')
      return
    }

    searchMutation.mutate({
      phaseId,
      location,
      participants,
    })
  }

  const handleOptionToggle = (optionName: string) => {
    const newSelected = new Set(selectedOptions)
    if (newSelected.has(optionName)) {
      newSelected.delete(optionName)
    } else {
      newSelected.add(optionName)
    }
    setSelectedOptions(newSelected)
  }

  const handleRequestQuotes = () => {
    if (selectedOptions.size === 0) {
      toast.error('Please select at least one option')
      return
    }

    generateQuotesMutation.mutate({
      phaseId,
      selectedOptionNames: Array.from(selectedOptions),
    })
  }

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle>Search Accommodation Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g., Barcelona"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="participants">Number of Participants</Label>
              <Input
                id="participants"
                type="number"
                min="1"
                value={participants}
                onChange={(e) => setParticipants(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
          <Button
            className="mt-4 w-full"
            onClick={handleSearch}
            disabled={searchMutation.isPending}
          >
            {searchMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Building2 className="mr-2 h-4 w-4" />
                Search Accommodation Options
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {searchMutation.isPending && <SearchingSkeleton />}

      {searchResults && (
        <>
          {/* Accommodation Options */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Accommodation Options ({searchResults.length})
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {searchResults.map((option) => (
                <AccommodationOptionCard
                  key={option.name}
                  option={option}
                  selected={selectedOptions.has(option.name)}
                  onToggle={() => handleOptionToggle(option.name)}
                />
              ))}
            </div>
          </div>

          {/* Action Button */}
          {selectedOptions.size > 0 && (
            <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{selectedOptions.size} option(s) selected</p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Ready to request quotes
                    </p>
                  </div>
                  <Button onClick={handleRequestQuotes} disabled={generateQuotesMutation.isPending}>
                    {generateQuotesMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Generate Quote Requests
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Quotes Dialog */}
      <QuotesDialog
        open={quotesDialogOpen}
        onOpenChange={setQuotesDialogOpen}
        emails={generatedEmails}
      />
    </div>
  )
}

function AccommodationOptionCard({
  option,
  selected,
  onToggle,
}: {
  option: AccommodationSuggestion
  selected: boolean
  onToggle: () => void
}) {
  return (
    <Card
      className={`cursor-pointer transition-all ${
        selected
          ? 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-500 dark:ring-blue-400'
          : 'hover:border-blue-300 dark:hover:border-blue-700'
      }`}
      onClick={onToggle}
    >
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-semibold text-lg">{option.name}</h4>
              <Badge
                variant="secondary"
                className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200"
              >
                {option.type.charAt(0).toUpperCase() + option.type.slice(1)}
              </Badge>
              {selected && <CheckCircle2 className="h-5 w-5 text-blue-500" />}
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm mb-3">
              <div>
                <p className="text-zinc-500">Estimated Price</p>
                <p className="font-medium text-lg">€{option.estimatedPrice}</p>
              </div>
              <div>
                <p className="text-zinc-500">Rating</p>
                <p className="font-medium">
                  {option.rating ? `${option.rating}/5 ⭐` : 'N/A'}
                  {option.reviewCount && ` (${option.reviewCount} reviews)`}
                </p>
              </div>
              <div>
                <p className="text-zinc-500">Capacity</p>
                <p className="font-medium">
                  {option.capacity?.min || 'N/A'} - {option.capacity?.max || 'N/A'} people
                </p>
              </div>
              <div>
                <p className="text-zinc-500">Location</p>
                <p className="font-medium">{option.location}</p>
              </div>
            </div>
            <div className="space-y-2">
              {option.features && option.features.length > 0 && (
                <div>
                  <p className="text-sm text-zinc-500 mb-1">Features</p>
                  <div className="flex flex-wrap gap-1">
                    {option.features.map((feature, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="text-right ml-4">
            <Badge
              className={
                option.suitabilityScore >= 80
                  ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
                  : option.suitabilityScore >= 60
                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200'
                    : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'
              }
            >
              {option.suitabilityScore}/100
            </Badge>
          </div>
        </div>

        {/* AI Analysis */}
        <div className="mt-4 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg space-y-3">
          <p className="text-sm font-semibold">AI Analysis</p>

          {option.pros && option.pros.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">
                PROS
              </p>
              <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
                {option.pros.map((pro, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>{pro}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {option.cons && option.cons.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">CONS</p>
              <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
                {option.cons.map((con, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="mr-2">✗</span>
                    <span>{con}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {option.reasoning && (
            <div>
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">
                VERDICT
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{option.reasoning}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function QuotesDialog({
  open,
  onOpenChange,
  emails,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  emails: { recipient?: string; subject: string; body: string; optionName?: string }[]
}) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const handleCopy = (index: number, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    toast.success('Email copied to clipboard!')
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Accommodation Quote Request Emails</DialogTitle>
          <DialogDescription>
            {emails.length} email{emails.length !== 1 ? 's' : ''} generated. Copy and send to
            request quotes.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {emails.map((email, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {email.recipient && (
                    <div>
                      <Label>To:</Label>
                      <p className="font-medium">{email.recipient}</p>
                    </div>
                  )}
                  {email.optionName && (
                    <div>
                      <Label>Provider:</Label>
                      <p className="font-medium">{email.optionName}</p>
                    </div>
                  )}
                  <div>
                    <Label>Subject:</Label>
                    <p className="font-medium">{email.subject}</p>
                  </div>
                  <div>
                    <Label>Body:</Label>
                    <div className="mt-2 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                      <pre className="text-sm whitespace-pre-wrap font-mono">{email.body}</pre>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleCopy(index, `Subject: ${email.subject}\n\n${email.body}`)}
                  >
                    {copiedIndex === index ? (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      'Copy Email'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function SearchingSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}
