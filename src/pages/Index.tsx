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
            &gt; STATUS: Data Science Protocol Active
          </p>
          <p className="text-muted-foreground max-w-2xl mx-auto font-mono matrix-text">
            &gt; INITIALIZING: Data analysis interface<br/>
            &gt; MISSION: Extracting insights from complex datasets<br/>
            &gt; SPECIALIZATION: Machine learning & statistical modeling
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
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start font-mono terminal-border text-primary border-primary hover:bg-primary/10" asChild>
                <a href="#" target="_blank" rel="noopener noreferrer">
                  &gt; Customer_Churn_Prediction.py
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start font-mono terminal-border text-primary border-primary hover:bg-primary/10" asChild>
                <a href="#" target="_blank" rel="noopener noreferrer">
                  &gt; Stock_Price_Forecasting.ipynb
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start font-mono terminal-border text-primary border-primary hover:bg-primary/10" asChild>
                <a href="#" target="_blank" rel="noopener noreferrer">
                  &gt; Sentiment_Analysis_Dashboard.py
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
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start font-mono terminal-border text-primary border-primary hover:bg-primary/10" asChild>
                <a href="#" target="_blank" rel="noopener noreferrer">
                  &gt; Data_Science_Insights.md
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start font-mono terminal-border text-primary border-primary hover:bg-primary/10" asChild>
                <a href="#" target="_blank" rel="noopener noreferrer">
                  &gt; ML_Tutorials.guide
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start font-mono terminal-border text-primary border-primary hover:bg-primary/10" asChild>
                <a href="#" target="_blank" rel="noopener noreferrer">
                  &gt; Python_Analytics.log
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
