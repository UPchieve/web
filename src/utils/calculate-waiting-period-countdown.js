import convertMsToMinutes from './convert-ms-to-minutes'

const calculateWaitingPeriodCountdown = time => {
  // Display countdown as counting down from 5 to 1
  let countdown = Math.floor(convertMsToMinutes(time) + 1)

  if (countdown > 5) {
    countdown = 5
  }

  return Number(countdown.toFixed(0))
}

export default calculateWaitingPeriodCountdown
