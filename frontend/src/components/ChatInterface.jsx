import { useState, useRef, useEffect, useCallback } from 'react'

const EXAMPLE_QUERIES = [
  'Show total revenue by marketing channel',
  'Which campaign type has the highest ROI?',
  'Show conversions by target audience',
  'Compare impressions vs clicks across channels',
  'Show revenue trend over time',
  'Which language gives the highest engagement score?',
  'Show leads by customer segment',
  'Show revenue distribution by campaign type'
]

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 animate-fadeIn">
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-[10px] flex-shrink-0">
        ✦
      </div>
      <div className="glass rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
    </div>
  )
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user'
  const isError = message.isError

  const formatContent = (content) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      .replace(/\n/g, '<br />')
  }

  return (
    <div className={`flex items-end gap-2 animate-fadeIn ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isUser && (
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-[10px] flex-shrink-0 mb-0.5">
          ✦
        </div>
      )}
      <div
        className={`
          max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed
          ${isUser
            ? 'bg-brand-600 text-white rounded-br-sm'
            : isError
              ? 'bg-red-500/10 border border-red-500/20 text-red-300 rounded-bl-sm'
              : 'glass text-gray-200 rounded-bl-sm'
          }
        `}
        dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
      />
    </div>
  )
}

export default function ChatInterface({ messages, onQuery, isLoading, datasetLoaded }) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleSubmit = useCallback((e) => {
    e?.preventDefault()
    if (input.trim() && !isLoading && datasetLoaded) {
      onQuery(input.trim())
      setInput('')
    }
  }, [input, isLoading, datasetLoaded, onQuery])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }, [handleSubmit])

  const handleChipClick = useCallback((query) => {
    if (!isLoading && datasetLoaded) {
      onQuery(query)
    }
  }, [isLoading, datasetLoaded, onQuery])

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 animate-fadeIn">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-brand-500/20 to-brand-700/20 border border-brand-500/20 flex items-center justify-center text-3xl mb-4">
              💬
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">Ask Your Data</h3>
            <p className="text-xs text-gray-500">Upload a dataset above to get started</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}

        {isLoading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Example Queries */}
      {datasetLoaded && messages.length <= 1 && (
        <div className="px-4 pb-2">
          <p className="text-[10px] text-gray-600 uppercase tracking-wider font-medium mb-2">Try these</p>
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLE_QUERIES.slice(0, 4).map((q) => (
              <button
                key={q}
                onClick={() => handleChipClick(q)}
                disabled={isLoading}
                className="text-[10px] bg-white/5 hover:bg-brand-500/20 border border-white/10 hover:border-brand-500/30 
                           text-gray-400 hover:text-brand-300 px-2.5 py-1 rounded-full transition-all duration-200
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Bar */}
      <div className="p-3 border-t border-white/5">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={datasetLoaded ? 'Ask a question about your data...' : 'Upload dataset first...'}
            disabled={!datasetLoaded || isLoading}
            rows={1}
            className="input-field resize-none flex-1 text-sm max-h-32 py-2.5 leading-relaxed"
            style={{ minHeight: '44px' }}
          />
          <button
            type="submit"
            disabled={!input.trim() || !datasetLoaded || isLoading}
            className="btn-primary flex-shrink-0 h-[44px] w-[44px] flex items-center justify-center p-0 rounded-xl"
            id="send-query-btn"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </form>
        <p className="text-[10px] text-gray-600 mt-1.5 text-center">Press Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  )
}
