import { supabase } from '../services/supabaseClient';

// Add a participant
export async function addParticipant(roomId, participantName) {
  const { data, error } = await supabase
    .from("rooms")
    .insert([{ room_id: roomId, participant_name: participantName }]);

  if (error) console.error("Error adding participant:", error);
  return data;
}

// Fetch all participants in a room
export async function fetchParticipants(roomId) {
  const { data, error } = await supabase
    .from("rooms")
    .select("participant_name")
    .eq("room_id", roomId);

  if (error) {
    console.error("Error fetching participants:", error);
    return [];
  }
  return data.map((p) => p.participant_name);
}

// Subscribe to changes in participants
export function subscribeToParticipants(roomId, onUpdate) {
  return supabase
    .channel("rooms-channel")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "rooms", filter: `room_id=eq.${roomId}` },
      async () => {
        const names = await fetchParticipants(roomId);
        onUpdate(names);
      }
    )
    .subscribe();
}

