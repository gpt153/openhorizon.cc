import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import api from '../services/api'

interface AccommodationSuggestion {
  name: string
  type: 'hotel' | 'hostel' | 'residence' | 'apartment' | 'guesthouse' | 'airbnb'
  estimatedPrice: number
  location: string
  contact?: {
    email?: string
    phone?: string
    website?: string
  }
  features: string[]
  capacity?: {
    min?: number
    max?: number
  }
  rating?: number
  reviewCount?: number
  photos?: string[]
  suitabilityScore: number
  reasoning: string
  pros: string[]
  cons: string[]
}

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

  const searchMutation = useMutation({
    mutationFn: async (params: { phaseId: string; location: string; participants: number }) => {
      const { data } = await api.post(`/phases/${params.phaseId}/search-accommodation`, params)
      return data.data
    },
    onSuccess: (data) => {
      setSearchResults(data.options)
      alert('Found accommodation options!')
    },
    onError: (error: any) => {
      alert(`Search failed: ${error.response?.data?.error || error.message}`)
    },
  })

  const generateQuotesMutation = useMutation({
    mutationFn: async (params: { phaseId: string; selectedOptionNames: string[] }) => {
      const { data } = await api.post(`/phases/${params.phaseId}/generate-quotes`, params)
      return data.data
    },
    onSuccess: (data) => {
      setGeneratedEmails(data.emails)
      setQuotesDialogOpen(true)
    },
    onError: (error: any) => {
      alert(`Failed to generate quotes: ${error.response?.data?.error || error.message}`)
    },
  })

  const handleSearch = () => {
    if (!location || !participants) {
      alert('Please fill in all fields')
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
      alert('Please select at least one option')
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
      <div className="border rounded-lg shadow-sm">
        <div className="border-b px-6 py-4">
          <h3 className="text-lg font-semibold">Search Accommodation Options</h3>
        </div>
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                Location
              </label>
              <input
                id="location"
                type="text"
                placeholder="e.g., Barcelona"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="participants" className="block text-sm font-medium text-gray-700">
                Number of Participants
              </label>
              <input
                id="participants"
                type="number"
                min="1"
                value={participants}
                onChange={(e) => setParticipants(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button
            className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            onClick={handleSearch}
            disabled={searchMutation.isPending}
          >
            {searchMutation.isPending ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Searching...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Search Accommodation Options
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results */}
      {searchMutation.isPending && <SearchingSkeleton />}

      {searchResults && (
        <>
          {/* Accommodation Options */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
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
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{selectedOptions.size} option(s) selected</p>
                  <p className="text-sm text-gray-600">Ready to request quotes</p>
                </div>
                <button
                  onClick={handleRequestQuotes}
                  disabled={generateQuotesMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {generateQuotesMutation.isPending ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Generate Quote Requests
                    </>
                  )}
                </button>
              </div>
            </div>
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
    <div
      className={`border rounded-lg p-6 cursor-pointer transition-all ${
        selected
          ? 'border-blue-500 ring-2 ring-blue-500'
          : 'border-gray-200 hover:border-blue-300'
      }`}
      onClick={onToggle}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold text-lg">{option.name}</h4>
            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
              {option.type.charAt(0).toUpperCase() + option.type.slice(1)}
            </span>
            {selected && (
              <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm mb-3">
            <div>
              <p className="text-gray-500">Estimated Price</p>
              <p className="font-medium text-lg">€{option.estimatedPrice}</p>
            </div>
            <div>
              <p className="text-gray-500">Rating</p>
              <p className="font-medium">
                {option.rating ? `${option.rating}/5 ⭐` : 'N/A'}
                {option.reviewCount && ` (${option.reviewCount} reviews)`}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Capacity</p>
              <p className="font-medium">
                {option.capacity?.min || 'N/A'} - {option.capacity?.max || 'N/A'} people
              </p>
            </div>
            <div>
              <p className="text-gray-500">Location</p>
              <p className="font-medium">{option.location}</p>
            </div>
          </div>
          <div className="space-y-2">
            {option.features && option.features.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Features</p>
                <div className="flex flex-wrap gap-1">
                  {option.features.map((feature, idx) => (
                    <span key={idx} className="px-2 py-1 border border-gray-300 text-gray-700 text-xs rounded">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="text-right ml-4">
          <span
            className={`px-2 py-1 text-sm rounded-full ${
              option.suitabilityScore >= 80
                ? 'bg-green-100 text-green-700'
                : option.suitabilityScore >= 60
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {option.suitabilityScore}/100
          </span>
        </div>
      </div>

      {/* AI Analysis */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
        <p className="text-sm font-semibold">AI Analysis</p>

        {option.pros && option.pros.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-green-700 mb-1">PROS</p>
            <ul className="text-sm text-gray-600 space-y-1">
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
            <p className="text-xs font-semibold text-red-700 mb-1">CONS</p>
            <ul className="text-sm text-gray-600 space-y-1">
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
            <p className="text-xs font-semibold text-blue-700 mb-1">VERDICT</p>
            <p className="text-sm text-gray-600">{option.reasoning}</p>
          </div>
        )}
      </div>
    </div>
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
    alert('Email copied to clipboard!')
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-3xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="border-b px-6 py-4">
          <h3 className="text-lg font-semibold">Accommodation Quote Request Emails</h3>
          <p className="text-sm text-gray-600 mt-1">
            {emails.length} email{emails.length !== 1 ? 's' : ''} generated. Copy and send to request quotes.
          </p>
        </div>
        <div className="px-6 py-4 space-y-6">
          {emails.map((email, index) => (
            <div key={index} className="border rounded-lg p-6">
              <div className="space-y-3">
                {email.recipient && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">To:</label>
                    <p className="font-medium">{email.recipient}</p>
                  </div>
                )}
                {email.optionName && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Provider:</label>
                    <p className="font-medium">{email.optionName}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-700">Subject:</label>
                  <p className="font-medium">{email.subject}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Body:</label>
                  <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                    <pre className="text-sm whitespace-pre-wrap font-mono">{email.body}</pre>
                  </div>
                </div>
                <button
                  className="w-full px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center justify-center gap-2"
                  onClick={() => handleCopy(index, `Subject: ${email.subject}\n\n${email.body}`)}
                >
                  {copiedIndex === index ? (
                    <>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    'Copy Email'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t px-6 py-4 flex justify-end">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

function SearchingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-48"></div>
      <div className="h-64 bg-gray-200 rounded w-full"></div>
      <div className="h-64 bg-gray-200 rounded w-full"></div>
      <div className="h-64 bg-gray-200 rounded w-full"></div>
    </div>
  )
}
