import { Brain, Camera, Info } from 'lucide-react';
import ObjectDetector from '@/components/ObjectDetector';

export default function Vision() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <a href="/" className="text-gray-400 hover:text-white transition-colors text-sm">← Back</a>
          <div className="flex items-center gap-2 text-cyan-400 font-semibold">
            <Brain className="w-5 h-5" />
            <span>Vision AI</span>
          </div>
          <div className="w-12" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 space-y-10">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-4 py-1.5 text-cyan-400 text-sm">
            <Camera className="w-4 h-4" />
            Real-time object detection
          </div>
          <h1 className="text-4xl font-bold tracking-tight">
            Webcam Object Detector
          </h1>
          <p className="text-gray-400 max-w-lg mx-auto text-base leading-relaxed">
            Powered by <span className="text-white font-medium">TensorFlow.js</span> + the{' '}
            <span className="text-white font-medium">COCO-SSD</span> model running 100% in your
            browser — no data leaves your device.
          </p>
        </div>

        {/* Detector */}
        <ObjectDetector />

        {/* Info panel */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-gray-300 font-medium">
            <Info className="w-4 h-4 text-cyan-400" />
            How it works
          </div>
          <ul className="text-gray-400 text-sm space-y-1.5 list-disc list-inside">
            <li>Model loads once from the TensorFlow.js CDN (~10 MB, MobileNetV2 backbone)</li>
            <li>Each frame is passed to COCO-SSD which can detect 80 object categories</li>
            <li>Inference runs on your GPU/CPU via WebGL — nothing is sent to a server</li>
            <li>Bounding boxes and confidence scores are drawn on a canvas overlay</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
