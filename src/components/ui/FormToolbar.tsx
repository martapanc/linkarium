import { SpinnerIcon } from "./SpinnerIcon";

interface Props {
  onCancel: () => void;
  cancelLabel: string;
  onSubmit: () => void;
  submitLabel: string;
  loadingLabel: string;
  isLoading: boolean;
  disabled: boolean;
}

export function FormToolbar({ onCancel, cancelLabel, onSubmit, submitLabel, loadingLabel, isLoading, disabled }: Props) {
  return (
    <div className="border-t border-sand-100 mt-4 -mx-5 px-5 pt-3 pb-1 flex items-center justify-between">
      <button
        onClick={onCancel}
        className="text-sm text-sand-600 hover:text-sand-800 transition-colors cursor-pointer"
      >
        {cancelLabel}
      </button>
      <button
        onClick={onSubmit}
        disabled={isLoading || disabled}
        className="bg-coral-500 hover:bg-coral-600 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <SpinnerIcon /> {loadingLabel}
          </span>
        ) : (
          submitLabel
        )}
      </button>
    </div>
  );
}
