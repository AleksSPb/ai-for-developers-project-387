import { useState } from 'react'

import { Button, Group, Modal, Stack, Text, TextInput } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'

import { useApp } from '../app/useApp'
import { CANCEL_FAILED_TEXT } from '../app/bookingRefusal'
import { sameEmail } from '../domain/booking'
import type { Booking } from '../domain/booking'

interface BookingCancelProps {
  booking: Booking
}

/**
 * Отмена Брони: кнопка и модалка с полем почты.
 *
 * **Поле защищает от промаха по кнопке, а не от чужого.** Сравнение живёт в
 * браузере, с той почтой, что уже напечатана в карточке, а сервер её не сверяет
 * и удаляет Бронь любому, кто знает её идентификатор (ADR-0004). Настоящая
 * защита появится вместе с авторизацией — назвать это поле «проверкой Гостя»
 * значило бы пообещать то, чего нет.
 *
 * Отказ **оставляет модалку открытой**: отмена не состоялась, и закрывать окно
 * значило бы выбросить то, что гость напечатал. Успех наоборот закрывает её, а
 * список перечитывается сам — карточка исчезает вместе с модалкой.
 *
 * Почта пустая тоже отказ, а не запрос: сравнивать нечего, и отправлять
 * бессмысленный `DELETE` значило бы обращаться к серверу без причины.
 */
const BookingCancel = ({ booking }: BookingCancelProps) => {
  const { cancelBooking } = useApp()
  const [isOpened, { open, close }] = useDisclosure(false)
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)

  const openCancel = () => {
    setEmail('')
    setError(null)
    open()
  }

  const cancel = async () => {
    if (!sameEmail(email, booking.guestEmail)) {
      setError('Почта не совпадает с почтой брони')
      return
    }

    setIsCancelling(true)
    const outcome = await cancelBooking(booking.id)
    setIsCancelling(false)

    if (outcome.kind === 'отменена') {
      close()
      return
    }

    setError(CANCEL_FAILED_TEXT)
  }

  return (
    <>
      <Button variant="subtle" size="xs" color="red" onClick={openCancel}>
        Отменить бронь
      </Button>

      <Modal opened={isOpened} onClose={close} title="Отмена брони">
        <Stack gap="sm">
          <Text size="sm" c="dimmed">
            Введите почту, которой записана бронь. Сервер почту не сверяет — поле
            защищает от промаха по кнопке.
          </Text>

          <TextInput
            label="Почта Гостя"
            value={email}
            error={error}
            onChange={(event) => {
              setEmail(event.currentTarget.value)
              setError(null)
            }}
          />

          <Group justify="flex-end">
            <Button variant="default" onClick={close}>
              Оставить
            </Button>
            <Button color="red" onClick={cancel} loading={isCancelling}>
              Отменить
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}

export default BookingCancel