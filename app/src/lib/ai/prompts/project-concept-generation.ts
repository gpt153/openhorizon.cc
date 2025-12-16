/**
 * Project Concept Generation Prompt
 *
 * Instructs the AI to generate a complete Erasmus+ Youth Exchange project concept
 * based on Project DNA and similar successful projects.
 */

export const PROJECT_CONCEPT_GENERATION_PROMPT = `You are crafting an Erasmus+ Youth Exchange project concept that will compete for EU funding. Your goal is to create a compelling, realistic, and compliant project that scores well on evaluation criteria.

PROJECT DNA:
{projectDnaJson}

SIMILAR SUCCESSFUL PROJECTS (for inspiration):
{similarProjectsJson}

ERASMUS+ YOUTH EXCHANGE REQUIREMENTS:

**Eligibility Criteria:**
- Minimum 2 organizations from different Programme or Partner Countries
- 16-60 participants aged 13-30 (youth + leaders)
- Duration: 5-21 days of activities (excluding travel)
- Activities take place in participating countries
- Based on non-formal and informal learning

**Quality Standards:**
- Active involvement of young people in all 4 phases (Planning, Preparation, Implementation, Follow-up)
- Clear learning outcome identification and validation (Youthpass)
- Inclusive design accessible to all participants
- Safe, respectful, non-discriminatory environment
- High-quality preparation for all participants

**Evaluation Criteria (100 points total, 60 minimum to pass):**

1. **RELEVANCE & IMPACT (30 points)**:
   - Track record and experience of participating organizations
   - Project designed around young people's needs
   - EU Youth Dialogue alignment
   - Inclusion practices and participant diversity
   - Clear anticipated outcomes for participants and organizations

2. **PROJECT DESIGN (40 points)**:
   - Clear description of all 4 phases with timelines and milestones
   - Transnational learning activities promote participant diversity
   - Sustainable and inclusive practices embedded
   - Appropriate learning methods aligned with objectives
   - Clear plans for documenting and validating outcomes (Youthpass)

3. **PROJECT MANAGEMENT (30 points)**:
   - Quality practical arrangements (venue, accommodation, food, transport)
   - Measures for participant health, safety, and well-being
   - Quality organizational cooperation structures
   - Monitoring and evaluation plans
   - Result dissemination strategies

**Horizontal Dimensions (must address ALL):**
- **Inclusion**: Design accessible to participants with fewer opportunities
- **Environmental Sustainability**: Eco-friendly practices, low-emission transport
- **Digital Transformation**: Integration of digital tools and learning
- **Democratic Participation**: Civic engagement, promoting European values

GENERATE A COMPLETE PROJECT CONCEPT:

1. **Title** (5-10 words):
   - Compelling and memorable
   - Clearly reflects theme and objectives
   - Professional tone
   - Example: "Green Futures: Youth Leading Climate Action"

2. **Tagline** (one sentence, ~15-30 words):
   - Captures project essence
   - Inspiring and clear
   - Example: "Empowering young Europeans to become environmental ambassadors through hands-on sustainability projects and intercultural exchange"

3. **Objectives** (3-5 objectives):
   - Each objective should:
     - Be SMART (Specific, Measurable, Achievable, Relevant, Time-bound)
     - Align with at least one Erasmus+ priority
     - Connect to target group needs
     - Be achievable within the project duration
   - Format: {{"text": "objective text", "erasmus_priority": "priority name"}}
   - Erasmus+ priorities: inclusion, sustainability, digital transformation, democratic participation, European values, intercultural dialogue

4. **Target Group Description** (150-200 words):
   - Who they are: demographics, background, characteristics
   - Why this project matters to them: needs, challenges, aspirations
   - What makes them the right audience
   - Inclusion considerations if applicable
   - How they'll be recruited and involved

5. **Activity Outline** (day-by-day for {duration} days):
   - Structure each day with morning, afternoon, and evening blocks
   - Balance:
     - Energizers and ice-breakers (especially early days)
     - Structured learning workshops
     - Youth-led activities and peer learning
     - Cultural exchange moments
     - Reflection sessions
     - Free time and informal learning
   - Include:
     - All 4 horizontal dimensions throughout
     - Low-stimulation alternatives for inclusion
     - Progressive complexity (easier → more challenging)
     - Mix of indoor and outdoor activities
   - Format: [{{"day": 1, "morning": "...", "afternoon": "...", "evening": "..."}}]

6. **Learning Outcomes** (5-8 outcomes):
   - Use Youthpass competences: learning to learn, communication, social & civic, sense of initiative & entrepreneurship, cultural awareness, digital
   - Be specific and observable
   - Mix of knowledge, skills, and attitudes
   - Achievable through the planned activities
   - Format: [{{"category": "competence area", "outcome": "what participants will gain"}}]

7. **Inclusion Plan Overview** (100-150 words):
   - Physical accessibility measures
   - Support for participants with fewer opportunities
   - Dietary accommodations
   - Language support strategies
   - Sensory considerations
   - Communication adaptations
   - Psychological safety measures
   - Financial support for those who need it

8. **Partner Profile** (100-150 words):
   - Type of organizations to involve (youth NGOs, schools, municipalities, etc.)
   - Required expertise and experience level
   - Geographic distribution considerations
   - Complementary strengths needed
   - Role clarity (who does what)
   - Why these partnerships will succeed

9. **Estimated Budget Range**:
   Use Erasmus+ unit costs:
   - Organizational support: €125 per participant
   - Travel: €28-€1,735 based on distance bands
   - Individual support: €41-€83 per day based on country
   - Inclusion support: €125 per participant with fewer opportunities
   - Exceptional costs: up to €10,000 for specific needs (e.g., accessibility equipment)

   Calculate realistic range based on:
   - {participants} participants
   - {duration} days
   - Typical European partners (assume mid-range travel costs)
   - Inclusion needs from Project DNA

   Format: {{"min": number, "max": number, "currency": "EUR", "breakdown": {{...}}}}

10. **Sustainability Narrative** (80-100 words):
    - Environmental practices during the project
    - Transport choices (train over plane when feasible)
    - Waste reduction and resource efficiency
    - Local and seasonal food sourcing
    - Carbon offsetting plans
    - How environmental awareness is integrated
    - Long-term environmental impact

11. **Impact Narrative** (80-100 words):
    - **On Participants**: Skills, confidence, networks, employability
    - **On Organizations**: Capacity building, international partnerships, learning
    - **On Communities**: Dissemination activities, awareness raising, follow-up projects
    - **Multiplier Effect**: How learning spreads beyond direct participants

QUALITY GUIDELINES:

- Be realistic and achievable - don't overpromise
- Use concrete examples rather than vague statements
- Ensure activities directly support stated objectives
- Show clear progression and logic
- Demonstrate understanding of target group needs
- Include practical details that show careful planning
- Balance ambition with feasibility
- Use inclusive, accessible language
- Reflect European values: respect, solidarity, diversity

TONE:
- Professional but warm
- Confident but not arrogant
- Specific and concrete
- Inspiring and motivational
- Inclusive and respectful

Return your complete project concept as structured JSON matching the ProjectConcept schema.

{format_instructions}`
