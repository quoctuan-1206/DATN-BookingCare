import { useEffect, useRef } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Heading2,
  Italic,
  Link2,
  List,
  ListOrdered,
  Redo2,
  RemoveFormatting,
  Underline,
  Undo2,
} from "lucide-react";

const toolbar = [
  { command: "formatBlock", value: "p", label: "Đoạn văn", text: "P" },
  { command: "formatBlock", value: "h2", label: "Tiêu đề", icon: Heading2 },
  { command: "bold", label: "In đậm", icon: Bold },
  { command: "italic", label: "In nghiêng", icon: Italic },
  { command: "underline", label: "Gạch chân", icon: Underline },
  { command: "insertUnorderedList", label: "Danh sách", icon: List },
  { command: "insertOrderedList", label: "Danh sách đánh số", icon: ListOrdered },
  { command: "justifyLeft", label: "Căn trái", icon: AlignLeft },
  { command: "justifyCenter", label: "Căn giữa", icon: AlignCenter },
  { command: "justifyRight", label: "Căn phải", icon: AlignRight },
  { command: "undo", label: "Hoàn tác", icon: Undo2 },
  { command: "redo", label: "Làm lại", icon: Redo2 },
  { command: "removeFormat", label: "Xóa định dạng", icon: RemoveFormatting },
];

function RichTextEditor({ id, label, value = "", onChange, placeholder }) {
  const editorRef = useRef(null);

  useEffect(() => {
    const editor = editorRef.current;
    if (editor && editor !== document.activeElement && editor.innerHTML !== value) {
      editor.innerHTML = value;
    }
  }, [value]);

  const emitChange = () => onChange(editorRef.current?.innerHTML || "");

  const runCommand = (command, commandValue) => {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    emitChange();
  };

  const addLink = () => {
    const url = window.prompt("Nhập địa chỉ liên kết (https://...)");
    if (!url) return;
    runCommand("createLink", url);
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const text = event.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  };

  return (
    <div className="admin-form-group admin-rich-text-group">
      <label htmlFor={id}>{label}</label>
      <div className="admin-rich-editor">
        <div className="admin-rich-editor__toolbar" role="toolbar" aria-label={`Định dạng ${label}`}>
          {toolbar.map(({ command, value: commandValue, label: title, icon: Icon, text }) => (
            <button
              key={`${command}-${commandValue || ""}`}
              type="button"
              title={title}
              aria-label={title}
              onMouseDown={(event) => {
                event.preventDefault();
                runCommand(command, commandValue);
              }}
            >
              {Icon ? <Icon size={17} /> : <strong>{text}</strong>}
            </button>
          ))}
          <span className="admin-rich-editor__separator" />
          <button
            type="button"
            title="Chèn liên kết"
            aria-label="Chèn liên kết"
            onMouseDown={(event) => {
              event.preventDefault();
              addLink();
            }}
          >
            <Link2 size={17} />
          </button>
        </div>
        <div
          ref={editorRef}
          id={id}
          className="admin-rich-editor__content"
          contentEditable
          role="textbox"
          aria-multiline="true"
          aria-label={label}
          data-placeholder={placeholder}
          onInput={emitChange}
          onBlur={emitChange}
          onPaste={handlePaste}
          suppressContentEditableWarning
        />
      </div>
      <small className="admin-rich-editor__hint">
        Bôi đen nội dung rồi chọn công cụ định dạng. Nội dung được hiển thị trực tiếp trên trang cơ sở khám.
      </small>
    </div>
  );
}

export default RichTextEditor;
