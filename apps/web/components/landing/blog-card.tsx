interface BlogCardProps {
  image: string;
  imageAlt: string;
  tag: string;
  title: string;
  excerpt: string;
}

export function BlogCard({ image, imageAlt, tag, title, excerpt }: BlogCardProps) {
  return (
    <article className="flex flex-col bg-[var(--color-bg-elevated)] rounded-lg overflow-hidden border border-[var(--color-border-subtle)] shadow-xs transition-shadow duration-fast ease-default hover:shadow-md hover:-translate-y-0.5">
      <img
        src={image}
        alt={imageAlt}
        loading="lazy"
        className="w-full aspect-video object-cover"
      />
      <div className="p-6 flex-1 flex flex-col">
        <div className="font-body text-xs font-semibold text-accent uppercase tracking-wider mb-2">
          {tag}
        </div>
        <div className="font-body text-lg font-semibold text-foreground leading-snug mb-2">
          {title}
        </div>
        <p className="font-body text-sm text-muted-foreground leading-relaxed flex-1">
          {excerpt}
        </p>
      </div>
    </article>
  );
}
