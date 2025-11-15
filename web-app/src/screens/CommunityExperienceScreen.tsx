import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Box, Button, TextField, Typography, List, ListItem, ListItemText } from "@mui/material";

import L from "leaflet";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: iconUrl,
  shadowUrl: shadowUrl,
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

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
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
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
        setUserLocation([position.coords.latitude, position.coords.longitude]);
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

      {/* Map */}
      <MapContainer
        center={userLocation || [37.7749, -122.4194]}
        zoom={13}
        style={{ height: "400px", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {userLocation && <Marker position={userLocation}><Popup>Your Location</Popup></Marker>}
        {filteredClinics.map((clinic) => (
          <Marker key={clinic.id} position={[clinic.lat, clinic.lng]}>
            <Popup>{clinic.name}</Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Comments */}
      <Box mt={4}>
        <Typography variant="h5">Comments</Typography>
        <TextField
          fullWidth
          multiline
          rows={3}
          label="Add your experience..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <Button variant="contained" sx={{ mt: 1 }} onClick={handleAddComment}>
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