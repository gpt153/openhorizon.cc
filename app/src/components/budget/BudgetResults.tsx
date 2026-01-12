'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatCurrency } from '@/types/budget'
import {
  Plane,
  Utensils,
  Building2,
  TrendingUp,
  Check,
} from 'lucide-react'

interface BudgetResultsProps {
  result: {
    travelCosts: Record<
      string,
      {
        participants: number
        distance: number
        distanceBand: string
        costPerParticipant: number
        totalCost: number
        greenBonus?: number
      }
    >
    individualSupport: {
      perDiem: number
      days: number
      participants: number
      totalCost: number
    }
    organizationalSupport: number
    totalBudget: number
    breakdown: {
      travel: number
      perDiem: number
      organizational: number
    }
  }
}

export function BudgetResults({ result }: BudgetResultsProps) {
  return (
    <div className="space-y-6">
      {/* Total Budget */}
      <Card className="border-2 border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Total Project Budget</span>
            <span className="text-3xl font-bold text-green-700">
              {formatCurrency(result.totalBudget)}
            </span>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Plane className="h-5 w-5 text-blue-600" />
              <span className="font-medium">Travel Costs</span>
            </div>
            <span className="text-xl font-semibold">
              {formatCurrency(result.breakdown.travel)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Utensils className="h-5 w-5 text-orange-600" />
              <span className="font-medium">Individual Support (Per Diem)</span>
            </div>
            <span className="text-xl font-semibold">
              {formatCurrency(result.breakdown.perDiem)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-purple-600" />
              <span className="font-medium">Organizational Support</span>
            </div>
            <span className="text-xl font-semibold">
              {formatCurrency(result.breakdown.organizational)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Travel Costs Detail */}
      <Card>
        <CardHeader>
          <CardTitle>Travel Costs by Country</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="pb-3 text-left text-sm font-medium text-zinc-600">
                    Origin Country
                  </th>
                  <th className="pb-3 text-center text-sm font-medium text-zinc-600">
                    Participants
                  </th>
                  <th className="pb-3 text-center text-sm font-medium text-zinc-600">
                    Distance
                  </th>
                  <th className="pb-3 text-center text-sm font-medium text-zinc-600">
                    Band
                  </th>
                  <th className="pb-3 text-right text-sm font-medium text-zinc-600">
                    Per Person
                  </th>
                  <th className="pb-3 text-right text-sm font-medium text-zinc-600">
                    Total Cost
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(result.travelCosts).map(([country, data]) => (
                  <tr key={country} className="border-b last:border-0">
                    <td className="py-3 font-medium">
                      <Badge variant="outline">{country}</Badge>
                    </td>
                    <td className="py-3 text-center">{data.participants}</td>
                    <td className="py-3 text-center">{data.distance} km</td>
                    <td className="py-3 text-center text-xs text-zinc-600">
                      {data.distanceBand}
                    </td>
                    <td className="py-3 text-right">
                      {formatCurrency(data.costPerParticipant)}
                      {data.greenBonus && (
                        <span className="ml-1 text-xs text-green-600">
                          (+{formatCurrency(data.greenBonus)} green)
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-right font-semibold">
                      {formatCurrency(data.totalCost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Individual Support Detail */}
      <Card>
        <CardHeader>
          <CardTitle>Individual Support (Per Diem)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-zinc-600">Per Diem Rate:</span>
              <span className="font-medium">
                {formatCurrency(result.individualSupport.perDiem)}/day
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600">Duration:</span>
              <span className="font-medium">
                {result.individualSupport.days} days
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600">Participants:</span>
              <span className="font-medium">
                {result.individualSupport.participants}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg">
              <span className="font-semibold">Total:</span>
              <span className="font-bold">
                {formatCurrency(result.individualSupport.totalCost)}
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              Calculation: {result.individualSupport.participants} participants
              × {result.individualSupport.days} days ×{' '}
              {formatCurrency(result.individualSupport.perDiem)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Organizational Support Detail */}
      <Card>
        <CardHeader>
          <CardTitle>Organizational Support</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-zinc-600">
              Lump sum based on total participant count
            </p>
            <div className="flex items-center justify-between rounded-lg bg-purple-50 p-4">
              <span className="font-semibold text-purple-900">
                Lump Sum Amount:
              </span>
              <span className="text-2xl font-bold text-purple-700">
                {formatCurrency(result.organizationalSupport)}
              </span>
            </div>
            <div className="space-y-2 text-xs text-zinc-500">
              <p>• 1-10 participants: €500</p>
              <p>• 11-30 participants: €750</p>
              <p>• 31-60 participants: €1,000</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Success Message */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-green-600 p-1">
              <Check className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-green-900">
                Budget Calculated Successfully
              </h4>
              <p className="mt-1 text-sm text-green-700">
                All calculations follow Erasmus+ 2024-2027 unit cost guidelines.
                This budget can now be used to plan your project phases.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
