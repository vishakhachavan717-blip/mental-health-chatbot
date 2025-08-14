// src/components/Message.jsx
export default function Message({ text, ts, from }) {
  return (
    <div className={`w-full flex ${from === "user" ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[80%] rounded-2xl p-3 shadow
        ${from === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"}`}>
        <div className="text-sm leading-relaxed">{text}</div>
        {ts && (
          <div className={`text-[11px] mt-1 opacity-70 ${from === "user" ? "text-white" : "text-gray-700"}`}>
            {new Date(ts).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
}
