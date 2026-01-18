-- Add formal mode fields to seeds table
ALTER TABLE seeds
  ADD COLUMN title_formal VARCHAR(200),
  ADD COLUMN description_formal TEXT,
  ADD COLUMN approval_likelihood_formal DOUBLE PRECISION;

-- Add documentation comments
COMMENT ON COLUMN seeds.title_formal IS 'Formal/application-ready version of seed title';
COMMENT ON COLUMN seeds.description_formal IS 'Formal/application-ready version of seed description';
COMMENT ON COLUMN seeds.approval_likelihood_formal IS 'Approval likelihood score for formal version';
