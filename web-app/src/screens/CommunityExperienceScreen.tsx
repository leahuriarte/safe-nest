import { useState } from "react";

// Dummy clinic data
const dummyClinics = [
  { id: 1, name: "Healthy Moms Clinic", lat: 37.7749, lng: -122.4194 },
  { id: 2, name: "Sunshine Birth Center", lat: 37.7849, lng: -122.4094 },
];

interface Comment {
  id: number;
  user: string;
  text: string;
  parentId?: number;
}

export default function CommunityExperiences() {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");

  // Get user location
  const handleFindMe = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      () => alert("Unable to retrieve your location")
    );
  };

  // Filter clinics by search query
  const filteredClinics = dummyClinics.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Add a new comment
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

  // Map center
  const mapCenter = userLocation || { lat: 37.7749, lng: -122.4194 };
  const mapUrl = `https://maps.google.com/maps?q=${mapCenter.lat},${mapCenter.lng}&z=13&output=embed`;

  return (
    <div style={{ padding: "16px", fontFamily: "Arial, sans-serif" }}>
      <h2>Community Experiences</h2>

      {/* Location and search */}
      <div style={{ margin: "16px 0", display: "flex", gap: "8px" }}>
        <button onClick={handleFindMe}>Find My Location</button>
        <input
          type="text"
          placeholder="Search Clinic"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Simple Map */}
      <div style={{ width: "100%", height: "400px", marginBottom: "16px" }}>
        <iframe
          title="clinic-map"
          src={mapUrl}
          style={{ border: 0, width: "100%", height: "100%" }}
          allowFullScreen
        ></iframe>
      </div>

      {/* Filtered Clinics */}
      <div style={{ marginBottom: "16px" }}>
        <h3>Clinics Found:</h3>
        <ul>
          {filteredClinics.map((clinic) => (
            <li key={clinic.id}>{clinic.name}</li>
          ))}
        </ul>
      </div>

      {/* Comments */}
      <div>
        <h3>Comments</h3>
        <textarea
          rows={3}
          style={{ width: "100%", marginBottom: "8px" }}
          placeholder="Add your experience..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <br />
        <button onClick={handleAddComment} style={{ marginBottom: "16px" }}>
          Submit
        </button>

        <ul>
          {comments.map((comment) => (
            <li key={comment.id}>
              <strong>{comment.user}:</strong> {comment.text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
