'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { useCallback, useEffect, useState } from 'react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Minus,
  Link as LinkIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  Heading1,
  Heading2,
  Heading3,
  Type,
  X,
  Check,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: boolean;
}

export function RichTextEditor({ value, onChange, placeholder = 'Escreva o conteúdo do artigo...', error }: RichTextEditorProps) {
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        link: false,
        underline: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-[#c40000] underline hover:text-[#a00000]',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto my-4',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'max-w-none focus:outline-none min-h-[400px] px-4 py-3 text-base text-[#333] leading-relaxed',
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const editorContent = editor.getHTML();
    const cleanValue = value || '';
    const cleanEditorContent = editorContent === '<p></p>' ? '' : editorContent;
    
    if (cleanValue !== cleanEditorContent) {
      editor.commands.setContent(cleanValue, { emitUpdate: false });
    }
  }, [value, editor]);

  const handleSetLink = useCallback(() => {
    if (!editor) return;

    if (linkUrl.trim() === '') {
      toast.error('URL é obrigatória');
      return;
    }

    const url = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
    
    if (linkText.trim()) {
      editor
        .chain()
        .focus()
        .insertContent(`<a href="${url}" target="_blank" rel="noopener noreferrer">${linkText}</a>`)
        .run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: url })
        .run();
    }

    setLinkUrl('');
    setLinkText('');
    setShowLinkDialog(false);
    toast.success('Link inserido com sucesso!');
  }, [editor, linkUrl, linkText]);

  const handleInsertImage = useCallback(() => {
    if (!editor) return;

    if (imageUrl.trim() === '') {
      toast.error('URL da imagem é obrigatória');
      return;
    }

    const url = imageUrl.startsWith('http') ? imageUrl : `https://${imageUrl}`;
    
    editor
      .chain()
      .focus()
      .setImage({ src: url, alt: imageAlt || 'Imagem do artigo' })
      .run();

    setImageUrl('');
    setImageAlt('');
    setShowImageDialog(false);
    toast.success('Imagem inserida com sucesso!');
  }, [editor, imageUrl, imageAlt]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (editor) {
        editor
          .chain()
          .focus()
          .setImage({ src: result, alt: file.name })
          .run();
        toast.success('Imagem carregada com sucesso!');
      }
    };
    reader.readAsDataURL(file);
  }, [editor]);

  if (!editor) {
    return <div className="h-[400px] bg-[#f8fafc] rounded-lg animate-pulse" />;
  }

  const ToolbarButton = ({ 
    onClick, 
    isActive = false, 
    disabled = false,
    title,
    children 
  }: { 
    onClick: () => void; 
    isActive?: boolean; 
    disabled?: boolean;
    title: string;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2 rounded-md transition-colors ${
        isActive 
          ? 'bg-[#c40000] text-white' 
          : 'hover:bg-[#f0f0f0] text-[#6b6b6b]'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );

  const Separator = () => <div className="w-px h-6 bg-[#e5e5e5] mx-1" />;

  return (
    <div className="border border-[#e5e5e5] rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-[#f8fafc] border-b border-[#e5e5e5]">
        {/* Títulos */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          title="Título 1"
        >
          <Heading1 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          title="Título 2"
        >
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          title="Título 3"
        >
          <Heading3 className="w-4 h-4" />
        </ToolbarButton>

        <Separator />

        {/* Texto */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Negrito (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Itálico (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          title="Sublinhado (Ctrl+U)"
        >
          <UnderlineIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title="Tachado"
        >
          <Strikethrough className="w-4 h-4" />
        </ToolbarButton>

        <Separator />

        {/* Listas */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Lista não ordenada"
        >
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Lista ordenada"
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>

        <Separator />

        {/* Citação e Linha */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title="Citação"
        >
          <Quote className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Linha horizontal"
        >
          <Minus className="w-4 h-4" />
        </ToolbarButton>

        <Separator />

        {/* Links */}
        <ToolbarButton
          onClick={() => {
            const previousUrl = editor.getAttributes('link').href;
            if (previousUrl) {
              setLinkUrl(previousUrl);
            }
            setShowLinkDialog(true);
          }}
          isActive={editor.isActive('link')}
          title="Inserir link"
        >
          <LinkIcon className="w-4 h-4" />
        </ToolbarButton>

        {/* Imagens */}
        <ToolbarButton
          onClick={() => setShowImageDialog(true)}
          title="Inserir imagem"
        >
          <ImageIcon className="w-4 h-4" />
        </ToolbarButton>

        <Separator />

        {/* Alinhamento */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
          title="Alinhar à esquerda"
        >
          <AlignLeft className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
          title="Centralizar"
        >
          <AlignCenter className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
          title="Alinhar à direita"
        >
          <AlignRight className="w-4 h-4" />
        </ToolbarButton>

        <Separator />

        {/* Desfazer/Refazer */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Desfazer (Ctrl+Z)"
        >
          <Undo className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Refazer (Ctrl+Y)"
        >
          <Redo className="w-4 h-4" />
        </ToolbarButton>
      </div>

      {/* Editor */}
      <div className={`bg-white ${error ? 'border-[#ef4444]' : ''}`}>
        <EditorContent editor={editor} />
      </div>

      {/* Dialog de Link */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Inserir Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">URL do Link</label>
              <Input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://exemplo.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Texto do Link (opcional)</label>
              <Input
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="Clique aqui"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLinkDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSetLink} className="bg-[#c40000] hover:bg-[#a00000]">
              Inserir Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Imagem */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Inserir Imagem</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Upload de arquivo */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Upload de Imagem</label>
              <div className="border-2 border-dashed border-[#e5e5e5] rounded-lg p-4 text-center hover:border-[#c40000] transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="editor-image-upload"
                />
                <label htmlFor="editor-image-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto text-[#6b6b6b] mb-2" />
                  <p className="text-sm text-[#6b6b6b]">
                    Clique para selecionar uma imagem
                  </p>
                  <p className="text-xs text-[#9ca3af] mt-1">
                    Máximo 5MB (PNG, JPG, WebP)
                  </p>
                </label>
              </div>
            </div>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-[#e5e5e5]" />
              <span className="flex-shrink-0 mx-4 text-xs text-[#6b6b6b]">ou</span>
              <div className="flex-grow border-t border-[#e5e5e5]" />
            </div>

            {/* URL da imagem */}
            <div className="space-y-2">
              <label className="text-sm font-medium">URL da Imagem</label>
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://exemplo.com/imagem.jpg"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Texto Alternativo</label>
              <Input
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                placeholder="Descrição da imagem"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImageDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleInsertImage} className="bg-[#c40000] hover:bg-[#a00000]">
              Inserir Imagem
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default RichTextEditor;
