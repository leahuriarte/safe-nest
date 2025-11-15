import { useState } from "react";

interface Comment {
  id: number;
  user: string;
  text: string;
  likes: number;
  dislikes: number;
  replies: Comment[];
}

interface Topic {
  id: number;
  title: string;
  description: string;
  comments: Comment[];
}

export default function CommunityForum() {
  const [currentTopic, setCurrentTopic] = useState<Topic | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);

  // Example topics
  const topics: Topic[] = [
    { id: 1, title: "POC Experiences", description: "Share experiences at clinics", comments: [] },
    { id: 2, title: "Alternative Birth Methods", description: "Support for home birth, water birth, etc.", comments: [] },
    { id: 3, title: "Spanish-Speakers Channel", description: "Habla en español aquí", comments: [] },
    { id: 4, title: "Preparing for Birth", description: "Tips and advice for expectant parents", comments: [] },
    { id: 5, title: "Post-Birth Practices", description: "Recovery, newborn care, and more", comments: [] },
    { id: 6, title: "Uninsured Users", description: "Resources and support for users without insurance", comments: [] },
  ];

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
    setComments([...comments, comment]);
    setNewComment("");
  };

  const handleLike = (id: number) => {
    setComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, likes: c.likes + 1 } : { ...c, replies: handleNestedLike(c.replies, id, 1) }))
    );
  };

  const handleDislike = (id: number) => {
    setComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, dislikes: c.dislikes + 1 } : { ...c, replies: handleNestedLike(c.replies, id, -1) }))
    );
  };

  const handleNestedLike = (replies: Comment[], id: number, type: 1 | -1): Comment[] => {
    return replies.map((r) => {
      if (r.id === id) {
        return type === 1 ? { ...r, likes: r.likes + 1 } : { ...r, dislikes: r.dislikes + 1 };
      } else {
        return { ...r, replies: handleNestedLike(r.replies, id, type) };
      }
    });
  };

  const handleReply = (parentId: number, text: string) => {
    if (!text.trim()) return;
    const reply: Comment = { id: Date.now(), user: "Anonymous", text, likes: 0, dislikes: 0, replies: [] };

    const addReplyRecursively = (list: Comment[]): Comment[] =>
      list.map((c) =>
        c.id === parentId
          ? { ...c, replies: [...c.replies, reply] }
          : { ...c, replies: addReplyRecursively(c.replies) }
      );

    setComments(addReplyRecursively(comments));
    setReplyingTo(null); // Hide reply box after posting
  };

  const CommentItem = ({ comment, level = 0 }: { comment: Comment; level?: number }) => {
    const [localReply, setLocalReply] = useState("");

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleReply(comment.id, localReply);
        setLocalReply("");
      }
    };

    return (
      <div
        style={{
          marginLeft: `${level * 16}px`,
          border: level === 0 ? "1px solid #ddd" : "1px solid #eee",
          padding: "12px",
          borderRadius: "8px",
          marginBottom: "12px",
          background: level === 0 ? "#fff" : "#f9f9f9",
        }}
      >
        <p>
          <strong>{comment.user}:</strong> {comment.text}
        </p>
        <div style={{ display: "flex", gap: "8px", fontSize: "0.9em", alignItems: "center" }}>
          <button onClick={() => handleLike(comment.id)}>👍 {comment.likes}</button>
          <button onClick={() => handleDislike(comment.id)}>👎 {comment.dislikes}</button>
          {replyingTo !== comment.id && (
            <button onClick={() => setReplyingTo(comment.id)}>Reply</button>
          )}
        </div>

        {replyingTo === comment.id && (
          <div style={{ marginTop: "8px" }}>
            <input
              type="text"
              value={localReply}
              onChange={(e) => setLocalReply(e.target.value)}
              onKeyDown={handleKeyPress}
              autoFocus
              placeholder="Write a reply..."
              style={{ padding: "4px", width: "80%", marginRight: "4px" }}
            />
            <button onClick={() => { handleReply(comment.id, localReply); setLocalReply(""); }}>Submit</button>
            <button
              onClick={() => { setReplyingTo(null); setLocalReply(""); }}
              style={{ marginLeft: "4px" }}
            >
              Cancel
            </button>
          </div>
        )}

        {comment.replies.length > 0 &&
          comment.replies.map((r) => <CommentItem key={r.id} comment={r} level={level + 1} />)}
      </div>
    );
  };

  return !currentTopic ? (
    <div style={{ padding: "16px" }}>
      <h2>Community Topics</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", maxHeight: "80vh", overflowY: "auto" }}>
        {topics.map((topic) => (
          <div
            key={topic.id}
            onClick={() => {
              setCurrentTopic(topic);
              setComments(topic.comments || []);
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
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)"}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
          >
            <h3>{topic.title}</h3>
            <p>{topic.description}</p>
          </div>
        ))}
      </div>
    </div>
  ) : (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", padding: "16px", position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: "16px" }}>
        <button
          onClick={() => setCurrentTopic(null)}
          style={{
            padding: "6px 10px",
            fontSize: "0.9em",
            borderRadius: "4px",
            marginRight: "12px",
          }}
        >
          ← Back
        </button>
        <h2 style={{ margin: 0 }}>{currentTopic.title}</h2>
      </div>
      <p>{currentTopic.description}</p>

      <div style={{ flex: 1, overflowY: "auto", marginTop: "8px", paddingRight: "8px", paddingBottom: "100px" }}>
        {comments.length === 0 && <p>No comments yet. Be the first to post!</p>}
        {comments.map((comment) => (
          <CommentItem key={comment.id} comment={comment} />
        ))}
      </div>

      <div
        style={{
          position: "sticky",
          bottom: 0,
          background: "#fff",
          borderTop: "1px solid #ccc",
          padding: "8px 0",
        }}
      >
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleAddComment();
            }
          }}
          placeholder="Write a comment..."
          style={{ width: "100%", height: "60px", marginBottom: "4px" }}
        />
        <button onClick={handleAddComment} style={{ padding: "8px 12px", float: "right" }}>
          Submit
        </button>
      </div>
    </div>
  );
}
