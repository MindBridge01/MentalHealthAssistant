import React from "react";

const Posts = ({ post, image }) => {
    const handleAction = async (action) => {
        try {
            await fetch(`http://localhost:3000/api/posts/${post._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action }),
            });
            // Optimistically update UI (re-fetch posts in PostWall for consistency)
        } catch (error) {
            console.error(`Error performing ${action}:`, error);
        }
    };

    return (
        <div className="inline-flex flex-col rounded-[24px] items-start shadow-[0px_4.97px_17.38px_rgba(181,181,181,0.25)]">
            {/* Header: User Info */}
            <div className="relative w-full h-[64.56px] rounded-t-[24px] bg-white overflow-hidden">
                <div className="absolute w-[41px] h-[41px] top-[13px] left-[18px] bg-[#2ab1ec] rounded-full" />
                <div className="flex flex-col w-[72px] items-start absolute top-4 left-[69px]">
                    <div className="self-stretch font-bold text-[13px] text-[#1a3c6d] leading-[normal] tracking-[0.015em]">
                        {post.author || "Rikki Janae"}
                    </div>
                    <div className="self-stretch font-medium text-[10px] text-[#6b7280] leading-[normal] tracking-[0.015em]">
                        {post.location || " "}
                    </div>
                </div>
            </div>

            {/* Post Image */}
            <div className="relative w-full h-[370px]">
                <img
                    src={image}
                    alt="Post"
                    className="w-full h-full object-cover"
                    onError={(e) => (e.target.style.display = "none")}
                />
            </div>

            {/* Caption */}
            <p className="w-full p-4 bg-white text-gray-800 text-[14px]">
                {post.caption || ""}
            </p>

            {/* Footer: Action Buttons */}
            <div className="relative w-full h-[49.66px] bg-white rounded-b-[24px] overflow-hidden">
                <div className="flex w-full items-center justify-between relative top-3.5 pb-4 px-4">
                    
                    <div className="inline-flex items-center gap-[9.93px]">
                        <span
                            className="material-icons-outlined w-[23.89px] h-[23.89px] text-blue-800 cursor-pointer"
                            onClick={() => handleAction("like")}
                        >
                            favorite_border
                        </span>
                        <span
                            className="material-icons-outlined w-[23.89px] h-[23.89px] text-blue-800 cursor-pointer"
                            onClick={() => handleAction("comment")}
                        >
                            chat_bubble_outline
                        </span>
                    </div>
                    <span
                        className="material-icons-outlined w-[23.89px] h-[23.89px] text-blue-800  cursor-pointer"
                        onClick={() => handleAction("save")}
                    >
                        bookmark_border
                    </span>
                </div>
            </div>
        </div>
    );
};

export default Posts;