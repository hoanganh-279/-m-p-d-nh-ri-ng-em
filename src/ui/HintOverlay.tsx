import { useExperienceStore } from '../store/useExperienceStore'

export function HintOverlay() {
  const entered = useExperienceStore((s) => s.entered)
  const showHint = useExperienceStore((s) => s.showHint)
  const scene = useExperienceStore((s) => s.scene)
  const isMobile = useExperienceStore((s) => s.isMobile)
  const dismissHint = useExperienceStore((s) => s.dismissHint)

  if (!entered || !showHint || scene !== 'main') return null

  const copy = isMobile
    ? 'Kéo · chạm tim · chụm zoom'
    : 'Kéo tim · chạm tim để đập · morph “Anh yêu em” · cuộn zoom'

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center px-4 pt-[max(1rem,env(safe-area-inset-top))]">
      <button
        type="button"
        onClick={dismissHint}
        className="pointer-events-auto min-h-11 bg-surface px-4 py-2 text-sm text-ink/90 transition-opacity hover:opacity-90"
      >
        {copy}
        <span className="ml-2 text-ink/50">Đóng</span>
      </button>
    </div>
  )
}
