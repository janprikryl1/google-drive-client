import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  Users,
  Clock,
  Star,
  Trash2,
  Plus,
  Search,
  Folder,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  File,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DriveItem } from '../types/DriveItem';

const initialFiles: DriveItem[] = [
  { id: '1', name: 'Projektová dokumentace', type: 'folder', modified: 'dnes' },
  { id: '2', name: 'Mobilní systémy - zadání.pdf', type: 'document', size: '240 KB', modified: 'včera' },
  { id: '3', name: 'Rozpočet Q4.xlsx', type: 'spreadsheet', size: '1.2 MB', modified: '4. říj' },
  { id: '4', name: 'Screenshot_architektura.png', type: 'image', size: '4.8 MB', modified: '1. říj' },
];

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'my-drive' | 'shared' | 'recent' | 'starred' | 'trash'>('my-drive');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [platform, setPlatform] = useState<string>('browser');
  const [ipcMessage, setIpcMessage] = useState<string>('Čekání na IPC...');

  useEffect(() => {
    if (window.electronAPI) {
      setPlatform(window.electronAPI.platform);
      window.electronAPI.ping().then((response) => {
        setIpcMessage(response);
      });
    } else {
      setIpcMessage('Běží v běžném prohlížeči (Electron API nedostupné)');
    }
  }, []);

  const handleTestIpc = async () => {
    if (window.electronAPI) {
      const response = await window.electronAPI.ping();
      setIpcMessage(`${response} (${new Date().toLocaleTimeString()})`);
    } else {
      setIpcMessage('Electron API není dostupné');
    }
  };

  const renderIcon = (type: DriveItem['type']) => {
    switch (type) {
      case 'folder':
        return <Folder className="h-8 w-8 text-amber-500 fill-amber-100" />;
      case 'document':
        return <FileText className="h-8 w-8 text-blue-500" />;
      case 'spreadsheet':
        return <FileSpreadsheet className="h-8 w-8 text-emerald-600" />;
      case 'image':
        return <ImageIcon className="h-8 w-8 text-purple-500" />;
      default:
        return <File className="h-8 w-8 text-gray-500" />;
    }
  };

  const filteredFiles = initialFiles.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-800">
      {/* Postranní panel */}
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col p-4 shrink-0">
        <div className="flex items-center gap-3 px-2 py-2 mb-4 border-b border-slate-100">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-blue-600 via-green-500 to-amber-400 flex items-center justify-center text-white font-bold text-sm shadow-sm">
            ▲
          </div>
          <span className="font-semibold text-lg text-slate-900 tracking-tight">Disk Google</span>
        </div>

        <Button
          variant="outline"
          size="lg"
          onClick={() => alert('Nahrát nový soubor')}
          className="rounded-full shadow-sm hover:shadow transition-all font-semibold gap-2 mb-6 border-slate-200"
        >
          <Plus className="h-5 w-5 text-blue-600" />
          <span>Nový soubor</span>
        </Button>

        <nav className="flex flex-col gap-1">
          <button
            onClick={() => setActiveTab('my-drive')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-medium transition-colors ${
              activeTab === 'my-drive'
                ? 'bg-blue-50 text-blue-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <HardDrive className="h-4 w-4" />
            <span>Můj disk</span>
          </button>
          <button
            onClick={() => setActiveTab('shared')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-medium transition-colors ${
              activeTab === 'shared'
                ? 'bg-blue-50 text-blue-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Sdíleno se mnou</span>
          </button>
          <button
            onClick={() => setActiveTab('recent')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-medium transition-colors ${
              activeTab === 'recent'
                ? 'bg-blue-50 text-blue-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Poslední</span>
          </button>
          <button
            onClick={() => setActiveTab('starred')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-medium transition-colors ${
              activeTab === 'starred'
                ? 'bg-blue-50 text-blue-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Star className="h-4 w-4" />
            <span>S hvězdičkou</span>
          </button>
          <button
            onClick={() => setActiveTab('trash')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-medium transition-colors ${
              activeTab === 'trash'
                ? 'bg-blue-50 text-blue-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Trash2 className="h-4 w-4" />
            <span>Koš</span>
          </button>
        </nav>

        {/* Úložiště dole v sidebaru */}
        <div className="mt-auto pt-4 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex justify-between mb-1.5 font-medium">
            <span>Úložiště</span>
            <span>5,7 GB / 15 GB</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-blue-600 h-full w-[38%] rounded-full" />
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
            <span>Platforma: {platform}</span>
          </div>
        </div>
      </aside>

      {/* Hlavní obsah */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Horní lišta */}
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Hledat na Disku..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-slate-50 border-slate-200 focus-visible:bg-white rounded-full"
            />
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-slate-100 text-slate-700 font-normal">
              Tailwind + shadcn
            </Badge>
            <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50/50">
              {platform}
            </Badge>
            <div className="h-9 w-9 rounded-full bg-blue-600 text-white font-medium flex items-center justify-center text-xs shadow-sm">
              JP
            </div>
          </div>
        </header>

        {/* Obsahová plocha */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* IPC Status banner */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-sm font-semibold text-emerald-900 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Electron IPC Status
              </div>
              <p className="text-xs text-emerald-700">
                Odpověď: <code className="bg-emerald-100/80 px-1 py-0.5 rounded font-mono">{ipcMessage}</code>
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleTestIpc}
              className="bg-white hover:bg-emerald-50 text-emerald-800 border-emerald-300 text-xs gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Test IPC
            </Button>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-900">Soubory a složky</h2>
              <span className="text-xs text-slate-500">{filteredFiles.length} položek</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredFiles.map((file) => (
                <Card
                  key={file.id}
                  className="hover:border-blue-300 hover:shadow-md transition-all cursor-pointer bg-white group"
                >
                  <CardContent className="p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      {renderIcon(file.type)}
                      <span className="text-[11px] text-slate-400 font-medium">
                        {file.size || 'Složka'}
                      </span>
                    </div>
                    <div>
                      <h3
                        className="font-medium text-sm text-slate-800 truncate group-hover:text-blue-600 transition-colors"
                        title={file.name}
                      >
                        {file.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Upraveno: {file.modified}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
