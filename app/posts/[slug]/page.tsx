// app/posts/[slug]/page.tsx
import { Metadata } from 'next';
import ReactMarkdown from 'react-markdown';
import { codeToHtml } from 'shiki'
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CalendarDays, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getSingleBlogPostBySlug, getAllPublished } from '@/lib/notion';

// Types
interface CodeBlockProps {
  language: string | undefined;
  value: string;
}

interface PostMetadata {
  title: string;
  date: string;
  tags: string[];
  description: string;
}

interface BlogPost {
  metadata: PostMetadata;
  markdown: string;
}

// Code block component using Shiki
const CodeBlock = async ({ language = 'text', value }: CodeBlockProps) => {
  const highlighted = await codeToHtml(value, {
    lang: language || 'bash',
    theme: 'material-theme-ocean'
  });

  return (
    <div 
      className="border-none"
      dangerouslySetInnerHTML={{ __html: highlighted }}
    />
  );
};

// Generate metadata
export async function generateMetadata(
  props: { 
    params: Promise<{ slug: string }>
  }
): Promise<Metadata> {
  const { slug } = (await props.params);
  const post = await getSingleBlogPostBySlug(slug);

  return {
    title: post.metadata.title,
    description: post.metadata.description,
  };
}

// Generate static params
export async function generateStaticParams() {
  const posts = await getAllPublished();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

// Main post component
export default async function Post(
  props0: { 
    params: Promise<{ slug: string }> 
  }
) {
  const params = await props0.params;
  const { slug } = params;
  const post = await getSingleBlogPostBySlug(slug);

  // Ensure markdown is a string
  const getMarkdownContent = (content: any) => {
    if (typeof content === 'string') {
      try {
        const parsed = JSON.parse(content);
        return parsed.parent || parsed; // Extract from parent field if it exists
      } catch {
        return content; // Return as-is if it's not JSON
      }
    } else if (content && typeof content === 'object') {
      return content.parent || content; // Extract from parent field if it exists
    }
    return '';
  };

  const markdownContent = getMarkdownContent(post.markdown);

  return (
    (<article className="container mx-auto py-8 px-4">
      <Link href="/">
        <Button variant="ghost" className="mb-8 gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Blog
        </Button>
      </Link>
      <Card className="border-none shadow-none">
        <CardHeader className="space-y-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              {post.metadata.title}
            </h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              <time dateTime={post.metadata.date}>{post.metadata.date}</time>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {post.metadata.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
          <p className="text-muted-foreground text-lg">
            {post.metadata.description}
          </p>
        </CardHeader>

        <Separator className="my-8" />

        <CardContent className="prose prose-gray dark:prose-invert max-w-none">
          <ReactMarkdown
            components={{
              code: async ({ node, inline, className, children, ...props }) => {
                const match = /language-(\w+)/.exec(className || '');
                const value = String(children).replace(/\n$/, '');
                
                if (!inline && match) {
                  // For code blocks
                  return CodeBlock({
                    value,
                    language: match[1],
                  });
                }
                
                // For inline code
                return (
                  <code className={className} {...props}>
                  {children}
                </code>
                );
              },
              // Customize other markdown elements
              h2: ({ children }) => (
                <h2 className="text-2xl font-bold tracking-tight mt-8 mb-4">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-xl font-bold tracking-tight mt-6 mb-3">{children}</h3>
              ),
              p: ({ children }) => (
                <p className="leading-7 [&:not(:first-child)]:mt-6">{children}</p>
              ),
              ul: ({ children }) => (
                <ul className="my-6 ml-6 list-disc [&>li]:mt-2">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="my-6 ml-6 list-decimal [&>li]:mt-2">{children}</ol>
              ),
              blockquote: ({ children }) => (
                <blockquote className="mt-6 border-l-2 pl-6 italic">{children}</blockquote>
              ),
            }}
          >
            {markdownContent}
          </ReactMarkdown>
        </CardContent>
      </Card>
    </article>)
  );
}