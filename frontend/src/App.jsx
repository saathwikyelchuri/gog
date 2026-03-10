import { useState, useCallback } from 'react'
import FileUpload from './components/FileUpload'
import ChatInterface from './components/ChatInterface'
import Dashboard from './components/Dashboard'
import { uploadDataset, sendQuery, preloadDataset } from './services/api'

export default function App() {
  const [datasetInfo, setDatasetInfo] = useState(null)       // { columns, rowCount, message }
  const [messages, setMessages] = useState([])               // [{ role, content, chartPayload? }]
  const [chartPayload, setChartPayload] = useState(null)     // latest chart data
  const [isLoading, setIsLoading] = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [preloadLoading, setPreloadLoading] = useState(false)
  const [conversationHistory, setConversationHistory] = useState([])

  const handleFileUpload = useCallback(async (file) => {
    setUploadLoading(true)
    try {
      const result = await uploadDataset(file)
      setDatasetInfo(result)
      setMessages([{
        role: 'assistant',
        content: `✅ **Dataset loaded!** Found **${result.rowCount.toLocaleString()} rows** and **${result.columns.length} columns**.\n\nReady to analyze: ${result.columns.join(', ')}\n\nAsk me anything about your data! 👇`
      }])
      setConversationHistory([])
      setChartPayload(null)
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Upload failed'
      setMessages([{ role: 'assistant', content: `❌ **Upload Error:** ${msg}`, isError: true }])
    } finally {
      setUploadLoading(false)
    }
  }, [])

  const handlePreload = useCallback(async () => {
    setPreloadLoading(true)
    try {
      const result = await preloadDataset()
      setDatasetInfo(result)
      setMessages([{
        role: 'assistant',
        content: `✅ **Nykaa Digital Marketing dataset loaded!** Found **${result.rowCount.toLocaleString()} rows** and **${result.columns.length} columns**.\n\nAvailable columns: ${result.columns.join(', ')}\n\nTry asking: _"Which channel had the highest ROI?"_ or _"Show me revenue by campaign type"_ 💄`
      }])
      setConversationHistory([])
      setChartPayload(null)
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Preload failed'
      setMessages([{ role: 'assistant', content: `❌ **Preload Error:** ${msg}`, isError: true }])
    } finally {
      setPreloadLoading(false)
    }
  }, [])

  const handleQuery = useCallback(async (question) => {
    if (!question.trim() || isLoading) return

    const userMessage = { role: 'user', content: question }
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      const result = await sendQuery(question, conversationHistory)

      const assistantMessage = {
        role: 'assistant',
        content: `📊 **${result.title}**\n\n${result.insight}\n\n_Showing ${result.rowCount} data points_`,
        chartPayload: result
      }

      setMessages(prev => [...prev, assistantMessage])
      setChartPayload(result)
      setConversationHistory(prev => [
        ...prev,
        { question, chartType: result.chartType, title: result.title }
      ])
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'Something went wrong'
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ **Error:** ${errMsg}`,
        isError: true
      }])
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, conversationHistory])

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Header Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 glass-dark border-b border-white/5 px-6 py-3 flex items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-sm font-bold shadow-lg shadow-brand-900/50">
            ✦
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight">AI BI Dashboard</h1>
            <p className="text-[10px] text-gray-500 leading-none">Conversational Business Intelligence</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {datasetInfo && (
            <span className="text-xs text-green-400 bg-green-400/10 border border-green-400/20 px-3 py-1 rounded-full font-medium">
              ● {datasetInfo.rowCount.toLocaleString()} rows loaded
            </span>
          )}
          <span className="text-xs text-brand-400 bg-brand-500/10 border border-brand-500/20 px-3 py-1 rounded-full font-medium">
            Powered by Gemini
          </span>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex w-full pt-14">
        {/* Left Panel – Upload + Chat */}
        <div className="w-[380px] min-w-[340px] flex flex-col border-r border-white/5 glass-dark">
          <div className="p-4 border-b border-white/5">
            <FileUpload
              onUpload={handleFileUpload}
              onPreload={handlePreload}
              isLoading={uploadLoading}
              preloadLoading={preloadLoading}
              datasetInfo={datasetInfo}
            />
          </div>
          <div className="flex-1 overflow-hidden">
            <ChatInterface
              messages={messages}
              onQuery={handleQuery}
              isLoading={isLoading}
              datasetLoaded={!!datasetInfo}
            />
          </div>
        </div>

        {/* Right Panel – Dashboard */}
        <div className="flex-1 overflow-auto">
          <Dashboard chartPayload={chartPayload} datasetInfo={datasetInfo} />
        </div>
      </div>
    </div>
  )
}
