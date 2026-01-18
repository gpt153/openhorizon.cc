-- Migration: Add Programme Builder Tables
-- Generated for openhorizon.cc Phase 2

-- Create enum types
CREATE TYPE "ProgrammeStatus" AS ENUM ('DRAFT', 'FINAL', 'ARCHIVED');
CREATE TYPE "ActivityType" AS ENUM (
  'ICEBREAKER',
  'WORKSHOP',
  'REFLECTION',
  'ENERGIZER',
  'FREE_TIME',
  'MEAL',
  'PRESENTATION',
  'GROUP_WORK',
  'OUTDOOR',
  'CULTURAL',
  'INTERCULTURAL',
  'CREATIVE',
  'SPORTS',
  'DISCUSSION'
);

-- Create programmes table
CREATE TABLE programmes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  version INTEGER DEFAULT 1,
  status "ProgrammeStatus" DEFAULT 'DRAFT',

  generated_from_concept JSONB NOT NULL,
  ai_model VARCHAR(50) DEFAULT 'gpt-4-turbo-preview',

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_programmes_project ON programmes(project_id);
CREATE INDEX idx_programmes_tenant ON programmes(tenant_id);

-- Create programme_days table
CREATE TABLE programme_days (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  programme_id UUID NOT NULL REFERENCES programmes(id) ON DELETE CASCADE,

  day_number INTEGER NOT NULL,
  date DATE,
  theme VARCHAR(200),

  morning_focus VARCHAR(500),
  afternoon_focus VARCHAR(500),
  evening_focus VARCHAR(500),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT unique_day_per_programme UNIQUE(programme_id, day_number)
);

CREATE INDEX idx_programme_days_programme ON programme_days(programme_id);

-- Create programme_sessions table
CREATE TABLE programme_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  programme_day_id UUID NOT NULL REFERENCES programme_days(id) ON DELETE CASCADE,

  start_time TIME NOT NULL,
  end_time TIME NOT NULL,

  title VARCHAR(200) NOT NULL,
  description TEXT,
  activity_type "ActivityType",

  learning_objectives TEXT[],
  methodology VARCHAR(100),

  materials_needed TEXT[],
  preparation_notes TEXT,
  space_requirements VARCHAR(200),
  group_size VARCHAR(50),

  accessibility_notes TEXT,
  language_level VARCHAR(20),

  order_index INTEGER NOT NULL,
  is_optional BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_programme_sessions_day ON programme_sessions(programme_day_id);
CREATE INDEX idx_programme_sessions_time ON programme_sessions(start_time);

-- Add comment for documentation
COMMENT ON TABLE programmes IS 'Detailed day-by-day programme schedules for Erasmus+ projects';
COMMENT ON TABLE programme_days IS 'Individual days within a programme with themes and focus areas';
COMMENT ON TABLE programme_sessions IS 'Time-slotted sessions within a programme day';
