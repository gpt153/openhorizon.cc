import { FormTemplate } from '../application-forms.types.js'

/**
 * Erasmus+ KA1 (Key Action 1) Form Template
 * For learning mobility of individuals
 */
export const erasmusKA1Template: FormTemplate = {
  type: 'KA1',
  name: 'Erasmus+ KA1 - Learning Mobility of Individuals',
  version: '1.0',
  sections: [
    {
      id: 'project_info',
      title: 'Project Information',
      description: 'Basic information about your mobility project',
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
          name: 'project_location',
          label: 'Project Location',
          type: 'text',
          required: true,
          dataPath: 'project.location'
        },
        {
          name: 'project_type',
          label: 'Project Type',
          type: 'select',
          required: true,
          dataPath: 'project.type',
          options: ['STUDENT_EXCHANGE', 'TRAINING', 'CONFERENCE', 'CUSTOM']
        }
      ]
    },
    {
      id: 'participants',
      title: 'Participants',
      description: 'Information about project participants',
      order: 2,
      fields: [
        {
          name: 'participants_count',
          label: 'Total Number of Participants',
          type: 'number',
          required: true,
          dataPath: 'project.participants_count',
          validation: {
            min: 1
          }
        },
        {
          name: 'participant_profile',
          label: 'Participant Profile',
          type: 'textarea',
          required: true,
          defaultValue: 'Target group: students, young people, or staff members'
        },
        {
          name: 'selection_criteria',
          label: 'Selection Criteria',
          type: 'textarea',
          required: true,
          defaultValue: 'Criteria for selecting participants'
        }
      ]
    },
    {
      id: 'activities',
      title: 'Activities',
      description: 'Description of planned activities',
      order: 3,
      fields: [
        {
          name: 'activities_description',
          label: 'Activities Description',
          type: 'textarea',
          required: true,
          defaultValue: 'Detailed description of planned activities during the mobility'
        },
        {
          name: 'learning_outcomes',
          label: 'Expected Learning Outcomes',
          type: 'textarea',
          required: true,
          defaultValue: 'Knowledge, skills, and competences participants will gain'
        },
        {
          name: 'methodology',
          label: 'Methodology',
          type: 'textarea',
          required: true,
          defaultValue: 'Teaching and learning methods to be used'
        }
      ]
    },
    {
      id: 'budget',
      title: 'Budget',
      description: 'Budget breakdown for the project',
      order: 4,
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
          name: 'budget_travel',
          label: 'Travel Budget',
          type: 'number',
          required: true,
          defaultValue: 0,
          validation: {
            min: 0
          }
        },
        {
          name: 'budget_accommodation',
          label: 'Accommodation Budget',
          type: 'number',
          required: true,
          defaultValue: 0,
          validation: {
            min: 0
          }
        },
        {
          name: 'budget_subsistence',
          label: 'Subsistence Budget',
          type: 'number',
          required: true,
          defaultValue: 0,
          validation: {
            min: 0
          }
        },
        {
          name: 'budget_organizational',
          label: 'Organizational Support Budget',
          type: 'number',
          required: true,
          defaultValue: 0,
          validation: {
            min: 0
          }
        },
        {
          name: 'budget_justification',
          label: 'Budget Justification',
          type: 'textarea',
          required: true,
          defaultValue: 'Explanation of budget allocation and cost estimates'
        }
      ]
    },
    {
      id: 'impact',
      title: 'Impact',
      description: 'Expected impact and sustainability',
      order: 5,
      fields: [
        {
          name: 'expected_impact',
          label: 'Expected Impact',
          type: 'textarea',
          required: true,
          defaultValue: 'Impact on participants, organizations, and wider community'
        },
        {
          name: 'dissemination',
          label: 'Dissemination Plan',
          type: 'textarea',
          required: true,
          defaultValue: 'How results will be shared and promoted'
        },
        {
          name: 'sustainability',
          label: 'Sustainability',
          type: 'textarea',
          required: true,
          defaultValue: 'How impact will be sustained after project completion'
        },
        {
          name: 'european_dimension',
          label: 'European Dimension',
          type: 'textarea',
          required: true,
          defaultValue: 'How project contributes to European cooperation and values'
        }
      ]
    }
  ],
  requiredDataPaths: [
    'project.name',
    'project.start_date',
    'project.end_date',
    'project.location',
    'project.type',
    'project.participants_count',
    'project.budget_total'
  ]
}
