/** "Tuesday 4pm" or "Tuesday 4:30pm" from a date and time saved on a booking. */
export function lessonWhen(slotDate: string, startTime: string) {
  const datePart = slotDate.slice(0, 10)
  const timePart = startTime.slice(0, 5)
  const [year, month, day] = datePart.split('-').map(Number)
  const [hour, minute] = timePart.split(':').map(Number)
  const when = new Date(year, (month || 1) - 1, day || 1, hour || 0, minute || 0)
  const dayName = when.toLocaleDateString('en-GB', { weekday: 'long' })
  const hour12 = when.getHours() % 12 || 12
  const suffix = when.getHours() < 12 ? 'am' : 'pm'
  const clock = when.getMinutes() === 0
    ? `${hour12}${suffix}`
    : `${hour12}:${String(when.getMinutes()).padStart(2, '0')}${suffix}`
  return `${dayName} ${clock}`
}

export function bookingRequestLabel(slotDate: string, startTime: string) {
  return `New booking request for ${lessonWhen(slotDate, startTime)}.`
}

export function whatsAppMessage(slotDate: string, startTime: string) {
  return `Hi, this is regarding our ${lessonWhen(slotDate, startTime)} lesson`
}
