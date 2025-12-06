// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'Flonp',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/' }],
			sidebar: [
				{
					label: 'Getting Started',
					items: [
						{ label: 'Introduction', slug: 'getting-started/introduction' },
						{ label: 'Complete Product Brief', slug: 'getting-started/complete-brief' },
						{ label: 'Domain Context', slug: 'getting-started/domain-context' },
					],
				},
				{
					label: 'Architecture',
					items: [
						{ label: 'Tech Stack', slug: 'architecture/tech-stack' },
						{ label: 'System Architecture', slug: 'architecture/system-architecture' },
						{ label: 'Frontend Architecture', slug: 'architecture/frontend-architecture' },
						{ label: 'Agent Architecture', slug: 'architecture/agent-architecture' },
					],
				},
				{
					label: 'Guides',
					items: [
						{ label: 'Development Setup', slug: 'guides/development-setup' },
						{ label: 'Deployment Guide', slug: 'guides/deployment-guide' },
					],
				},
				{
					label: 'Reference',
					items: [
						{ label: 'API Specification', slug: 'reference/api-specification' },
						{ label: 'Error Handling', slug: 'reference/error-handling' },
						{ label: 'Validation Strategy', slug: 'reference/validation-strategy' },
					],
				},
			],
		}),
	],
});
