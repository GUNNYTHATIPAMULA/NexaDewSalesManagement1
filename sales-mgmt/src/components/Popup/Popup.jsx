"use client"

const Popup = ({ isOpen, onCancel, onConfirm, title, message }) => {
  if (!isOpen) return null

  return (
    // <div className="fixed inset-0 bg-slate-100 bg-opacity-100 flex items-center justify-center z-50">
       <div className="fixed inset-0 bg-black/50 bg-opacity-10 backdrop-blur-[1px] flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4">
        <div className="flex items-center gap-2 mb-4">
          <svg
            className="w-6 h-6 text-yellow-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01M12 3a9 9 0 110 18 9 9 0 010-18z"
            />
          </svg>
          <h2 className="text-lg font-semibold text-gray-800">{title || "Confirm Action"}</h2>
        </div>
        <p className="text-gray-600 mb-6">{message || "Are you sure you want to proceed with this action?"}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}

export default Popup
