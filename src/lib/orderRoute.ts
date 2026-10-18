import 'server-only'
import { apiError, json, readJson } from './http'
import { createOrder, fakeOrderResponse } from './orders'

export async function handleOrder(req: Request) {
  const body = await readJson(req)
  if (!body) return apiError(422, 'VALIDATION', 'Invalid JSON body')
  if (typeof body.website === 'string' && body.website.trim() !== '') return json(fakeOrderResponse(), 201) // SEC-004
  const result = await createOrder(body)
  if (!result.ok) {
    const { status, code, message, ...extra } = result.error
    return apiError(status, code, message, extra)
  }
  return json(result.value, 201)
}
