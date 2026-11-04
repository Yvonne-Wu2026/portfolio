/**
 * Case study content, transcribed from the "putting it together" page of the
 * Figma file (Home 31:1041, PawTrainer 38:2012, Watt's the Big Deal 88:718).
 *
 * Body copy is HTML because the design uses inline bold/italic, links and
 * bulleted lists inside the paragraphs.
 */

export interface CardItem {
	title: string;
	bodyHtml: string;
}

export type Block =
	| { type: 'cards'; cards: CardItem[] }
	| { type: 'text'; bodyHtml: string }
	| {
			type: 'image';
			src?: string;
			alt?: string;
			ratio?: string;
			caption?: string;
			captionAlign?: 'left' | 'center';
			srcWebm?: string;
			href?: string;
			maxWidth?: string;
			/** Crop anchor when the ratio is shorter than the image. */
			objectPosition?: string;
	  }
	| { type: 'imageRow'; images: { src?: string; alt?: string; ratio?: string; caption?: string }[]; ratio?: string }
	| { type: 'media'; src?: string; alt?: string; bodyHtml: string; reverse?: boolean }
	| { type: 'flow'; steps: FlowStep[] }
	| { type: 'compare'; before: CompareSide; after: CompareSide };

/** One side of a before → after pair. ratio is width / height as shown (cropped from the top). */
export interface CompareSide {
	src: string;
	alt: string;
	ratio: number;
	label: string;
}

export interface FlowStep {
	/** A small icon tile; ignored when the step has an image. */
	icon?: 'activity' | 'insight' | 'guidance';
	/** A screenshot shown under the copy. Steps in a flow should share one size. */
	image?: { src: string; alt: string; ratio: string };
	/** Small uppercase line above the title. */
	label?: string;
	title: string;
	body: string;
}

export interface Section {
	/** Figma "line sep section" numeral. Omitted for sub-sections. */
	number?: string;
	title: string;
	/** Short line set under the heading. */
	subtitle?: string;
	bodyHtml?: string;
	/** 'section' = 64px heading with rule; 'detail' = 32px heading, no rule. */
	variant?: 'section' | 'detail';
	/** Pulls the following sub-sections up; for short intro sections. */
	tightBottom?: boolean;
	blocks?: Block[];
}

export interface CaseStudy {
	slug: string;
	title: string;
	summary: string;
	cover?: string;
	coverAlt?: string;
	/** Crop anchor for the home-page thumbnail. */
	coverPosition?: string;
	hero?: { src?: string; alt?: string; ratio?: string; maxWidth?: string };
	cta?: { label: string; href?: string };
	meta: { role: string; type: string; client: string; tools: string };
	sections: Section[];
}

/* ------------------------------------------------------------------ */
/* PawTrainer — Figma 38:2012                                          */
/* ------------------------------------------------------------------ */

const pawtrainer: CaseStudy = {
	slug: 'pawtrainer',
	title: 'PawTrainer',
	summary: 'Turning dog data into personalized training guidance with conversational AI',
	cover: '/images/pawtrainer-cover.jpg',
	coverAlt: 'PawTrainer app shown on a phone beside a computer mouse',
	hero: {
		src: '/images/pawtrainer-hero.webp',
		alt: 'Three PawTrainer screens: the welcome screen with a puppy photo, the "Tell us '
			+ 'about your pup" form, and the training schedule setup, standing on a desk '
			+ 'among old books, a paw-print mug and an open sketchbook.',
		ratio: '1671 / 941',
		maxWidth: '1040px',
	},
	cta: { label: 'Explore Prototype', href: 'https://dun-paste-37159254.figma.site' },
	meta: {
		role: 'AI integration and conversational experience design',
		type: 'Mobile App Prototype',
		client: 'Student team project',
		tools: 'Figma Make, Supabase, Google AI Studio, Procreate',
	},
	sections: [
		{
			number: '01',
			title: 'Overview',
			bodyHtml: `
				<p>PawTrainer is a mobile app concept exploring how smart-collar data and conversational AI could help dog owners understand their dogs’ behavior and training needs. Its interactive prototype pairs a dynamic dashboard with Scout, an AI training companion that uses simulated metrics to generate contextual responses.</p>
				<p>I led the design and AI integration of Scout, connecting Gemini API responses with dashboard data to explore how conversational AI could transform metrics into meaningful, actionable guidance. I also used feedback from user interviews, surveys, and peer critiques to inform design iterations.</p>
			`,
		},
		{
			number: '02',
			title: 'Problem',
			subtitle: 'Dog owners have access to information, but understanding what to do with it is another challenge.',
			bodyHtml: `
				<p>For new dog owners, understanding behavior can be overwhelming. Barking, pulling, or changes in activity may have multiple explanations, and owners may not know how to respond.</p>
				<p>Professional trainers provide valuable support, but guidance is not always available when behavioral challenges arise. Owners must also remember training techniques, monitor progress, and maintain consistency between sessions.</p>
				<p>Our research identified three areas of opportunity:</p>
			`,
			blocks: [
				{
					type: 'cards',
					cards: [
						{
							title: 'Lack of objective metrics',
							bodyHtml: '<p>Owners may struggle to identify behavioral patterns or measure progress.</p>',
						},
						{
							title: 'Limited ongoing guidance',
							bodyHtml: '<p>Questions and challenges can arise outside scheduled training sessions.</p>',
						},
						{
							title: 'High cognitive load',
							bodyHtml:
								'<p>Remembering techniques, tracking progress, and choosing what to practice require sustained effort.</p>',
						},
					],
				},
			],
		},
		{
			variant: 'detail',
			title: 'The Opportunity',
			bodyHtml: `
				<p>How can we make dog training more accessible, convenient and effective while helping owners translate activity data into meaningful training guidance?</p>
				<p>PawTrainer explores this opportunity by combining a smart-collar concept with a Gemini integrated mobile experience. A dynamic activity dashboard presents key metrics, while Scout helps connect those metrics to conversational, behavior-focused guidance.</p>
			`,
			blocks: [
				{
					type: 'flow',
					steps: [
						{ icon: 'activity', title: 'Activity data', body: 'What is my dog doing?' },
						{
							icon: 'insight',
							title: 'Interpretation',
							body: 'What might this mean for my dog’s behavior or training?',
						},
						{
							icon: 'guidance',
							title: 'Practical guidance',
							body: 'How can I respond or support my dog?',
						},
					],
				},
			],
		},
		{
			number: '03',
			title: 'Research and Usability Testing',
			bodyHtml: `
				<p>Our team explored how AI and sensor data could support dog training while keeping the experience approachable for new dog owners.</p>
				<p>We researched:</p>
				<ul>
					<li>AI &amp; Machine Learning application for behavioral analysis</li>
					<li>Human-canine training interactions</li>
					<li>Ethical considerations surrounding AI-assisted behavioral guidance</li>
				</ul>
				<p>We explored machine learning approaches including:</p>
				<ul>
					<li>Long Short-Term Memory (LSTM) models for time-series sensor analysis</li>
					<li>Kernel Principal Component Analysis (KPCA) for behavioral pattern detection</li>
					<li>Retrieval-Augmented Generation (RAG) for conversational assistance</li>
				</ul>
				<p>Our research helped us understand how raw sensor data could be translated to provide a personalized training experience.</p>
			`,
		},
		{
			variant: 'detail',
			title: 'Usability Testing',
			subtitle: 'Testing whether PawTrainer feels intuitive to use',
			bodyHtml: `
				<p>We ran an in-person usability evaluation to see how easily first-time users could set up PawTrainer, choose a training program, and follow a guided training session.</p>
				<p>The study focused on two questions:</p>
				<ul>
					<li>Can users complete the initial setup and collar-pairing flow without help?</li>
					<li>Can users confidently find and follow a relevant training program?</li>
				</ul>
				<p>We tested an interactive prototype with three participants across two scenarios: getting started with PawTrainer and completing a guided dog-walking program. Participants attempted key tasks, rated their difficulty, and told us where interactions felt confusing or information was missing.</p>
			`,
			blocks: [
				{
					type: 'cards',
					cards: [
						{ title: 'Method', bodyHtml: '<p>Moderated, in-person usability evaluation</p>' },
						{ title: 'Participants', bodyHtml: '<p>3 first-time users</p>' },
						{
							title: 'Data collected',
							bodyHtml:
								'<p>Task completion, difficulty ratings, navigation errors, and qualitative feedback</p>',
						},
					],
				},
				{
					type: 'text',
					bodyHtml:
						'<p>As a small, exploratory study, it was meant to surface usability issues rather than predict how all dog owners would use the product. Three findings stood out.</p>',
				},
			],
		},
		{
			variant: 'detail',
			title: '1. Getting started was easy, but key steps were missing',
			subtitle: 'Setup and account creation',
			bodyHtml: `
				<p>All three participants completed setup and generally found it easy. However, they pointed out missing account-security and consent steps, and one noted that some buttons and dropdowns were too small to use comfortably.</p>
				<p class="callout"><strong>Design opportunity:</strong> Clarify account creation, add terms and conditions, consider asking for notification permissions, and enlarge small interactive elements.</p>
			`,
		},
		{
			variant: 'detail',
			title: '2. Finding the right program wasn’t always intuitive',
			subtitle: 'Program discovery and navigation',
			bodyHtml: `
				<p>All three participants completed program selection, but they were unsure how programs were organized and what “My Programs” meant. Participants also ran into unexpected navigation behavior elsewhere in the training flow.</p>
				<blockquote>
					<p>“The programs listed are confusing and not organized.”</p>
					<cite>— Participant 2</cite>
				</blockquote>
				<p class="callout"><strong>Design opportunity:</strong> Distinguish available programs from selected ones, keep setup preferences consistent with the Programs menu, and fix unexpected navigation behavior.</p>
			`,
		},
		{
			variant: 'detail',
			title: '3. Training sessions needed clearer timing feedback',
			subtitle: 'In-session guidance',
			bodyHtml: `
				<p>Two participants were confused by the timer or by how the session progressed. One wasn’t sure when the session had ended, because the app advanced automatically without a clear completion message.</p>
				<blockquote>
					<p>“Was it cumulative for the whole program, or were you supposed to spend the time on each step?”</p>
					<cite>— Participant 3</cite>
				</blockquote>
				<p class="callout"><strong>Design opportunity:</strong> Explain what the timer measures, signal clearly when a step or session ends, and let users choose when to move on to the next activity.</p>
			`,
		},
		{
			number: '04',
			title: 'Role + Exploration',
			bodyHtml: `
				<p>I led the AI integration and conversational experience design, collaborating with a UX Designer and Project Manager. I focused on designing and implementing <strong>Scout</strong>, PawTrainer's chatbot.</p>
				<p>This was my first time integrating the Gemini API into a project, so there was definitely a huge learning curve! Once my team was satisfied with the current iteration of our app, I integrated Gemini into our Figma Make project. To do this, I:</p>
				<ul>
					<li>Created a free Gemini API key through Google AI Studio</li>
					<li>Configured a Supabase backend</li>
					<li>Connected the frontend experience to the backend</li>
					<li>Secured credentials using Supabase Edge Functions</li>
					<li>Tested and troubleshot API requests</li>
					<li>Evaluated different Gemini models</li>
				</ul>
				<p>To set up the secure Supabase connection, I prompted Figma Make's AI chat directly. Behind the scenes, there was plenty of trial and error: troubleshooting unexpected errors and learning about API rate limits, all while having no coding experience. Ultimately, we selected <strong>gemini-3-flash-preview</strong> based on our use case and added a spending cap to our workspace to help manage API usage during development.</p>
			`,
		},
		{
			variant: 'detail',
			title: 'Initial Designs — Low Fidelity',
			bodyHtml: `
				<p>We started with individual sketches and wireframes. These sketches on paper turned into interactive prototypes fully vibe coded using Figma Make. Our initial prompt defined the visual direction, including:</p>
				<ul>
					<li>Color palette</li>
					<li>Typography</li>
					<li>Visual style</li>
					<li>Screen structure</li>
					<li>Key interactions</li>
				</ul>
				<p>We continued refining the interface and interactions, bringing us to the current version of PawTrainer.</p>
			`,
			blocks: [
				{
					type: 'imageRow',
					ratio: '4 / 3',
					images: [
						{
							src: '/images/pawtrainer-sketch.jpg',
							alt: 'Paper sketches of eight PawTrainer screens: logo and login, the four '
								+ 'onboarding steps, Daisy\'s dashboard, the AI chatbot and the training '
								+ 'library.',
							ratio: '812 / 614',
						},
						{
							src: '/images/pawtrainer-wireframe.webp',
							alt: 'Greyscale wireframes of the same eight screens, with form fields, '
								+ 'training frequency options, smart collar pairing and the dashboard.',
							ratio: '5692 / 5262',
						},
					],
				},
			],
		},
		{
			number: '05',
			title: 'Features + Iterations',
			bodyHtml: `
				<p>PawTrainer was designed to be a human and canine centered experience. Our goal is not to replace, but <strong>supplement and enhance</strong> traditional (in person) dog training with our features.</p>
				<p>Because the smart collar is still a concept, the prototype’s dashboard metrics change dynamically to simulate collar data, which Scout uses to generate personalized, actionable training guidance. The aim is to help dog owners <strong>understand</strong> their dog's behavior, <strong>reduce</strong> the cognitive load of training, and <strong>see</strong> measurable progress over time.</p>
			`,
			blocks: [
				{
					type: 'text',
					bodyHtml: `
						<aside class="callout callout--panel">
							<p class="callout-label">App Overview</p>
							<p>Designed with new dog parents in mind, PawTrainer explores how smart-collar data and AI-powered guidance could make caring for and training a puppy feel more manageable.</p>
							<p>Users can create a dog profile, explore personalized training programs and daily tips, and track activity metrics through a dashboard. Scout, the AI training companion, helps connect these insights to training guidance, while progress reports, training sessions, and reminders support ongoing practice.</p>
						</aside>
					`,
				},
			],
		},
		{
			variant: 'detail',
			title: 'Connecting Dashboard Data to AI',
			subtitle: 'From activity metrics to conversational guidance',
			bodyHtml: `
				<p>Activity metrics can show dog owners what is happening, but they may not explain what those numbers mean for everyday training. Scout explores how conversational AI could help bridge that gap.</p>
				<p>I contributed to Scout’s conversational UX and AI integration, connecting dashboard metric values to Gemini-generated responses. This allowed the prototype to explore a more contextual interaction in which Scout could respond using the data available in the dashboard, rather than relying on a generic chat experience alone.</p>
			`,
			blocks: [
				{
					type: 'flow',
					steps: [
						{
							label: 'Step 1 · The data',
							title: 'Dashboard metrics',
							body: 'Simulated collar data, like heart rate and stress, appears on Daisy Mae’s dashboard.',
							image: {
								src: '/images/pawtrainer-scout-metrics.webp',
								alt: "Daisy Mae's dashboard: heart rate 136 bpm (normal), activity 73% "
									+ '(active), stress low (relaxed) and sleep 8.2 hours (great).',
								ratio: '389 / 463',
							},
						},
						{
							label: 'Step 2 · The question',
							title: 'The owner asks Scout',
							body: 'In the chat, the owner asks a training question: “How do I stop leash pulling?”',
							image: {
								src: '/images/pawtrainer-scout-question.webp',
								alt: 'The Scout chat: the owner asks "How do I stop leash pulling?" and '
									+ 'Scout shows a typing indicator.',
								ratio: '389 / 463',
							},
						},
						{
							label: 'Step 3 · The response',
							title: 'Scout responds in context',
							body: 'Gemini generates a reply that draws on the dashboard, citing her steady heart rate before suggesting a session.',
							image: {
								src: '/images/pawtrainer-scout-response.webp',
								alt: "Scout's reply: Daisy Mae is calm and focused with a steady 136 bpm "
									+ 'heart rate, so it suggests a 10-minute leash session and explains '
									+ 'how to reward slack on the leash.',
								ratio: '389 / 463',
							},
						},
					],
				},
			],
		},
		{
			variant: 'detail',
			title: 'Meet Scout',
			bodyHtml: `
				<p>Scout, PawTrainer's AI-powered training companion, provides guidance and contextual support when owners need it most. Whether it's a late-night concern about barking or uncertainty about reinforcement timing, Scout serves as an accessible source of coaching and reassurance.</p>
			`,
			blocks: [
				{
					type: 'image',
					src: '/images/pawtrainer-scout-chat.mp4',
					srcWebm: '/images/pawtrainer-scout-chat.webm',
					alt: "Moving from Daisy Mae's dashboard into a chat with Scout, which summarizes "
						+ 'her calm 131 bpm heart rate and low stress and suggests a 12-minute '
						+ '"Leave It" session.',
					ratio: '388 / 844',
					maxWidth: '388px',
					caption:
						'A demo of Scout powered by the Gemini integration: asked to summarize the '
						+ "dog's metrics, Scout recommends a training session to match.",
					captionAlign: 'center',
				},
				{
					type: 'text',
					bodyHtml: `
						<aside class="callout callout--panel callout--media">
							<img
								src="/images/pawtrainer-scout-avatar.webp"
								alt="Scout, the PawTrainer AI training companion: a cartoon puppy with orange ears, a blue spotted collar and a bone-shaped tag."
								loading="lazy"
							/>
							<div>
								<p class="callout-label">Designing Scout</p>
								<p>Scout began as an avatar generated through Figma Make. I wanted to add a more human and personalized touch, so I illustrated Scout in Procreate, referencing photos of our teammate’s beagle.</p>
							</div>
						</aside>
					`,
				},
				{
					type: 'image',
					src: '/images/pawtrainer-scout-screens.webp',
					alt: "Three PawTrainer screens: Scout's chat offering collar-data insights, "
						+ "the Meet Scout introduction, and Daisy Mae's dashboard showing heart "
						+ 'rate, activity, stress and sleep.',
					ratio: '580 / 382',
					maxWidth: '580px',
					caption: "The illustration became Scout's visual identity throughout the app.",
					captionAlign: 'center',
				},
			],
		},
		{
			variant: 'detail',
			title: 'Reducing Cognitive Load',
			bodyHtml: `
				<p>A core design goal was to make training easier to follow for busy pet parents. PawTrainer organizes training into manageable steps so owners don't have to remember every technique or track their progress manually.</p>
			`,
			blocks: [
				{
					type: 'image',
					src: '/images/pawtrainer-session-screens.webp',
					alt: 'Three Loose Leash Walking session screens: the pre-session check with heart '
						+ 'rate and stress, a step timer with a tip, and the completed session summary.',
					ratio: '1360 / 920',
					maxWidth: '1360px',
				},
				{
					type: 'text',
					bodyHtml: `
						<p>Guided Training Sessions include:</p>
						<ul>
							<li>Step-by-step instructions</li>
							<li>Helpful tips</li>
							<li>Flexible controls</li>
							<li>Real-time heart rate information</li>
						</ul>
						<p>Users can pause or skip ahead when needed, giving them more control over the pace of a session. We also added a heart-rate indicator to the training experience after receiving feedback from users.</p>
					`,
				},
				{
					type: 'image',
					src: '/images/pawtrainer-training-session.mp4',
					srcWebm: '/images/pawtrainer-training-session.webm',
					alt: 'A training session screen playing through its step-by-step instructions, '
						+ 'with live heart rate shown as the session runs.',
					ratio: '392 / 846',
					maxWidth: '392px',
					caption:
						'A guided session walks owners through each step, with live heart rate shown '
						+ 'as the session runs.',
					captionAlign: 'center',
				},
				{
					type: 'text',
					bodyHtml: `
						<p>PawTrainer supports consistency with:</p>
						<ul>
							<li>Week and month calendar with training reminders</li>
							<li>Weekly progress reports</li>
							<li>Session history and progress summary</li>
						</ul>
						<p>Together, these features reduce the amount of information owners need to remember and help turn training into a more manageable routine.</p>
					`,
				},
				{
					type: 'image',
					src: '/images/pawtrainer-consistency.webp',
					alt: 'Four screens supporting consistency: the month training calendar, the '
						+ 'training log with streak and behaviour trends, and the weekly report with '
						+ "skill progress, goal breakdown and Scout's summary.",
					ratio: '1685 / 994',
					maxWidth: '1685px',
				},
			],
		},
		{
			variant: 'detail',
			title: 'Onboarding + Setup Experience',
			bodyHtml:
				'<p>The next three screens are related to setting up an account and connecting a smart collar.</p>',
			blocks: [
				{
					type: 'text',
					bodyHtml: `
						<p><strong>Account Setup</strong><br />We designed onboarding to easily gather information about the dog, such as name, breed, age, and behavior concerns.</p>
					`,
				},
				{
					type: 'image',
					src: '/images/pawtrainer-setup.mp4',
					srcWebm: '/images/pawtrainer-setup.webm',
					alt: 'The account setup flow being filled in: the dog\'s name, breed and age, '
						+ 'followed by the behavior concerns to focus training on.',
					ratio: '392 / 846',
					maxWidth: '392px',
				},
				{
					type: 'text',
					bodyHtml: `
						<p><strong>Smart Collar Experience</strong><br />Although the smart collar is still a concept, we designed the pairing experience to show how connecting a collar could feel like a seamless, integrated part of the app.</p>
					`,
				},
				{
					type: 'image',
					src: '/images/pawtrainer-collar-setup.mp4',
					srcWebm: '/images/pawtrainer-collar-setup.webm',
					alt: 'The smart collar pairing flow, connecting the collar to the app.',
					ratio: '392 / 846',
					maxWidth: '392px',
				},
				{
					type: 'text',
					bodyHtml: `
						<p><strong>Terms + Conditions</strong><br />We used Claude to generate an initial draft and then manually reviewed and edited the content to ensure clarity and relevance.</p>
					`,
				},
				{
					type: 'image',
					src: '/images/pawtrainer-terms.mp4',
					srcWebm: '/images/pawtrainer-terms.webm',
					alt: 'The terms and conditions screen being scrolled through during onboarding.',
					ratio: '392 / 846',
					maxWidth: '392px',
				},
			],
		},
		{
			number: '06',
			title: 'Outcome',
			bodyHtml: `
				<p>PawTrainer has evolved significantly since our earliest concepts. At the time of writing, the project has gone through over 150 iterations and continues evolving. This journey was filled with error messages because I was stepping into unfamiliar territory, but it has been such a valuable learning experience as a designer.</p>
				<p>Our next steps include:</p>
				<ul>
					<li>Expanding usability testing</li>
					<li>Conducting accessibility evaluations</li>
					<li>Exploring multimodal AI capabilities: adding speech-based interactions, and supporting image/video uploads for training analysis</li>
				</ul>
				<p>Building a functional AI prototype with Gemini showed me that designers can create interactive experiences without coding backgrounds, as long as they stay curious, patient, and willing to learn through trial and error.</p>
			`,
		},
		{
			variant: 'detail',
			title: "Let's Connect",
			bodyHtml:
				"<p>If you'd like to discuss PawTrainer, share feedback, or talk about AI-powered "
				+ "product design, I'd love to hear from you!</p>",
		},
	],
};

/* ------------------------------------------------------------------ */
/* Watt's the Big Deal? — Figma 88:718                                 */
/* ------------------------------------------------------------------ */

const watts: CaseStudy = {
	slug: 'watts-the-big-deal',
	title: 'Watt’s the Big Deal?',
	summary: 'Turning complex solar production data into an interactive story about sustainability',
	cover: '/images/watts-cover.webp',
	coverAlt: "The Watt's the Big Deal? site: the Bentley Arena header above the "
		+ 'three solar statistic circles.',
	coverPosition: 'top',
	cta: { label: 'Visit page', href: 'https://gas-gutter-90506166.figma.site/' },
	hero: {
		src: '/images/watts-hero.webp',
		alt: "The Watt's the Big Deal? site open on a laptop: the Bentley Arena header and "
			+ 'three solar statistics, on a desk with old books, a mug and a sketchbook.',
		ratio: '1671 / 941',
		maxWidth: '1040px',
	},
	meta: {
		role: 'UI/UX Design',
		type: 'Webpage Design',
		client: 'Bentley University Office of Sustainability',
		tools: 'Figma, Figma Make, Datawrapper',
	},
	sections: [
		{
			number: '01',
			title: 'Overview',
			bodyHtml: `
				<p>Bentley University’s Office of Sustainability wanted to raise awareness of the solar panels installed at Bentley Arena, but needed a compelling way to communicate their impact.</p>
				<p>I designed an interactive webpage that transforms technical energy data into accessible visuals, highlighting solar production, estimated financial savings, and relatable energy equivalents.</p>
			`,
		},
		{
			number: '02',
			title: 'Problem',
			subtitle: 'Bentley had the data. The challenge was making people care about it.',
			bodyHtml: `
				<p>The Office of Sustainability had extensive solar production data from Bentley Arena, including daily, weekly, monthly, and annual energy records.</p>
				<p>However, the volume and complexity of the data made it difficult to communicate the value of the university’s solar investment.</p>
				<p>The challenge was not simply to visualize electricity production. It was to make that information understandable and meaningful to people who may have little familiarity with energy measurements.</p>
				<p><strong>Two audiences, two questions:</strong></p>
			`,
			blocks: [
				{
					type: 'cards',
					cards: [
						{ title: 'Students', bodyHtml: '<p>What difference do Bentley’s solar panels actually make?</p>' },
						{
							title: 'Financial stakeholders',
							bodyHtml: '<p>What financial value could solar energy provide?</p>',
						},
					],
				},
				{
					type: 'compare',
					before: {
						src: '/images/watts-calc-data.jpg',
						alt: 'Spreadsheets of monthly solar production in kWh, service and supply rates, and the 2025 total cost.',
						ratio: 939 / 445,
						label: 'Raw data',
					},
					after: {
						src: '/images/watts-final.jpg',
						alt: "The finished Watt's the Big Deal? overview: 1,400 solar panels, 549K kWh of electricity and $155k in annual savings.",
						ratio: 951 / 760,
						label: 'Solar impact overview',
					},
				},
				{
					type: 'text',
					bodyHtml:
						'<p class="callout"><strong>My design challenge:</strong> How might I turn complex solar production data into an engaging, understandable experience that communicates both environmental and financial impact?</p>',
				},
			],
		},
		{
			number: '03',
			title: 'Design Decisions',
			tightBottom: true,
		},
		{
			variant: 'detail',
			title: '1. Tell a focused story instead of visualizing every available data point',
			bodyHtml: `
				<h3>The challenge</h3>
				<p>The client provided extensive energy production records, including data broken down by individual inverters. Some periods also contained missing data.</p>
				<p>Presenting everything would increase complexity without necessarily helping the audience understand the overall impact.</p>
				<h3>The decision</h3>
				<p>I focused the visualization on three key pieces of information:</p>
				<ul>
					<li><strong>1,400</strong> solar panels installed at Bentley Arena.</li>
					<li><strong>549,344 kWh</strong> of electricity generated in 2025.</li>
					<li>Approximately <strong>$155,201</strong> in estimated annual electricity value, based on my rate calculations.</li>
				</ul>
				<p>These figures became the foundation of the webpage, providing a quick overview before users explore more detailed information.</p>
				<h3>The trade-off</h3>
				<p>Focusing on three headline metrics meant leaving much of the original dataset out of the primary experience.</p>
				<p>I prioritized clarity and relevance over comprehensiveness, while preserving additional information within expandable sections.</p>
				<h3>The result</h3>
				<p>Users can quickly understand the scale of the installation, its annual electricity production, and its estimated financial significance.</p>
			`,
			blocks: [
				{
					type: 'compare',
					before: {
						src: '/images/watts-calc-data.jpg',
						alt: 'The original spreadsheets: monthly solar production in kWh, service and supply rates, and the 2025 total cost.',
						ratio: 939 / 445,
						label: 'Original spreadsheet',
					},
					after: {
						src: '/images/watts-reduce-group-text.jpg',
						alt: 'The three final solar statistic circles: 1,400 solar panels, 549K kWh of electricity and $155k in annual savings.',
						ratio: 1004 / 618,
						label: 'Three headline statistics',
					},
				},
			],
		},
		{
			variant: 'detail',
			title: '2. Use progressive disclosure instead of overwhelming users with information',
			bodyHtml: `
				<h3>The challenge</h3>
				<p>The initial interface relied on modal windows to display additional information. This required users to manage separate overlays and remember which information belonged to each statistic.</p>
				<h3>The decision</h3>
				<p>I replaced the modals with expandable information panels directly beneath the corresponding solar statistics.</p>
				<p>The selected statistic changes appearance to indicate which information is currently displayed.</p>
				<p>I also grouped labels and values within each statistic circle to reinforce their relationship through the Gestalt principle of proximity.</p>
				<h3>Why this mattered</h3>
				<p>Keeping related information visually connected supports recognition and reduces the need to remember information across interface states.</p>
				<h3>The result</h3>
				<p>The redesigned interaction keeps the main statistics visible while allowing users to explore supporting details when needed.</p>
			`,
			blocks: [
				{
					type: 'compare',
					before: {
						src: '/images/watts-modal.webp',
						alt: 'The earlier modal: a $155k Annual Savings window covering the page, listing kWh generated, estimated and 25-year savings, and service and supply rates.',
						ratio: 896 / 510,
						label: 'Before: modal window',
					},
					after: {
						src: '/images/watts-remove-modals.jpg',
						alt: 'The final expandable panel: 1,400 Solar Panels details open beneath the circles, with the selected circle shaded a darker yellow.',
						ratio: 951 / 470,
						label: 'After: expandable panel',
					},
				},
			],
		},
		{
			variant: 'detail',
			title: '3. Make energy measurements relatable through everyday examples',
			bodyHtml: `
				<h3>The challenge</h3>
				<p>Kilowatt-hours are useful for measuring electricity production, but the unit may not be meaningful to someone unfamiliar with energy consumption.</p>
				<p>I wanted visitors to understand the practical significance of the data, rather than simply reading large numbers.</p>
				<h3>The decision</h3>
				<p>I translated one kilowatt-hour into examples involving familiar household devices, including a refrigerator, LED bulb, laptop, and iPhone.</p>
				<p>I presented these comparisons as interactive cards that users could flip individually to reveal more information.</p>
				<h3>The trade-off</h3>
				<p>An earlier interaction flipped all cards together. However, this exposed several large numerical values simultaneously, increasing visual clutter.</p>
				<p>I changed the interaction so users could reveal information one card at a time.</p>
				<h3>The result</h3>
				<p>The final design provides a more approachable way to explore energy quantities, while giving users control over how much information they see.</p>
			`,
			blocks: [
				{
					type: 'imageRow',
					images: [
						{
							src: '/images/watts-flip-2.webp',
							alt: 'All four energy-equivalent cards in their default state: 3.2 hours for a fridge, 100 hours for a bulb, 20 hours for a laptop and about 62 iPhone charges.',
							ratio: '1180 / 667',
							caption: 'Default: what one kilowatt-hour can power.',
						},
						{
							src: '/images/watts-flip-1.jpg',
							alt: 'The fridge and bulb cards flipped on their own to show totals for 549,344 kWh, each offering “flip back”.',
							ratio: '1079 / 572',
							caption: 'Flipped one at a time: the 549,344 kWh totals, revealed only when chosen.',
						},
					],
				},
			],
		},
		{
			variant: 'detail',
			title: '4. Make the data visualization readable at a glance',
			bodyHtml: `
				<h3>The challenge</h3>
				<p>I needed to show how solar electricity production varied throughout 2025 without requiring users to interpret a complicated chart.</p>
				<h3>The decision</h3>
				<p>I selected a monthly column chart using Datawrapper.</p>
				<p>I placed electricity production values directly above each column so readers could compare months without repeatedly scanning between the chart and the vertical axis.</p>
				<p>The chart was embedded within an expandable information panel, keeping the landing page visually focused.</p>
				<h3>The trade-off</h3>
				<p>Monthly aggregation reduces the detail available compared with daily production records, but provides a more manageable view of annual patterns.</p>
				<h3>The result</h3>
				<p>The visualization makes monthly production easier to compare while keeping the broader story focused on annual impact.</p>
			`,
			blocks: [
				{
					type: 'image',
					src: '/images/watts-datawrapper.webp',
					alt: 'The 549,344 kWh information panel, with a Datawrapper column chart of 2025 monthly solar production and each month’s kWh labelled above its column.',
					ratio: '853 / 509',
					maxWidth: '853px',
					caption: 'Values sit directly above each column, so months compare without reading the axis.',
				},
			],
		},
		{
			number: '04',
			title: 'The Results',
			subtitle: 'An interactive experience that makes solar energy more understandable.',
			bodyHtml: `
				<p>The final webpage presents Bentley Arena’s solar production through three layers of information.</p>
			`,
			blocks: [
				{
					type: 'cards',
					cards: [
						{
							title: '01 — Immediate impact',
							bodyHtml: '<p>Three prominent statistics communicate the scale of the installation, annual energy production, and estimated financial value.</p>',
						},
						{
							title: '02 — Explore the details',
							bodyHtml: '<p>Expandable panels provide additional context about the solar installation, production data, and environmental impact.</p>',
						},
						{
							title: '03 — Make the numbers meaningful',
							bodyHtml: '<p>Interactive energy-equivalent cards connect abstract electricity measurements to familiar everyday activities.</p>',
						},
					],
				},
				{
					type: 'image',
					src: '/images/watts-final.jpg',
					alt: 'The final Watt’s the Big Deal? webpage: the Arena header, the three solar statistics and the energy-equivalent cards.',
					ratio: '951 / 1169',
					maxWidth: '760px',
					href: 'https://gas-gutter-90506166.figma.site',
					caption: 'The final webpage. Select it to visit the live site.',
					captionAlign: 'center',
				},
				{
					type: 'imageRow',
					images: [
						{
							src: '/images/watts-datawrapper.webp',
							alt: 'The expanded 549,344 kWh panel with the monthly production chart.',
							ratio: '853 / 509',
							caption: 'Expanded data panel',
						},
						{
							src: '/images/watts-flip-1.jpg',
							alt: 'The energy-equivalent cards with the fridge and bulb flipped.',
							ratio: '1079 / 572',
							caption: 'Interactive energy cards',
						},
					],
				},
			],
		},
		{
			variant: 'detail',
			title: 'What did the project accomplish?',
			bodyHtml: `
				<p>I transformed a complex collection of solar production records into an interactive webpage designed for a nontechnical audience.</p>
				<p>The project also produced an estimate of annual electricity value using 2025 solar production and publicly available Massachusetts electricity rates.</p>
				<p class="callout">The financial figure is an illustrative estimate, not a verified measure of Bentley University’s realized savings.</p>
				<h3>Sources</h3>
				<ul class="sources">
					<li><strong>Solar production:</strong> 2025 monthly production records from Bentley University’s Office of Sustainability.</li>
					<li><strong>Electricity rates:</strong> National Grid Massachusetts, using the <a href="https://www.nationalgridus.com/MA-Business/Rates/Service-Rates" target="_blank" rel="noopener noreferrer">G1 commercial rate</a>, a fixed <a href="https://www.nationalgridus.com/media/pdfs/billing-payments/electric-rates/ma/cm4394_maweb.pdf" target="_blank" rel="noopener noreferrer">supply rate of $0.1441</a> per kWh, and <a href="https://www.nationalgridus.com/media/pdfs/billing-payments/electric-rates/ma/commtable.pdf" target="_blank" rel="noopener noreferrer">monthly service rates</a>.</li>
					<li><strong>Installation details:</strong> Rivermoor Energy, which finances Bentley’s solar power purchase agreement, and the Office of Sustainability’s webpage.</li>
					<li><strong>Environmental equivalents:</strong> homes powered from Simms (2026); CO₂ avoided from an emissions calculator; the cars equivalent from the U.S. Environmental Protection Agency.</li>
					<li><strong>Progressive disclosure:</strong> Nielsen (2006).</li>
				</ul>
			`,
		},
		{
			variant: 'detail',
			title: 'Limitations',
			bodyHtml: `
				<p>The project was completed under a short academic timeline, with limited opportunities for evaluation.</p>
				<p>The savings calculation relied on external commercial electricity rates rather than Bentley’s actual electricity purchasing agreement. More accurate financial analysis would require the university’s contractual rates and billing information.</p>
				<p>The interface also needs formal usability testing to determine whether visitors understand the statistics, discover the interactions, and interpret the information correctly.</p>
			`,
		},
		{
			variant: 'detail',
			title: 'What I learned',
			bodyHtml: `
				<p>This project reinforced that effective data visualization is not about showing as much data as possible.</p>
				<p>It is about identifying what matters to the audience, selecting the appropriate level of detail, and presenting information in a way that supports understanding.</p>
				<p>By simplifying the dataset and progressively revealing details, I explored how interaction design and information hierarchy can make technical information more accessible.</p>
			`,
		},
		{
			variant: 'detail',
			title: 'What’s next?',
			bodyHtml: `
				<p>I would validate the financial estimates using Bentley’s actual electricity costs and conduct usability testing with students and stakeholders.</p>
				<p>I would also evaluate whether visitors understand the meaning of kilowatt-hours, correctly interpret the environmental comparisons, and recognize the interactive elements without instruction.</p>
			`,
		},
	],
};

export const caseStudies: CaseStudy[] = [pawtrainer, watts];
