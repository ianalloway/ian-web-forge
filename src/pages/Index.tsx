import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Github, ExternalLink, Mail, Linkedin } from 'lucide-react';
import MatrixRain from '@/components/MatrixRain';

const Index = () => {
  return (
    <div className="min-h-screen bg-background py-12 px-4 relative">
      <MatrixRain />
      <div className="max-w-4xl ml-auto mr-8 relative z-10">
        {/* Header/Intro */}
        <div className="text-right mb-12 matrix-glow p-8 terminal-border bg-background/80 backdrop-blur-sm">
          <div className="mb-4 text-primary font-mono text-sm">
            <span className="animate-terminal-blink">█</span> SYSTEM_ONLINE
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4 matrix-text font-mono">
            &gt; ACCESSING: IAN.ALLOWAY.SYS
          </h1>
          <p className="text-xl text-muted-foreground mb-2 font-mono matrix-text">
            &gt; STATUS: Data Science Protocol Active
          </p>
          <p className="text-muted-foreground font-mono matrix-text">
            &gt; INITIALIZING: Data analysis interface<br/>
            &gt; MISSION: Extracting insights from complex datasets<br/>
            &gt; SPECIALIZATION: Machine learning & statistical modeling
          </p>
        </div>

        {/* Main Content Dropdowns */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Projects */}
          <div className="terminal-border bg-card/80 backdrop-blur-sm matrix-glow p-6">
            <div className="flex items-center gap-2 matrix-text font-mono mb-4">
              <ExternalLink size={20} />
              [PROJECTS.DIR]
            </div>
            <Select>
              <SelectTrigger className="w-full font-mono terminal-border text-primary border-primary bg-background">
                <SelectValue placeholder="&gt; Select Project..." />
              </SelectTrigger>
              <SelectContent className="bg-card border-primary">
                <SelectItem value="churn" className="font-mono text-primary">
                  &gt; Customer_Churn_Prediction.py
                </SelectItem>
                <SelectItem value="stock" className="font-mono text-primary">
                  &gt; Stock_Price_Forecasting.ipynb
                </SelectItem>
                <SelectItem value="sentiment" className="font-mono text-primary">
                  &gt; Sentiment_Analysis_Dashboard.py
                </SelectItem>
                <SelectItem value="all" className="font-mono text-primary">
                  &gt; View_All_Projects.bat
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* GitHub */}
          <div className="terminal-border bg-card/80 backdrop-blur-sm matrix-glow p-6">
            <div className="flex items-center gap-2 matrix-text font-mono mb-4">
              <Github size={20} />
              [GITHUB.SYS]
            </div>
            <Select>
              <SelectTrigger className="w-full font-mono terminal-border text-primary border-primary bg-background">
                <SelectValue placeholder="&gt; Select Repository..." />
              </SelectTrigger>
              <SelectContent className="bg-card border-primary">
                <SelectItem value="profile" className="font-mono text-primary">
                  &gt; GitHub_Profile.link
                </SelectItem>
                <SelectItem value="repos" className="font-mono text-primary">
                  &gt; Recent_Repositories.dir
                </SelectItem>
                <SelectItem value="contrib" className="font-mono text-primary">
                  &gt; Open_Source_Contrib.log
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Movie Reviews */}
          <div className="terminal-border bg-card/80 backdrop-blur-sm matrix-glow p-6">
            <div className="flex items-center gap-2 matrix-text font-mono mb-4">
              <ExternalLink size={20} />
              [MOVIE_REVIEWS.DB]
            </div>
            <Select>
              <SelectTrigger className="w-full font-mono terminal-border text-primary border-primary bg-background">
                <SelectValue placeholder="&gt; Select Reviews..." />
              </SelectTrigger>
              <SelectContent className="bg-card border-primary">
                <SelectItem value="latest" className="font-mono text-primary">
                  &gt; Latest_Reviews.txt
                </SelectItem>
                <SelectItem value="top" className="font-mono text-primary">
                  &gt; Top_Rated_Movies.rank
                </SelectItem>
                <SelectItem value="recommendations" className="font-mono text-primary">
                  &gt; Recommendations.algo
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Blog */}
          <div className="terminal-border bg-card/80 backdrop-blur-sm matrix-glow p-6">
            <div className="flex items-center gap-2 matrix-text font-mono mb-4">
              <ExternalLink size={20} />
              [BLOG.POSTS]
            </div>
            <Select>
              <SelectTrigger className="w-full font-mono terminal-border text-primary border-primary bg-background">
                <SelectValue placeholder="&gt; Select Post..." />
              </SelectTrigger>
              <SelectContent className="bg-card border-primary">
                <SelectItem value="insights" className="font-mono text-primary">
                  &gt; Data_Science_Insights.md
                </SelectItem>
                <SelectItem value="tutorials" className="font-mono text-primary">
                  &gt; ML_Tutorials.guide
                </SelectItem>
                <SelectItem value="analytics" className="font-mono text-primary">
                  &gt; Python_Analytics.log
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Contact & Social Links */}
        <Card className="terminal-border bg-card/80 backdrop-blur-sm matrix-glow">
          <CardHeader className="text-right">
            <CardTitle className="matrix-text font-mono">
              [CONTACT_INTERFACE.SYS]
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button variant="outline" className="font-mono terminal-border text-primary border-primary hover:bg-primary/10" asChild>
                <a href="mailto:hello@ianalloway.xyz">
                  <Mail size={16} className="mr-2" />
                  &gt; EMAIL.SEND
                </a>
              </Button>
              <Button variant="outline" className="font-mono terminal-border text-primary border-primary hover:bg-primary/10" asChild>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
                  <Linkedin size={16} className="mr-2" />
                  &gt; LINKEDIN.CONNECT
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
