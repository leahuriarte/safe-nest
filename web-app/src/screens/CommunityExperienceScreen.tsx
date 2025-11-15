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
      text: "Just wanted to share my positive experience at Kindred Space LA. The staff was incredibly understanding and culturally sensitive. They even had Spanish-speaking midwives!",
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
      text: "Has anyone else experienced dismissive behavior from medical staff? At a big LA hospital I felt like my pain wasn’t taken seriously.",
      likes: 42,
      dislikes: 2,
      timestamp: Date.now() - 86400000 * 5,
      replies: [
        {
          id: 21,
          user: "Anonymous",
          text: "YES! I switched to a Black-owned practice near Inglewood and the difference was incredible. I finally felt seen and heard.",
          likes: 31,
          dislikes: 0,
          timestamp: Date.now() - 86400000 * 4,
          replies: []
        },
        {
          id: 22,
          user: "Aisha M.",
          text: "I'm so sorry. Document everything and ask to switch providers if you feel dismissed — you deserve respectful care.",
          likes: 18,
          dislikes: 0,
          timestamp: Date.now() - 86400000 * 3,
          replies: []
        }
      ]
    },
    {
      id: 3,
      user: "Priya S.",
      text: "Shoutout to Mind Body Birth in LA! They supported my vegetarian diet and understood cultural dietary restrictions through pregnancy.",
      likes: 35,
      dislikes: 0,
      timestamp: Date.now() - 86400000 * 8,
      replies: []
    },
    {
      id: 4,
      user: "Mei L.",
      text: "For anyone seeking culturally aware postpartum support, Kindred Space LA really understood traditional Asian postpartum practices.",
      likes: 29,
      dislikes: 0,
      timestamp: Date.now() - 86400000 * 6,
      replies: [
        {
          id: 41,
          user: "Linh N.",
          text: "This is so helpful! I’ve been afraid my practices would be judged.",
          likes: 12,
          dislikes: 0,
          timestamp: Date.now() - 86400000 * 5,
          replies: []
        }
      ]
    },

    // NEW LA HOSPITAL COMMENTS
    {
      id: 101,
      user: "Tatiana M.",
      text: "Cedars-Sinai treated me so well during my delivery. I asked for a Black lactation consultant and they actually honored my request.",
      likes: 58,
      dislikes: 1,
      timestamp: Date.now() - 86400000 * 3,
      replies: []
    },
    {
      id: 102,
      user: "Carlos R.",
      text: "UCLA BirthPlace (Santa Monica) had Spanish interpreters available 24/7. It made everything so much less stressful.",
      likes: 41,
      dislikes: 0,
      timestamp: Date.now() - 86400000 * 6,
      replies: []
    },
    {
      id: 103,
      user: "Anaya J.",
      text: "I delivered at LAC+USC and while it was crowded, the midwives were incredibly respectful and communicative.",
      likes: 77,
      dislikes: 3,
      timestamp: Date.now() - 86400000 * 4,
      replies: [
        {
          id: 1031,
          user: "Renee B.",
          text: "Same here! LAC+USC is busy but the midwives are amazing.",
          likes: 18,
          dislikes: 0,
          timestamp: Date.now() - 86400000 * 3,
          replies: []
        }
      ]
    },
    {
      id: 104,
      user: "Hana K.",
      text: "Kaiser Permanente LA understood my cultural postpartum needs and didn’t judge at all.",
      likes: 63,
      dislikes: 0,
      timestamp: Date.now() - 86400000 * 7,
      replies: []
    }
  ],

  2: [ // Alternative Birth Methods
    {
      id: 5,
      user: "Sarah M.",
      text: "I had a water birth at home with a doula and it was the most empowering experience of my life. Happy to answer questions!",
      likes: 56,
      dislikes: 3,
      timestamp: Date.now() - 86400000 * 7,
      replies: [
        {
          id: 51,
          user: "Emily R.",
          text: "How did you find your doula? I live in LA and feel overwhelmed by choices.",
          likes: 12,
          dislikes: 0,
          timestamp: Date.now() - 86400000 * 6,
          replies: []
        },
        {
          id: 52,
          user: "Fatima H.",
          text: "Water birth changed everything for me too. Pain management was way better than I expected.",
          likes: 8,
          dislikes: 0,
          timestamp: Date.now() - 86400000 * 5,
          replies: []
        }
      ]
    },
    {
      id: 6,
      user: "Yuki N.",
      text: "Hypnobirthing changed my entire perspective on labor. Even if you’re delivering in a hospital, I recommend it!",
      likes: 34,
      dislikes: 1,
      timestamp: Date.now() - 86400000 * 10,
      replies: []
    },
    {
      id: 7,
      user: "Destiny J.",
      text: "I chose Moxie Birth in South Pasadena — the perfect middle ground between a homey vibe and having medical support nearby.",
      likes: 41,
      dislikes: 0,
      timestamp: Date.now() - 86400000 * 9,
      replies: []
    },
    {
      id: 8,
      user: "Lakshmi P.",
      text: "If you're interested in Ayurvedic birthing support, ask midwives ahead of time — some are familiar and supportive.",
      likes: 27,
      dislikes: 1,
      timestamp: Date.now() - 86400000 * 11,
      replies: []
    },

    // NEW LA BIRTH CENTER + HOSPITAL COMMENTS
    {
      id: 201,
      user: "Emily S.",
      text: "GraceFull Birth Center felt like a spa. I transferred to California Hospital last minute due to exhaustion and the transition was seamless.",
      likes: 52,
      dislikes: 1,
      timestamp: Date.now() - 86400000 * 12,
      replies: []
    },
    {
      id: 202,
      user: "Serena L.",
      text: "UCLA Westwood has a midwife-led program for hospital births if you want a natural birth but still want hospital resources.",
      likes: 39,
      dislikes: 0,
      timestamp: Date.now() - 86400000 * 9,
      replies: []
    },
    {
      id: 203,
      user: "Ritu D.",
      text: "Providence St. John’s let me labor with dim lights and music. It felt calm and supported.",
      likes: 48,
      dislikes: 0,
      timestamp: Date.now() - 86400000 * 10,
      replies: []
    }
  ],

  3: [ // Spanish Speakers
    {
      id: 9,
      user: "Carmen L.",
      text: "¿Dónde puedo encontrar clases prenatales en español en Los Ángeles?",
      likes: 18,
      dislikes: 0,
      timestamp: Date.now() - 86400000 * 3,
      replies: [
        {
          id: 91,
          user: "Isabel M.",
          text: "¡Sí! Kindred Space LA y varias clínicas comunitarias del condado ofrecen clases prenatales en español.",
          likes: 22,
          dislikes: 0,
          timestamp: Date.now() - 86400000 * 2,
          replies: []
        }
      ]
    },
    {
      id: 10,
      user: "Gabriela R.",
      text: "Pidan intérprete en el hospital — es su derecho. A mí me ayudó muchísimo.",
      likes: 45,
      dislikes: 0,
      timestamp: Date.now() - 86400000 * 7,
      replies: [
        {
          id: 101,
          user: "Rosa V.",
          text: "Tan cierto. No sabía esto con mi primer bebé.",
          likes: 15,
          dislikes: 0,
          timestamp: Date.now() - 86400000 * 6,
          replies: []
        }
      ]
    },
    {
      id: 11,
      user: "Alejandra T.",
      text: "Para ayuda con WIC o Medi-Cal, Mujeres Unidas y varias clínicas comunitarias tienen personal en español.",
      likes: 38,
      dislikes: 0,
      timestamp: Date.now() - 86400000 * 12,
      replies: []
    },

    // NEW HOSPITAL SPANISH COMMENTS
    {
      id: 301,
      user: "Marisol P.",
      text: "En el hospital White Memorial fueron súper pacientes conmigo. Pedí una enfermera que hablara español y la trajeron de inmediato.",
      likes: 55,
      dislikes: 0,
      timestamp: Date.now() - 86400000 * 8,
      replies: []
    },
    {
      id: 302,
      user: "Julieta A.",
      text: "California Hospital (en Downtown LA) tiene intérpretes en persona y por video. Me explicaron todo durante la inducción.",
      likes: 33,
      dislikes: 0,
      timestamp: Date.now() - 86400000 * 5,
      replies: []
    }
  ],

  4: [ // Preparing for Birth
    {
      id: 12,
      user: "Rachel K.",
      text: "Pro tip: Start doing perineal massages around week 34. It really helped me avoid tearing during delivery!",
      likes: 89,
      dislikes: 2,
      timestamp: Date.now() - 86400000 * 14,
      replies: []
    },
    {
      id: 13,
      user: "Anonymous",
      text: "Don't forget to pack snacks for your birth partner! They need to keep their energy up too. Also, bring a phone charger!",
      likes: 67,
      dislikes: 0,
      timestamp: Date.now() - 86400000 * 8,
      replies: []
    },
    {
      id: 14,
      user: "Jamila A.",
      text: "Practice your breathing techniques NOW, not just in labor. I did 10 minutes every day for the last month and it made such a difference.",
      likes: 52,
      dislikes: 0,
      timestamp: Date.now() - 86400000 * 10,
      replies: []
    },
    {
      id: 15,
      user: "Sophie Chen",
      text: "Create a birth playlist! Music really helped me stay calm during early labor. Include songs that make you feel strong and peaceful.",
      likes: 44,
      dislikes: 1,
      timestamp: Date.now() - 86400000 * 13,
      replies: [
        {
          id: 151,
          user: "Zara K.",
          text: "This is such a good idea! What kind of music did you use?",
          likes: 7,
          dislikes: 0,
          timestamp: Date.now() - 86400000 * 12,
          replies: []
        }
      ]
    },
    {
      id: 16,
      user: "Naomi B.",
      text: "Talk to your doctor about creating a birth plan, but also be flexible. I had a plan and things didn't go exactly as expected, but knowing my priorities helped me make decisions in the moment.",
      likes: 71,
      dislikes: 0,
      timestamp: Date.now() - 86400000 * 15,
      replies: []
    },

    // NEW HOSPITAL PREP COMMENTS
    {
      id: 401,
      user: "Danielle J.",
      text: "If you're delivering at Kaiser LA: take the virtual tour. Seeing the rooms ahead reduced my anxiety.",
      likes: 61,
      dislikes: 0,
      timestamp: Date.now() - 86400000 * 7,
      replies: []
    },
    {
      id: 402,
      user: "Liya M.",
      text: "Cedars-Sinai lets you upload your birth plan into your patient portal before labor. Game changer.",
      likes: 54,
      dislikes: 0,
      timestamp: Date.now() - 86400000 * 6,
      replies: []
    }
  ],

  5: [ // Post-Birth Practices
    {
      id: 17,
      user: "Michelle P.",
      text: "Nobody told me about postpartum night sweats! Is this normal? I'm literally soaking through my clothes every night.",
      likes: 45,
      dislikes: 0,
      timestamp: Date.now() - 86400000 * 4,
      replies: [
        {
          id: 171,
          user: "Dr. Amanda L.",
          text: "Completely normal! It's your body's way of getting rid of excess fluids. It should improve after a few weeks. Keep hydrated and use absorbent towels on your bed.",
          likes: 78,
          dislikes: 0,
          timestamp: Date.now() - 86400000 * 3,
          replies: []
        }
      ]
    },
    {
      id: 18,
      user: "Tanya W.",
      text: "Postpartum depression is REAL and it's nothing to be ashamed of. I waited too long to get help. Please talk to your doctor if you're struggling.",
      likes: 156,
      dislikes: 0,
      timestamp: Date.now() - 86400000 * 9,
      replies: [
        {
          id: 181,
          user: "Yara S.",
          text: "Thank you for sharing this. I'm struggling right now and felt so alone. Making an appointment tomorrow.",
          likes: 62,
          dislikes: 0,
          timestamp: Date.now() - 86400000 * 8,
          replies: []
        }
      ]
    },
    {
      id: 19,
      user: "Haruka M.",
      text: "For anyone interested in traditional postpartum confinement practices, my mother-in-law helped me with a modified version that worked with modern life. Don't feel like you have to choose between cultures!",
      likes: 41,
      dislikes: 0,
      timestamp: Date.now() - 86400000 * 11,
      replies: []
    },
    {
      id: 20,
      user: "Imani J.",
      text: "Accept help when people offer! I tried to do everything myself and burned out so fast. Let people bring you meals, hold the baby while you shower, whatever you need.",
      likes: 93,
      dislikes: 0,
      timestamp: Date.now() - 86400000 * 16,
      replies: []
    },

    // NEW HOSPITAL POSTPARTUM COMMENTS
    {
      id: 501,
      user: "Angela S.",
      text: "UCLA BirthPlace Santa Monica has phenomenal lactation consultants. They literally saved my breastfeeding journey.",
      likes: 83,
      dislikes: 0,
      timestamp: Date.now() - 86400000 * 10,
      replies: []
    },
    {
      id: 502,
      user: "Naoko T.",
      text: "MLK Community Hospital’s postpartum team checked on me even after discharge. I felt so cared for.",
      likes: 47,
      dislikes: 0,
      timestamp: Date.now() - 86400000 * 11,
      replies: []
    },
    {
      id: 503,
      user: "Tiffany W.",
      text: "California Hospital downtown gave me postpartum mental health resources that were actually useful.",
      likes: 51,
      dislikes: 0,
      timestamp: Date.now() - 86400000 * 9,
      replies: []
    }
  ],

  6: [ // Uninsured Users
    {
      id: 21,
      user: "Jennifer H.",
      text: "For anyone uninsured: Look into your state's Medi-Cal program. Many states offer pregnancy coverage even if you don't qualify for regular Medicaid. It saved me thousands!",
      likes: 156,
      dislikes: 0,
      timestamp: Date.now() - 86400000 * 12,
      replies: [
        {
          id: 211,
          user: "Anonymous",
          text: "Also, many hospitals have financial aid programs. Don't be afraid to ask about payment plans or charity care!",
          likes: 92,
          dislikes: 0,
          timestamp: Date.now() - 86400000 * 11,
          replies: []
        }
      ]
    },
    {
      id: 22,
      user: "Thu N.",
      text: "Community health centers in Los Angeles offer sliding-scale fees based on income. I paid $20 per visit when I was uninsured.",
      likes: 104,
      dislikes: 0,
      timestamp: Date.now() - 86400000 * 15,
      replies: []
    },
    {
      id: 23,
      user: "Shanice T.",
      text: "Don't skip prenatal care because of insurance! There are free clinics and programs here. Your health and baby’s health are too important.",
      likes: 128,
      dislikes: 0,
      timestamp: Date.now() - 86400000 * 18,
      replies: [
        {
          id: 231,
          user: "Esperanza D.",
          text: "Absolutely. I found a nonprofit in LA that provided completely free prenatal care. They exist, you just have to ask!",
          likes: 48,
          dislikes: 0,
          timestamp: Date.now() - 86400000 * 17,
          replies: []
        }
      ]
    },
    {
      id: 24,
      user: "Amara O.",
      text: "WIC (Women, Infants, and Children) program provides free nutrition assistance and doesn’t require insurance. It’s been a lifesaver for me and my baby.",
      likes: 87,
      dislikes: 0,
      timestamp: Date.now() - 86400000 * 20,
      replies: []
    },

    // NEW HOSPITAL / SAFETY NET COMMENTS
    {
      id: 601,
      user: "Rosa D.",
      text: "LAC+USC accepted me under emergency Medi-Cal for pregnancy even though I had no insurance. They didn’t judge me at all.",
      likes: 92,
      dislikes: 0,
      timestamp: Date.now() - 86400000 * 14,
      replies: []
    },
    {
      id: 602,
      user: "Monica J.",
      text: "Eisner Health near DTLA offers low-cost prenatal care and even free classes. Amazing option if you're uninsured.",
      likes: 71,
      dislikes: 0,
      timestamp: Date.now() - 86400000 * 15,
      replies: []
    },
    {
      id: 603,
      user: "Deborah F.",
      text: "MLK Community Hospital helped me set up a payment plan for $30/month. Total lifesaver.",
      likes: 56,
      dislikes: 0,
      timestamp: Date.now() - 86400000 * 16,
      replies: []
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
