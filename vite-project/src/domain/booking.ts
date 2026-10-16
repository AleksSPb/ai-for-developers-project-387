import type { TimeRange } from './range'

/**
 * Бронь — единственное, что хранится.
 *
 * Интервал Брони — пара моментов, а не минуты от полуночи: момент несёт своё
 * смещение, поэтому Броня через полночь или через переход на летнее время не
 * требует ничего. Слоты не хранятся, они считаются (docs/adr/0001), поэтому
 * проверка конфликта спрашивает про интервалы, а не про записи в таблице Слотов.
 */
export interface Booking extends TimeRange {
  id: string
  /** Тип события, под который Гость забронировал Слот. */
  eventTypeId: string
  guestName: string
  guestEmail: string
  /** Когда Бронь была создана, ISO 8601. */
  createdAt: string
}

export interface GuestInput {
  name: string
  email: string
}

export interface GuestErrors {
  name?: string
  email?: string
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Почта приводится к канону: без пробелов по краям и в нижнем регистре. */
const normalizeEmail = (email: string): string => email.trim().toLowerCase()

/** Пробелы по краям — опечатка, а не часть имени; регим почты значения не имеет. */
export const normalizeGuest = (input: GuestInput): GuestInput => ({
  name: input.name.trim(),
  email: normalizeEmail(input.email),
})

/**
 * Совпадает ли введённая почта с почтой Брони.
 *
 * Обе стороны приводятся к одному канону — тому же, что и при записи, — иначе
 * гость, напечатавший `Ivan@Example.com `, получил бы отказ на почте, которую
 * записал сам же двумя экранами выше.
 *
 * Сравнение живёт в браузере и **от чужого не защищает**: сервер почту не
 * сверяет, а `GET /bookings` отдаёт все Брони каждому (ADR-0004). Поле защищает
 * от промаха по кнопке, и именно поэтому в коде названо так, а не «проверкой
 * владельца».
 */
export const sameEmail = (entered: string, bookingEmail: string): boolean =>
  normalizeEmail(entered) === normalizeEmail(bookingEmail)

export const validateGuest = (input: GuestInput): GuestErrors => {
  const guest = normalizeGuest(input)
  const errors: GuestErrors = {}

  if (guest.name.length === 0) {
    errors.name = 'Введите имя'
  }

  if (!emailPattern.test(guest.email)) {
    errors.email = 'Введите почту в формате name@example.com'
  }

  return errors
}