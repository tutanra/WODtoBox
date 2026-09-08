export const RETIRED_PLAN_TEMPLATE_IDS = ['power-clean-100', 'kipping-muscle-up'] as const

export function isRetiredPlanTemplateId(id: string) {
  return (RETIRED_PLAN_TEMPLATE_IDS as readonly string[]).includes(id)
}
