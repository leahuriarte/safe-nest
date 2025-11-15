interface Topic {
  id: number;
  title: string;
  description: string;
}

interface Comment {
  id: number;
  user: string;
  text: string;
  likes: number;
  dislikes: number;
  replies: Comment[];
}

import { useState } from "react";

const initialTopics: Topic[] = [
  { id: 1, title: "POC Experiences", description: "Share experiences at clinics and with healthcare providers" },
  { id: 2, title: "Alternative Birth Methods", description: "Support and advice for home births, midwives, water births, etc." },
  { id: 3, title: "Spanish-Speakers Channel", description: "Conversations and resources in Spanish" },
  { id: 4, title: "Preparing for Birth", description: "Tips, classes, and preparation ideas" },
  { id: 5, title: "Post-Birth Practices", description: "Recovery, breastfeeding, mental health, and more" },
  { id: 6, title: "Parenting & Support Networks", description: "Community resources for new parents" },
];

export default function CommunityForum() {
  const [currentTopic, setCurrentTopic] = useState<Topic | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const comment: Comment = {
      id: Date.now(),
      user: "Anonymous",
      text: newComment,
      likes: 0,
      dislikes: 0,
      replies: [],
    };
    setComments([comment, ...comments]);
    setNewComment("");
  };

  const handleReply = (parentId: number, replyText: string) => {
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === parentId) {
          const reply: Comment = { id: Date.now(), user: "Anonymous", text: replyText, likes: 0, dislikes: 0, replies: [] };
          return { ...c, replies: [...c.replies, reply] };
        }
        return c;
      })
    );
  };

  const handleLike = (id: number) =>
    setComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, likes: c.likes + 1 } : c))
    );

  const handleDislike = (id: number) =>
    setComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, dislikes: c.dislikes + 1 } : c))
    );

  if (!currentTopic) {
    // **Start Page with Topics**
    return (
      <div style={{ padding: "16px" }}>
        <h2>Community Topics</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", maxHeight: "80vh", overflowY: "auto" }}>
          {initialTopics.map((topic) => (
            <div
              key={topic.id}
              onClick={() => {
                setCurrentTopic(topic);
                setComments([]); // Reset comments for demo, could fetch from backend
              }}
              style={{
                flex: "1 0 300px",
                border: "1px solid #ccc",
                borderRadius: "8px",
                padding: "16px",
                cursor: "pointer",
                minHeight: "120px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                transition: "transform 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <h3>{topic.title}</h3>
              <p>{topic.description}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // **Topic Page / Chat Room**
  return (
    <div style={{ padding: "16px" }}>
      <button onClick={() => setCurrentTopic(null)} style={{ marginBottom: "16px" }}>
        ← Back to Topics
      </button>
      <h2>{currentTopic.title}</h2>
      <p>{currentTopic.description}</p>

      <div style={{ marginTop: "24px" }}>
        <h4>Add a Comment</h4>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Share your thoughts..."
          style={{ width: "100%", height: "80px", marginBottom: "8px" }}
        />
        <button onClick={handleAddComment} style={{ padding: "8px 12px" }}>
          Submit
        </button>
      </div>

      <div style={{ marginTop: "24px" }}>
        <h4>Comments</h4>
        {comments.map((comment) => (
          <div
            key={comment.id}
            style={{ border: "1px solid #ddd", padding: "12px", borderRadius: "8px", marginBottom: "12px" }}
          >
            <p>
              <strong>{comment.user}:</strong> {comment.text}
            </p>
            <div style={{ display: "flex", gap: "8px", fontSize: "0.9em" }}>
              <button onClick={() => handleLike(comment.id)}>👍 {comment.likes}</button>
              <button onClick={() => handleDislike(comment.id)}>👎 {comment.dislikes}</button>
              <ReplyForm comment={comment} handleReply={handleReply} />
            </div>

            {comment.replies.length > 0 && (
              <div style={{ marginTop: "12px", marginLeft: "16px" }}>
                {comment.replies.map((reply) => (
                  <div key={reply.id} style={{ border: "1px solid #eee", padding: "8px", borderRadius: "6px", marginBottom: "8px" }}>
                    <p>
                      <strong>{reply.user}:</strong> {reply.text}
                    </p>
                    <div style={{ display: "flex", gap: "8px", fontSize: "0.8em" }}>
                      <button onClick={() => handleLike(reply.id)}>👍 {reply.likes}</button>
                      <button onClick={() => handleDislike(reply.id)}>👎 {reply.dislikes}</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// **Reply Input Component**
function ReplyForm({ comment, handleReply }: { comment: Comment; handleReply: (id: number, text: string) => void }) {
  const [replyText, setReplyText] = useState("");
  const [open, setOpen] = useState(false);

  const submitReply = () => {
    if (!replyText.trim()) return;
    handleReply(comment.id, replyText);
    setReplyText("");
    setOpen(false);
  };

  return (
    <div>
      <button onClick={() => setOpen(!open)}>Reply</button>
      {open && (
        <div style={{ marginTop: "8px" }}>
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a reply..."
            style={{ width: "70%", padding: "6px" }}
          />
          <button onClick={submitReply} style={{ marginLeft: "4px", padding: "6px 10px" }}>
            Submit
          </button>
        </div>
      )}
    </div>
  );
}
