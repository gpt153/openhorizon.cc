import { FormTemplate } from '../application-forms.types.js'

/**
 * Erasmus+ KA2 (Key Action 2) Form Template
 * For cooperation partnerships
 */
export const erasmusKA2Template: FormTemplate = {
  type: 'KA2',
  name: 'Erasmus+ KA2 - Cooperation Partnerships',
  version: '1.0',
  sections: [
    {
      id: 'project_info',
      title: 'Project Information',
      description: 'Basic information about your cooperation partnership',
      order: 1,
      fields: [
        {
          name: 'project_title',
          label: 'Project Title',
          type: 'text',
          required: true,
          dataPath: 'project.name'
        },
        {
          name: 'project_description',
          label: 'Project Description',
          type: 'textarea',
          required: true,
          dataPath: 'project.description'
        },
        {
          name: 'project_start_date',
          label: 'Project Start Date',
          type: 'date',
          required: true,
          dataPath: 'project.start_date'
        },
        {
          name: 'project_end_date',
          label: 'Project End Date',
          type: 'date',
          required: true,
          dataPath: 'project.end_date'
        },
        {
          name: 'project_duration',
          label: 'Project Duration (months)',
          type: 'number',
          required: true,
          validation: {
            min: 6,
            max: 36
          }
        }
      ]
    },
    {
      id: 'partnership',
      title: 'Partnership Information',
      description: 'Details about partner organizations',
      order: 2,
      fields: [
        {
          name: 'partnership_description',
          label: 'Partnership Description',
          type: 'textarea',
          required: true,
          defaultValue: 'Description of the partnership structure and consortium'
        },
        {
          name: 'lead_organization',
          label: 'Lead Organization',
          type: 'text',
          required: true
        },
        {
          name: 'partner_organizations',
          label: 'Partner Organizations',
          type: 'textarea',
          required: true,
          defaultValue: 'List of partner organizations with their roles'
        },
        {
          name: 'partner_countries',
          label: 'Partner Countries',
          type: 'text',
          required: true,
          defaultValue: 'Countries involved in the partnership'
        },
        {
          name: 'partnership_rationale',
          label: 'Partnership Rationale',
          type: 'textarea',
          required: true,
          defaultValue: 'Why these partners were chosen and their complementarity'
        }
      ]
    },
    {
      id: 'objectives',
      title: 'Objectives and Relevance',
      description: 'Project objectives and relevance to Erasmus+ priorities',
      order: 3,
      fields: [
        {
          name: 'main_objectives',
          label: 'Main Objectives',
          type: 'textarea',
          required: true,
          defaultValue: 'Clear, measurable objectives of the partnership'
        },
        {
          name: 'target_groups',
          label: 'Target Groups',
          type: 'textarea',
          required: true,
          defaultValue: 'Direct and indirect target groups and expected reach'
        },
        {
          name: 'priorities_addressed',
          label: 'Erasmus+ Priorities Addressed',
          type: 'textarea',
          required: true,
          defaultValue: 'How project addresses Erasmus+ horizontal and specific priorities'
        },
        {
          name: 'needs_analysis',
          label: 'Needs Analysis',
          type: 'textarea',
          required: true,
          defaultValue: 'Identified needs that the project will address'
        }
      ]
    },
    {
      id: 'activities',
      title: 'Work Plan and Activities',
      description: 'Detailed work plan and activities',
      order: 4,
      fields: [
        {
          name: 'work_packages',
          label: 'Work Packages',
          type: 'textarea',
          required: true,
          defaultValue: 'Description of work packages and their objectives'
        },
        {
          name: 'activities_timeline',
          label: 'Activities Timeline',
          type: 'textarea',
          required: true,
          defaultValue: 'Timeline of main activities and milestones'
        },
        {
          name: 'methodology',
          label: 'Methodology',
          type: 'textarea',
          required: true,
          defaultValue: 'Methodological approach and innovative aspects'
        },
        {
          name: 'deliverables',
          label: 'Project Deliverables',
          type: 'textarea',
          required: true,
          defaultValue: 'Expected outputs and intellectual outputs'
        }
      ]
    },
    {
      id: 'budget',
      title: 'Budget',
      description: 'Budget breakdown and co-financing',
      order: 5,
      fields: [
        {
          name: 'budget_total',
          label: 'Total Budget',
          type: 'number',
          required: true,
          dataPath: 'project.budget_total',
          validation: {
            min: 0
          }
        },
        {
          name: 'eu_grant_requested',
          label: 'EU Grant Requested',
          type: 'number',
          required: true,
          validation: {
            min: 0
          }
        },
        {
          name: 'cofinancing',
          label: 'Co-financing Sources',
          type: 'textarea',
          required: true,
          defaultValue: 'Sources of co-financing and contribution amounts'
        },
        {
          name: 'budget_breakdown',
          label: 'Budget Breakdown by Work Package',
          type: 'textarea',
          required: true,
          defaultValue: 'Detailed budget allocation per work package'
        },
        {
          name: 'budget_justification',
          label: 'Budget Justification',
          type: 'textarea',
          required: true,
          defaultValue: 'Justification of budget and cost efficiency'
        }
      ]
    },
    {
      id: 'impact',
      title: 'Impact, Dissemination and Sustainability',
      description: 'Expected impact and long-term sustainability',
      order: 6,
      fields: [
        {
          name: 'expected_impact',
          label: 'Expected Impact',
          type: 'textarea',
          required: true,
          defaultValue: 'Expected impact on participants, organizations, systems, and policies'
        },
        {
          name: 'dissemination_strategy',
          label: 'Dissemination Strategy',
          type: 'textarea',
          required: true,
          defaultValue: 'Strategy for disseminating results to target audiences'
        },
        {
          name: 'exploitation_plan',
          label: 'Exploitation Plan',
          type: 'textarea',
          required: true,
          defaultValue: 'How results will be used and mainstreamed'
        },
        {
          name: 'sustainability',
          label: 'Sustainability',
          type: 'textarea',
          required: true,
          defaultValue: 'How project impact will continue after EU funding ends'
        },
        {
          name: 'quality_measures',
          label: 'Quality Assurance Measures',
          type: 'textarea',
          required: true,
          defaultValue: 'Quality control and evaluation measures'
        }
      ]
    }
  ],
  requiredDataPaths: [
    'project.name',
    'project.description',
    'project.start_date',
    'project.end_date',
    'project.budget_total'
  ]
}
