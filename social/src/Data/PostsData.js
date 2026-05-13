import PostPic1 from "../img/postpic1.jpg";
import PostPic2 from "../img/postpic2.jpg";
import PostPic3 from "../img/postpic3.JPG";
import ProfileImg from "../img/profileImg.jpg";

export const PostsData = [
  {
    _id: "demo-1",
    name: "FSM Team",
    username: "futuremedia",
    desc: "First look at the new FSM social vibe.",
    likes: 178,
    likedUser: [],
    format: "image",
    imageUrl: PostPic1,
    avatar: ProfileImg,
    isDemo: true,
  },
  {
    _id: "demo-2",
    name: "Bhavishya Gupta",
    username: "bhavishya",
    desc: "Building Future Media - A Social Media Platform one pixel at a time.",
    likes: 244,
    likedUser: [],
    format: "image",
    imageUrl: PostPic2,
    avatar: ProfileImg,
    isDemo: true,
  },
  {
    _id: "demo-3",
    name: "FSM Creator",
    username: "fsmcreator",
    desc: "Post, connect, and grow your audience.",
    likes: 129,
    likedUser: [],
    format: "image",
    imageUrl: PostPic3,
    avatar: ProfileImg,
    isDemo: true,
  },
];
