import { useState } from 'react';
import { Download, ExternalLink, X } from 'lucide-react';
import toast from 'react-hot-toast';
import premiumService from '../features/premium/premiumService';

function PremiumContentViewer({ content, onClose }) {
  const [loading, setLoading] = useState(false);
  const download = async () => {
    setLoading(true);
    try {
      const result = await premiumService.getSecureDownload(content.$id);
      window.location.assign(result.url);
    } catch (error) { toast.error(error.message || 'Secure download failed.'); } finally { setLoading(false); }
  };
  const isVideo = content.type === 'video';
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onContextMenu={(event) => event.preventDefault()}>
    <div className="w-full max-w-4xl rounded-xl bg-gray-900 p-5 text-white shadow-2xl">
      <div className="flex items-center justify-between gap-4"><h2 className="text-lg font-semibold">{content.title}</h2><button onClick={onClose} aria-label="Close viewer"><X /></button></div>
      {isVideo ? <div className="mt-5 aspect-video overflow-hidden rounded-lg bg-black"><iframe className="h-full w-full" src={content.embedUrl || content.videoUrl} title={content.title} allowFullScreen referrerPolicy="no-referrer" /></div> : <div className="mt-5 h-[60vh] overflow-hidden rounded-lg bg-gray-800"><iframe className="h-full w-full" src={content.previewUrl} title={content.title} onContextMenu={(event) => event.preventDefault()} /></div>}
      {!isVideo && <button onClick={download} disabled={loading} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold hover:bg-purple-500 disabled:opacity-60"><Download className="h-4 w-4" />{loading ? 'Preparing secure link...' : 'Download securely'}</button>}
      {isVideo && <p className="mt-3 flex items-center gap-2 text-xs text-gray-400"><ExternalLink className="h-3 w-3" /> Video links are view-only and are never exposed as downloadable file links.</p>}
      {!isVideo && <p className="mt-3 text-xs text-gray-400">The viewer deters casual save actions; browser previews cannot make displayed content completely leak-proof.</p>}
    </div>
  </div>;
}

export default PremiumContentViewer;