import { BlogCard } from './blog-card';

const posts = [
  {
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
    imageAlt: 'Modern Lagos apartment',
    tag: 'Market Insights',
    title: 'Lagos Real Estate Market Report 2026',
    excerpt: 'Comprehensive analysis of pricing trends, emerging neighbourhoods, and investment hotspots across Nigeria\'s commercial capital.',
  },
  {
    image: 'https://images.unsplash.com/photo-1600566753086-00f18c805e24?w=800&q=80',
    imageAlt: 'Property documents and keys',
    tag: 'Buying Guide',
    title: 'A First-Time Buyer\'s Guide to Nigerian Property',
    excerpt: 'Navigate the Nigerian property market with confidence. From land documentation to closing costs, here\'s everything you need to know.',
  },
  {
    image: 'https://images.unsplash.com/photo-1600585154084-4e5fe7c39198?w=800&q=80',
    imageAlt: 'Real estate agent with client',
    tag: 'Agent Tips',
    title: 'How Agents Can Win with Digital Tools',
    excerpt: 'Discover how forward-thinking agents are using PropTech to close deals faster, build trust, and grow their portfolios.',
  },
];

export function BlogSection() {
  return (
    <section className="w-full py-16 lg:py-20 px-4 lg:px-10" aria-label="Blog highlights">
      <div className="max-w-[1120px] mx-auto">
        <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground leading-tight mb-8 lg:mb-10">
          From Our Blog
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.map((post, i) => (
            <BlogCard key={i} {...post} />
          ))}
        </div>
      </div>
    </section>
  );
}
