import { useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { Settings2 } from 'lucide-react'
import { Sheet } from '../../ui/Sheet'
import { AccountSettings } from './AuthGate'
import { SubscriptionSettings } from '../subscription/Subscription'

/** Keeps returning players' account access available before choosing a starter. */
export function AccountMenu() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        className="journey-icon-button"
        aria-label="設定"
        onClick={() => setOpen(true)}
      >
        <Settings2 size={22} />
      </button>
      <AnimatePresence>
        {open && (
          <Sheet title="設定" contentKey="account" onClose={() => setOpen(false)}>
            <SubscriptionSettings />
            <AccountSettings />
          </Sheet>
        )}
      </AnimatePresence>
    </>
  )
}
