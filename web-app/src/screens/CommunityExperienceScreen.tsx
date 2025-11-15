import { useState } from "react";

// Dummy clinic data
const dummyClinics = [
  {
    id: 1,
    name: "Healthy Moms Clinic",
    location: "San Francisco, CA",
    image: "https://via.placeholder.com/150",
    googleRating: 4.5,
  },
  {
    id: 2,
    name: "Sunshine Birth Center",
    location: "San Francisco, CA",
    image: "https://via.placeholder.com/150",
    googleRating: 4.2,
  },
  {
    id: 3,
    name: "Gentle Birth Clinic",
    location: "San Francisco, CA",
    image: "https://via.placeholder.com/150",
    googleRating: 4.8,
  },
];

interface Comment {
  id: number;
  user: string;
  text: string;
}

export default function CommunityExperiences() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClinic, setSelectedClinic] = useState<typeof dummyClinics[0] | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");

  const filteredClinics = dummyClinics.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const comment: Comment = {
      id: Date.now(),
      user: "Anonymous",
      text: newComment,
    };
    setComments([...comments, comment]);
    setNewComment("");
  };

  // Back to clinic list
  const handleBack = () => {
    setSelectedClinic(null);
    setComments([]);
    setNewComment("");
  };

  // === Clinic List View ===
  if (!selectedClinic) {
    return (
      <div style={{ padding: "16px", fontFamily: "Arial, sans-serif" }}>
        <h2>Community Experiences</h2>
        <input
          type="text"
          placeholder="Search clinic..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: "100%", padding: "8px", marginBottom: "16px" }}
        />

        <div
          style={{
            display: "flex",
            overflowX: "auto",
            gap: "16px",
            paddingBottom: "16px",
          }}
        >
          {filteredClinics.length > 0 ? (
            filteredClinics.map((clinic) => (
              <div
                key={clinic.id}
                style={{
                  minWidth: "200px",
                  border: "1px solid #ccc",
                  borderRadius: "8px",
                  padding: "8px",
                  cursor: "pointer",
                  textAlign: "center",
                }}
                onClick={() => setSelectedClinic(clinic)}
              >
                <img
                  src={clinic.image}
                  alt={clinic.name}
                  style={{ width: "100%", borderRadius: "8px" }}
                />
                <h4>{clinic.name}</h4>
                <p>{clinic.location}</p>
                <p>⭐ {clinic.googleRating}</p>
              </div>
            ))
          ) : (
            <p>No clinics found.</p>
          )}
        </div>
      </div>
    );
  }

  // === Clinic Detail View ===
  return (
    <div style={{ padding: "16px", fontFamily: "Arial, sans-serif" }}>
      <button onClick={handleBack} style={{ marginBottom: "16px" }}>
        ← Back
      </button>

      <div style={{ textAlign: "center" }}>
        <img
          src={selectedClinic.image}
          alt={selectedClinic.name}
          style={{ width: "300px", borderRadius: "8px", marginBottom: "16px" }}
        />
        <h2>{selectedClinic.name}</h2>
        <p>{selectedClinic.location}</p>
        <p>Google Rating: ⭐ {selectedClinic.googleRating}</p>
      </div>

      <div style={{ marginTop: "32px" }}>
        <h3>Community Comments</h3>
        <textarea
          rows={3}
          style={{ width: "100%", marginBottom: "8px" }}
          placeholder="Share your experience..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <br />
        <button onClick={handleAddComment} style={{ marginBottom: "16px" }}>
          Submit
        </button>

        {comments.length > 0 ? (
          <ul>
            {comments.map((comment) => (
              <li key={comment.id}>
                <strong>{comment.user}:</strong> {comment.text}
              </li>
            ))}
          </ul>
        ) : (
          <p>No comments yet. Be the first to add one!</p>
        )}
      </div>
    </div>
  );
}
