import React, { useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import {
  Bold, Italic, Underline as UnderlineIcon, Heading1, Heading2,
  List, ListOrdered, Link as LinkIcon, Image as ImageIcon,
  AlignLeft, AlignCenter, AlignRight, RemoveFormatting, Undo, Redo
} from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Image.configure({ inline: false, allowBase64: true }),
      Link.configure({ openOnClick: false, autolink: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm prose-invert max-w-none min-h-[200px] focus:outline-none px-4 py-3 text-white/90',
      },
    },
  });

  const [isUploading, setIsUploading] = React.useState(false);

  const addImage = useCallback(() => {
    if (!editor) return;
    
    // Create a hidden file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsUploading(true);
      try {
        const uploadData = new FormData();
        uploadData.append('image', file);
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/upload`, { method: 'POST', body: uploadData });
        
        if (!res.ok) throw new Error('Upload failed');
        
        const data = await res.json();
        const url = data.url || data.imageUrl;
        if (url) {
          // Resolve relative URL if needed
          const finalUrl = url.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${url}` : url;
          editor.chain().focus().setImage({ src: finalUrl }).run();
        }
      } catch (err) {
        console.error('Error uploading image', err);
        const manualUrl = window.prompt('Lỗi khi tải ảnh. Bạn có thể nhập URL trực tiếp:');
        if (manualUrl) {
          editor.chain().focus().setImage({ src: manualUrl }).run();
        }
      } finally {
        setIsUploading(false);
      }
    };
    input.click();
  }, [editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Nhập URL liên kết:', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  const ToolButton = ({ onClick, isActive, children, title }: { onClick: () => void; isActive?: boolean; children: React.ReactNode; title: string }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-lg transition-colors ${isActive ? 'bg-emerald-500/30 text-emerald-400' : 'text-white/50 hover:text-white/80 hover:bg-white/10'}`}
    >
      {children}
    </button>
  );

  return (
    <div className="border border-white/10 rounded-xl overflow-hidden bg-black/20">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-white/10 bg-white/5">
        <ToolButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Bold">
          <Bold className="w-3.5 h-3.5" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Italic">
          <Italic className="w-3.5 h-3.5" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} title="Underline">
          <UnderlineIcon className="w-3.5 h-3.5" />
        </ToolButton>

        <div className="w-px h-4 bg-white/10 mx-1" />

        <ToolButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} title="Heading 1">
          <Heading1 className="w-3.5 h-3.5" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} title="Heading 2">
          <Heading2 className="w-3.5 h-3.5" />
        </ToolButton>

        <div className="w-px h-4 bg-white/10 mx-1" />

        <ToolButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="Danh sách">
          <List className="w-3.5 h-3.5" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="Danh sách số">
          <ListOrdered className="w-3.5 h-3.5" />
        </ToolButton>

        <div className="w-px h-4 bg-white/10 mx-1" />

        <ToolButton onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} title="Căn trái">
          <AlignLeft className="w-3.5 h-3.5" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} title="Căn giữa">
          <AlignCenter className="w-3.5 h-3.5" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} title="Căn phải">
          <AlignRight className="w-3.5 h-3.5" />
        </ToolButton>

        <div className="w-px h-4 bg-white/10 mx-1" />

        <ToolButton onClick={setLink} isActive={editor.isActive('link')} title="Liên kết">
          <LinkIcon className="w-3.5 h-3.5" />
        </ToolButton>
        <ToolButton onClick={addImage} title={isUploading ? "Đang tải ảnh..." : "Chèn ảnh từ máy tính"}>
          {isUploading ? <div className="w-3.5 h-3.5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
        </ToolButton>

        <div className="w-px h-4 bg-white/10 mx-1" />

        <ToolButton onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} title="Xóa format">
          <RemoveFormatting className="w-3.5 h-3.5" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().undo().run()} title="Hoàn tác">
          <Undo className="w-3.5 h-3.5" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().redo().run()} title="Làm lại">
          <Redo className="w-3.5 h-3.5" />
        </ToolButton>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />
    </div>
  );
}
