import React from "react";
import CommunityChat from "./CommunityChat";

const CommunityHero = ({ userId, username, room }) => {
  // ...existing visual/animation code can be kept here...
  return (
    <div>
      {/* Existing hero/visuals here */}
      <CommunityChat userId={userId} username={username} room={room} />
    </div>
  );
};

export default CommunityHero;
