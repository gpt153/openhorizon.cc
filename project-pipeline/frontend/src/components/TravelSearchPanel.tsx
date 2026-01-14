import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import api from '../services/api'

interface Flight {
  id: string
  airline: string
  price: number
  duration: string
  connections: number
  departureTime: string
  arrivalTime: string
  origin: string
  destination: string
  groupSuitability: number
  aiAnalysis: string
}

interface TravelAgency {
  id: string
  name: string
  website: string
  contactEmail?: string
  contactPhone?: string
  specializations: string[]
  groupSuitability: number
  aiAnalysis: string
}

interface TravelSearchPanelProps {
  phaseId: string
  defaultOrigin?: string
  defaultDestination?: string
  defaultPassengers?: number
}

export function TravelSearchPanel({
  phaseId,
  defaultOrigin = '',
  defaultDestination = '',
  defaultPassengers = 30,
}: TravelSearchPanelProps) {
  const [origin, setOrigin] = useState(defaultOrigin)
  const [destination, setDestination] = useState(defaultDestination)
  const [date, setDate] = useState('')
  const [passengers, setPassengers] = useState(defaultPassengers)

  const [searchResults, setSearchResults] = useState<{
    flights: Flight[]
    agencies: TravelAgency[]
  } | null>(null)

  const [selectedFlights, setSelectedFlights] = useState<Set<string>>(new Set())
  const [selectedAgencies, setSelectedAgencies] = useState<Set<string>>(new Set())
  const [quotesDialogOpen, setQuotesDialogOpen] = useState(false)
  const [generatedEmails, setGeneratedEmails] = useState<
    { recipient?: string; subject: string; body: string }[]
  >([])

  const searchMutation = useMutation({
    mutationFn: async (params: { phaseId: string; origin: string; destination: string; date: string; passengers: number }) => {
      const { data } = await api.post(`/phases/${params.phaseId}/search-travel`, params)
      return data.data
    },
    onSuccess: (data) => {
      setSearchResults(data)
      alert('Found travel options!')
    },
    onError: (error: any) => {
      alert(`Search failed: ${error.response?.data?.error || error.message}`)
    },
  })

  const generateQuotesMutation = useMutation({
    mutationFn: async (params: any) => {
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
    if (!origin || !destination || !date || !passengers) {
      alert('Please fill in all fields')
      return
    }

    searchMutation.mutate({
      phaseId,
      origin,
      destination,
      date,
      passengers,
    })
  }

  const handleFlightToggle = (flightId: string) => {
    const newSelected = new Set(selectedFlights)
    if (newSelected.has(flightId)) {
      newSelected.delete(flightId)
    } else {
      newSelected.add(flightId)
    }
    setSelectedFlights(newSelected)
  }

  const handleAgencyToggle = (agencyId: string) => {
    const newSelected = new Set(selectedAgencies)
    if (newSelected.has(agencyId)) {
      newSelected.delete(agencyId)
    } else {
      newSelected.add(agencyId)
    }
    setSelectedAgencies(newSelected)
  }

  const handleRequestQuotes = () => {
    if (selectedFlights.size === 0 && selectedAgencies.size === 0) {
      alert('Please select at least one option')
      return
    }

    generateQuotesMutation.mutate({
      phaseId,
      origin,
      destination,
      date,
      passengers,
      selectedFlightIds: Array.from(selectedFlights),
      selectedAgencyIds: Array.from(selectedAgencies),
      flights: searchResults?.flights || [],
      agencies: searchResults?.agencies || [],
    })
  }

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <div className="border rounded-lg shadow-sm">
        <div className="border-b px-6 py-4">
          <h3 className="text-lg font-semibold">Search Travel Options</h3>
        </div>
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="origin" className="block text-sm font-medium text-gray-700">
                Origin
              </label>
              <input
                id="origin"
                type="text"
                placeholder="e.g., Stockholm"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="destination" className="block text-sm font-medium text-gray-700">
                Destination
              </label>
              <input
                id="destination"
                type="text"
                placeholder="e.g., Barcelona"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                Travel Date
              </label>
              <input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="passengers" className="block text-sm font-medium text-gray-700">
                Number of Passengers
              </label>
              <input
                id="passengers"
                type="number"
                min="1"
                value={passengers}
                onChange={(e) => setPassengers(parseInt(e.target.value) || 0)}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                </svg>
                Search Travel Options
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results */}
      {searchMutation.isPending && <SearchingSkeleton />}

      {searchResults && (
        <>
          {/* Flights */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                </svg>
                Flights ({searchResults.flights.length})
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {searchResults.flights.map((flight) => (
                <FlightCard
                  key={flight.id}
                  flight={flight}
                  selected={selectedFlights.has(flight.id)}
                  onToggle={() => handleFlightToggle(flight.id)}
                />
              ))}
            </div>
          </div>

          {/* Travel Agencies */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Travel Agencies ({searchResults.agencies.length})
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {searchResults.agencies.map((agency) => (
                <AgencyCard
                  key={agency.id}
                  agency={agency}
                  selected={selectedAgencies.has(agency.id)}
                  onToggle={() => handleAgencyToggle(agency.id)}
                />
              ))}
            </div>
          </div>

          {/* Action Button */}
          {(selectedFlights.size > 0 || selectedAgencies.size > 0) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">
                    {selectedFlights.size + selectedAgencies.size} option(s) selected
                  </p>
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

function FlightCard({
  flight,
  selected,
  onToggle,
}: {
  flight: Flight
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
            <h4 className="font-semibold text-lg">{flight.airline}</h4>
            {flight.connections === 0 && (
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                Direct
              </span>
            )}
            {selected && (
              <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Departure</p>
              <p className="font-medium">{flight.departureTime}</p>
            </div>
            <div>
              <p className="text-gray-500">Arrival</p>
              <p className="font-medium">{flight.arrivalTime}</p>
            </div>
            <div>
              <p className="text-gray-500">Duration</p>
              <p className="font-medium">{flight.duration}</p>
            </div>
            <div>
              <p className="text-gray-500">Price</p>
              <p className="font-medium text-lg">€{flight.price}</p>
            </div>
          </div>
        </div>
        <div className="text-right">
          <span
            className={`px-2 py-1 text-sm rounded-full ${
              flight.groupSuitability >= 8
                ? 'bg-green-100 text-green-700'
                : flight.groupSuitability >= 6
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {flight.groupSuitability}/10
          </span>
        </div>
      </div>

      {/* AI Analysis */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm font-semibold mb-2">AI Analysis</p>
        <div className="text-sm text-gray-600 whitespace-pre-wrap">
          {flight.aiAnalysis}
        </div>
      </div>
    </div>
  )
}

function AgencyCard({
  agency,
  selected,
  onToggle,
}: {
  agency: TravelAgency
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
            <h4 className="font-semibold text-lg">{agency.name}</h4>
            {selected && (
              <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-gray-500">Website</p>
              <p className="font-medium">{agency.website}</p>
            </div>
            {agency.contactEmail && (
              <div>
                <p className="text-gray-500">Email</p>
                <p className="font-medium">{agency.contactEmail}</p>
              </div>
            )}
            {agency.contactPhone && (
              <div>
                <p className="text-gray-500">Phone</p>
                <p className="font-medium">{agency.contactPhone}</p>
              </div>
            )}
            <div>
              <p className="text-gray-500 mb-1">Specializations</p>
              <div className="flex flex-wrap gap-1">
                {agency.specializations.map((spec, idx) => (
                  <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                    {spec}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="text-right">
          <span
            className={`px-2 py-1 text-sm rounded-full ${
              agency.groupSuitability >= 8
                ? 'bg-green-100 text-green-700'
                : agency.groupSuitability >= 6
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {agency.groupSuitability}/10
          </span>
        </div>
      </div>

      {/* AI Analysis */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm font-semibold mb-2">AI Analysis</p>
        <div className="text-sm text-gray-600 whitespace-pre-wrap">
          {agency.aiAnalysis}
        </div>
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
  emails: { recipient?: string; subject: string; body: string }[]
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
          <h3 className="text-lg font-semibold">Quote Request Emails</h3>
          <p className="text-sm text-gray-600 mt-1">
            {emails.length} email{emails.length !== 1 ? 's' : ''} generated. Copy and send to request quotes.
          </p>
        </div>
        <div className="px-6 py-4 space-y-6">
          {emails.map((email, index) => (
            <div key={index} className="border rounded-lg p-6">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">To:</label>
                  <p className="font-medium">{email.recipient}</p>
                </div>
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
      <div className="h-8 bg-gray-200 rounded w-48"></div>
      <div className="h-64 bg-gray-200 rounded w-full"></div>
    </div>
  )
}
