-- Add formal mode fields to projects table
ALTER TABLE projects
  ADD COLUMN target_group_description_formal TEXT,
  ADD COLUMN inclusion_plan_overview_formal TEXT,
  ADD COLUMN partner_profile_formal TEXT,
  ADD COLUMN sustainability_narrative_formal TEXT,
  ADD COLUMN impact_narrative_formal TEXT;

-- Add formal mode fields to programme_days table
ALTER TABLE programme_days
  ADD COLUMN morning_focus_formal VARCHAR(500),
  ADD COLUMN afternoon_focus_formal VARCHAR(500),
  ADD COLUMN evening_focus_formal VARCHAR(500);

-- Add formal mode fields to programme_sessions table
ALTER TABLE programme_sessions
  ADD COLUMN title_formal VARCHAR(200),
  ADD COLUMN description_formal TEXT,
  ADD COLUMN preparation_notes_formal TEXT;

-- Add documentation comments
COMMENT ON COLUMN projects.target_group_description_formal IS 'Formal/application-ready version of target group description';
COMMENT ON COLUMN projects.inclusion_plan_overview_formal IS 'Formal/application-ready version of inclusion plan overview';
COMMENT ON COLUMN projects.partner_profile_formal IS 'Formal/application-ready version of partner profile';
COMMENT ON COLUMN projects.sustainability_narrative_formal IS 'Formal/application-ready version of sustainability narrative';
COMMENT ON COLUMN projects.impact_narrative_formal IS 'Formal/application-ready version of impact narrative';

COMMENT ON COLUMN programme_days.morning_focus_formal IS 'Formal/application-ready version of morning focus';
COMMENT ON COLUMN programme_days.afternoon_focus_formal IS 'Formal/application-ready version of afternoon focus';
COMMENT ON COLUMN programme_days.evening_focus_formal IS 'Formal/application-ready version of evening focus';

COMMENT ON COLUMN programme_sessions.title_formal IS 'Formal/application-ready version of session title';
COMMENT ON COLUMN programme_sessions.description_formal IS 'Formal/application-ready version of session description';
COMMENT ON COLUMN programme_sessions.preparation_notes_formal IS 'Formal/application-ready version of preparation notes';
