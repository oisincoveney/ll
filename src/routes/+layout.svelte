<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import { Home, Headphones, BookOpen, Zap, Music, Video, Brain, LogOut, ChevronRight } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import { Avatar, AvatarImage, AvatarFallback } from '$lib/components/ui/avatar';
	import { Separator } from '$lib/components/ui/separator';

	let { data, children } = $props();

	function isActive(path: string, exact = false): boolean {
		return exact ? $page.url.pathname === path : $page.url.pathname.startsWith(path);
	}

	const navItems = [
		{ href: '/', label: 'Home', icon: Home, exact: true },
		{ href: '/episodes', label: 'Episodes', icon: Headphones, exact: false },
		{ href: '/vocabulary', label: 'Vocab', icon: BookOpen, exact: false },
		{ href: '/practice', label: 'Practice', icon: Zap, exact: false },
		{ href: '/music', label: 'Music', icon: Music, exact: false },
		{ href: '/videos', label: 'Videos', icon: Video, exact: false },
		{ href: '/concepts', label: 'Concepts', icon: Brain, exact: false },
	];

	const routeLabels: Record<string, string> = {
		episodes: 'Episodes',
		vocabulary: 'Vocabulary',
		practice: 'Practice',
		flashcards: 'Flashcards',
		'past-tense': 'Past Tense',
		music: 'Music',
		videos: 'Videos',
		concepts: 'Concepts',
		new: 'New'
	};

	function toTitleCase(value: string): string {
		return value
			.split('-')
			.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
			.join(' ');
	}

	function getSegmentLabel(segment: string): string {
		if (routeLabels[segment]) return routeLabels[segment];
		if (/^\d+$/.test(segment)) return `#${segment}`;
		return toTitleCase(segment);
	}

	const breadcrumbs = $derived.by(() => {
		const segments = $page.url.pathname.split('/').filter(Boolean);
		const crumbs = [{ href: '/', label: 'Home', current: segments.length === 0 }];
		let currentPath = '';
		for (const segment of segments) {
			currentPath += `/${segment}`;
			crumbs.push({
				href: currentPath,
				label: getSegmentLabel(segment),
				current: currentPath === $page.url.pathname
			});
		}
		return crumbs;
	});

</script>

<svelte:head>
	<title>Language Learner</title>
</svelte:head>

<div class="flex h-screen bg-background">
	<!-- Desktop sidebar -->
	<aside class="hidden md:flex w-48 shrink-0 flex-col border-r border-border bg-background">
		<div class="px-3 py-3">
			<Button href="/" variant="ghost" class="h-auto justify-start px-1 py-1 text-sm font-semibold tracking-tight">LL</Button>
			<p class="px-1 text-xs text-muted-foreground">Language Transfer</p>
		</div>
		<nav class="flex-1 space-y-1 overflow-y-auto px-2">
			{#each navItems as item}
				<Button
					href={item.href}
					variant={isActive(item.href, item.exact) ? 'secondary' : 'ghost'}
					size="sm"
					class="w-full justify-start gap-2.5"
				>
					<item.icon size={15} />
					{item.label}
				</Button>
			{/each}
		</nav>
		<div class="flex flex-col gap-2 px-2 py-3">
			<Separator />
			<form method="POST" action="/?/sync" use:enhance>
				<Button type="submit" variant="outline" size="sm" class="w-full">Sync LingQ</Button>
			</form>
			{#if data.user}
				<div class="flex items-center gap-2 px-1">
					<Avatar size="sm">
						{#if data.user.avatar}
							<AvatarImage src={data.user.avatar} alt={data.user.name ?? 'User'} referrerpolicy="no-referrer" />
						{/if}
						<AvatarFallback class="text-xs">{(data.user.name ?? data.user.email)[0].toUpperCase()}</AvatarFallback>
					</Avatar>
					<span class="max-w-[7.5rem] truncate text-xs text-muted-foreground">{data.user.name ?? data.user.email}</span>
				</div>
				<form method="POST" action="/auth/logout">
					<Button type="submit" variant="ghost" size="sm" class="w-full justify-start gap-2">
						<LogOut size={14} />
						Sign out
					</Button>
				</form>
			{/if}
		</div>
	</aside>

	<!-- Main content -->
	<main class="flex-1 min-h-0 overflow-hidden flex flex-col">
		<header class="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
			<div class="px-4 py-2 md:px-6">
				<nav aria-label="Breadcrumb" class="flex items-center gap-0.5 overflow-x-auto">
					{#each breadcrumbs as crumb, index}
						{#if index > 0}
							<ChevronRight size={12} class="shrink-0 text-muted-foreground" />
						{/if}
						<Button
							href={crumb.href}
							variant="ghost"
							size="sm"
							aria-current={crumb.current ? 'page' : undefined}
							class="h-6 whitespace-nowrap px-2 text-xs {crumb.current ? 'text-foreground' : 'text-muted-foreground'}"
						>
							{crumb.label}
						</Button>
					{/each}
				</nav>
			</div>
			<Separator />
		</header>
		<div class="flex-1 min-h-0 overflow-auto p-4 pb-20 md:p-6 md:pb-6">
			{@render children()}
		</div>
	</main>

	<!-- Mobile bottom nav -->
	<nav class="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border pb-2">
		<div class="grid grid-cols-7 h-14">
			{#each navItems as item}
				<Button
					href={item.href}
					variant="ghost"
					size="sm"
					class="h-full flex-col gap-0.5 rounded-none px-1 {isActive(item.href, item.exact) ? 'text-foreground' : 'text-muted-foreground'}"
				>
					<item.icon size={20} />
					<span class="text-[10px] font-medium">{item.label}</span>
				</Button>
			{/each}
		</div>
	</nav>
</div>
