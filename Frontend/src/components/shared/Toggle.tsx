import React from 'react';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  /** Required: the control is icon-only, so it needs an accessible name. */
  label: string;
  id?: string;
}

/**
 * The switch used wherever something is on or off.
 *
 * Each place that needed one previously rolled its own, and they drifted: the
 * service-status one put a 2px border on the track, which shrank the inner box
 * below the knob's own height so the knob visibly bulged out of the pill.
 *
 * Sizing here is deliberate — track 44x24, knob 20px inset 2px, so the knob
 * clears the edge by 2px on every side and travels exactly 20px.
 */
const Toggle: React.FC<ToggleProps> = ({ checked, onChange, disabled = false, label, id }) => (
  <button
    id={id}
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 ${
      checked ? 'bg-orange-500' : 'bg-gray-300'
    } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
  >
    <span
      className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);

export default Toggle;
