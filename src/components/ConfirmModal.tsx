interface Props {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ message, onConfirm, onCancel }: Props) {
  return (
    <>
      <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="fixed inset-0 z-[90] flex items-center justify-center px-4">
        <div className="bg-[#1a1138] border border-white/10 rounded-2xl p-8 w-full max-w-sm shadow-2xl">
          <p className="text-white font-semibold text-lg mb-6 text-center">{message}</p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 font-bold text-sm text-zinc-300 transition"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-3 rounded-xl bg-red-500/80 hover:bg-red-500 font-bold text-sm text-white transition"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </>
  );
}