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
			srcWebm?: string;
			href?: string;
			maxWidth?: string;
			/** Crop anchor when the ratio is shorter than the image. */
			objectPosition?: string;
	  }
	| { type: 'imageRow'; images: { src?: string; alt?: string }[]; ratio?: string }
	| { type: 'media'; src?: string; alt?: string; bodyHtml: string; reverse?: boolean };

export interface Section {
	/** Figma "line sep section" numeral. Omitted for sub-sections. */
	number?: string;
	title: string;
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
	meta: { role: string; type: string; platform: string; tools: string };
	sections: Section[];
}

/* ------------------------------------------------------------------ */
/* PawTrainer — Figma 38:2012                                          */
/* ------------------------------------------------------------------ */

const pawtrainer: CaseStudy = {
	slug: 'pawtrainer',
	title: 'PawTrainer',
	summary: 'Building an AI-powered dog training app to ease new dog parent stress',
	cover: '/images/pawtrainer-cover.jpg',
	coverAlt: 'PawTrainer app shown on a phone beside a computer mouse',
	hero: {
		src: '/images/pawtrainer-hero.webp',
		alt: 'Three PawTrainer screens: the welcome screen with a puppy photo, the "Tell us '
			+ 'about your pup" form, and the training schedule setup.',
		ratio: '1040 / 585',
		maxWidth: '1040px',
	},
	cta: { label: 'Explore Prototype', href: 'https://dun-paste-37159254.figma.site' },
	meta: {
		role: 'AI integration and conversational experience design',
		type: 'Mobile App Prototype',
		platform: 'Mobile App',
		tools: 'Figma Make, Supabase, Google AI Studio, Procreate',
	},
	sections: [
		{
			number: '01',
			title: 'Overview',
			bodyHtml: `
				<p>PawTrainer is a mobile dog-training app that was inspired by the challenges of training a new puppy. The app combines smart collar data with AI coaching to provide personalized support, behavioral insights, and real-time feedback.</p>
				<p>My primary role was to <strong>connect a Gemini model</strong> to our chatbot interface, transforming it from a static concept into a functional experience.</p>
			`,
		},
		{
			number: '02',
			title: 'Role + Process',
			bodyHtml: `
				<p>I led the AI integration and conversational experience design, collaborating with a UX Designer and Project Manager. I focused on designing and implementing <strong>Scout</strong>, PawTrainer's chatbot.</p>
				<p>This was my first time integrating the Gemini API into a project, so there was definitely a huge learning curve!</p>
				<p>I generated a free Gemini API key in Google AI Studio after my team was satisfied with the current iteration of our app. Since our prototype was built in Figma Make, I directly prompted the AI chat to configure a secure connection between our project and Supabase, where the key could be safely stored.</p>
				<p>Behind the scenes, there was plenty of trial and error: testing different models, troubleshooting unexpected errors, and learning about API rate limits, all while having no coding experience. Ultimately, we selected <strong>gemini-3-flash-preview</strong> based on our use case and added a spending cap to our workspace to help manage API usage during development.</p>
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
			number: '03',
			title: 'App Overview',
			bodyHtml: `
				<p>PawTrainer was designed with new dog parents in mind because we know how amazing and overwhelming a new puppy can be.</p>
				<p>New users can easily set up an account, logging details such as dog name, age, breed, training goals, and concerns. Connecting to a smart collar gives owners a look at key metrics, such as heart rate, sleep score, and stress levels.</p>
				<p>In the app, users can read a daily tip specific to their dog breed, chat with Scout, check out training programs, view progress reports, start a training session, toggle between weekly and monthly calendar views, and get training reminders.</p>
			`,
		},
		{
			number: '04',
			title: 'Research',
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
			number: '05',
			title: 'Problem',
			bodyHtml:
				'<p>Through research and user interviews, we identified three major pain points in the dog-training experience.</p>',
			blocks: [
				{
					type: 'cards',
					cards: [
						{
							title: 'Understanding Dog Behavior',
							bodyHtml:
								'<p>Are the behaviors presented caused by stress, excitement, boredom, or fear? Without objective metrics, it can be difficult to understand progress, identify triggers, and measure training effectiveness.</p>',
						},
						{
							title: 'Limited Access to Training Support',
							bodyHtml: `
								<p>Professional trainers are typically available only during scheduled sessions, while behavioral challenges can happen at any time. Owners may find themselves asking questions in the moment:</p>
								<ul>
									<li><em>Why is my dog barking?</em></li>
									<li><em>Am I reinforcing this behavior correctly?</em></li>
									<li><em>What should I do right now?</em></li>
								</ul>
							`,
						},
						{
							title: 'High Cognitive Load',
							bodyHtml: `
								<p>Training requires high cognitive effort. Owners may struggle to:</p>
								<ul>
									<li>Remember training methods</li>
									<li>Track progress over time</li>
									<li>Maintain consistent sessions</li>
									<li>Recognize behavioral trends</li>
									<li>Know what to focus on next</li>
								</ul>
							`,
						},
					],
				},
			],
		},
		{
			number: '06',
			title: 'Solution + Features',
			bodyHtml: `
				<p>PawTrainer was designed to be a human and canine centered experience. Our goal is not to replace, but <strong>supplement and enhance</strong> traditional (in person) dog training with our features.</p>
				<p>PawTrainer combines smart collar data with AI coaching to transform passive observations into personalized, actionable training guidance. This helps dog owners <strong>understand</strong> their dog's behavior, <strong>reduce</strong> the cognitive load of training, and <strong>see</strong> measurable progress over time.</p>
			`,
		},
		{
			variant: 'detail',
			title: 'Data-Driven Training',
			bodyHtml: `
				<p>Paired with a smart collar, PawTrainer can help owners better understand their dog's behavior.</p>
				<ul>
					<li>AI can explain potential reasons behind a behavior.</li>
					<li>Behavioral patterns can surface potential triggers.</li>
					<li>Recommendations can be personalized based on training history and metrics</li>
				</ul>
				<p>The app translates behavioral and physical metrics into clear, actionable coaching while providing continuous support between training sessions.</p>
			`,
		},
		{
			variant: 'detail',
			title: 'Meet Scout',
			bodyHtml: `
				<p>My primary responsibility was designing and implementing Scout, PawTrainer's AI-powered training companion.</p>
				<p>Scout provides guidance and contextual support when owners need it most. Whether it's a late-night concern about barking or uncertainty about reinforcement timing, Scout serves as an accessible source of coaching and reassurance.</p>
				<p>In order to integrate the Gemini API into our Figma project, I had to:</p>
				<ul>
					<li>Create a Gemini API key through Google AI Studio</li>
					<li>Configure a Supabase backend</li>
					<li>Connect the frontend experience to the backend</li>
					<li>Secure credentials using Supabase Edge Functions</li>
					<li>Test and troubleshoot API requests</li>
					<li>Evaluate different Gemini models</li>
				</ul>
			`,
			blocks: [
				{
					type: 'imageRow',
					ratio: '3 / 2',
					images: [
						{
							src: '/images/pawtrainer-scout-avatar.webp',
							alt: 'Scout, the PawTrainer AI training companion: a cartoon puppy with '
								+ 'orange ears, a blue spotted collar and a bone-shaped tag.',
							ratio: '1536 / 1024',
							caption:
								'Scout began as an avatar generated through Figma Make. I wanted to add a '
								+ 'more human and personalized touch. I illustrated Scout in Procreate, '
								+ "referencing photos of our teammate's beagle.",
						},
						{
							src: '/images/pawtrainer-scout-screens.webp',
							alt: "Three PawTrainer screens: Scout's chat offering collar-data insights, "
								+ "the Meet Scout introduction, and Daisy Mae's dashboard showing heart "
								+ 'rate, activity, stress and sleep.',
							ratio: '580 / 382',
							caption:
								"The illustration became Scout's visual identity throughout the app.",
						},
					],
				},
				{
					type: 'image',
					src: '/images/pawtrainer-api-errors.webp',
					alt: 'The Gemini API usage dashboard over 90 days, showing total requests against '
						+ 'success rate and a spike of 429 TooManyRequests errors in late April.',
					ratio: '1174 / 588',
					maxWidth: '1174px',
					caption:
						'During testing, we encountered API rate limit errors that prevented requests '
						+ 'from reaching Gemini. I added a spending cap to manage usage during development.',
				},
			],
		},
		{
			variant: 'detail',
			title: 'Real-Time Behavioral Feedback',
			bodyHtml: `
				<p>Traditional training often relies on retrospective feedback from trainers. PawTrainer introduces real-time coaching by using smart collar data to provide contextual, real-time coaching. The system can identify patterns associated with behaviors such as:</p>
				<ul>
					<li>Excessive barking</li>
					<li>Leash pulling</li>
					<li>Signs of stress</li>
					<li>Changes in activity</li>
				</ul>
			`,
			blocks: [
				{
					type: 'image',
					src: '/images/pawtrainer-training-session.mp4',
					srcWebm: '/images/pawtrainer-training-session.webm',
					alt: 'A training session screen playing through its step-by-step instructions, '
						+ 'with live heart rate shown as the session runs.',
					ratio: '392 / 846',
					maxWidth: '392px',
					caption:
						'The app can give immediate recommendations, helping owners reinforce desired '
						+ 'behaviors at the moment they occur.',
				},
			],
		},
		{
			variant: 'detail',
			title: 'Reducing Cognitive Load',
			bodyHtml: `
				<p>A core design goal was to make training easier to follow for busy pet parents. PawTrainer organizes training into manageable steps so owners don't have to remember every technique or track their progress manually.</p>
				<p>Guided Training Sessions include:</p>
				<ul>
					<li>Step-by-step instructions</li>
					<li>Helpful tips</li>
					<li>Flexible controls</li>
					<li>Real-time heart rate information</li>
				</ul>
				<p>Users can pause or skip ahead when needed, giving them more control over the pace of a session. We also added a heart-rate indicator to the training experience after receiving feedback from users.</p>
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
						<p><strong>Smart Collar Experience</strong><br />The collar ecosystem was designed to feel like an integrated part of the product.</p>
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
			number: '07',
			title: 'Outcome',
			bodyHtml: `
				<p>PawTrainer has evolved significantly since our earliest concepts. At the time of writing, the project has gone through over 150 iterations and continues evolving. This journey was filled with error messages because I was stepping into unfamiliar territory, but it has been such a valuable learning experience as a designer.</p>
				<p>Our next steps include:</p>
				<ul>
					<li>Expanding usability testing</li>
					<li>Conducting accessibility evaluations</li>
					<li>Exploring multimodal AI capabilities: adding speech-based interactions, and supporting image/video uploads for training analysis</li>
				</ul>
				<p>Building a functional AI prototype with Gemini showed me that designers can create interactive experiences without coding backgrounds, as long as</p>
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
	summary: 'Turning solar power data into interactive data visuals',
	cover: '/images/watts-cover.webp',
	coverAlt: "The Watt's the Big Deal? site: the Bentley Arena header above the "
		+ 'three solar statistic circles.',
	coverPosition: 'top',
	cta: { label: 'Visit page', href: 'https://gas-gutter-90506166.figma.site/' },
	hero: {
		src: '/images/watts-hero.jpg',
		alt: "Top of the Watt's the Big Deal? site: the Bentley Arena header with the "
			+ 'three solar statistics below it.',
		ratio: '807 / 710',
		/* 1.2x the 807px source. */
		maxWidth: '968px',
	},
	meta: {
		role: 'UI/UX Design',
		type: 'Webpage Design',
		platform: 'Desktop + Tablet',
		tools: 'Figma, Figma Make, Datawrapper',
	},
	sections: [
		{
			number: '01',
			title: 'Overview',
			bodyHtml: `
				<p><strong>Watt's the Big Deal?</strong></p>
				<p><strong>Client:</strong> The Office of Sustainability at Bentley University</p>
				<p><strong>Business Problem:</strong> Our client wanted to spread awareness that Bentley <em>has</em> and <em>uses</em> solar panels, but they were unsure how to convey the message. They provided a massive collection of data sets regarding solar power production at The Arena, Bentley's ice hockey arena.</p>
				<p><strong>Intended Audience:</strong> Bentley students, secondary target audience are the university's financial stakeholders.</p>
				<p><strong>Goal:</strong> With this interactive webpage, I share information about the panels we have in an interactive way. Additionally, I aim to nudge stakeholders towards investing in more panels by highlighting annual savings, as well as projected 25 year savings.</p>
			`,
		},
		{
			number: '02',
			title: 'Visualization Solution',
			bodyHtml: `
				<p>I created an interactive webpage to visualize solar power production data and highlight key facts about the panels in The Arena.</p>
				<p>Click the image below to visit the site:</p>
			`,
			blocks: [
				{
					type: 'image',
					src: '/images/watts-preview.jpg',
					alt: "Top of the Watt's the Big Deal? site: the Bentley Arena header and the "
						+ 'three solar statistics.',
					ratio: '951 / 585',
					maxWidth: '780px',
					objectPosition: 'top',
					href: 'https://gas-gutter-90506166.figma.site',
				},
			],
		},
		{
			variant: 'detail',
			title: 'Site Breakdown',
			bodyHtml: `
				<pre class="tree">Landing Page
│
├── Hero Section
│   ├── Project title
│   ├── Subtitle
│   └── Instruction ("Click any circle to learn more")
│
├── Solar Impact Overview, each with dropdown info panels
│   ├── 1,400 Solar Panels
│   ├── 549K kWh Generated
│   └── $155K Annual Savings
│
├── Real-World Energy Equivalents (click to flip cards)
│   ├── Refrigerator
│   ├── LED Light Bulb
│   ├── Laptop
│   └── iPhone Charging
│
└── Footer
    ├── Bentley University
    └── Office of Sustainability</pre>
			`,
		},
		{
			number: '05',
			title: 'Design Decisions',
			bodyHtml: '<p>I made major changes after feedback and reviewing my work.</p>',
			tightBottom: true,
		},
		{
			variant: 'detail',
			title: 'Remove modals',
			bodyHtml:
				"<p>I didn't want users to have to rely on recall when navigating the site. Now, the information panels open as a dropdown below the circles. Additionally, the selected circle turn a darker shade of yellow to make it clear on which panel is open. I incorporated these heuristics to allow users to make decisions with ease.</p>",
			blocks: [
				{
					type: 'image',
					src: '/images/watts-remove-modals.jpg',
					alt: 'The 1,400 Solar Panels information panel open as a dropdown beneath the '
						+ 'circles, with the selected circle shaded a darker yellow.',
					ratio: '951 / 470',
					maxWidth: '951px',
				},
			],
		},
		{
			variant: 'detail',
			title: 'Add sun ray effect',
			bodyHtml:
				'<p>Rays circle the sun when hovering over a circle, signaling to users that something happens when pressed.</p>',
			blocks: [
				{
					type: 'image',
					src: '/images/watts-sun-rays.webp',
					alt: 'The three solar statistic circles, with rays radiating out from the '
						+ 'first one to signal it can be pressed.',
					ratio: '951 / 268',
					maxWidth: '951px',
				},
			],
		},
		{
			variant: 'detail',
			title: 'Reduce + group text',
			bodyHtml: `
				<p>I reduced and moved the text in the subtext of the suns. The long text underneath the circle looked more like a sentence. The icons and numbers should let users know the message, with text supporting and providing a bit more information rather than overwhelm the user.</p>
				<p>I ended up grouping the subtext with the bold text in the sun. The text labels were previously below each circle. I received feedback that the text didn't seem related to the circle. Using the Gestalt principle of proximity allows users to perceive the elements as being grouped together.</p>
			`,
			blocks: [
				{
					type: 'image',
					src: '/images/watts-reduce-group-text.jpg',
					alt: 'The three circles with their labels grouped inside them, beneath the '
						+ 'Bentley Arena header.',
					ratio: '1004 / 618',
					maxWidth: '1004px',
				},
			],
		},
		{
			variant: 'detail',
			title: 'Individual flip state',
			bodyHtml:
				'<p>I also got feedback to have each card have its own flip state. Before, there was one "click to flip" button but it could be overwhelming for users to see all the cards flipped. Giving users the ability to flip the cards individually reduces cognitive effort and visual clutter since the flipped state has much larger numbers. This decision was inspired by the Nielsen (2006) article on progressive disclosure. This allows users to disclose (or open) more information when they want or when they are ready.</p>',
			blocks: [
				{
					type: 'imageRow',
					ratio: '1079 / 572',
					images: [
						{
							src: '/images/watts-flip-1.jpg',
							alt: 'The fridge and bulb cards flipped individually to show totals for '
								+ '549,344 kWh, each offering "flip back".',
						},
						{
							src: '/images/watts-flip-2.webp',
							alt: 'All four cards in their default state, showing hours for the fridge, '
								+ 'bulb and laptop and charges for the iPhone.',
						},
					],
				},
			],
		},
		{
			variant: 'detail',
			title: 'Datawrapper',
			bodyHtml:
				'<p>I chose to use Datawrapper to visualize monthly solar production in kilowatt-hours. I embedded the chart into the information panel. I explored different charts but the column chart was simple and effective in showing production. I chose to display the kWh above each column to avoid having users scan across and read the y axis.</p>',
			blocks: [
				{
					type: 'image',
					src: '/images/watts-datawrapper.webp',
					alt: 'The 549,344 kWh information panel, with a Datawrapper column chart of '
						+ '2025 monthly solar production and each month\'s kWh labelled above its column.',
					ratio: '853 / 509',
					maxWidth: '853px',
				},
			],
		},
		{
			variant: 'detail',
			title: 'Remove Bentley logo',
			bodyHtml:
				"<p>A minor change I made was to remove the Bentley logo from the top of the page. It didn't go well with the colors of my page. I added a picture of The Arena to fill the top width of the site.</p>",
			blocks: [
				{
					type: 'image',
					src: '/images/watts-remove-logo.webp',
					alt: 'The site header with no Bentley logo: a photo of The Arena at dusk '
						+ 'filling the full width behind the title.',
					ratio: '951 / 381',
					maxWidth: '951px',
				},
			],
		},
		{
			number: '03',
			title: 'Data + Research',
			bodyHtml: `
				<p>I started the process by <strong>extracting the data</strong> I wanted to use. This was a long process because there was a lot of data! There was daily, weekly, monthly and annual data for energy production, broken down by the different inverters. There was also many months of missing data.</p>
				<p>I asked myself: <strong>What is the story I want to tell, and which data can I use to do this effectively?</strong></p>
				<p>I ended up monthly solar production data of all panels in 2025. I also estimated and calculated projected savings by researching service/supply rates for Massachusetts.</p>
			`,
		},
		{
			variant: 'detail',
			title: 'Research + Calculations',
			bodyHtml: `
				<p>How much did Bentley save in 2025 with solar panels?</p>
				<ul>
					<li>I used monthly solar production data provided by the Office of Sustainability for 2025.</li>
					<li>Annual savings was calculated using the total solar panel production of 549,344 kWh in 2025. Using the service/supply rates, I calculated estimated savings of $155,201.</li>
					<li>Calculating the annual cost using service and supply rates for Massachusetts in 2025. I chose National Grid and determined the Arena would be classified as using a <a href="https://www.nationalgridus.com/MA-Business/Rates/Service-Rates" target="_blank" rel="noopener noreferrer">G1 commercial rate</a>. Supply rate was fixed at <a href="https://www.nationalgridus.com/media/pdfs/billing-payments/electric-rates/ma/cm4394_maweb.pdf" target="_blank" rel="noopener noreferrer">$0.1441</a>, while <a href="https://www.nationalgridus.com/media/pdfs/billing-payments/electric-rates/ma/commtable.pdf" target="_blank" rel="noopener noreferrer">service rates</a> changed according to the month.</li>
				</ul>
			`,
			blocks: [
				{
					type: 'image',
					src: '/images/watts-calc-data.jpg',
					alt: 'Spreadsheets of 2025 monthly solar production in kWh alongside National Grid '
						+ 'service and supply rates, totalling $155,201 for the year.',
					ratio: '939 / 445',
					maxWidth: '939px',
				},
				{
					type: 'image',
					src: '/images/watts-calc-panel.webp',
					alt: 'The 1,400 Solar Panels information panel: total panels installed, arena '
						+ 'square footage, system capacity, and a callout on emissions reduction.',
					ratio: '803 / 299',
					maxWidth: '803px',
					caption:
						"Solar panel information is from Rivermoor Energy website, they are the ones "
						+ "financing Bentley's solar power purchase agreement. The callout text info on "
						+ "the right side is pulled from Bentley's Office of Sustainability webpage.",
				},
				{
					type: 'image',
					src: '/images/watts-calc-co2.jpg',
					alt: 'The 549,344 kWh panel with a tooltip reading "That is equivalent to removing '
						+ 'annual emissions from 44 cars!" beside 203 metric tons of CO2 avoided.',
					ratio: '1151 / 265',
					maxWidth: '1151px',
					caption:
						'Equivalent homes powered = around 52 (hidden in above image) from Simms 2026 '
						+ 'site. CO2 avoided was calculated to be around 203 metric tons from the '
						+ 'calculator tool. The 44 cars equivalent is from the U.S. Environmental '
						+ 'Protection Agency.',
				},
				{
					type: 'image',
					/* Same screenshot as the flip-state pair above. */
					src: '/images/watts-flip-2.webp',
					alt: 'The "For watt it\'s worth" cards: 3.2 hours for a 313W fridge, 100 hours for '
						+ 'a 10W bulb, 20 hours for a 50W laptop and about 62 iPhone charges.',
					ratio: '1180 / 667',
					/* 1.2x the 807px source. */
		maxWidth: '968px',
					caption:
						'I also calculated how long can one kilowatt-hour power three common appliances; '
						+ 'a 313W fridge, a 10 watt light bulb, and a laptop that draws around 50 watts '
						+ 'of power. Lastly, I calculated how many charges a kilowatt-hour can charge an '
						+ 'iPhone. A full sized fridge uses around 313 watts, so that would be around '
						+ '3.2 hours (1000/313).',
				},
			],
		},
		{
			number: '04',
			title: 'Project Evolution',
			bodyHtml: `
				<p>I began with sketches on paper and Procreate. Originally, I had a static infographic/poster concept for my visualization.</p>
			`,
			blocks: [
				{
					type: 'imageRow',
					ratio: '1 / 1',
					images: [
						{
							src: '/images/watts-sketch-1.jpg',
							alt: 'Low-fidelity paper sketch: a bar chart of electricity consumption '
								+ 'against solar production, a fridge for one kilowatt-hour, and money '
								+ 'bags beside a chart of annual savings.',
							ratio: '2550 / 3300',
						},
						{
							src: '/images/watts-sketch-2.jpg',
							alt: 'Procreate sketch of a horizontal bar chart titled Bentley Arena Solar '
								+ 'Production, with January, June and December labelled in kilowatt hours.',
							ratio: '1 / 1',
						},
						{
							src: '/images/watts-sketch-3.jpg',
							alt: 'Procreate sketch: a "Did you know?" sun noting the average US household '
								+ 'uses 28-30 kWh per day, and that one kWh runs a fridge for a day.',
							ratio: '1 / 1',
						},
					],
				},
				{
					type: 'imageRow',
					ratio: '1 / 1',
					images: [
						{
							src: '/images/watts-draft.webp',
							alt: 'Grey Figma wireframe: the title, three yellow statistic circles and '
								+ 'three empty placeholder boxes.',
							ratio: '1440 / 1164',
						},
						{
							src: '/images/watts-final.jpg',
							alt: 'The final iteration of the live site, with the Arena header, the three '
								+ 'solar circles and the energy equivalents cards.',
							ratio: '951 / 1169',
						},
					],
				},
				{
					type: 'text',
					bodyHtml:
						'<p>Poster to webpage evolution: still simple wireframes, exploring colors. '
						+ 'The image on the right is the final iteration.</p>',
				},
			],
		},
		{
			number: '05',
			title: 'Limitations + Future Opportunities',
			bodyHtml: `
				<p>This project had a tight deadline, given that executive format classes only meet for 4 days. Deliverables were due within a day or two after feedback sessions. I would like to expand on this project in the future. There is data that could increase relevance/accuracy for the financial portion. The Office of Sustainability mentioned Bentley buys electricity. I could do a more accurate savings and cost analysis with that information rather than estimating with National Grid data.</p>
				<p>Overall, I feel as if there is a lot of room for improvement in the annual savings/projected savings portion of my site.</p>
			`,
		},
		{
			variant: 'detail',
			title: "Let's Connect",
			bodyHtml:
				"<p>If you'd like to talk about AI usage in design, I'd love to hear from you! Have you created interactive prototypes with the help of AI tools? Where do you think AI comes in handy in UX design, and where have you seen it fall short?</p>",
		},
	],
};

export const caseStudies: CaseStudy[] = [pawtrainer, watts];
