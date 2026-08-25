const User = require("../models/userModel");
const Post = require("../models/postModels");
const Story = require("../models/storyModel");
const Hashtag = require("../models/hashtagModel");
const { hashPassword } = require("../utils/password");

const SEED_USERS = [
  {
    username: "snehilkhokhar",
    email: "snehilkhokhar@gmail.com",
    displayName: "Snehil Khokhar",
    profession: "Street & Documentary Photographer",
    bio: "Spent the evening experimenting with street photography and natural light. 35mm prime.",
    location: "Delhi, India",
    website: "https://snehilkhokhar.com",
    profilePicture: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&h=400&q=80",
    coverImage: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&h=400&q=85",
    isVerified: true,
    isPrivate: false,
    role: "user"
  },
  {
    username: "sahilsingh",
    email: "sahilsingh@gmail.com",
    displayName: "Sahil Singh",
    profession: "Product Designer & Technologist",
    bio: "Exploring spatial UI, motion curves, and fluid design systems.",
    location: "Mumbai, India",
    website: "https://sahilsingh.design",
    profilePicture: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&h=400&q=80",
    coverImage: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&h=400&q=85",
    isVerified: true,
    isPrivate: false,
    role: "user"
  },
  {
    username: "garvitpathak",
    email: "garvitpathak@gmail.com",
    displayName: "Garvit Pathak",
    profession: "Visual Artist & Brand Designer",
    bio: "Working late on a new visual identity. Sometimes the simplest direction is the strongest.",
    location: "Jaipur, India",
    website: "https://garvitpathak.art",
    profilePicture: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&h=400&q=80",
    coverImage: "https://images.unsplash.com/photo-1512486130939-2c4f79935e4f?auto=format&fit=crop&w=1200&h=400&q=85",
    isVerified: true,
    isPrivate: false,
    role: "user"
  },
  {
    username: "vipulagarwal",
    email: "vipulagarwal@gmail.com",
    displayName: "Vipul Agarwal",
    profession: "Software Architect & Open Source",
    bio: "Real-time systems, WebSockets, and clean backend engineering.",
    location: "Bengaluru, India",
    website: "https://vipulagarwal.dev",
    profilePicture: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&h=400&q=80",
    coverImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&h=400&q=85",
    isVerified: true,
    isPrivate: false,
    role: "user"
  },
  {
    username: "mayankkhandelwal",
    email: "mayankkhandelwal@gmail.com",
    displayName: "Mayank Khandelwal",
    profession: "Full Stack Engineer & Tech Lead",
    bio: "Building resilient web platforms, scalable microservices, and distributed architectures.",
    location: "Noida, India",
    website: "https://mayank.tech",
    profilePicture: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&h=400&q=80",
    coverImage: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&h=400&q=85",
    isVerified: true,
    isPrivate: false,
    role: "user"
  },
  {
    username: "darshkhandelwal",
    email: "darshkhandelwal@gmail.com",
    displayName: "Darsh Khandelwal",
    profession: "Creative Technologist & UI Specialist",
    bio: "Crafting fluid front-end animations, interactive WebGL experiences, and design systems.",
    location: "Gurugram, India",
    website: "https://darshk.dev",
    profilePicture: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&h=400&q=80",
    coverImage: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1200&h=400&q=85",
    isVerified: true,
    isPrivate: false,
    role: "user"
  },
  {
    username: "piyushmahipal",
    email: "piyushmahipal@gmail.com",
    displayName: "Piyush Mahipal",
    profession: "Mobile & Cloud Infrastructure Architect",
    bio: "Passionate about high-performance cloud architectures, mobile dev, and developer tooling.",
    location: "Pune, India",
    website: "https://piyushmahipal.io",
    profilePicture: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&h=400&q=80",
    coverImage: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&h=400&q=85",
    isVerified: true,
    isPrivate: false,
    role: "user"
  },
  {
    username: "theviralking",
    email: "theviralking@gmail.com",
    displayName: "theviralking",
    profession: "Digital Media Strategist & Content Creator",
    bio: "Creating viral social narratives, community engagement, and digital trends.",
    location: "Hyderabad, India",
    website: "https://theviralking.media",
    profilePicture: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&h=400&q=80",
    coverImage: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1200&h=400&q=85",
    isVerified: true,
    isPrivate: false,
    role: "user"
  },
  {
    username: "superrrstarrr",
    email: "superrrstarrr@gmail.com",
    displayName: "superrrstarrr",
    profession: "Visual Artist & Electronic Music Producer",
    bio: "Synthwave melodies, futuristic art, and creative coding.",
    location: "Goa, India",
    website: "https://superrrstarrr.art",
    profilePicture: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&h=400&q=80",
    coverImage: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1200&h=400&q=85",
    isVerified: true,
    isPrivate: false,
    role: "user"
  },
  {
    username: "bhavishyagupta",
    email: "bhavishyagupta@gmail.com",
    displayName: "Bhavishya Gupta",
    profession: "Digital creator • Photography • Technology",
    bio: "Building ideas for the future. Exploring new ways to create products that feel human.",
    location: "Bangalore, India",
    website: "https://bhavishyagupta.dev",
    profilePicture: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&h=400&q=80",
    coverImage: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&h=400&q=85",
    isVerified: true,
    isPrivate: false,
    role: "admin"
  }
];

const SEED_POSTS = [
  {
    username: "snehilkhokhar",
    caption: "Spent the evening experimenting with street photography and natural light. 35mm prime grain #photography #streetphoto #lighting",
    media: [
      { url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&h=800&q=85", type: "image" }
    ],
    hashtags: ["photography", "streetphoto", "lighting"],
    visibility: "public"
  },
  {
    username: "sahilsingh",
    caption: "Reviewing spatial design tokens and component physics for FutureMedia. Tactile surfaces and soft peach warmth #design #ui #designsystems #futuremedia",
    media: [
      { url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&h=800&q=85", type: "image" }
    ],
    hashtags: ["design", "ui", "designsystems", "futuremedia"],
    visibility: "public"
  },
  {
    username: "bhavishyagupta",
    caption: "Building real-time interactive canvas experiments with WebGL shaders running smooth at 60fps #creativecoding #webgl #tech #futuremedia",
    media: [
      { url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&h=800&q=85", type: "image" }
    ],
    hashtags: ["creativecoding", "webgl", "tech", "futuremedia"],
    visibility: "public"
  },
  {
    username: "garvitpathak",
    caption: "Exploring typography hierarchy and editorial layout composition. Simplicity always stands out #art #typography #design",
    media: [
      { url: "https://images.unsplash.com/photo-1512486130939-2c4f79935e4f?auto=format&fit=crop&w=1200&h=800&q=85", type: "image" }
    ],
    hashtags: ["art", "typography", "design"],
    visibility: "public"
  },
  {
    username: "vipulagarwal",
    caption: "Optimized the WebSocket connection pool and reduced latency by 40ms across active chat rooms #tech #development #architecture",
    media: [
      { url: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&h=800&q=85", type: "image" }
    ],
    hashtags: ["tech", "development", "architecture"],
    visibility: "public"
  },
  {
    username: "mayankkhandelwal",
    caption: "Urban skyline at dusk. Love the atmospheric glow and modern architecture #architecture #cityscape #photography",
    media: [
      { url: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&h=800&q=85", type: "image" }
    ],
    hashtags: ["architecture", "cityscape", "photography"],
    visibility: "public"
  },
  {
    username: "darshkhandelwal",
    caption: "Geometric abstraction study with tactile lighting and warm ambient shadows #design #art #creativecoding",
    media: [
      { url: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1200&h=800&q=85", type: "image" }
    ],
    hashtags: ["design", "art", "creativecoding"],
    visibility: "public"
  },
  {
    username: "theviralking",
    caption: "Dusk reflections and color spectrum transitions. Vibrant energy for the new season #creative #color #futuremedia",
    media: [
      { url: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1200&h=800&q=85", type: "image" }
    ],
    hashtags: ["creative", "color", "futuremedia"],
    visibility: "public"
  }
];

const SEED_STORIES = [
  {
    username: "snehilkhokhar",
    mediaUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&h=1400&q=85",
    mediaType: "image",
    caption: "Evening light test on 35mm f/1.4 (Slide 1/2)"
  },
  {
    username: "snehilkhokhar",
    mediaUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&h=1400&q=85",
    mediaType: "image",
    caption: "Raw grain shadows at sunset (Slide 2/2)"
  },
  {
    username: "sahilsingh",
    mediaUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&h=1400&q=85",
    mediaType: "image",
    caption: "Reviewing physical layout & design tokens"
  },
  {
    username: "bhavishyagupta",
    mediaUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&h=1400&q=85",
    mediaType: "image",
    caption: "Kinetic particle simulation in WebGL"
  },
  {
    username: "garvitpathak",
    mediaUrl: "https://images.unsplash.com/photo-1512486130939-2c4f79935e4f?auto=format&fit=crop&w=800&h=1400&q=85",
    mediaType: "image",
    caption: "New font pairings in the studio"
  },
  {
    username: "vipulagarwal",
    mediaUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&h=1400&q=85",
    mediaType: "image",
    caption: "Camera sensor latency benchmark"
  },
  {
    username: "mayankkhandelwal",
    mediaUrl: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=800&h=1400&q=85",
    mediaType: "image",
    caption: "City dusk from the roof"
  }
];

let isSeeding = false;

const seedDatabase = async () => {
  if (isSeeding) return;
  isSeeding = true;

  try {
    // 1. Remove all legacy test/synthetic accounts from database
    const testUsers = await User.find({
      $or: [
        { username: { $regex: /^integration_test_|^vuser_|^user_\d+|^test_user|^testuser/i } },
        { email: { $regex: /^verify_test_|^testuser|^integration_test/i } }
      ]
    });

    if (testUsers.length > 0) {
      const testUserIds = testUsers.map(u => u._id);
      await Post.deleteMany({ userId: { $in: testUserIds } });
      await Story.deleteMany({ userId: { $in: testUserIds } });
      await User.deleteMany({ _id: { $in: testUserIds } });
      await User.updateMany(
        {},
        {
          $pull: {
            followers: { $in: testUserIds },
            following: { $in: testUserIds }
          }
        }
      );
    }

    // 2. Upsert official users
    const defaultHashedPassword = hashPassword("Password123!");
    const userMap = new Map();

    for (const userData of SEED_USERS) {
      let user = await User.findOne({ usernameLower: userData.username.toLowerCase() });
      if (!user) {
        user = await User.create({
          ...userData,
          usernameLower: userData.username.toLowerCase(),
          displayNameLower: (userData.displayName || userData.username).toLowerCase(),
          password: defaultHashedPassword,
          isEmailVerified: true,
          accountStatus: "active"
        });
      } else {
        // Update profile fields without overwriting password
        user.displayName = userData.displayName;
        user.displayNameLower = userData.displayName.toLowerCase();
        user.profession = userData.profession;
        user.bio = userData.bio;
        user.location = userData.location;
        user.website = userData.website;
        user.profilePicture = userData.profilePicture;
        user.coverImage = userData.coverImage;
        user.isVerified = userData.isVerified;
        user.isPrivate = userData.isPrivate;
        user.role = userData.role;
        user.accountStatus = "active";
        await user.save();
      }
      userMap.set(userData.username, user);
    }

    // 3. Set up mutual follow relationships between official users
    const allUsers = Array.from(userMap.values());
    for (const user of allUsers) {
      const others = allUsers.filter(u => u._id.toString() !== user._id.toString());
      // Follow all other official users to create an active network
      user.following = others.map(u => u._id);
      user.followers = others.map(u => u._id);
      await user.save();
    }

    // 4. Seed official posts (idempotent: check if posts exist for each user)
    for (const postData of SEED_POSTS) {
      const author = userMap.get(postData.username);
      if (!author) continue;

      const existing = await Post.findOne({
        userId: author._id,
        caption: postData.caption
      });

      if (!existing) {
        // Create post
        const otherUserIds = allUsers
          .filter(u => u._id.toString() !== author._id.toString())
          .map(u => u._id);

        const sampleLikes = otherUserIds.slice(0, Math.floor(Math.random() * 4) + 3);
        const sampleComments = [
          {
            userId: otherUserIds[0],
            text: "Incredible shot and color tone! ✨"
          },
          {
            userId: otherUserIds[1],
            text: "The details here are super clean."
          }
        ];

        await Post.create({
          userId: author._id,
          caption: postData.caption,
          media: postData.media,
          hashtags: postData.hashtags,
          visibility: postData.visibility,
          status: "published",
          likes: sampleLikes,
          likeCount: sampleLikes.length,
          comments: sampleComments,
          commentCount: sampleComments.length
        });
      }
    }

    // 5. Seed active 24-hour stories (idempotent: check if active story exists)
    const now = new Date();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    for (const storyData of SEED_STORIES) {
      const author = userMap.get(storyData.username);
      if (!author) continue;

      const existing = await Story.findOne({
        userId: author._id,
        caption: storyData.caption,
        expiresAt: { $gt: now }
      });

      if (!existing) {
        await Story.create({
          userId: author._id,
          mediaUrl: storyData.mediaUrl,
          mediaType: storyData.mediaType,
          caption: storyData.caption,
          expiresAt,
          seenBy: []
        });
      }
    }

    // 6. Update Hashtag Collection
    const allTags = ["photography", "design", "creativecoding", "futuremedia", "art", "tech", "webgl", "architecture", "ui", "streetphoto"];
    for (const tag of allTags) {
      const count = await Post.countDocuments({ hashtags: tag });
      await Hashtag.updateOne(
        { tag },
        {
          $set: {
            tag,
            postCount: count > 0 ? count : 4,
            trendScore: (count > 0 ? count : 4) * 10,
            lastUsed: new Date()
          }
        },
        { upsert: true }
      );
    }

    console.log(`[SEED] FutureMedia database seeded successfully with ${allUsers.length} official creators.`);
  } catch (err) {
    console.error("[SEED] Error seeding database:", err.message);
  } finally {
    isSeeding = false;
  }
};

module.exports = seedDatabase;
