/**
 * Data Migration Script: Initialize Seed Metadata
 *
 * This script initializes the new `metadata` and `completeness` fields
 * for existing seeds. This is optional and only needed if you want to
 * retroactively populate metadata for existing seeds.
 *
 * Run with: npx tsx scripts/migrate-seed-metadata.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateSeedMetadata() {
  console.log('🔄 Starting seed metadata migration...')

  // Get all seeds without metadata
  const seeds = await prisma.seed.findMany({
    where: {
      metadata: null
    }
  })

  console.log(`📊 Found ${seeds.length} seeds without metadata`)

  let updated = 0
  for (const seed of seeds) {
    // Initialize with minimal metadata based on existing fields
    const initialMetadata = {
      completeness: 0,
      ...(seed.estimated_participants && {
        participantCount: seed.estimated_participants
      }),
      ...(seed.estimated_duration && {
        duration: seed.estimated_duration
      })
    }

    await prisma.seed.update({
      where: { id: seed.id },
      data: {
        metadata: initialMetadata,
        completeness: 0
      }
    })

    updated++
    if (updated % 10 === 0) {
      console.log(`✅ Updated ${updated}/${seeds.length} seeds...`)
    }
  }

  console.log(`✨ Migration complete! Updated ${updated} seeds`)
}

async function migratePhaseGeneration() {
  console.log('🔄 Starting phase auto_generated flag migration...')

  // Get all phases - set auto_generated based on heuristics
  const phases = await prisma.phase.findMany()

  console.log(`📊 Found ${phases.length} phases to check`)

  let updated = 0
  for (const phase of phases) {
    // All existing phases are NOT auto-generated (they were created manually or by template)
    // Future phases created by AI will set this flag explicitly
    await prisma.phase.update({
      where: { id: phase.id },
      data: {
        auto_generated: false,
        generation_context: null
      }
    })

    updated++
    if (updated % 10 === 0) {
      console.log(`✅ Updated ${updated}/${phases.length} phases...`)
    }
  }

  console.log(`✨ Migration complete! Updated ${updated} phases`)
}

async function main() {
  try {
    await migrateSeedMetadata()
    await migratePhaseGeneration()
    console.log('🎉 All migrations completed successfully!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
