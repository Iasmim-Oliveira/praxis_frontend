export type Role = 'ADMIN' | 'USER'
export type AppointmentStatus = 'SCHEDULED' | 'CANCELLED'

export interface TokenPair {
  accessToken: string
  refreshToken: string
}

export interface JwtPayload {
  sub: string
  email: string
  role: Role
  iat: number
  exp: number
}

export interface User {
  id: string
  name: string
  email: string
  role: Role
  createdAt: string
  updatedAt: string
}

export interface Service {
  id: string
  name: string
  description: string | null
  durationMinutes: number
  createdAt: string
  updatedAt: string
}

export interface Client {
  id: string
  name: string
  email: string | null
  phone: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface Appointment {
  id: string
  clientId: string
  serviceId: string
  createdById: string
  startsAt: string
  endsAt: string
  status: AppointmentStatus
  cancelledAt: string | null
  createdAt: string
  updatedAt: string
}

export interface AppointmentWithRelations extends Appointment {
  client: Client
  service: Service
}

export interface AvailabilitySlot {
  startsAt: string
  endsAt: string
}
