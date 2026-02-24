interface MessagePreviewProps {
  previewHtml: string | null;
  time: string;
  copied: boolean;
  onCopy: () => void;
}

export function MessagePreview({ previewHtml, time, copied, onCopy }: MessagePreviewProps) {
  if (previewHtml) {
    return (
      <div className="message">
        <div className="avatar">Y</div>
        <div className="message-content">
          <div className="message-meta">
            <span className="message-author">You</span>
            <span className="message-time">{time}</span>
          </div>
          {/* biome-ignore lint/security/noDangerouslySetInnerHtml: preview-only rendering */}
          <div className="message-body" dangerouslySetInnerHTML={{ __html: previewHtml }} />
          <div className="message-actions-row">
            {copied ? <span className="reaction-badge">&#x1F4CB; copied</span> : <span />}
            {!copied && (
              <button type="button" className="copy-action-btn" onClick={onCopy}>
                Copy for Slack
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="message welcome-message">
      <div className="avatar">S</div>
      <div>
        <div className="message-meta">
          <span className="message-author">slackfmt</span>
          <span className="message-time">{time}</span>
        </div>
        <div className="message-body">
          <p>
            Type or paste content in the composer below, then click <strong>Copy for Slack</strong>{" "}
            (or press <code>Cmd+Enter</code>).
          </p>
          <p>
            Your formatted message will appear here as a preview before you paste it into Slack.
          </p>
        </div>
      </div>
    </div>
  );
}
