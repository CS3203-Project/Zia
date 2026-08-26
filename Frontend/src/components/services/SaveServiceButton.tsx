import { useEffect, useState } from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { wishlistApi } from '../../api/wishlistApi';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../utils/utils';

interface SaveServiceButtonProps {
  serviceId: string;
  /** The provider who owns this listing, so they aren't offered their own. */
  ownerUserId?: string;
  className?: string;
}

/**
 * Save-for-later, customer side.
 *
 * Not a rating or a public "like": the list is private to its owner and carries
 * no signal anyone else can see. State is read from the server rather than kept
 * locally, so a save survives a reload - which is the entire point of the
 * feature and what the previous local-only heart never did.
 */
export default function SaveServiceButton({ serviceId, ownerUserId, className }: SaveServiceButtonProps) {
  const { user, isLoggedIn } = useAuth();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!isLoggedIn) {
      setReady(true);
      return;
    }
    wishlistApi
      .list()
      .then((rows) => {
        if (alive) setSaved(rows.some((r) => r.service?.id === serviceId));
      })
      .catch(() => {
        /* A failed read just leaves the button in its unsaved state. */
      })
      .finally(() => {
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
  }, [serviceId, isLoggedIn]);

  // A provider saving their own listing is noise, not a feature.
  if (ownerUserId && user?.id === ownerUserId) return null;

  const toggle = async () => {
    if (!isLoggedIn) {
      toast.error('Sign in to save services');
      return;
    }
    setBusy(true);
    const next = !saved;
    setSaved(next); // optimistic: the button should feel instant
    try {
      if (next) await wishlistApi.save(serviceId);
      else await wishlistApi.remove(serviceId);
      toast.success(next ? 'Saved for later' : 'Removed from saved');
    } catch {
      setSaved(!next); // put it back so the button never lies about what is stored
      toast.error('Could not update your saved list');
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy || !ready}
      aria-pressed={saved}
      title={saved ? 'Remove from saved' : 'Save for later'}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-60',
        saved
          ? 'border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100'
          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50',
        className
      )}
    >
      {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
      <span>{saved ? 'Saved' : 'Save for later'}</span>
    </button>
  );
}
