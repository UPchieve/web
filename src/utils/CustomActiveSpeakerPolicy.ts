import type { ActiveSpeakerPolicy } from 'amazon-chime-sdk-js'

export class CustomActiveSpeakerPolicy implements ActiveSpeakerPolicy {
  calculateScore(
    _attendeeId: string,
    volume: number | null,
    muted: boolean | null
  ): number {
    if (muted || volume === 0) return 0
    return volume ?? 0
  }

  prioritizeVideoSendBandwidthForActiveSpeaker(): boolean {
    return false
  }
}
