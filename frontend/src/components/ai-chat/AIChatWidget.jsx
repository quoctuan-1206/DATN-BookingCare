import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Bot, MessageCircle, RotateCcw, Send, Sparkles, X } from "lucide-react";
import aiChatService, { AI_CHAT_MAX_MESSAGE_LENGTH } from "../../services/ai-chat.service";
import "./AIChatWidget.css";

const WELCOME_MESSAGE = "Xin chào! Tôi là MediUTE AI. Tôi có thể giúp bạn tìm bác sĩ, phòng khám và giải đáp các câu hỏi sức khỏe từ nguồn thông tin của MediUTE.";
const WELCOME_SUGGESTIONS = ["Tìm bác sĩ", "Tìm phòng khám", "Hỏi về sức khỏe"];
const SAFE_ERROR_MESSAGE = "MediUTE AI hiện chưa thể trả lời. Vui lòng thử lại sau.";
const HIDDEN_PATHS = [
  "/login", "/register", "/forgot-password", "/verify-otp", "/reset-password", "/unauthorized",
  "/admin", "/doctor", "/staff", "/consultations", "/booking", "/payment", "/lab-booking", "/clinical-booking",
];

function shouldHideWidget(pathname) {
  return HIDDEN_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function getSourceLink(source) {
  if (!source || typeof source.id !== "string") return null;
  if (source.type === "ARTICLE" && /^article-\d+$/.test(source.id)) {
    const articleId = source.id.slice("article-".length);
    return source.url === `/articles/${articleId}` ? source.url : null;
  }
  if (source.type === "SYSTEM_GUIDE" && /^patient-[a-z0-9-]+-guide$/.test(source.id) && source.url === `/help/${source.id}`) {
    return source.url;
  }
  const routes = { DOCTOR: "doctors", CLINIC: "clinics", SPECIALTY: "specialties" };
  const route = routes[source.type];
  const match = route ? new RegExp(`^${route}-(\\d+)$`).exec(source.id) : null;
  return match ? `/${route}/${match[1]}` : null;
}

function renderInlineMarkdown(text, keyPrefix) {
  const withoutLinks = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  const tokens = withoutLinks.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g).filter(Boolean);
  return tokens.map((token, index) => {
    const key = `${keyPrefix}-${index}`;
    if (token.startsWith("**") && token.endsWith("**")) return <strong key={key}>{token.slice(2, -2)}</strong>;
    if (token.startsWith("*") && token.endsWith("*")) return <em key={key}>{token.slice(1, -1)}</em>;
    if (token.startsWith("`") && token.endsWith("`")) return <code key={key}>{token.slice(1, -1)}</code>;
    return token;
  });
}

function SafeMarkdown({ text }) {
  const blocks = String(text || "").split(/\n\s*\n/).filter(Boolean);
  return blocks.map((block, blockIndex) => {
    const lines = block.split("\n");
    if (lines.every((line) => /^\s*[-*]\s+/.test(line))) {
      return (
        <ul key={`block-${blockIndex}`}>
          {lines.map((line, lineIndex) => (
            <li key={`item-${lineIndex}`}>{renderInlineMarkdown(line.replace(/^\s*[-*]\s+/, ""), `list-${blockIndex}-${lineIndex}`)}</li>
          ))}
        </ul>
      );
    }
    if (/^#{1,3}\s+/.test(lines[0])) {
      return <p className="ai-chat-message__heading" key={`block-${blockIndex}`}>{renderInlineMarkdown(lines[0].replace(/^#{1,3}\s+/, ""), `heading-${blockIndex}`)}</p>;
    }
    return (
      <p key={`block-${blockIndex}`}>
        {lines.map((line, lineIndex) => (
          <span key={`line-${lineIndex}`}>
            {lineIndex > 0 ? <br /> : null}
            {renderInlineMarkdown(line, `text-${blockIndex}-${lineIndex}`)}
          </span>
        ))}
      </p>
    );
  });
}

function sourceTypeLabel(type) {
  return { DOCTOR: "Bác sĩ", CLINIC: "Phòng khám", SPECIALTY: "Chuyên khoa", ARTICLE: "Bài viết MediUTE", SYSTEM_GUIDE: "Hướng dẫn sử dụng" }[type] || "Nguồn MediUTE";
}

function SourceList({ sources }) {
  if (!sources?.length) return null;
  return (
    <div className="ai-chat-sources">
      <span className="ai-chat-sources__label">Nguồn tham khảo</span>
      <div className="ai-chat-sources__items">
        {sources.map((source) => {
          const href = getSourceLink(source);
          const contents = <><span className="ai-chat-source__type">{sourceTypeLabel(source.type)}</span><span className="ai-chat-source__title">{source.title || source.id}</span></>;
          return href ? (
            <Link className="ai-chat-source" to={href} key={source.id}>
              {contents}<span className="ai-chat-source__action">Xem chi tiết</span>
            </Link>
          ) : (
            <div className="ai-chat-source" key={source.id}>{contents}</div>
          );
        })}
      </div>
    </div>
  );
}

function AIChatWidget() {
  const { pathname } = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => [{
    id: "welcome",
    role: "assistant",
    text: WELCOME_MESSAGE,
    suggestions: WELCOME_SUGGESTIONS,
  }]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);
  const messageAreaRef = useRef(null);
  const bottomRef = useRef(null);
  const shouldStickToBottomRef = useRef(true);
  const loadingRef = useRef(false);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && shouldStickToBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [isOpen, messages, isLoading]);

  useEffect(() => {
    if (!isOpen) return undefined;
    function onKeyDown(event) {
      if (event.key === "Escape") setIsOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  async function requestAnswer(question, retryMessageId = null) {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setIsLoading(true);
    if (retryMessageId) setMessages((current) => current.filter((message) => message.id !== retryMessageId));
    try {
      const response = await aiChatService.sendMessage(question);
      setMessages((current) => [...current, {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text: response.answer,
        sources: response.sources,
        suggestions: response.suggestions,
      }]);
    } catch {
      setMessages((current) => [...current, {
        id: `error-${Date.now()}`,
        role: "assistant",
        text: SAFE_ERROR_MESSAGE,
        retryText: question,
        isError: true,
      }]);
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }

  function handleSend(event) {
    event?.preventDefault();
    const question = input.trim();
    if (!question || loadingRef.current) return;
    setMessages((current) => [...current, { id: `user-${Date.now()}`, role: "user", text: question }]);
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "24px";
    shouldStickToBottomRef.current = true;
    requestAnswer(question);
  }

  function handleRetry(message) {
    shouldStickToBottomRef.current = true;
    requestAnswer(message.retryText, message.id);
  }

  function fillSuggestion(suggestion) {
    setInput(suggestion.slice(0, AI_CHAT_MAX_MESSAGE_LENGTH));
    if (inputRef.current) inputRef.current.style.height = "24px";
    inputRef.current?.focus();
  }

  function toggleOpen() {
    setIsOpen((current) => {
      if (!current) shouldStickToBottomRef.current = true;
      return !current;
    });
  }

  function handleInputChange(event) {
    const value = event.target.value.slice(0, AI_CHAT_MAX_MESSAGE_LENGTH);
    setInput(value);
    event.target.style.height = "24px";
    event.target.style.height = `${Math.min(event.target.scrollHeight, 90)}px`;
  }

  function handleScroll() {
    const element = messageAreaRef.current;
    if (!element) return;
    shouldStickToBottomRef.current = element.scrollHeight - element.scrollTop - element.clientHeight < 64;
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      handleSend();
    }
  }

  if (shouldHideWidget(pathname)) return null;

  return (
    <div className="ai-chat-widget">
      {isOpen ? (
        <section className="ai-chat-window" role="dialog" aria-label="MediUTE AI Chatbox">
          <header className="ai-chat-header">
            <div className="ai-chat-header__avatar"><Bot size={20} aria-hidden="true" /></div>
            <div className="ai-chat-header__copy">
              <strong>MediUTE AI</strong>
              <span>Trợ lý hỗ trợ sức khỏe</span>
            </div>
            <button className="ai-chat-header__close" type="button" onClick={() => setIsOpen(false)} aria-label="Đóng chat">
              <X size={19} />
            </button>
          </header>

          <div className="ai-chat-messages" ref={messageAreaRef} onScroll={handleScroll} aria-live="polite">
            {messages.map((message) => (
              <article className={`ai-chat-message ai-chat-message--${message.role}`} key={message.id}>
                {message.role === "assistant" ? <span className="ai-chat-message__avatar"><Sparkles size={14} /></span> : null}
                <div className="ai-chat-message__body">
                  <div className={`ai-chat-bubble${message.isError ? " ai-chat-bubble--error" : ""}`}>
                    {message.role === "assistant" ? <SafeMarkdown text={message.text} /> : <p>{message.text}</p>}
                  </div>
                  {message.isError ? (
                    <button className="ai-chat-retry" type="button" onClick={() => handleRetry(message)} disabled={isLoading}>
                      <RotateCcw size={14} /> Thử lại
                    </button>
                  ) : null}
                  {message.role === "assistant" ? <SourceList sources={message.sources} /> : null}
                  {message.suggestions?.length ? (
                    <div className="ai-chat-suggestions">
                      {message.suggestions.map((suggestion, index) => (
                        <button type="button" key={`${message.id}-suggestion-${index}`} onClick={() => fillSuggestion(suggestion)} disabled={isLoading}>
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
            {isLoading ? (
              <div className="ai-chat-typing" role="status">
                <span className="ai-chat-message__avatar"><Sparkles size={14} /></span>
                <span>MediUTE AI đang trả lời<span className="ai-chat-typing__dots">...</span></span>
              </div>
            ) : null}
            <div ref={bottomRef} />
          </div>

          <form className="ai-chat-composer" onSubmit={handleSend}>
            <div className="ai-chat-composer__field">
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Nhập câu hỏi của bạn..."
                aria-label="Nhập câu hỏi của bạn"
                maxLength={AI_CHAT_MAX_MESSAGE_LENGTH}
                rows={1}
                disabled={isLoading}
              />
              <button type="submit" aria-label="Gửi tin nhắn" disabled={!input.trim() || isLoading}>
                <Send size={17} />
              </button>
            </div>
            <div className="ai-chat-composer__footer">
              <span>AI chỉ cung cấp thông tin tham khảo.</span>
              <span>{input.length}/{AI_CHAT_MAX_MESSAGE_LENGTH}</span>
            </div>
          </form>
        </section>
      ) : null}

      <button
        className={`ai-chat-launcher${isOpen ? " ai-chat-launcher--open" : ""}`}
        type="button"
        aria-label={isOpen ? "Đóng MediUTE AI" : "Mở MediUTE AI"}
        aria-expanded={isOpen}
        onClick={toggleOpen}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={25} />}
        {!isOpen ? <span className="ai-chat-launcher__badge">AI</span> : null}
      </button>
    </div>
  );
}

export default AIChatWidget;
