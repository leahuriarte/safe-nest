import { useState } from "react";
import { Box, Button, TextField, Typography, List, ListItem, ListItemText } from "@mui/material";

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

  // Generate simple Google Maps embed URL
  const mapCenter = userLocation || { lat: 37.7749, lng: -122.4194 };
  const mapUrl = `https://maps.google.com/maps?q=${mapCenter.lat},${mapCenter.lng}&z=13&output=embed`;

  return (
    <Box p={2}>
      <Typography variant="h4">Community Experiences</Typography>

      {/* Location and search */}
      <Box mt={2} mb={2} display="flex" gap={2}>
        <Button variant="contained" onClick={handleFindMe}>
          Find My Location
        </Button>
        <TextField
          label="Search Clinic"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </Box>

      {/* Simple Map */}
      <Box sx={{ height: "400px", width: "100%", mb: 4 }}>
        <iframe
          title="clinic-map"
          src={mapUrl}
          style={{ border: 0, width: "100%", height: "100%" }}
          allowFullScreen
        ></iframe>
      </Box>

      {/* Filtered Clinics */}
      <Box mb={4}>
        <Typography variant="h6">Clinics Found:</Typography>
        <List>
          {filteredClinics.map((clinic) => (
            <ListItem key={clinic.id}>
              <ListItemText primary={clinic.name} />
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Comments */}
      <Box>
        <Typography variant="h5">Comments</Typography>
        <TextField
          fullWidth
          multiline
          rows={3}
          label="Add your experience..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <Button variant="contained" sx={{ mt: 1, mb: 2 }} onClick={handleAddComment}>
          Submit
        </Button>

        <List>
          {comments.map((comment) => (
            <ListItem key={comment.id} alignItems="flex-start">
              <ListItemText primary={comment.user} secondary={comment.text} />
            </ListItem>
          ))}
        </List>
      </Box>
    </Box>
  );
}
