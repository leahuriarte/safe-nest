import { useState, useEffect } from "react";
import "./CommunityExperienceScreen.css";

interface Comment {
  id: number;
  user: string;
  text: string;
  likes: number;
  dislikes: number;
  replies: Comment[];
  timestamp: number;
}

interface Topic {
  id: number;
  title: string;
  description: string;
  comments: Comment[];
}

const EXAMPLE_COMMENTS: { [key: number]: Comment[] } = {
  1: [ // POC Experiences
    {
      id: 1,
      user: "Maria G.",
      text: "Just wanted to share my positive experience at the Downtown Women's Health Center. The staff was incredibly understanding and culturally sensitive. They even had Spanish-speaking doctors!",
      likes: 24,
      dislikes: 0,
      timestamp: Date.now() - 86400000 * 2,
      replies: [
        {
          id: 11,
          user: "Jasmine T.",
          text: "Thanks for sharing! I've been looking for a clinic that understands our community's needs. Will definitely check them out.",
          likes: 8,
          dislikes: 0,
          timestamp: Date.now() - 86400000,
          replies: []
        }
      ]
    },
    {
      id: 2,
      user: "Keisha W.",
      text: "Has anyone else experienced dismissive behavior from medical staff? I feel like my concerns about pain during pregnancy weren't taken seriously.",
      likes: 42,
      dislikes: 2,
      timestamp: Date.now() - 86400000 * 5,
      replies: [
        {
          id: 21,
          user: "Anonymous",
          text: "YES! This happened to me too. I switched to a Black-owned practice and the difference was night and day. They actually listened to me.",
          likes: 31,
          dislikes: 0,
          timestamp: Date.now() - 86400000 * 4,
          replies: []
        }
      ]
    }
  ],
  2: [ // Alternative Birth Methods
    {
      id: 3,
      user: "Sarah M.",
      text: "I had a water birth at home with a doula and it was the most empowering experience of my life. Happy to answer questions!",
      likes: 56,
      dislikes: 3,
      timestamp: Date.now() - 86400000 * 7,
      replies: [
        {
          id: 31,
          user: "Emily R.",
          text: "How did you find a good doula? I'm interested in home birth but nervous about finding the right support team.",
          likes: 12,
          dislikes: 0,
          timestamp: Date.now() - 86400000 * 6,
          replies: []
        }
      ]
    },
    {
      id: 4,
      user: "Yuki N.",
      text: "Hypnobirthing changed my entire perspective on labor. I highly recommend looking into it even if you're planning a hospital birth.",
      likes: 34,
      dislikes: 1,
      timestamp: Date.now() - 86400000 * 10,
      replies: []
    }
  ],
  3: [ // Spanish-Speakers Channel
    {
      id: 5,
      user: "Carmen L.",
      text: "¿Alguien sabe dónde puedo encontrar clases prenatales en español en el área de Los Angeles?",
      likes: 18,
      dislikes: 0,
      timestamp: Date.now() - 86400000 * 3,
      replies: [
        {
          id: 51,
          user: "Isabel M.",
          text: "¡Sí! El Centro de Salud Comunitario ofrece clases gratuitas los martes y jueves. Son excelentes!",
          likes: 22,
          dislikes: 0,
          timestamp: Date.now() - 86400000 * 2,
          replies: []
        }
      ]
    }
  ],
  4: [ // Preparing for Birth
    {
      id: 6,
      user: "Rachel K.",
      text: "Pro tip: Start doing perineal massages around week 34. It really helped me avoid tearing during delivery!",
      likes: 89,
      dislikes: 2,
      timestamp: Date.now() - 86400000 * 14,
      replies: []
    },
    {
      id: 7,
      user: "Anonymous",
      text: "Don't forget to pack snacks for your birth partner! They need to keep their energy up too. Also, bring a phone charger!",
      likes: 67,
      dislikes: 0,
      timestamp: Date.now() - 86400000 * 8,
      replies: []
    }
  ],
  5: [ // Post-Birth Practices
    {
      id: 8,
      user: "Michelle P.",
      text: "Nobody told me about postpartum night sweats! Is this normal? I'm literally soaking through my clothes every night.",
      likes: 45,
      dislikes: 0,
      timestamp: Date.now() - 86400000 * 4,
      replies: [
        {
          id: 81,
          user: "Dr. Amanda L.",
          text: "Completely normal! It's your body's way of getting rid of excess fluids. It should improve after a few weeks. Keep hydrated and use absorbent towels on your bed.",
          likes: 78,
          dislikes: 0,
          timestamp: Date.now() - 86400000 * 3,
          replies: []
        }
      ]
    }
  ],
  6: [ // Uninsured Users
    {
      id: 9,
      user: "Jennifer H.",
      text: "For anyone uninsured: Look into your state's Medicaid program. Many states offer pregnancy coverage even if you don't qualify for regular Medicaid. It saved me thousands!",
      likes: 156,
      dislikes: 0,
      timestamp: Date.now() - 86400000 * 12,
      replies: [
        {
          id: 91,
          user: "Anonymous",
          text: "Also, many hospitals have financial aid programs. Don't be afraid to ask about payment plans or charity care!",
          likes: 92,
          dislikes: 0,
          timestamp: Date.now() - 86400000 * 11,
          replies: []
        }
      ]
    }
  ]
};

export default function CommunityForum() {
  const [currentTopic, setCurrentTopic] = useState<Topic | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [likedComments, setLikedComments] = useState<Set<number>>(new Set());
  const [dislikedComments, setDislikedComments] = useState<Set<number>>(new Set());

  const topics: Topic[] = [
    { id: 1, title: "POC Experiences", description: "Share experiences at clinics and support each other", comments: [] },
    { id: 2, title: "Alternative Birth Methods", description: "Home birth, water birth, hypnobirthing, and more", comments: [] },
    { id: 3, title: "Spanish-Speakers Channel", description: "Comunidad en español para futuras madres", comments: [] },
    { id: 4, title: "Preparing for Birth", description: "Tips, advice, and what to expect", comments: [] },
    { id: 5, title: "Post-Birth Practices", description: "Recovery, newborn care, and postpartum support", comments: [] },
    { id: 6, title: "Uninsured Users", description: "Resources and support for users without insurance", comments: [] },
  ];

  // Load comments from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('community-comments');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Initialize with example comments and merge with saved
        const mergedComments: { [key: number]: Comment[] } = { ...EXAMPLE_COMMENTS };
        Object.keys(parsed).forEach(key => {
          const topicId = parseInt(key);
          mergedComments[topicId] = [...(EXAMPLE_COMMENTS[topicId] || []), ...parsed[topicId]];
        });
      } catch (e) {
        console.error('Failed to load comments:', e);
      }
    }
  }, []);

  // Save comments to localStorage whenever they change
  const saveComments = (topicId: number, updatedComments: Comment[]) => {
    try {
      const saved = localStorage.getItem('community-comments');
      const allComments = saved ? JSON.parse(saved) : {};

      // Only save user-added comments (not example comments)
      const userComments = updatedComments.filter(c => c.id > 1000);
      allComments[topicId] = userComments;

      localStorage.setItem('community-comments', JSON.stringify(allComments));
    } catch (e) {
      console.error('Failed to save comments:', e);
    }
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !currentTopic) return;

    const comment: Comment = {
      id: Date.now(),
      user: "You",
      text: newComment,
      likes: 0,
      dislikes: 0,
      replies: [],
      timestamp: Date.now()
    };

    const updatedComments = [...comments, comment];
    setComments(updatedComments);
    saveComments(currentTopic.id, updatedComments);
    setNewComment("");
  };

  const handleLike = (id: number) => {
    if (dislikedComments.has(id)) {
      setDislikedComments(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }

    setLikedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });

    setComments((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, likes: likedComments.has(id) ? c.likes - 1 : c.likes + 1 }
          : { ...c, replies: handleNestedLike(c.replies, id, 1) }
      )
    );
  };

  const handleDislike = (id: number) => {
    if (likedComments.has(id)) {
      setLikedComments(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }

    setDislikedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });

    setComments((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, dislikes: dislikedComments.has(id) ? c.dislikes - 1 : c.dislikes + 1 }
          : { ...c, replies: handleNestedLike(c.replies, id, -1) }
      )
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
    if (!text.trim() || !currentTopic) return;

    const reply: Comment = {
      id: Date.now(),
      user: "You",
      text,
      likes: 0,
      dislikes: 0,
      replies: [],
      timestamp: Date.now()
    };

    const addReplyRecursively = (list: Comment[]): Comment[] =>
      list.map((c) =>
        c.id === parentId
          ? { ...c, replies: [...c.replies, reply] }
          : { ...c, replies: addReplyRecursively(c.replies) }
      );

    const updatedComments = addReplyRecursively(comments);
    setComments(updatedComments);
    saveComments(currentTopic.id, updatedComments);
    setReplyingTo(null);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const CommentItem = ({ comment, level = 0 }: { comment: Comment; level?: number }) => {
    const [localReply, setLocalReply] = useState("");

    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleReply(comment.id, localReply);
        setLocalReply("");
      }
    };

    return (
      <div className="comment-item" style={{ marginLeft: level > 0 ? '3rem' : '0' }}>
        <div className="comment-header">
          <div className="comment-avatar">{getInitials(comment.user)}</div>
          <span className="comment-user">{comment.user}</span>
        </div>

        <p className="comment-text">{comment.text}</p>

        <div className="comment-actions">
          <button
            className={`action-button ${likedComments.has(comment.id) ? 'liked' : ''}`}
            onClick={() => handleLike(comment.id)}
          >
            👍 {comment.likes}
          </button>
          <button
            className={`action-button ${dislikedComments.has(comment.id) ? 'disliked' : ''}`}
            onClick={() => handleDislike(comment.id)}
          >
            👎 {comment.dislikes}
          </button>
          {replyingTo !== comment.id && (
            <button className="action-button" onClick={() => setReplyingTo(comment.id)}>
              💬 Reply
            </button>
          )}
        </div>

        {replyingTo === comment.id && (
          <div className="reply-input-section">
            <textarea
              className="reply-input"
              value={localReply}
              onChange={(e) => setLocalReply(e.target.value)}
              onKeyDown={handleKeyPress}
              autoFocus
              placeholder="Write a reply..."
              rows={3}
            />
            <div className="reply-buttons">
              <button className="cancel-button" onClick={() => { setReplyingTo(null); setLocalReply(""); }}>
                Cancel
              </button>
              <button className="submit-button" onClick={() => { handleReply(comment.id, localReply); setLocalReply(""); }}>
                Post Reply
              </button>
            </div>
          </div>
        )}

        {comment.replies.length > 0 && (
          <div className="reply-container">
            {comment.replies.map((r) => <CommentItem key={r.id} comment={r} level={level + 1} />)}
          </div>
        )}
      </div>
    );
  };

  return !currentTopic ? (
    <div className="community-container">
      <div className="community-header">
        <h2>Community Forum</h2>
        <p>Connect with others, share experiences, and find support</p>
      </div>

      <div className="topics-grid">
        {topics.map((topic) => {
          const exampleComments = EXAMPLE_COMMENTS[topic.id] || [];
          const commentCount = exampleComments.length;

          return (
            <div
              key={topic.id}
              className="topic-card"
              onClick={() => {
                setCurrentTopic(topic);
                setComments(exampleComments);
              }}
            >
              <div>
                <h3>{topic.title}</h3>
                <p>{topic.description}</p>
              </div>
              <div className="topic-stats">
                <span>💬 {commentCount} discussions</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  ) : (
    <div className="topic-view">
      <div className="topic-header">
        <button className="back-button" onClick={() => setCurrentTopic(null)}>
          ← Back to Topics
        </button>
        <h2 className="topic-title">{currentTopic.title}</h2>
        <p className="topic-description">{currentTopic.description}</p>
      </div>

      <div className="comments-container">
        {comments.length === 0 && (
          <p className="no-comments">No comments yet. Be the first to share your thoughts!</p>
        )}
        {comments.map((comment) => (
          <CommentItem key={comment.id} comment={comment} />
        ))}
      </div>

      <div className="new-comment-section">
        <textarea
          className="new-comment-textarea"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleAddComment();
            }
          }}
          placeholder="Share your thoughts, ask a question, or offer support..."
        />
        <button
          className="submit-comment-button"
          onClick={handleAddComment}
          disabled={!newComment.trim()}
        >
          Post Comment
        </button>
      </div>
    </div>
  );
}
