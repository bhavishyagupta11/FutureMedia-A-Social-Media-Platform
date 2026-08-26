/**
 * FutureMedia Official Curated Media Assets & Creator Data
 * 20 Verified Production Assets (Images & Final 6 Creator Identities)
 */

import creativeCodingHero from "../assets/images/creativeCoding_hero.jpg";
import streetPhotoHero from "../assets/images/streetPhoto_hero.jpg";
import architectureHero from "../assets/images/architecture_hero.jpg";
import abstractShapesBento from "../assets/images/abstractShapes_bento.jpg";
import architectureStackedBento from "../assets/images/architecture_stacked_bento.png";
import postComposerCover from "../assets/images/post_composer_cover.jpg";
import cameraLensSub from "../assets/images/camera_lens_sub.jpg";
import storySnehilMoment from "../assets/images/story_snehil_moment.jpg";
import storySahilMoment from "../assets/images/story_sahil_moment.jpg";
import storyGarvitMoment from "../assets/images/story_garvit_moment.jpg";
import urbanSunsetBanner from "../assets/images/urban_sunset_banner.png";
import galleryKineticSeries from "../assets/images/gallery_kinetic_series.jpg";
import galleryDuskWaves from "../assets/images/gallery_dusk_waves.jpg";
import galleryMicroShader from "../assets/images/gallery_micro_shader.png";

import avatarSnehil from "../assets/images/avatar_snehil_khokhar.jpg";
import avatarBhavishya from "../assets/images/avatar_bhavishya_gupta.jpg";
import avatarSahil from "../assets/images/avatar_sahil_singh.jpg";
import avatarGarvit from "../assets/images/avatar_garvit_pathak.jpg";
import avatarPraneet from "../assets/images/avatar_praneet_jha.jpg";
import avatarDivyam from "../assets/images/avatar_divyam_khandelwal.png";

export const CREATORS = {
  snehil: {
    name: "Snehil Khokhar",
    username: "snehilkhokhar",
    handle: "@snehilkhokhar",
    avatar: avatarSnehil,
    role: "Street Photographer & Visual Artist",
    bio: "Spent the evening experimenting with street photography and natural light. 35mm prime.",
    followers: "8.4k",
    following: "312",
    postsCount: "64",
    verified: true,
  },
  bhavishya: {
    name: "Bhavishya Gupta",
    username: "bhavishyagupta",
    handle: "@bhavishyagupta",
    avatar: avatarBhavishya,
    role: "Developer • Creator • Dreamer",
    bio: "Building FutureMedia — where creativity meets code and community. Exploring new ways to create products that feel human.",
    followers: "14.8k",
    following: "428",
    postsCount: "92",
    verified: true,
  },
  sahil: {
    name: "Sahil Singh",
    username: "sahilsingh",
    handle: "@sahilsingh",
    avatar: avatarSahil,
    role: "Product Designer & Technologist",
    bio: "Exploring spatial UI, motion curves, and fluid design systems.",
    followers: "11.2k",
    following: "389",
    postsCount: "78",
    verified: true,
  },
  garvit: {
    name: "Garvit Pathak",
    username: "garvitpathak",
    handle: "@garvitpathak",
    avatar: avatarGarvit,
    role: "Visual Artist & Brand Designer",
    bio: "Code. Create. Collaborate. That's the FutureMedia way.",
    followers: "9.6k",
    following: "275",
    postsCount: "51",
    verified: true,
  },
  praneet: {
    name: "Praneet Jha",
    username: "praneetjha",
    handle: "@praneetjha",
    avatar: avatarPraneet,
    role: "Community Lead & Software Architect",
    bio: "Real-time systems, WebSockets, and building vibrant creative communities.",
    followers: "12.1k",
    following: "402",
    postsCount: "83",
    verified: true,
  },
  divyam: {
    name: "Divyam Khandelwal",
    username: "divyamkhandelwal",
    handle: "@divyamkhandelwal",
    avatar: avatarDivyam,
    role: "Creative Technologist & UI Specialist",
    bio: "FutureMedia is more than a platform — it's a community that inspires, supports, and builds together.",
    followers: "7.9k",
    following: "290",
    postsCount: "47",
    verified: true,
  },
};

export const POST_MEDIA = {
  creativeCoding: creativeCodingHero,
  streetPhoto: streetPhotoHero,
  architecture: architectureHero,
  abstractShapes: abstractShapesBento,
  architectureStacked: architectureStackedBento,
  composerCover: postComposerCover,
  cameraLens: cameraLensSub,
  storySnehil: storySnehilMoment,
  designWorkspace: storySahilMoment,
  storyGarvit: storyGarvitMoment,
  urbanSunset: urbanSunsetBanner,
  galleryPhoto1: galleryKineticSeries,
  galleryPhoto2: galleryDuskWaves,
  galleryPhoto3: galleryMicroShader,
};
