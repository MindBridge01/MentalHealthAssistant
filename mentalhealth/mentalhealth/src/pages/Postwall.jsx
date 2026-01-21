import React, { useState, useEffect } from "react";
import Posts from "./Posts";
import post1 from "../assets/images/post1.jpg";
import post2 from "../assets/images/post2.jpg";
import post3 from "../assets/images/post3.jpg";
import post4 from "../assets/images/post4.jpg";
import post5 from "../assets/images/post5.jpg";
import post6 from "../assets/images/post6.jpg";

const PostWall = () => {
    const [posts, setPosts] = useState([]);
    const [error, setError] = useState(null);

    const postImages = [post1, post2, post3, post4, post5, post6];

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const response = await fetch("http://localhost:3000/api/posts");
                if (!response.ok) {
                    throw new Error("Failed to fetch posts");
                }
                const data = await response.json();

                // Attach images to posts
                const postsWithImages = data.map((post, index) => ({
                    ...post,
                    image: postImages[index % postImages.length], // Cycle through images
                }));

                setPosts(postsWithImages);
                setError(null); // Clear error on success
            } catch (error) {
                console.error("Error fetching posts:", error);
                setError("Unable to load posts. Please try again later.");
            }
        };

        fetchPosts();
        const interval = setInterval(fetchPosts, 5000); // Poll every 5 seconds for demo
        return () => clearInterval(interval);
    },);

    return (
        <div className="w-full mt-24 p-4">
                  <div className="flex flex-col items-center mb-24 gap-2 md:gap-4 px-4">
        <h2 className="font-['General_Sans'] font-semibold text-dark-blue900 text-2xl md:text-5xl text-center">
          Watch What Others Are Sharing
        </h2>
        <p className="font-[Satoshi] font-normal text-dark-blue900 text-lg md:text-2xl text-center">
            A place to share your thoughts and feelings. So let’s try fast enough to fit anywhere.
        </p>
      </div>
            {error ? (
                <p className="text-red-600">{error}</p>
            ) : posts.length === 0 ? (
                <p className="text-gray-600">No posts yet. Be the first to share!</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    {posts.map((post) => (
                        <Posts key={post._id} post={post} image={post.image} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default PostWall;