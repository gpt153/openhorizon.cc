import { FormTemplate, AggregatedProjectData, ValidationResult } from '../application-forms.types.js'
import { erasmusKA1Template } from './erasmus-ka1-template.js'
import { erasmusKA2Template } from './erasmus-ka2-template.js'

/**
 * Get form template by type
 */
export function getTemplate(formType: 'KA1' | 'KA2' | 'CUSTOM'): FormTemplate {
  switch (formType) {
    case 'KA1':
      return erasmusKA1Template
    case 'KA2':
      return erasmusKA2Template
    case 'CUSTOM':
      // For now, return KA1 as base for custom forms
      return { ...erasmusKA1Template, type: 'CUSTOM', name: 'Custom Application Form' }
    default:
      throw new Error(`Unknown form type: ${formType}`)
  }
}

/**
 * Get nested value from object using dot notation path
 * e.g., getValueByPath(data, 'project.name') returns data.project.name
 */
function getValueByPath(obj: any, path: string): any {
  if (!path) return undefined

  const parts = path.split('.')
  let current = obj

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined
    }
    current = current[part]
  }

  return current
}

/**
 * Render template with aggregated data
 * Populates form fields with data from aggregated project data
 */
export function renderTemplate(
  template: FormTemplate,
  data: AggregatedProjectData
): Record<string, any> {
  const formData: Record<string, any> = {}

  // Iterate through all sections and fields
  for (const section of template.sections) {
    for (const field of section.fields) {
      let value: any

      // Try to get value from dataPath if specified
      if (field.dataPath) {
        value = getValueByPath(data, field.dataPath)
      }

      // Use default value if no data found
      if (value === undefined || value === null) {
        value = field.defaultValue
      }

      // Convert dates to ISO strings for serialization
      if (value instanceof Date) {
        value = value.toISOString()
      }

      // Store in formData
      formData[field.name] = value
    }
  }

  return formData
}

/**
 * Validate that all required fields have values
 */
export function validateFields(
  template: FormTemplate,
  data: Record<string, any>
): ValidationResult {
  const missing: string[] = []
  const errors: Array<{ field: string; message: string }> = []

  // Check each field in template
  for (const section of template.sections) {
    for (const field of section.fields) {
      const value = data[field.name]

      // Check required fields
      if (field.required && (value === undefined || value === null || value === '')) {
        missing.push(field.name)
        errors.push({
          field: field.name,
          message: `${field.label} is required`
        })
        continue
      }

      // Skip validation if field is empty and not required
      if (!value) continue

      // Validate field based on type and validation rules
      if (field.validation) {
        // Number validations
        if (field.type === 'number' && typeof value === 'number') {
          if (field.validation.min !== undefined && value < field.validation.min) {
            errors.push({
              field: field.name,
              message: `${field.label} must be at least ${field.validation.min}`
            })
          }
          if (field.validation.max !== undefined && value > field.validation.max) {
            errors.push({
              field: field.name,
              message: `${field.label} must be at most ${field.validation.max}`
            })
          }
        }

        // Pattern validations (for text fields)
        if (field.validation.pattern && typeof value === 'string') {
          const regex = new RegExp(field.validation.pattern)
          if (!regex.test(value)) {
            errors.push({
              field: field.name,
              message: `${field.label} has invalid format`
            })
          }
        }
      }

      // Validate select/multiselect options
      if (field.options && field.options.length > 0) {
        if (field.type === 'select') {
          if (!field.options.includes(value)) {
            errors.push({
              field: field.name,
              message: `${field.label} must be one of: ${field.options.join(', ')}`
            })
          }
        } else if (field.type === 'multiselect' && Array.isArray(value)) {
          const invalidOptions = value.filter(v => !field.options!.includes(v))
          if (invalidOptions.length > 0) {
            errors.push({
              field: field.name,
              message: `${field.label} contains invalid options: ${invalidOptions.join(', ')}`
            })
          }
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    missing,
    errors
  }
}

/**
 * Validate that aggregated data contains all required data paths
 */
export function validateRequiredDataPaths(
  template: FormTemplate,
  data: AggregatedProjectData
): ValidationResult {
  const missing: string[] = []
  const errors: Array<{ field: string; message: string }> = []

  for (const path of template.requiredDataPaths) {
    const value = getValueByPath(data, path)
    if (value === undefined || value === null) {
      missing.push(path)
      errors.push({
        field: path,
        message: `Required data path '${path}' is missing`
      })
    }
  }

  return {
    valid: errors.length === 0,
    missing,
    errors
  }
}
