import { HugeiconsIcon } from '@hugeicons/react'
import { SunIcon, MoonIcon } from '@hugeicons/core-free-icons'

import { Button } from '~/components/ui/button'
import { useTheme } from './theme-provider'

export function ModeToggle() {
  const { theme, setTheme } = useTheme()

  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark')
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      title={isDark ? 'Toggle light mode' : 'Toggle dark mode'}
    >
      <HugeiconsIcon
        icon={MoonIcon}
        strokeWidth={2}
        className="size-5 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0"
      />
      <HugeiconsIcon
        icon={SunIcon}
        strokeWidth={2}
        className="absolute size-5 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100"
      />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
