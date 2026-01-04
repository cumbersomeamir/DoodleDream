
import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Download, 
  RefreshCw, 
  BookOpen, 
  Palette, 
  User, 
  Layout, 
  AlertCircle,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { ColoringPage, BookConfig, ImageSize } from './types';
import { generateColoringPage } from './services/geminiService';
import { generatePDF } from './services/pdfService';
import { ChatBot } from './components/ChatBot';

const App: React.FC = () => {
  const [config, setConfig] = useState<BookConfig>({
    theme: '',
    childName: '',
    imageSize: '1K'
  });
  const [pages, setPages] = useState<ColoringPage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [needsApiKey, setNeedsApiKey] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if we already have a selected key on boot
    const checkKey = async () => {
      if ((window as any).aistudio) {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        // We don't block the UI yet, we try to "use directly" first as requested
      }
    };
    checkKey();
  }, []);

  const handleOpenSelectKey = async () => {
    if ((window as any).aistudio) {
      await (window as any).aistudio.openSelectKey();
      setNeedsApiKey(false);
      setError(null);
    }
  };

  const handleGenerate = async () => {
    if (!config.theme || !config.childName) {
      setError("Please provide a theme and a child's name!");
      return;
    }
    
    setError(null);
    setIsGenerating(true);
    setPages([]);

    const initialPages: ColoringPage[] = Array.from({ length: 5 }, (_, i) => ({
      id: Math.random().toString(36).substr(2, 9),
      url: '',
      status: 'pending',
      prompt: config.theme
    }));
    
    setPages(initialPages);

    for (let i = 0; i < 5; i++) {
      setPages(prev => prev.map((p, idx) => 
        idx === i ? { ...p, status: 'generating' } : p
      ));

      try {
        const url = await generateColoringPage(config.theme, i, config.imageSize);
        setPages(prev => prev.map((p, idx) => 
          idx === i ? { ...p, url, status: 'completed' } : p
        ));
      } catch (err: any) {
        const msg = err.message || "";
        // If 403 Forbidden or entity not found, it means the key lacks permission for the Pro/Preview model
        if (msg.includes('403') || msg.includes('PERMISSION_DENIED') || msg.includes('not found')) {
          setNeedsApiKey(true);
          setIsGenerating(false);
          return;
        }
        
        setPages(prev => prev.map((p, idx) => 
          idx === i ? { ...p, status: 'error' } : p
        ));
        setError("Something went wrong. High-quality (2K/4K) generations often require a paid API key.");
      }
    }
    
    setIsGenerating(false);
  };

  const handleDownload = () => {
    const successfulUrls = pages
      .filter(p => p.status === 'completed' && p.url)
      .map(p => p.url);
    
    if (successfulUrls.length === 0) {
      setError("No completed pages to download!");
      return;
    }

    generatePDF(config.theme, config.childName, successfulUrls);
  };

  const retryPage = async (index: number) => {
    setPages(prev => prev.map((p, idx) => 
      idx === index ? { ...p, status: 'generating' } : p
    ));

    try {
      const url = await generateColoringPage(config.theme, index, config.imageSize);
      setPages(prev => prev.map((p, idx) => 
        idx === index ? { ...p, url, status: 'completed' } : p
      ));
    } catch (err: any) {
      const msg = err.message || "";
      if (msg.includes('403') || msg.includes('PERMISSION_DENIED') || msg.includes('not found')) {
        setNeedsApiKey(true);
      } else {
        setPages(prev => prev.map((p, idx) => 
          idx === index ? { ...p, status: 'error' } : p
        ));
      }
    }
  };

  if (needsApiKey) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-indigo-50">
        <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full border border-indigo-100">
          <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={40} />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Paid Key Required</h1>
          <p className="text-gray-600 mb-8 leading-relaxed">
            The coloring generator uses professional preview models that require a **Paid API Key** from a Google Cloud project with billing enabled.
          </p>
          <button
            onClick={handleOpenSelectKey}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-2xl shadow-lg transition-all transform hover:-translate-y-1"
          >
            Connect Paid API Key
          </button>
          <div className="mt-6 flex flex-col gap-3">
            <button 
              onClick={() => { setNeedsApiKey(false); setConfig({...config, imageSize: '1K'}); }}
              className="text-gray-400 text-sm hover:text-gray-600 underline"
            >
              Try Standard Quality (1K) instead
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Header */}
      <header className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Palette className="text-indigo-600" size={48} />
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
            DoodleDream
          </h1>
        </div>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Create a personalized, printable coloring book in seconds using magic AI!
        </p>
      </header>

      {/* Main Form */}
      <section className="bg-white rounded-3xl shadow-xl p-8 mb-12 border border-indigo-50">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 ml-1">
              <Sparkles size={16} className="text-indigo-500" /> What's the Theme?
            </label>
            <input
              type="text"
              placeholder="e.g. Space Dinosaurs, Ocean Fairies"
              className="w-full px-5 py-4 bg-indigo-50 border-none rounded-2xl text-lg focus:ring-4 focus:ring-indigo-200 outline-none transition-all"
              value={config.theme}
              onChange={(e) => setConfig({ ...config, theme: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 ml-1">
              <User size={16} className="text-indigo-500" /> Child's Name
            </label>
            <input
              type="text"
              placeholder="e.g. Charlie, Emily"
              className="w-full px-5 py-4 bg-indigo-50 border-none rounded-2xl text-lg focus:ring-4 focus:ring-indigo-200 outline-none transition-all"
              value={config.childName}
              onChange={(e) => setConfig({ ...config, childName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 ml-1">
              <Layout size={16} className="text-indigo-500" /> Image Quality
            </label>
            <select
              className="w-full px-5 py-4 bg-indigo-50 border-none rounded-2xl text-lg focus:ring-4 focus:ring-indigo-200 outline-none transition-all appearance-none cursor-pointer"
              value={config.imageSize}
              onChange={(e) => setConfig({ ...config, imageSize: e.target.value as ImageSize })}
            >
              <option value="1K">Standard (1K)</option>
              <option value="2K">High (2K) - Req. Paid Key</option>
              <option value="4K">Ultra (4K) - Req. Paid Key</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mt-6 flex items-center gap-2 text-red-500 bg-red-50 p-4 rounded-xl border border-red-100">
            <AlertCircle size={20} />
            <p className="font-medium">{error}</p>
          </div>
        )}

        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-black py-5 px-8 rounded-2xl shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-3 text-xl"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="animate-spin" /> Generating Magic...
              </>
            ) : (
              <>
                <BookOpen size={24} /> Create My Book
              </>
            )}
          </button>
          
          {pages.some(p => p.status === 'completed') && !isGenerating && (
            <button
              onClick={handleDownload}
              className="bg-green-600 hover:bg-green-700 text-white font-black py-5 px-8 rounded-2xl shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-3 text-xl"
            >
              <Download size={24} /> Download PDF
            </button>
          )}
        </div>
      </section>

      {/* Pages Grid */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {pages.map((page, index) => (
          <div key={page.id} className="group relative bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all border border-indigo-50 aspect-[3/4]">
            {page.status === 'pending' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-indigo-200 p-6 text-center">
                <div className="w-16 h-16 border-4 border-dashed border-indigo-100 rounded-full mb-4"></div>
                <p className="font-bold text-sm">Page {index + 1} Waiting...</p>
              </div>
            )}
            
            {page.status === 'generating' && (
              <div className="absolute inset-0 bg-indigo-50/50 flex flex-col items-center justify-center p-6 text-center">
                <div className="relative w-20 h-20 mb-4">
                  <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                </div>
                <p className="font-bold text-indigo-600 animate-pulse">Sketching Page {index + 1}...</p>
              </div>
            )}

            {page.status === 'completed' && (
              <>
                <img 
                  src={page.url} 
                  alt={`Coloring page ${index + 1}`} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3 bg-green-500 text-white p-1.5 rounded-full shadow-lg">
                  <CheckCircle2 size={16} />
                </div>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <button 
                     onClick={() => retryPage(index)}
                     className="bg-white/90 hover:bg-white text-gray-800 px-4 py-2 rounded-full font-bold flex items-center gap-2 shadow-lg"
                   >
                     <RefreshCw size={16} /> Regenerate
                   </button>
                </div>
              </>
            )}

            {page.status === 'error' && (
              <div className="absolute inset-0 bg-red-50 flex flex-col items-center justify-center p-6 text-center">
                <AlertCircle className="text-red-400 mb-2" size={32} />
                <p className="text-red-700 text-sm font-bold mb-4">Failed to draw</p>
                <button 
                  onClick={() => retryPage(index)}
                  className="bg-red-500 text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-red-600 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        ))}
      </section>

      {/* Footer Info */}
      <footer className="mt-20 text-center text-gray-500 pb-10">
        <p className="mb-2">Created with 💜 for little artists everywhere.</p>
        <p className="text-sm">Standard (1K) uses Gemini 2.5 Flash | High (2K/4K) uses Gemini 3 Pro</p>
      </footer>

      {/* Chat Assistant */}
      <ChatBot />
    </div>
  );
};

export default App;
