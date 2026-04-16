interface Props {
  message: string;
  onClose: () => void;
}

export default function AlertModal({ message, onClose }: Props) {
  return (
    <>
      <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[90] flex items-center justify-center px-4">
        <div className="bg-[#1a1138] border border-white/10 rounded-2xl p-8 w-full max-w-sm shadow-2xl">
          <p className="text-white font-semibold text-lg mb-6 text-center">{message}</p>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold text-sm text-white transition"
          >
            OK
          </button>
        </div>
      </div>
    </>
  );
}