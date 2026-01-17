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
import { Plane, Building2, Loader2, CheckCircle2, Mail } from 'lucide-react'
import type { Flight, TravelAgency } from '@/lib/ai/agents/travel-agent'
import { toast } from 'sonner'

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

  const searchMutation = trpc.pipeline.phases.searchTravel.useMutation({
    onSuccess: (data) => {
      setSearchResults(data)
      toast.success('Found travel options!')
    },
    onError: (error) => {
      toast.error(`Search failed: ${error.message}`)
    },
  })

  const generateQuotesMutation = trpc.pipeline.phases.generateTravelQuotes.useMutation({
    onSuccess: (data) => {
      setGeneratedEmails(data.emails)
      setQuotesDialogOpen(true)
    },
    onError: (error) => {
      toast.error(`Failed to generate quotes: ${error.message}`)
    },
  })

  const handleSearch = () => {
    if (!origin || !destination || !date || !passengers) {
      toast.error('Please fill in all fields')
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
      toast.error('Please select at least one option')
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
      <Card>
        <CardHeader>
          <CardTitle>Search Travel Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="origin">Origin</Label>
              <Input
                id="origin"
                placeholder="e.g., Stockholm"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="destination">Destination</Label>
              <Input
                id="destination"
                placeholder="e.g., Barcelona"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Travel Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passengers">Number of Passengers</Label>
              <Input
                id="passengers"
                type="number"
                min="1"
                value={passengers}
                onChange={(e) => setPassengers(parseInt(e.target.value) || 0)}
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
                <Plane className="mr-2 h-4 w-4" />
                Search Travel Options
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {searchMutation.isPending && <SearchingSkeleton />}

      {searchResults && (
        <>
          {/* Flights */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Plane className="h-5 w-5" />
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
                <Building2 className="h-5 w-5" />
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
            <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">
                      {selectedFlights.size + selectedAgencies.size} option(s) selected
                    </p>
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
              <h4 className="font-semibold text-lg">{flight.airline}</h4>
              {flight.connections === 0 && (
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  Direct
                </Badge>
              )}
              {selected && <CheckCircle2 className="h-5 w-5 text-blue-500" />}
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-zinc-500">Departure</p>
                <p className="font-medium">{flight.departureTime}</p>
              </div>
              <div>
                <p className="text-zinc-500">Arrival</p>
                <p className="font-medium">{flight.arrivalTime}</p>
              </div>
              <div>
                <p className="text-zinc-500">Duration</p>
                <p className="font-medium">{flight.duration}</p>
              </div>
              <div>
                <p className="text-zinc-500">Price</p>
                <p className="font-medium text-lg">€{flight.price}</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <Badge
              className={
                flight.groupSuitability >= 8
                  ? 'bg-green-100 text-green-700'
                  : flight.groupSuitability >= 6
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
              }
            >
              {flight.groupSuitability}/10
            </Badge>
          </div>
        </div>

        {/* AI Analysis */}
        <div className="mt-4 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
          <p className="text-sm font-semibold mb-2">AI Analysis</p>
          <div className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">
            {flight.aiAnalysis}
          </div>
        </div>
      </CardContent>
    </Card>
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
              <h4 className="font-semibold text-lg">{agency.name}</h4>
              {selected && <CheckCircle2 className="h-5 w-5 text-blue-500" />}
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-zinc-500">Website</p>
                <p className="font-medium">{agency.website}</p>
              </div>
              {agency.contactEmail && (
                <div>
                  <p className="text-zinc-500">Email</p>
                  <p className="font-medium">{agency.contactEmail}</p>
                </div>
              )}
              {agency.contactPhone && (
                <div>
                  <p className="text-zinc-500">Phone</p>
                  <p className="font-medium">{agency.contactPhone}</p>
                </div>
              )}
              <div>
                <p className="text-zinc-500 mb-1">Specializations</p>
                <div className="flex flex-wrap gap-1">
                  {agency.specializations.map((spec, idx) => (
                    <Badge key={idx} variant="secondary">
                      {spec}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="text-right">
            <Badge
              className={
                agency.groupSuitability >= 8
                  ? 'bg-green-100 text-green-700'
                  : agency.groupSuitability >= 6
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
              }
            >
              {agency.groupSuitability}/10
            </Badge>
          </div>
        </div>

        {/* AI Analysis */}
        <div className="mt-4 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
          <p className="text-sm font-semibold mb-2">AI Analysis</p>
          <div className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">
            {agency.aiAnalysis}
          </div>
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
  emails: { recipient?: string; subject: string; body: string }[]
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
          <DialogTitle>Quote Request Emails</DialogTitle>
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
                  <div>
                    <Label>To:</Label>
                    <p className="font-medium">{email.recipient}</p>
                  </div>
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
                    onClick={() =>
                      handleCopy(
                        index,
                        `Subject: ${email.subject}\n\n${email.body}`
                      )
                    }
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
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}
