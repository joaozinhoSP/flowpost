import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, CalendarClock, Image, Film, X, Globe, Sparkles, Hash, Eye, Crop } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/toast';
import ImageEditor from '../components/ui/image-editor';
import ImageUpload from '../components/ImageUpload';

const networks = [
  { id: 'twitter', label: 'Twitter', color: 'bg-sky-500' },
  { id: 'instagram', label: 'Instagram', color: 'bg-pink-500' },
  { id: 'linkedin', label: 'LinkedIn', color: 'bg-blue-700' },
  { id: 'facebook', label: 'Facebook', color: 'bg-blue-600' },
  { id: 'tiktok', label: 'TikTok', color: 'bg-gray-900' },
  { id: 'mastodon', label: 'Mastodon', color: 'bg-purple-500' },
];

type ActionType = 'draft' | 'schedule' | 'publish';

interface MediaItem {
  type: 'image' | 'video';
  url: string;
  file?: File;
  caption?: string;
}

export default function DashboardNewPost() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [content, setContent] = useState('');
  const [selectedNetworks, setSelectedNetworks] = useState<string[]>([]);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [cloudinaryImages, setCloudinaryImages] = useState<string[]>([]);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState('');
  const [action, setAction] = useState<ActionType>('draft');
  const [saving, setSaving] = useState(false);
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);

  function toggleNetwork(id: string) {
    setSelectedNetworks(prev =>
      prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id]
    );
  }

  function addHashtag() {
    const tag = hashtagInput.trim().replace(/^#/, '');
    if (tag && !hashtags.includes(tag)) {
      setHashtags(prev => [...prev, tag]);
      setHashtagInput('');
    }
  }

  function removeHashtag(tag: string) {
    setHashtags(prev => prev.filter(h => h !== tag));
  }

  function handleMediaUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    Array.from<File>(files).forEach(file => {
      const url = URL.createObjectURL(file);
      const type = file.type.startsWith('video/') ? 'video' : 'image';
      setMedia(prev => [...prev, { type, url, file }]);
    });
    e.target.value = '';
  }

  function handleEditImage(index: number) {
    setEditingImageIndex(index);
  }

  function handleSaveEdited(dataUrl: string) {
    if (editingImageIndex === null) return;
    setMedia(prev => prev.map((item, i) =>
      i === editingImageIndex ? { ...item, url: dataUrl } : item
    ));
    setEditingImageIndex(null);
  }

  function removeMedia(index: number) {
    setMedia(prev => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function handleSubmit() {
    if (!content.trim() || selectedNetworks.length === 0) return;
    setSaving(true);

    try {
      let mediaUrl: string | null = null;
      if (cloudinaryImages.length > 0) {
        mediaUrl = cloudinaryImages[0];
      } else if (media.length > 0) {
        mediaUrl = media[0].url;
      }

      const token = await user!.getIdToken();
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          content,
          networks: selectedNetworks,
          scheduledDate: action === 'schedule' ? scheduledDate : null,
          scheduledTime: action === 'schedule' ? scheduledTime : null,
          mediaUrl,
          mediaUrls: cloudinaryImages.length > 0 ? cloudinaryImages : null,
          hashtags,
          action,
        }),
      });

      if (!res.ok) {
        let errMsg = 'Erro ao criar post';
        try { const err = await res.json(); errMsg = err.error || errMsg; } catch { errMsg = (await res.text()) || errMsg; }
        throw new Error(errMsg);
      }

      const message = action === 'publish' ? 'Post publicado com sucesso!' :
        action === 'schedule' ? 'Post agendado com sucesso!' : 'Rascunho salvo!';
      toast(message, 'success');

      if (action === 'publish') {
        setTimeout(() => navigate('/dashboard/posts'), 1000);
      } else {
        setTimeout(() => navigate('/dashboard/posts'), 1000);
      }
    } catch (err: any) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  const isValid = content.trim().length > 0 && selectedNetworks.length > 0;

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      {/* Action toggle */}
      <div className="flex gap-2 mb-6 bg-white rounded-xl border border-gray-200 p-1.5 shadow-card w-fit">
        {([
          { id: 'draft' as const, label: 'Rascunho', icon: Eye },
          { id: 'schedule' as const, label: 'Agendar', icon: CalendarClock },
          { id: 'publish' as const, label: 'Publicar Agora', icon: Send },
        ]).map((opt) => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.id}
              onClick={() => setAction(opt.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                action === opt.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {opt.label}
            </button>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          {/* Content */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Conteúdo</h3>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="O que você quer publicar?"
              rows={6}
              className={`w-full px-4 py-3 rounded-xl border transition resize-none text-sm ${
                content.length > 0 ? 'border-accent ring-2 ring-accent/20' : 'border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20'
              }`}
              aria-label="Conteúdo do post"
            />
            <div className="flex items-center justify-between mt-3">
              <div className="flex gap-2">
                <label className="flex items-center gap-1.5 text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                  <Image className="w-4 h-4" />
                  <span>Imagem</span>
                  <input type="file" accept="image/*" multiple onChange={handleMediaUpload} className="hidden" ref={fileInputRef} />
                </label>
                <label className="flex items-center gap-1.5 text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                  <Film className="w-4 h-4" />
                  <span>Vídeo</span>
                  <input type="file" accept="video/*" onChange={handleMediaUpload} className="hidden" />
                </label>
              </div>
              <span className={`text-xs ${content.length > 0 ? 'text-gray-600' : 'text-gray-400'}`}>{content.length} caracteres</span>
            </div>

            <div className="mt-4">
              <p className="text-xs text-gray-500 mb-2 font-medium">Upload de Imagens (Cloudinary)</p>
              <ImageUpload images={cloudinaryImages} onChange={setCloudinaryImages} maxFiles={5} />
            </div>

            {media.length > 0 && (
              <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
                {media.map((item, i) => (
                  <div key={i} className="relative shrink-0">
                    {item.type === 'image' ? (
                      <button onClick={() => handleEditImage(i)}>
                        <img src={item.url} alt="" className="h-24 w-24 rounded-xl object-cover border border-gray-200 hover:opacity-80 transition" />
                        <span className="absolute bottom-1 left-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <Crop className="w-3 h-3" /> editar
                        </span>
                      </button>
                    ) : (
                      <div className="h-24 w-24 rounded-xl bg-gray-900 flex items-center justify-center border border-gray-200">
                        <Film className="w-8 h-8 text-white" />
                      </div>
                    )}
                    <button onClick={() => removeMedia(i)} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center" aria-label="Remover mídia">
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Hashtags */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Hash className="w-4 h-4 text-accent" /> Hashtags
            </h3>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={hashtagInput}
                onChange={e => setHashtagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addHashtag(); } }}
                placeholder="Digite uma hashtag e pressione Enter"
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 text-sm"
                aria-label="Adicionar hashtag"
              />
              <button onClick={addHashtag} className="px-4 py-2 bg-accent/10 text-accent text-sm font-medium rounded-lg hover:bg-accent/20 transition">
                Adicionar
              </button>
            </div>
            {hashtags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {hashtags.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 bg-accent/5 text-accent text-xs font-medium rounded-full">
                    #{tag}
                    <button onClick={() => removeHashtag(tag)} className="hover:bg-accent/20 rounded-full p-0.5" aria-label={`Remover ${tag}`}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Networks */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Redes Sociais</h3>
            <p className="text-xs text-gray-400 mb-3">Selecione para quais redes o post será enviado</p>
            <div className="flex flex-wrap gap-2">
              {networks.map((n) => (
                <button
                  key={n.id}
                  onClick={() => toggleNetwork(n.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition ${
                    selectedNetworks.includes(n.id)
                      ? `${n.color} text-white border-transparent`
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                  aria-pressed={selectedNetworks.includes(n.id)}
                >
                  <Globe className="w-3.5 h-3.5" />
                  {n.label}
                </button>
              ))}
            </div>
            {selectedNetworks.length === 0 && <p className="text-xs text-gray-400 mt-2">Selecione ao menos uma rede</p>}
          </div>

          {/* Schedule */}
          {action === 'schedule' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-card animate-slide-up">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Data e Horário</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="date" className="text-xs text-gray-500 mb-1 block">Data</label>
                  <input id="date" type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 text-sm" />
                </div>
                <div>
                  <label htmlFor="time" className="text-xs text-gray-500 mb-1 block">Horário</label>
                  <input id="time" type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 text-sm" />
                </div>
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!isValid || saving}
            className={`w-full py-3 font-medium rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
              action === 'publish'
                ? 'bg-accent text-white hover:bg-accent/90 shadow-lg shadow-accent/20'
                : action === 'schedule'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : action === 'publish' ? (
              <Send className="w-4 h-4" />
            ) : action === 'schedule' ? (
              <CalendarClock className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
            {saving ? 'Salvando...' : action === 'publish' ? 'Publicar Agora' : action === 'schedule' ? 'Agendar Post' : 'Salvar Rascunho'}
          </button>
        </div>

        {/* Preview sidebar */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-card sticky top-24">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Eye className="w-4 h-4 text-accent" /> Preview
            </h3>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 min-h-48">
              {content ? (
                <div className="space-y-3">
                  {media.length > 0 && media[0].type === 'image' && (
                    <button onClick={() => handleEditImage(0)} className="w-full">
                      <img src={media[0].url} alt="" className="w-full h-40 rounded-lg object-cover hover:opacity-80 transition" />
                    </button>
                  )}
                  {media.length > 0 && media[0].type === 'video' && (
                    <div className="w-full h-40 rounded-lg bg-gray-900 flex items-center justify-center">
                      <Film className="w-10 h-10 text-white/50" />
                    </div>
                  )}
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{content}</p>
                  {hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {hashtags.map(t => <span key={t} className="text-xs text-accent">#{t}</span>)}
                    </div>
                  )}
                  <div className="flex gap-1">
                    {selectedNetworks.map((id) => {
                      const net = networks.find(n => n.id === id);
                      return net ? <span key={id} className={`text-xs text-white px-2 py-0.5 rounded-full ${net.color}`}>{net.label}</span> : null;
                    })}
                  </div>
                  {action === 'schedule' && scheduledDate && (
                    <p className="text-xs text-gray-400">
                      Agendado para {new Date(scheduledDate + 'T' + (scheduledTime || '00:00')).toLocaleString('pt-BR')}
                    </p>
                  )}
                  {action === 'publish' && (
                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Será publicado agora</span>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                  <Sparkles className="w-8 h-8 mb-2" />
                  <p className="text-sm">Digite algo para ver o preview</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {editingImageIndex !== null && media[editingImageIndex]?.type === 'image' && (
        <ImageEditor
          src={media[editingImageIndex].url}
          onSave={handleSaveEdited}
          onClose={() => setEditingImageIndex(null)}
        />
      )}
    </div>
  );
}
