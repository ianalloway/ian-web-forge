import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Github, ExternalLink } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header/Intro */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Ian Alloway</h1>
          <p className="text-xl text-muted-foreground mb-2">Full Stack Developer</p>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Welcome to my personal website. I'm a developer passionate about creating modern web applications 
            and sharing my thoughts on technology, movies, and more.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Projects */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink size={20} />
                Projects
              </CardTitle>
              <CardDescription>
                Check out some of my recent work and development projects.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="#" target="_blank" rel="noopener noreferrer">
                  E-Commerce Platform
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="#" target="_blank" rel="noopener noreferrer">
                  Task Management App
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="#" target="_blank" rel="noopener noreferrer">
                  Weather Dashboard
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="#" target="_blank" rel="noopener noreferrer">
                  View All Projects
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* GitHub */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Github size={20} />
                GitHub
              </CardTitle>
              <CardDescription>
                Follow my coding journey and explore my repositories.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                  My GitHub Profile
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                  Recent Repositories
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                  Open Source Contributions
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* Movie Reviews */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink size={20} />
                Movie Reviews
              </CardTitle>
              <CardDescription>
                My thoughts and reviews on the latest films and classics.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="#" target="_blank" rel="noopener noreferrer">
                  Latest Reviews
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="#" target="_blank" rel="noopener noreferrer">
                  Top Rated Movies
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="#" target="_blank" rel="noopener noreferrer">
                  Movie Recommendations
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* Blog */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink size={20} />
                Blog
              </CardTitle>
              <CardDescription>
                Articles about web development, technology, and my experiences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="#" target="_blank" rel="noopener noreferrer">
                  Recent Posts
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="#" target="_blank" rel="noopener noreferrer">
                  Tech Tutorials
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="#" target="_blank" rel="noopener noreferrer">
                  Developer Insights
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Contact */}
        <div className="text-center mt-12">
          <Card className="inline-block">
            <CardContent className="pt-6">
              <p className="text-muted-foreground mb-4">
                Want to get in touch?
              </p>
              <Button asChild>
                <a href="mailto:hello@ianalloway.xyz">
                  Send me an email
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
