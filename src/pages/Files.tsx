import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  Home as HomeIcon,
  LogIn,
  LayoutGrid,
  List,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { DriveItem } from '../types/DriveItem';

interface ExtendedDriveItem extends DriveItem {
  starred?: boolean;
  shared?: boolean;
  inTrash?: boolean;
}

const initialFiles: ExtendedDriveItem[] = [
  { id: '1', name: 'Projektová dokumentace', type: 'folder', modified: 'dnes', starred: true, shared: false },
  { id: '2', name: 'Mobilní systémy - zadání.pdf', type: 'document', size: '240 KB', modified: 'včera', starred: true, shared: true },
  { id: '3', name: 'Rozpočet Q4.xlsx', type: 'spreadsheet', size: '1.2 MB', modified: '4. říj', starred: false, shared: false },
  { id: '4', name: 'Screenshot_architektura.png', type: 'image', size: '4.8 MB', modified: '1. říj', starred: false, shared: true },
  { id: '5', name: 'Prezentace_obhajoba.pptx', type: 'document', size: '3.4 MB', modified: '28. zář', starred: true, shared: false },
  { id: '6', name: 'Záloha databáze', type: 'folder', modified: '15. zář', starred: false, shared: false },
];

export const Files: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'my-drive' | 'shared' | 'recent' | 'starred' | 'trash'>('my-drive');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [platform, setPlatform] = useState<string>('browser');
  const [ipcMessage, setIpcMessage] = useState<string>('Čekání na IPC...');
  const [isIpcLoading, setIsIpcLoading] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [files, setFiles] = useState<ExtendedDriveItem[]>(initialFiles);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newItemName, setNewItemName] = useState<string>('');
  const [newItemType, setNewItemType] = useState<DriveItem['type']>('folder');

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
      setIsIpcLoading(true);
      try {
        const response = await window.electronAPI.ping();
        setIpcMessage(`${response} (${new Date().toLocaleTimeString()})`);
      } catch (err) {
        setIpcMessage('Chyba při volání IPC');
      } finally {
        setIsIpcLoading(false);
      }
    } else {
      setIpcMessage('Electron API není dostupné');
    }
  };

  const handleToggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, starred: !f.starred } : f))
    );
  };

  const handleToggleTrash = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id === id) {
          return { ...f, inTrash: !f.inTrash };
        }
        return f;
      })
    );
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const newItem: ExtendedDriveItem = {
      id: Date.now().toString(),
      name: newItemName.trim(),
      type: newItemType,
      size: newItemType === 'folder' ? undefined : '120 KB',
      modified: 'právě teď',
      starred: false,
      shared: false,
      inTrash: false,
    };

    setFiles((prev) => [newItem, ...prev]);
    setNewItemName('');
    setShowAddModal(false);
  };

  const renderIcon = (type: DriveItem['type'], sizeClass = 'h-8 w-8') => {
    switch (type) {
      case 'folder':
        return <Folder className={`${sizeClass} text-amber-500 fill-amber-100 shrink-0`} />;
      case 'document':
        return <FileText className={`${sizeClass} text-blue-500 shrink-0`} />;
      case 'spreadsheet':
        return <FileSpreadsheet className={`${sizeClass} text-emerald-600 shrink-0`} />;
      case 'image':
        return <ImageIcon className={`${sizeClass} text-purple-500 shrink-0`} />;
      default:
        return <File className={`${sizeClass} text-gray-500 shrink-0`} />;
    }
  };

  // Filter items by tab and search
  const filteredFiles = files
    .filter((file) => {
      // First apply tab filter
      if (activeTab === 'trash') {
        return Boolean(file.inTrash);
      }
      if (file.inTrash) {
        return false;
      }
      if (activeTab === 'shared') {
        return Boolean(file.shared);
      }
      if (activeTab === 'starred') {
        return Boolean(file.starred);
      }
      // 'my-drive' or 'recent'
      return true;
    })
    .filter((file) =>
      file.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const tabTitles = {
    'my-drive': 'Můj disk',
    shared: 'Sdíleno se mnou',
    recent: 'Poslední soubory',
    starred: 'S hvězdičkou',
    trash: 'Koš',
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-800">
      {/* Postranní panel */}
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col p-4 shrink-0 select-none">
        {/* Brand / Logo */}
        <div className="flex items-center justify-between px-2 py-2 mb-3 border-b border-slate-100">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-blue-600 via-green-500 to-amber-400 flex items-center justify-center text-white font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
              ▲
            </div>
            <span className="font-semibold text-lg text-slate-900 tracking-tight">Disk Google</span>
          </Link>
          <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900" title="Zpět na domovskou stránku">
            <Link to="/">
              <HomeIcon className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Přidat soubor tlačítko */}
        <Button
          onClick={() => setShowAddModal(true)}
          size="lg"
          className="rounded-full shadow-sm hover:shadow transition-all font-semibold gap-2 mb-5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 justify-start px-4 h-11"
        >
          <Plus className="h-5 w-5 text-blue-600" />
          <span>Nový soubor / složka</span>
        </Button>

        {/* Navigační položky */}
        <nav className="flex flex-col gap-1">
          <button
            onClick={() => setActiveTab('my-drive')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-full text-sm font-medium transition-colors ${
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
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-full text-sm font-medium transition-colors ${
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
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-full text-sm font-medium transition-colors ${
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
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-full text-sm font-medium transition-colors ${
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
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-full text-sm font-medium transition-colors ${
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
            <Link to="/login" className="text-blue-600 hover:underline">
              Změnit účet
            </Link>
          </div>
        </div>
      </aside>

      {/* Hlavní obsah */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Horní lišta */}
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0 gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Hledat na Disku..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-slate-50 border-slate-200 focus-visible:bg-white rounded-full text-sm"
            />
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* View Switcher */}
            <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'grid' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Mřížka"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'list' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Seznam"
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            <Button asChild variant="outline" size="sm" className="hidden sm:flex gap-1.5 text-xs text-slate-700">
              <Link to="/">
                <HomeIcon className="h-3.5 w-3.5" />
                <span>Domů</span>
              </Link>
            </Button>

            <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs text-slate-700">
              <Link to="/login">
                <LogIn className="h-3.5 w-3.5" />
                <span>Přihlášení</span>
              </Link>
            </Button>

            {/* User Avatar */}
            <div
              className="h-9 w-9 rounded-full bg-blue-600 text-white font-medium flex items-center justify-center text-xs shadow-sm cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all"
              title="Jan Přikryl (jan@example.com)"
            >
              JP
            </div>
          </div>
        </header>

        {/* Obsahová plocha */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* IPC Status banner */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
              disabled={isIpcLoading}
              className="bg-white hover:bg-emerald-50 text-emerald-800 border-emerald-300 text-xs gap-1.5 self-start sm:self-auto"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isIpcLoading ? 'animate-spin' : ''}`} />
              Test IPC
            </Button>
          </div>

          {/* Heading + Count */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{tabTitles[activeTab]}</h2>
                <span className="text-xs text-slate-500">
                  {filteredFiles.length} {filteredFiles.length === 1 ? 'položka' : filteredFiles.length < 5 ? 'položky' : 'položek'}
                  {searchQuery && ` (filtrováno dle "${searchQuery}")`}
                </span>
              </div>

              {activeTab === 'trash' && filteredFiles.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setFiles((prev) => prev.filter((f) => !f.inTrash))}
                  className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Vysypat koš
                </Button>
              )}
            </div>

            {/* Empty state */}
            {filteredFiles.length === 0 ? (
              <div className="text-center py-16 px-4 bg-white border border-slate-200 rounded-2xl">
                <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <Folder className="h-6 w-6" />
                </div>
                <h3 className="text-base font-semibold text-slate-800">Žádné položky k zobrazení</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                  {searchQuery
                    ? 'Pro zadaný vyhledávací dotaz nebyly nalezeny žádné soubory ani složky.'
                    : 'Tato sekce momentálně neobsahuje žádné položky.'}
                </p>
                {searchQuery ? (
                  <Button size="sm" variant="outline" onClick={() => setSearchQuery('')}>
                    Zrušit filtr vyhledávání
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => setShowAddModal(true)}>
                    <Plus className="h-4 w-4 mr-1.5" />
                    Přidat první soubor
                  </Button>
                )}
              </div>
            ) : viewMode === 'grid' ? (
              /* Grid View */
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredFiles.map((file) => (
                  <Card
                    key={file.id}
                    className="hover:border-blue-300 hover:shadow-md transition-all cursor-pointer bg-white group relative"
                  >
                    <CardContent className="p-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        {renderIcon(file.type)}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => handleToggleStar(file.id, e)}
                            className={`p-1 rounded-full hover:bg-slate-100 transition-colors ${
                              file.starred ? 'text-amber-400 fill-amber-400' : 'text-slate-300 hover:text-slate-500'
                            }`}
                            title={file.starred ? 'Odebrat hvězdičku' : 'Přidat hvězdičku'}
                          >
                            <Star className={`h-4 w-4 ${file.starred ? 'fill-amber-400' : ''}`} />
                          </button>
                          <button
                            onClick={(e) => handleToggleTrash(file.id, e)}
                            className="p-1 rounded-full text-slate-300 hover:text-rose-500 hover:bg-slate-100 transition-colors"
                            title={file.inTrash ? 'Obnovit z koše' : 'Přesunout do koše'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <h3
                          className="font-medium text-sm text-slate-800 truncate group-hover:text-blue-600 transition-colors"
                          title={file.name}
                        >
                          {file.name}
                        </h3>
                        <div className="flex items-center justify-between text-xs text-slate-400 mt-1">
                          <span>{file.size || 'Složka'}</span>
                          <span>{file.modified}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              /* List View */
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="grid grid-cols-12 px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <div className="col-span-6">Název</div>
                  <div className="col-span-2">Typ</div>
                  <div className="col-span-2">Velikost</div>
                  <div className="col-span-2 text-right">Akce</div>
                </div>

                <div className="divide-y divide-slate-100">
                  {filteredFiles.map((file) => (
                    <div
                      key={file.id}
                      className="grid grid-cols-12 px-4 py-3 items-center hover:bg-slate-50/80 transition-colors group text-sm"
                    >
                      <div className="col-span-6 flex items-center gap-3 truncate">
                        {renderIcon(file.type, 'h-5 w-5')}
                        <span className="font-medium text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                          {file.name}
                        </span>
                      </div>
                      <div className="col-span-2 text-xs text-slate-500 capitalize">{file.type}</div>
                      <div className="col-span-2 text-xs text-slate-500">{file.size || '—'}</div>
                      <div className="col-span-2 flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => handleToggleStar(file.id, e)}
                          className={`p-1 rounded-md hover:bg-slate-200/60 ${
                            file.starred ? 'text-amber-400 fill-amber-400' : 'text-slate-300 hover:text-slate-500'
                          }`}
                          title="Hvězdička"
                        >
                          <Star className={`h-4 w-4 ${file.starred ? 'fill-amber-400' : ''}`} />
                        </button>
                        <button
                          onClick={(e) => handleToggleTrash(file.id, e)}
                          className="p-1 rounded-md text-slate-300 hover:text-rose-600 hover:bg-slate-200/60"
                          title="Smazat"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal pro přidání nového souboru/složky */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Přidat položku</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Název položky:</label>
                <Input
                  type="text"
                  placeholder="např. Diplomová práce.docx"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Typ položky:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewItemType('folder')}
                    className={`p-2.5 rounded-lg border text-xs font-medium flex items-center gap-2 transition-all ${
                      newItemType === 'folder'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Folder className="h-4 w-4 text-amber-500" />
                    <span>Složka</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewItemType('document')}
                    className={`p-2.5 rounded-lg border text-xs font-medium flex items-center gap-2 transition-all ${
                      newItemType === 'document'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <FileText className="h-4 w-4 text-blue-500" />
                    <span>Dokument</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewItemType('spreadsheet')}
                    className={`p-2.5 rounded-lg border text-xs font-medium flex items-center gap-2 transition-all ${
                      newItemType === 'spreadsheet'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                    <span>Tabulka</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewItemType('image')}
                    className={`p-2.5 rounded-lg border text-xs font-medium flex items-center gap-2 transition-all ${
                      newItemType === 'image'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <ImageIcon className="h-4 w-4 text-purple-500" />
                    <span>Obrázek</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddModal(false)}
                >
                  Zrušit
                </Button>
                <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                  Vytvořit
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
