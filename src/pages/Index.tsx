import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Github, ExternalLink, Mail } from 'lucide-react';
import MatrixRain from '@/components/MatrixRain';

const Index = () => {
  return (
    <div className="min-h-screen bg-background py-12 px-4 relative">
      <MatrixRain />
      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header/Intro */}
        <div className="text-center mb-12 matrix-glow p-8 terminal-border bg-background/80 backdrop-blur-sm">
          <div className="mb-4 text-primary font-mono text-sm">
            <span className="animate-terminal-blink">█</span> SYSTEM_ONLINE
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4 matrix-text font-mono">
            &gt; ACCESSING: IAN.ALLOWAY.SYS
          </h1>
          <p className="text-xl text-muted-foreground mb-2 font-mono matrix-text">
            &gt; STATUS: Full Stack Developer Protocol Active
          </p>
          <p className="text-muted-foreground max-w-2xl mx-auto font-mono matrix-text">
            &gt; INITIALIZING: Personal data interface<br/>
            &gt; MISSION: Building innovative digital solutions<br/>
            &gt; SPECIALIZATION: Modern web technologies
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Projects */}
          <Card className="terminal-border bg-card/80 backdrop-blur-sm matrix-glow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 matrix-text font-mono">
                <ExternalLink size={20} />
                [PROJECTS.DIR]
              </CardTitle>
              <CardDescription className="font-mono matrix-text">
                &gt; Accessing project database...
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start font-mono terminal-border text-primary border-primary hover:bg-primary/10" asChild>
                <a href="#" target="_blank" rel="noopener noreferrer">
                  &gt; E-Commerce_Platform.exe
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start font-mono terminal-border text-primary border-primary hover:bg-primary/10" asChild>
                <a href="#" target="_blank" rel="noopener noreferrer">
                  &gt; Task_Management_App.exe
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start font-mono terminal-border text-primary border-primary hover:bg-primary/10" asChild>
                <a href="#" target="_blank" rel="noopener noreferrer">
                  &gt; Weather_Dashboard.exe
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start font-mono terminal-border text-primary border-primary hover:bg-primary/10" asChild>
                <a href="#" target="_blank" rel="noopener noreferrer">
                  &gt; View_All_Projects.bat
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* GitHub */}
          <Card className="terminal-border bg-card/80 backdrop-blur-sm matrix-glow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 matrix-text font-mono">
                <Github size={20} />
                [GITHUB.SYS]
              </CardTitle>
              <CardDescription className="font-mono matrix-text">
                &gt; Connecting to code repositories...
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start font-mono terminal-border text-primary border-primary hover:bg-primary/10" asChild>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                  &gt; GitHub_Profile.link
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start font-mono terminal-border text-primary border-primary hover:bg-primary/10" asChild>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                  &gt; Recent_Repositories.dir
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start font-mono terminal-border text-primary border-primary hover:bg-primary/10" asChild>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                  &gt; Open_Source_Contrib.log
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* Movie Reviews */}
          <Card className="terminal-border bg-card/80 backdrop-blur-sm matrix-glow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 matrix-text font-mono">
                <ExternalLink size={20} />
                [MOVIE_REVIEWS.DB]
              </CardTitle>
              <CardDescription className="font-mono matrix-text">
                &gt; Loading entertainment analysis...
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start font-mono terminal-border text-primary border-primary hover:bg-primary/10" asChild>
                <a href="#" target="_blank" rel="noopener noreferrer">
                  &gt; Latest_Reviews.txt
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start font-mono terminal-border text-primary border-primary hover:bg-primary/10" asChild>
                <a href="#" target="_blank" rel="noopener noreferrer">
                  &gt; Top_Rated_Movies.rank
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start font-mono terminal-border text-primary border-primary hover:bg-primary/10" asChild>
                <a href="#" target="_blank" rel="noopener noreferrer">
                  &gt; Recommendations.algo
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* Blog */}
          <Card className="terminal-border bg-card/80 backdrop-blur-sm matrix-glow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 matrix-text font-mono">
                <ExternalLink size={20} />
                [BLOG.POSTS]
              </CardTitle>
              <CardDescription className="font-mono matrix-text">
                &gt; Accessing thought protocols...
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start font-mono terminal-border text-primary border-primary hover:bg-primary/10" asChild>
                <a href="#" target="_blank" rel="noopener noreferrer">
                  &gt; Recent_Posts.md
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start font-mono terminal-border text-primary border-primary hover:bg-primary/10" asChild>
                <a href="#" target="_blank" rel="noopener noreferrer">
                  &gt; Tech_Tutorials.guide
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start font-mono terminal-border text-primary border-primary hover:bg-primary/10" asChild>
                <a href="#" target="_blank" rel="noopener noreferrer">
                  &gt; Developer_Insights.log
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Contact & Social Links */}
        <Card className="terminal-border bg-card/80 backdrop-blur-sm matrix-glow">
          <CardHeader className="text-center">
            <CardTitle className="matrix-text font-mono">
              [CONTACT_INTERFACE.SYS]
            </CardTitle>
            <CardDescription className="font-mono matrix-text">
              &gt; Establishing communication protocols...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button variant="outline" className="font-mono terminal-border text-primary border-primary hover:bg-primary/10" asChild>
                <a href="mailto:hello@ianalloway.xyz">
                  <Mail size={16} className="mr-2" />
                  &gt; EMAIL.SEND
                </a>
              </Button>
              <Button variant="outline" className="font-mono terminal-border text-primary border-primary hover:bg-primary/10" asChild>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                  &gt; TWITTER.CONNECT
                </a>
              </Button>
              <Button variant="outline" className="font-mono terminal-border text-primary border-primary hover:bg-primary/10" asChild>
                <a href="https://t.me/" target="_blank" rel="noopener noreferrer">
                  &gt; TELEGRAM.LINK
                </a>
              </Button>
              <Button variant="outline" className="font-mono terminal-border text-primary border-primary hover:bg-primary/10" asChild>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                  <Github size={16} className="mr-2" />
                  &gt; GITHUB.REPO
                </a>
              </Button>
              <Button variant="outline" className="font-mono terminal-border text-primary border-primary hover:bg-primary/10" asChild>
                <a href="#" onClick={() => navigator.clipboard.writeText('YOUR_CRYPTO_ADDRESS_HERE')}>
                  &gt; CRYPTO.ADDR
                </a>
              </Button>
              <Button variant="outline" className="font-mono terminal-border text-primary border-primary hover:bg-primary/10" asChild>
                <a href="tel:+1234567890">
                  &gt; PHONE.DIAL
                </a>
              </Button>
            </div>
            
            <div className="text-center mt-6 pt-6 border-t border-primary/30 terminal-border">
              <p className="text-muted-foreground font-mono matrix-text text-sm">
                &gt; SYSTEM_STATUS: Online and ready for connection<br/>
                &gt; RESPONSE_TIME: Usually within 24 hours<br/>
                &gt; ENCRYPTION: End-to-end secured
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
