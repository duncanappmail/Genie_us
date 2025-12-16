

import type { Template } from '../types';

export const TEMPLATE_LIBRARY: Template[] = [
  // --- STUDIO CATEGORY (Commercial/High-End) ---
  {
    id: 'studio-01',
    title: 'Clean Studio Backdrop',
    description: 'A classic, professional product shot on a clean, seamless background.',
    category: 'Studio',
    previewImageUrl: 'https://storage.googleapis.com/genius-images-ny/images/ChatGPT%20Image%20May%2023%2C%202025%2C%2002_16_29%20PM.png',
    promptTemplate: "Type: Professional Commercial Photography. Subject: {{PRODUCT_NAME}}. Environment: Seamless, solid light grey cyclorama background. Lighting: Softbox key light from left, hard rim light from right to separate subject from background. Tech Specs: Shot on Hasselblad X2D, 100mm macro lens, f/11 aperture for full sharpness. Style: Minimalist, elegant, {{BRAND_VIBE}}, 8k resolution, highly detailed texture.",
    imageGenerationPrompt: "Type: Commercial Product Photography. Subject: Sleek matte black stainless steel water bottle. Environment: Seamless light grey studio background (#f0f0f0). Lighting: Soft, diffuse studio lighting with linear gradients reflection. Tech Specs: 8k resolution, raw photo, sharp focus, highly detailed metal texture. Style: Minimalist, e-commerce standard.",
    type: 'image',
    animationPrompt: 'Slow, smooth cinematic pan around the product. The lighting reflections travel across the surface.',
    recommendedModel: 'imagen-4.0-generate-001'
  },
  {
    id: 'studio-02',
    title: 'Geometric Pedestals',
    description: 'Showcase your product on modern geometric shapes for a bold, contemporary look.',
    category: 'Studio',
    previewImageUrl: 'https://storage.googleapis.com/genius-images-ny/images/ChatGPT%20Image%20May%2023%2C%202025%2C%2012_48_45%20PM.png',
    promptTemplate: "Type: High-End Product Staging. Subject: {{PRODUCT_NAME}} balanced on overlapping pastel geometric pedestals. Lighting: Hard directional sunlight casting crisp, defined shadows (gobos). Color Palette: Pastel pinks, mint greens, and cream. Aesthetic: Modern Art Deco, {{BRAND_VIBE}}, Architectural. Tech Specs: Octane Render style, ray-tracing, 8k, hyper-realistic.",
    imageGenerationPrompt: "Type: Luxury Product Advertisement. Subject: Silver luxury watch. Set Design: Mint green and pastel pink geometric cylinders and cubes. Lighting: Hard simulated sunlight casting long, sharp shadows. Aesthetic: Modern, architectural, clean. Tech Specs: 4k, photorealistic, physically based rendering (PBR).",
    type: 'image',
    animationPrompt: 'The geometric shapes gently float and bob in place (zero gravity effect) while the product remains stable.',
    recommendedModel: 'imagen-4.0-generate-001'
  },

  // --- LIFESTYLE CATEGORY (Editorial/Realism) ---
  {
    id: 'lifestyle-01',
    title: 'Cozy Morning Coffee',
    description: 'Place your product in a warm, inviting morning scene.',
    category: 'Lifestyle',
    previewImageUrl: 'https://placehold.co/800x800/E2E8F0/31343C?text=Morning+Coffee',
    promptTemplate: "Type: Editorial Lifestyle Photography. Subject: {{PRODUCT_NAME}} placed naturally on a rustic oak coffee table. Props: Steaming ceramic mug, linen napkin, reading glasses. Lighting: Dappled natural sunlight streaming through a window (gobo shadow effect). Atmosphere: {{BRAND_VIBE}}, slow living, warm. Tech Specs: Shot on 35mm film, shallow depth of field (f/2.8), focus on product, authentic film grain.",
    imageGenerationPrompt: "Type: Lifestyle Photography. Subject: Silver noise-cancelling headphones. Setting: Rustic oak coffee table. Props: Steaming white ceramic mug, open book, reading glasses. Lighting: Warm morning sunlight filtering through blinds, casting striped shadows. Tech Specs: 35mm film aesthetic, Kodak Portra 400, f/2.0 aperture, soft bokeh background.",
    type: 'image',
    animationPrompt: 'Steam rising gently from the coffee mug, dust motes dancing in the shafts of sunlight.',
    recommendedModel: 'gemini-3-pro-image-preview'
  },
  {
    id: 'lifestyle-02',
    title: 'On the Go',
    description: 'Feature your product in a dynamic, urban setting.',
    category: 'Lifestyle',
    previewImageUrl: 'https://placehold.co/800x800/E2E8F0/31343C?text=Urban+Setting',
    promptTemplate: "Type: Street Style Photography. Subject: {{PRODUCT_NAME}} in a bustling urban environment. Action: Worn or held by a stylish model (cropped to focus on product). Background: City street with motion-blurred cars and pedestrians. Lighting: Natural overcast city light. Vibe: {{TARGET_AUDIENCE}}, energetic, modern. Tech Specs: Shutter speed 1/60s for background motion blur, subject sharp.",
    imageGenerationPrompt: "Type: Urban Lifestyle Shot. Subject: Stylish canvas backpack. Context: Worn by a person walking away from camera in a busy New York street. Background: Yellow taxis and pedestrians with motion blur. Lighting: Soft overcast daylight. Tech Specs: Cinematic composition, low angle, high contrast, sharp focus on fabric texture.",
    type: 'image',
    animationPrompt: 'Timelapse effect of the city background rushing by while the product stays in sharp focus.',
    recommendedModel: 'imagen-4.0-generate-001'
  },

  // --- SEASONAL CATEGORY (Thematic) ---
  {
    id: 'seasonal-01',
    title: 'Spring Bloom',
    description: 'Set your product among fresh spring flowers and soft light.',
    category: 'Seasonal',
    previewImageUrl: 'https://placehold.co/800x800/E2E8F0/31343C?text=Spring+Bloom',
    promptTemplate: "Type: Botanical Product Photography. Subject: {{PRODUCT_NAME}}. Surroundings: Lush arrangement of fresh pink peonies and cherry blossoms. Surface: White marble. Lighting: Bright, airy, high-key lighting. Vibe: {{BRAND_VIBE}}, fresh, organic. Tech Specs: Macro lens, water droplets on flowers (dew), 8k resolution.",
    imageGenerationPrompt: "Type: Beauty Product Photography. Subject: Glass perfume bottle. Surroundings: Exploded floral arrangement of pink peonies and cherry blossoms. Lighting: Bright, airy, backlit by soft window light. Details: Dew drops on petals. Style: Fresh, organic, high-end. 8k resolution.",
    activeMonths: [2, 3, 4], // March, April, May
    type: 'image',
    animationPrompt: 'Flower petals gently falling in slow motion around the product.',
    recommendedModel: 'gemini-2.5-flash-image'
  },
  {
    id: 'seasonal-02',
    title: 'Summer Beach Day',
    description: 'A bright, sunny beach scene to give your product a vacation vibe.',
    category: 'Seasonal',
    previewImageUrl: 'https://placehold.co/800x800/E2E8F0/31343C?text=Beach+Day',
    promptTemplate: "Type: Summer Campaign Photography. Subject: {{PRODUCT_NAME}} nestled in fine white sand. Background: Turquoise ocean waves breaking in distance, clear blue sky. Lighting: Hard, direct sunlight (Golden Hour), high contrast. Vibe: {{BRAND_VIBE}}, refreshing, vacation mode. Tech Specs: Polarized lens filter, vibrant colors.",
    imageGenerationPrompt: "Type: Beverage Advertising. Subject: Cold aluminum soda can with condensation droplets. Setting: Buried slightly in white sand on a tropical beach. Background: Out-of-focus turquoise ocean waves. Lighting: Bright, high-contrast tropical sunlight. Tech Specs: Hyper-realistic, wet texture, vibrant blue and gold colors.",
    activeMonths: [5, 6, 7], // June, July, August
    type: 'image',
    animationPrompt: 'Gentle ocean waves rolling in the background, condensation dripping down the product.',
    recommendedModel: 'imagen-4.0-generate-001'
  },
  {
    id: 'seasonal-03',
    title: 'Autumn Harvest',
    description: 'Nestle your product among cozy autumn elements like pumpkins and leaves.',
    category: 'Seasonal',
    previewImageUrl: 'https://storage.googleapis.com/genius-images-ny/images/generated_image_0.png',
    promptTemplate: "Type: Flat Lay Photography. Subject: {{PRODUCT_NAME}}. Arrangement: Surrounded by mini white pumpkins, dried maple leaves, cinnamon sticks, and a beige knit sweater texture. Lighting: Warm, soft, directional window light. Color Palette: Burnt orange, brown, cream. Vibe: {{BRAND_VIBE}}, cozy, hygge. Tech Specs: Top-down view, sharp focus corner-to-corner.",
    imageGenerationPrompt: "Type: Autumn Flat Lay. Subject: Amber glass skincare bottle. Props: Mini pumpkins, dried orange slices, red maple leaves, chunky knit beige blanket. Lighting: Warm golden hour light casting long shadows. Texture: High detail on the knit fabric and organic elements. Style: Cozy, rustic, Instagram-ready.",
    activeMonths: [8, 9, 10], // September, October, November
    type: 'image',
    animationPrompt: 'A subtle wind blows, causing the autumn leaves to rustle gently.',
    recommendedModel: 'gemini-3-pro-image-preview'
  },
  {
    id: 'seasonal-04',
    title: 'Winter Wonderland',
    description: 'A magical winter scene perfect for holiday campaigns.',
    category: 'Seasonal',
    previewImageUrl: 'https://placehold.co/800x800/E2E8F0/31343C?text=Winter',
    promptTemplate: "Type: Holiday Campaign Photography. Subject: {{PRODUCT_NAME}} resting on pristine, powdery snow. Background: Dark winter forest with soft-focus warm fairy lights (Bokeh). Lighting: Cool blue ambient light (moonlight) mixed with warm candlelight. Vibe: {{BRAND_VIBE}}, magical, enchanting. Tech Specs: Macro contrast, sparkling snow texture.",
    imageGenerationPrompt: "Type: Luxury Product Shot. Subject: Premium candle in glass jar. Setting: Bed of fresh white snow. Background: Deep winter forest with glowing warm string lights (bokeh). Lighting: Magical mix of cool moonlight and warm glow. Texture: Sparkling ice crystals and snow. Style: Enchanting, premium.",
    activeMonths: [11, 0, 1], // December, January, February
    type: 'image',
    animationPrompt: 'Soft, fluffy snow falling gently in the foreground and background.',
    recommendedModel: 'imagen-4.0-generate-001'
  },

  // --- HOLIDAYS & EVENTS ---
  {
    id: 'upcoming-01',
    title: 'Valentine\'s Romance',
    description: 'A romantic, elegant setting with roses and soft lighting.',
    category: 'Holidays & Events',
    previewImageUrl: 'https://placehold.co/800x800/E2E8F0/31343C?text=Valentine%27s',
    promptTemplate: "Type: Romantic Product Styling. Subject: {{PRODUCT_NAME}} placed on draped red silk satin. Props: Scattered red rose petals, luxury gift box. Lighting: Low-key, moody, candlelight flickering in background. Vibe: Passionate, {{BRAND_VIBE}}, luxurious. Tech Specs: Rich colors, high contrast, soft focus background.",
    imageGenerationPrompt: "Type: Perfume Ad. Subject: Crystal perfume bottle. Surface: Red silk drapes. Props: Fresh red rose petals. Lighting: Moody, warm candlelight. Style: Luxurious, intimate, romantic. Tech Specs: 85mm lens, f/1.8 aperture.",
    activeMonths: [1], // February
    type: 'image',
    animationPrompt: 'Candle flames flickering and soft shadows dancing on the silk.',
    recommendedModel: 'imagen-4.0-generate-001'
  },
   {
    id: 'upcoming-02',
    title: 'Mother\'s Day Elegance',
    description: 'A bright, clean, and elegant scene with fresh flowers.',
    category: 'Holidays & Events',
    previewImageUrl: 'https://placehold.co/800x800/E2E8F0/31343C?text=Mother%27s+Day',
    promptTemplate: "Type: Elegant Flat Lay. Subject: {{PRODUCT_NAME}}. Props: Bouquet of pink peonies, 'Thank You' calligraphy card, silk ribbon. Surface: White Carrara marble. Lighting: Soft, diffused daylight (cloudy day). Vibe: Gentle, appreciative, {{BRAND_VIBE}}. Tech Specs: Soft shadows, pastel color palette.",
    imageGenerationPrompt: "Type: Gift Guide Photography. Subject: Box of luxury chocolates. Props: Pink peonies, silk ribbon, handwritten card. Surface: White marble. Lighting: Soft, even, shadowless natural light. Style: Clean, feminine, high-end.",
    activeMonths: [4], // May
    type: 'image',
    animationPrompt: 'Sunlight slowly shifting across the scene, revealing texture in the marble.',
    recommendedModel: 'gemini-2.5-flash-image'
  },
  {
    id: 'upcoming-03',
    title: 'Spooky Halloween',
    description: 'A fun and spooky setup with a dark, moody atmosphere.',
    category: 'Holidays & Events',
    previewImageUrl: 'https://placehold.co/800x800/E2E8F0/31343C?text=Halloween',
    promptTemplate: "Type: Thematic Product Photography. Subject: {{PRODUCT_NAME}}. Setting: Dark rustic wood table. Props: Theatrical dry ice fog, small bats, cobwebs, jack-o'-lantern. Lighting: Dark moody atmosphere with strong orange rim light (gel lighting). Vibe: Spooky, fun, {{BRAND_VIBE}}. Tech Specs: Low key, dramatic shadows.",
    imageGenerationPrompt: "Type: Halloween Campaign. Subject: Black leather boots. Setting: Dark wood surface with creeping dry ice fog. Lighting: Strong orange backlight (pumpkin glow) and cool blue fill. Props: Subtle cobwebs, silhouette of bats. Style: Cinematic, moody, spooky.",
    activeMonths: [9], // October
    type: 'image',
    animationPrompt: 'Low-lying fog swirling slowly around the product base.',
    recommendedModel: 'gemini-3-pro-image-preview'
  },
  {
    id: 'upcoming-04',
    title: 'Holiday Cheer',
    description: 'A festive scene with ornaments, pine, and twinkling lights.',
    category: 'Holidays & Events',
    previewImageUrl: 'https://storage.googleapis.com/genius-images-ny/images/generated_image_0%20%282%29.png',
    promptTemplate: "Type: Christmas Product Photography. Subject: {{PRODUCT_NAME}}. Surroundings: Fresh pine branches, holly berries, gold baubles. Background: Defocused Christmas tree with warm twinkling lights. Lighting: Warm, glowing, festive. Vibe: Joyful, {{BRAND_VIBE}}, gift-ready. Tech Specs: Bokeh effect, rich greens and reds.",
    imageGenerationPrompt: "Type: Holiday Ad. Subject: Luxury leather wallet. Setting: Nestled in pine needles and red berries. Background: Warm, glowing Christmas tree lights (heavy bokeh). Lighting: Warm and inviting. Style: Classic Christmas, premium.",
    activeMonths: [10, 11], // November, December
    type: 'image',
    animationPrompt: 'Twinkling lights in the background fading in and out gently.',
    recommendedModel: 'imagen-4.0-generate-001'
  },

  // --- SURREAL CATEGORY (Creative/Abstract) ---
  {
    id: 'surreal-01',
    title: 'Floating in Air',
    description: 'A gravity-defying, dreamlike presentation of your product.',
    category: 'Surreal',
    previewImageUrl: 'https://placehold.co/800x800/E2E8F0/31343C?text=Surreal',
    promptTemplate: "Type: 3D Motion Graphics Render. Subject: {{PRODUCT_NAME}} floating weightlessly in a pastel void. Surroundings: Fluffy volumetric clouds, floating geometric spheres. Lighting: Dreamy soft-focus gradient lighting (Pink/Blue). Aesthetic: Vaporwave, {{BRAND_VIBE}}, Ethereal. Tech Specs: Octane Render, subsurface scattering, anti-aliased, 8k.",
    imageGenerationPrompt: "Type: 3D Art Direction. Subject: Futuristic sneakers. Environment: Floating in zero gravity amidst soft pink and blue clouds. Lighting: Soft, non-directional ambient occlusion. Style: Dreamy, surreal, pastel, high-tech. Texture: Matte finish.",
    type: 'image',
    animationPrompt: 'The product rotates slowly in zero gravity while clouds drift past.',
    recommendedModel: 'gemini-3-pro-image-preview'
  },
  {
    id: 'surreal-02',
    title: 'Nature Fusion',
    description: 'Merge your product with natural elements for a stunning, organic visual.',
    category: 'Surreal',
    previewImageUrl: 'https://placehold.co/800x800/E2E8F0/31343C?text=Nature+Fusion',
    promptTemplate: "Type: Fantasy Concept Art. Subject: {{PRODUCT_NAME}} overgrown with bioluminescent moss and glowing flowers. Setting: Enchanted forest floor at twilight. Lighting: Magical, glowing particles, shafts of moonlight. Vibe: Organic, {{BRAND_VIBE}}, mystical. Tech Specs: Macro details, hyper-realistic textures.",
    imageGenerationPrompt: "Type: Surreal Nature Photography. Subject: Glass skincare bottle. Details: Vines and glowing blue mushrooms growing around the bottle base. Setting: Dark mossy forest floor. Lighting: Bioluminescent glow from plants. Style: Magical, organic, fantasy.",
    type: 'image',
    animationPrompt: 'Bioluminescent plants pulsing gently with light.',
    recommendedModel: 'imagen-4.0-generate-001'
  },

  // --- VISUAL EFFECTS CATEGORY ---
  {
    id: 'vfx-02',
    title: 'The Outfit Jump',
    description: 'A viral "Jump Cut" transition. One jump, a whole new look.',
    category: 'Visual Effects',
    previewImageUrl: 'https://placehold.co/800x800/3B82F6/FFFFFF?text=The+Jump',
    promptTemplate: "This is a placeholder. The actual prompt is constructed dynamically by the builder UI.",
    imageGenerationPrompt: "Medium: Social Media Video. Subject: A person jumping in the air. Mid-air, their outfit changes from casual to formal. Style: Viral transition.",
    type: 'video',
    recommendedModel: 'veo-3.1-generate-preview',
    customUI: 'transition-builder'
  },
  {
    id: 'vfx-03',
    title: 'The Miniature World',
    description: 'Turn your product into a tiny toy in a macro world using tilt-shift effects.',
    category: 'Visual Effects',
    previewImageUrl: 'https://placehold.co/800x800/F59E0B/FFFFFF?text=Miniature',
    promptTemplate: "Type: Tilt-Shift Photography. Subject: {{PRODUCT_NAME}} placed in a miniature model city or garden. Effect: Heavy blur on foreground and background (Tilt-shift) making the product look like a toy. Lighting: Warm, golden hour sun. Vibe: Cute, detailed, playful. Tech Specs: Macro lens, shallow depth of field.",
    imageGenerationPrompt: "Type: Tilt-Shift. Subject: Sneaker placed on a miniature street set. Effect: Strong tilt-shift blur making it look like a toy. Lighting: Warm sunlight. Style: Playful, detailed, macro.",
    type: 'image',
    recommendedModel: 'imagen-4.0-generate-001'
  },
  {
    id: 'vfx-04',
    title: 'Zero Gravity',
    description: 'A high-energy "Bullet Time" effect. Jump, freeze, spin, and land.',
    category: 'Visual Effects',
    previewImageUrl: 'https://placehold.co/800x800/E2E8F0/31343C?text=Zero+Gravity',
    promptTemplate: "Format: Cinematic Bullet Time Video. Subject: {{PRODUCT_NAME}} wearing {{PRODUCT_DESCRIPTION}}. Action: The subject performs a powerful vertical jump. At the highest point, they freeze in mid-air. The camera performs a rapid 360-degree orbit around them. Then time resumes and they land. Setting: {{PROMPT}}. Lighting: Dynamic, high contrast.",
    imageGenerationPrompt: "Medium: Cinematic Video. Subject: A dancer jumping in mid-air. Effect: The subject is frozen in time while the camera pans around them (Matrix style). Setting: Neon-lit urban rooftop at night. Lighting: Rim lighting, dramatic shadows.",
    type: 'video',
    recommendedModel: 'veo-3.1-generate-preview',
    customUI: 'bullet-time'
  },
  {
    id: 'vfx-05',
    title: 'Sketch to Reality',
    description: 'Watch your product evolve from a technical sketch to a photorealistic object.',
    category: 'Visual Effects',
    previewImageUrl: 'https://placehold.co/800x800/2B2B2B/FFFFFF?text=Sketch+to+Reality',
    promptTemplate: "Format: 9:16 Social Media Video. Visual Effect: Starts as a rough pencil sketch of {{PRODUCT_NAME}} on paper. The sketch rapidly fills with color and texture, transforming into a real, 3D photorealistic product. Motion: Camera slowly orbits as the transformation happens. Style: Technical to Luxury, blueprint reveal.",
    imageGenerationPrompt: "Medium: Split screen art. Left side: Pencil sketch of a sneaker. Right side: Photorealistic render of the same sneaker. Style: Transition, blueprint, design process.",
    type: 'video',
    recommendedModel: 'veo-3.1-generate-preview'
  },
  {
    id: 'vfx-01',
    title: 'The Giant',
    description: 'Stop the scroll with an oversized version of your product in a real-world city scene.',
    category: 'Visual Effects',
    previewImageUrl: 'https://placehold.co/800x800/91EB23/050C26?text=The+Giant',
    promptTemplate: "Type: Surreal Marketing Campaign. Subject: Giant, oversized {{PRODUCT_NAME}} placed in the middle of a busy city street (Times Square style). Scale: The product is 2 stories tall, towering over pedestrians and cars. Lighting: Realistic city daylight, hard shadows matching the scale. Vibe: Viral, surreal, eye-catching. Tech Specs: Photorealistic, 8k, cinematic composition, wide angle lens.",
    imageGenerationPrompt: "Type: Surreal Campaign. Subject: Giant red lipstick tube standing upright in the middle of a busy New York interaction. Scale: 20 feet tall. Surroundings: Yellow taxis, pedestrians looking up in awe. Lighting: Bright sunny day with sharp shadows. Style: Hyper-realistic, viral marketing stunt.",
    type: 'image',
    recommendedModel: 'gemini-3-pro-image-preview'
  },

  // --- UGC VIDEO TEMPLATES (Authentic/Social) ---
  {
    id: 'ugc-01',
    title: 'Kitchen Review',
    description: 'A friendly face in a bright, modern kitchen. Perfect for food or home appliances.',
    category: 'UGC',
    previewImageUrl: 'https://storage.googleapis.com/genius-images-ny/images/Screenshot%202025-11-08%20at%2010.56.09%E2%80%AFAM.png',
    promptTemplate: "Format: 9:16 UGC. Scene: Bright modern kitchen. Lighting: High-key, natural window light + ring light fill. Camera: iPhone 15 Pro, handheld selfie mode. Subject: {{AVATAR_DESCRIPTION}}. Action: Standing at counter, gesturing to {{PRODUCT_NAME}}. Style: Authentic, energetic.",
    imageGenerationPrompt: "Medium: TikTok Screenshot. Subject: Friendly female creator (20s) in a soft beige knit sweater. Action: Holding a product close to lens. Setting: Modern white kitchen with marble countertops and blurred stainless steel appliances. Lighting: Bright, high-key natural morning light. Style: Authentic UGC, friendly vibe.",
    sceneDescription: 'A bright, modern kitchen with white marble countertops and stainless steel appliances in the background (bokeh). Lighting is High-key: Bright natural morning sunlight coming from a large window (backlight) combined with a soft ring-light fill on the face. Camera: Shot on iPhone 15 Pro, Front-Facing Selfie Camera, Handheld with slight natural sway to feel authentic.',
    defaultAvatarDescription: "A friendly female creator (early 30s), wearing a comfortable, stylish beige knit sweater. She has natural makeup and hair tied back loosely. Expression is warm, enthusiastic, and trustworthy.",
    ugcAction: 'Standing at the counter, smiling warmly at the camera, occasionally gesturing towards the countertop.',
    type: 'video',
    recommendedModel: 'veo-3.1-generate-preview'
  },
  {
    id: 'ugc-02',
    title: 'Living Room Chat',
    description: 'A relaxed, cozy vibe in a comfortable living room setting.',
    category: 'UGC',
    previewImageUrl: 'https://storage.googleapis.com/genius-images-ny/images/Screenshot%202025-11-08%20at%2010.48.56%E2%80%AFAM.png',
    promptTemplate: "Format: 9:16 Vlog. Scene: Cozy living room, plush sofa, warm lamp. Camera: Smartphone on tripod, shallow depth of field. Subject: {{AVATAR_DESCRIPTION}}. Action: Sitting comfortably, talking to camera like a friend. Style: Relatable, intimate.",
    imageGenerationPrompt: "Medium: YouTube Vlog Frame. Subject: Relaxed male presenter (30s) wearing a grey hoodie. Setting: Cozy living room with plush sofa and warm floor lamp (2700K). Style: Casual, intimate, conversational.",
    sceneDescription: 'A cozy living room environment. Background features a plush sofa with textured pillows, a soft throw blanket, and warm ambient lighting from floor lamps (2700K tungsten temperature). Camera: Shot on Smartphone (Vertical 9:16), Static tripod shot but with simulated auto-focus hunting. Depth of field is shallow (f/2.8) keeping background slightly soft.',
    defaultAvatarDescription: "A relaxed male presenter (late 20s to early 30s), wearing a comfortable grey hoodie or casual t-shirt. Sitting posture is open and engaging, leaning forward slightly. He has a genuine, warm smile.",
    ugcAction: 'Sitting comfortably on the sofa, leaning forward slightly to talk to the camera like a friend, using hand gestures for emphasis.',
    type: 'video',
    recommendedModel: 'veo-3.1-fast-generate-preview'
  },
  {
    id: 'ugc-03',
    title: 'Car Interior',
    description: 'Casual, on-the-go commentary from the passenger seat.',
    category: 'UGC',
    previewImageUrl: 'https://storage.googleapis.com/genius-images-ny/images/Screenshot%202025-11-08%20at%2010.34.57%E2%80%AFAM.png',
    promptTemplate: "Format: 9:16 Selfie. Scene: Interior of parked modern car, day. Lighting: Dynamic natural light, lens flare. Camera: Handheld selfie, slight shake. Subject: {{AVATAR_DESCRIPTION}}. Action: Sitting in driver seat, holding phone. Style: Spontaneous, on-the-go.",
    imageGenerationPrompt: "Medium: Selfie Camera Shot. Subject: Male driver (20s) wearing sunglasses and a denim jacket. Setting: Interior of a parked modern car during the day with sunlight flares. Style: Spontaneous, vlog, cool.",
    sceneDescription: 'Inside a parked modern car during the day. Lighting is dynamic: Natural light coming through the windshield creating dynamic shadows and slight lens flare (sun glint). Visible leather seat texture. Camera: Handheld Selfie Mode (iPhone), slightly high angle (45 degrees), shaky handheld movement typical of a vlog.',
    defaultAvatarDescription: "A cool male driver (20s-30s), wearing a denim jacket over a white t-shirt. Sunglasses perched on his head or dashboard. Expression is spontaneous, excited, and energetic.",
    ugcAction: "Sitting in the driver's seat (stationary), holding the phone camera with one hand, gesturing with the free hand.",
    type: 'video',
    recommendedModel: 'veo-3.1-fast-generate-preview'
  },
  {
    id: 'ugc-04',
    title: 'Gym Session',
    description: 'High energy and motivation in a fitness setting.',
    category: 'UGC',
    previewImageUrl: 'https://storage.googleapis.com/genius-images-ny/images/Screenshot%202025-11-08%20at%2011.04.52%E2%80%AFAM.png',
    promptTemplate: "Format: 9:16 Fitness Video. Scene: Busy gym, blurred equipment background. Lighting: Overhead fluorescent + window light. Camera: Smartphone on low shelf, looking up. Subject: {{AVATAR_DESCRIPTION}}. Action: Post-workout, wiping brow, energetic. Style: Motivational.",
    imageGenerationPrompt: "Medium: Fitness Video. Subject: Female fitness enthusiast in activewear, light sweat sheen. Setting: Busy gym with blurred weights and mirrors. Lighting: Bright, slightly harsh gym lighting mixed with daylight. Style: Energetic, motivational, post-workout glow.",
    sceneDescription: 'A busy gym setting. Background shows blurred weights, mirrors, and gym equipment. Lighting is overhead fluorescent mixed with natural light from windows (high contrast). Camera: Shot on Smartphone, placed on a low shelf or tripod (slightly looking up). Sharp digital video look.',
    defaultAvatarDescription: "A female fitness enthusiast, wearing a matching athletic crop top and leggings. She has a light sheen of sweat (post-workout glow) and her hair is tied back. Expression is energetic, motivated, and breathing heavily but smiling.",
    ugcAction: 'Standing in workout gear, wiping brow, breathing heavily (post-workout), looking energized and motivated.',
    type: 'video',
    recommendedModel: 'veo-3.1-generate-preview'
  },
];