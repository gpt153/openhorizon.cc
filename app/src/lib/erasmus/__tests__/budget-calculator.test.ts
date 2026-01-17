import { describe, it, expect } from 'vitest'
import {
  getOrganizationalSupport,
  getPerDiemRate,
  getTravelCost,
  calculateDistance,
  calculateBudget,
} from '../budget-calculator'

describe('Budget Calculator', () => {
  describe('getOrganizationalSupport', () => {
    it('should return €500 for 1-10 participants', () => {
      expect(getOrganizationalSupport(1)).toBe(500)
      expect(getOrganizationalSupport(10)).toBe(500)
    })

    it('should return €750 for 11-30 participants', () => {
      expect(getOrganizationalSupport(11)).toBe(750)
      expect(getOrganizationalSupport(30)).toBe(750)
    })

    it('should return €1000 for 31-60 participants', () => {
      expect(getOrganizationalSupport(31)).toBe(1000)
      expect(getOrganizationalSupport(60)).toBe(1000)
    })

    it('should return €1000 for more than 60 participants', () => {
      expect(getOrganizationalSupport(100)).toBe(1000)
    })

    it('should throw error for invalid participant count', () => {
      expect(() => getOrganizationalSupport(0)).toThrow()
      expect(() => getOrganizationalSupport(-1)).toThrow()
    })
  })

  describe('getPerDiemRate', () => {
    it('should return correct per diem rate for Spain', () => {
      expect(getPerDiemRate('ES')).toBe(42)
    })

    it('should return correct per diem rate for Sweden', () => {
      expect(getPerDiemRate('SE')).toBe(62)
    })

    it('should return correct per diem rate for Germany', () => {
      expect(getPerDiemRate('DE')).toBe(55)
    })

    it('should throw error for unknown country', () => {
      expect(() => getPerDiemRate('XX')).toThrow()
    })
  })

  describe('getTravelCost', () => {
    it('should return correct cost for 10-99 km band', () => {
      const result = getTravelCost(50, false)
      expect(result.amount).toBe(23)
      expect(result.greenBonus).toBe(0)
      expect(result.band).toBe('10-99 km')
    })

    it('should return correct cost with green bonus for 10-99 km band', () => {
      const result = getTravelCost(50, true)
      expect(result.amount).toBe(23)
      expect(result.greenBonus).toBe(30)
      expect(result.band).toBe('10-99 km')
    })

    it('should return correct cost for 100-499 km band', () => {
      const result = getTravelCost(250, false)
      expect(result.amount).toBe(180)
      expect(result.greenBonus).toBe(0)
    })

    it('should return correct cost for 500-1999 km band', () => {
      const result = getTravelCost(1000, false)
      expect(result.amount).toBe(275)
      expect(result.greenBonus).toBe(0)
    })

    it('should return correct cost for 8000+ km band', () => {
      const result = getTravelCost(10000, false)
      expect(result.amount).toBe(1500)
      expect(result.greenBonus).toBe(0)
    })

    it('should throw error for distance less than 10 km', () => {
      expect(() => getTravelCost(5, false)).toThrow()
    })
  })

  describe('calculateDistance', () => {
    it('should calculate distance between Stockholm and Barcelona', () => {
      // Stockholm: 59.3293, 18.0686
      // Barcelona: 41.3851, 2.1734
      const distance = calculateDistance(59.3293, 18.0686, 41.3851, 2.1734)

      // Expected distance is approximately 2278 km
      expect(distance).toBeGreaterThan(2200)
      expect(distance).toBeLessThan(2350)
    })

    it('should return 0 for same coordinates', () => {
      const distance = calculateDistance(50.0, 10.0, 50.0, 10.0)
      expect(distance).toBe(0)
    })
  })

  describe('calculateBudget', () => {
    it('should calculate correct budget for sample project', async () => {
      // Sample project from issue: Barcelona destination, 30 participants from 3 countries, 7 days
      const input = {
        participantsByCountry: {
          SE: 15,
          DE: 10,
          PL: 5,
        },
        destinationCity: 'Barcelona',
        destinationCountry: 'ES',
        durationDays: 7,
        useGreenTravel: false,
      }

      const destinationCoords = { lat: 41.3851, lon: 2.1734 } // Barcelona
      const originCoordsByCountry = {
        SE: { lat: 59.3293, lon: 18.0686 }, // Stockholm
        DE: { lat: 52.52, lon: 13.405 }, // Berlin
        PL: { lat: 52.2297, lon: 21.0122 }, // Warsaw
      }

      const result = await calculateBudget(
        input,
        destinationCoords,
        originCoordsByCountry
      )

      // Verify structure
      expect(result).toHaveProperty('travelCosts')
      expect(result).toHaveProperty('individualSupport')
      expect(result).toHaveProperty('organizationalSupport')
      expect(result).toHaveProperty('totalBudget')
      expect(result).toHaveProperty('breakdown')

      // Verify participants
      expect(result.individualSupport.participants).toBe(30)

      // Verify per diem (Spain = €42/day)
      expect(result.individualSupport.perDiem).toBe(42)

      // Verify organizational support (30 participants = €750)
      expect(result.organizationalSupport).toBe(750)

      // Verify individual support calculation (30 participants × 7 days × €42)
      expect(result.individualSupport.totalCost).toBe(8820)

      // Verify total budget is sum of all components
      expect(result.totalBudget).toBe(
        result.breakdown.travel +
          result.breakdown.perDiem +
          result.breakdown.organizational
      )

      // Verify travel costs for each country
      expect(result.travelCosts.SE).toBeDefined()
      expect(result.travelCosts.DE).toBeDefined()
      expect(result.travelCosts.PL).toBeDefined()

      expect(result.travelCosts.SE.participants).toBe(15)
      expect(result.travelCosts.DE.participants).toBe(10)
      expect(result.travelCosts.PL.participants).toBe(5)
    })

    it('should include green travel bonus when enabled', async () => {
      const input = {
        participantsByCountry: {
          SE: 10,
        },
        destinationCity: 'Copenhagen',
        destinationCountry: 'DK',
        durationDays: 5,
        useGreenTravel: true,
      }

      const destinationCoords = { lat: 55.6761, lon: 12.5683 } // Copenhagen
      const originCoordsByCountry = {
        SE: { lat: 59.3293, lon: 18.0686 }, // Stockholm
      }

      const result = await calculateBudget(
        input,
        destinationCoords,
        originCoordsByCountry
      )

      // Stockholm to Copenhagen is ~500 km, should be in 100-499 km band with €40 green bonus
      expect(result.travelCosts.SE.greenBonus).toBeGreaterThan(0)
    })

    it('should throw error for invalid inputs', async () => {
      const input = {
        participantsByCountry: {},
        destinationCity: 'Barcelona',
        destinationCountry: 'ES',
        durationDays: 7,
      }

      const destinationCoords = { lat: 41.3851, lon: 2.1734 }
      const originCoordsByCountry = {}

      await expect(
        calculateBudget(input, destinationCoords, originCoordsByCountry)
      ).rejects.toThrow()
    })
  })
})
